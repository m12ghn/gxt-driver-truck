const { Op } = require("sequelize");

const Assignment = require("../models/Assignment");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const IncidentReport = require("../models/IncidentReport");

const { getDistanceMeters } = require("../utils/geoHelpers");
const {
  markOverdueAssignments,
  findUnfinishedAssignment,
} = require("../utils/assignmentHelpers");

const { PHOTO_FIELDS } = require("../middlewares/uploadDriverPhotos");
const { uploadBufferToSupabase } = require("../utils/uploadToSupabase");
const { findWarehouseByName } = require("../utils/ensureWarehouses");

function publicErrorMessage(err, fallback) {
  const msg = err?.message || "";
  if (/EMAXCONNSESSION|max clients reached|too many clients/i.test(msg)) {
    return "Hệ thống đang bận, vui lòng đợi 5 giây rồi gửi lại.";
  }
  return fallback || msg || "Có lỗi xảy ra.";
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function parseBodyPhotos(bodyPhotos) {
  if (!bodyPhotos) return null;

  if (typeof bodyPhotos === "string") {
    try {
      return JSON.parse(bodyPhotos);
    } catch {
      return null;
    }
  }

  if (typeof bodyPhotos === "object") {
    return bodyPhotos;
  }

  return null;
}

function getMissingPhotoUrls(photos) {
  return PHOTO_FIELDS.filter((field) => !isHttpUrl(photos?.[field]));
}

async function resolveCheckPhotos(req, folder) {
  const fromBody = parseBodyPhotos(req.body?.photos);

  if (fromBody) {
    return {
      photos: fromBody,
      missing: getMissingPhotoUrls(fromBody),
    };
  }

  const missing = getMissingFields(req.files);

  if (missing.length > 0) {
    return { photos: null, missing };
  }

  return {
    photos: await buildPhotosMap(req.files, folder),
    missing: [],
  };
}

async function buildPhotosMap(files, subFolder) {
  const photos = {};

  for (const field of PHOTO_FIELDS) {
    const file = files?.[field]?.[0];

    if (file) {
      photos[field] = await uploadBufferToSupabase(file, subFolder);
    }
  }

  return photos;
}

function getMissingFields(files) {
  return PHOTO_FIELDS.filter((field) => !files?.[field]?.[0]);
}

// ==============================
// DRIVER - CHECK IN
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
exports.driverCheckIn = async (req, res) => {
  try {
    await markOverdueAssignments();

    const assignment = await Assignment.findOne({
      where: { id: req.params.id },
      include: [Vehicle, Driver],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    const {
      msnv,
      odoCheckIn,
      checkInLatitude,
      checkInLongitude,
      forceGps,
    } = req.body;

    if (!msnv || assignment.Driver?.msnv !== msnv) {
      return res.status(403).json({
        success: false,
        message: "Phân công này không thuộc về tài xế đăng nhập.",
      });
    }

    if (assignment.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này đã Check In.",
      });
    }

    const unfinished = await findUnfinishedAssignment({
      vehicleId: assignment.vehicleId,
      driverId: assignment.driverId,
    });

    if (unfinished) {
      return res.status(400).json({
        success: false,
        message:
          "Bạn chưa Check In được vì còn chuyến cũ chưa hoàn thành, cần Admin xác nhận hoàn thành chuyến trước.",
      });
    }

    if (!odoCheckIn || !checkInLatitude || !checkInLongitude) {
      return res.status(400).json({
        success: false,
        message: "Thiếu số ODO hoặc vị trí GPS.",
      });
    }

    const resolved = await resolveCheckPhotos(req, "checkin");

    if (resolved.missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu ảnh chụp: ${resolved.missing.join(", ")}`,
      });
    }

    const warehouse = await findWarehouseByName(assignment.kho);

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: `Chưa có tọa độ GPS cho kho "${assignment.kho}". Vui lòng liên hệ Admin.`,
      });
    }

    const distance = getDistanceMeters(
      Number(checkInLatitude),
      Number(checkInLongitude),
      warehouse.latitude,
      warehouse.longitude
    );

    const gpsValid = distance <= warehouse.banKinh;

    // GPS sai vị trí: không chặn cứng, chỉ cảnh báo và yêu cầu tài xế
    // xác nhận muốn tiếp tục hay quay lại khu vực kho. Lần gọi đầu
    // (forceGps chưa gửi) trả 409 để FE hiện dialog xác nhận.
    if (!gpsValid && !isForceGps(forceGps)) {
      return res.status(409).json({
        success: false,
        needConfirm: true,
        message: `Bạn đang Check In sai tọa độ, cách kho "${warehouse.ten}" khoảng ${Math.round(
          distance
        )}m (cho phép ${warehouse.banKinh}m).`,
        distance: Math.round(distance),
        allowedRadius: warehouse.banKinh,
        khoTen: warehouse.ten,
      });
    }

    const checkInPhotos = resolved.photos;

    await assignment.update({
      trangThai: "Đã Check In",
      checkInTime: new Date(),
      odoCheckIn,
      checkInLatitude,
      checkInLongitude,
      checkInDistanceMeters: distance,
      checkInGpsValid: gpsValid,
      checkInPhotos,
    });

    res.json({
      success: true,
      message: "Check In thành công.",
      data: assignment,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: publicErrorMessage(err),
    });
  }
};

// ==============================
// DRIVER - CHECK OUT
// (bắt buộc 6 ảnh real-time + đúng bán kính GPS kho)
// ==============================
exports.driverCheckOut = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      where: { id: req.params.id },
      include: [Vehicle, Driver],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    const {
      msnv,
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
      forceGps,
    } = req.body;

    if (!msnv || assignment.Driver?.msnv !== msnv) {
      return res.status(403).json({
        success: false,
        message: "Phân công này không thuộc về tài xế đăng nhập.",
      });
    }

    if (!assignment.checkInTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này chưa Check In.",
      });
    }

    if (assignment.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Chuyến này đã Check Out.",
      });
    }

    if (!odoCheckOut || !checkOutLatitude || !checkOutLongitude) {
      return res.status(400).json({
        success: false,
        message: "Thiếu số ODO hoặc vị trí GPS.",
      });
    }

    const resolved = await resolveCheckPhotos(req, "checkout");

    if (resolved.missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu ảnh chụp: ${resolved.missing.join(", ")}`,
      });
    }

    const warehouse = await findWarehouseByName(assignment.kho);

    if (!warehouse) {
      return res.status(400).json({
        success: false,
        message: `Chưa có tọa độ GPS cho kho "${assignment.kho}". Vui lòng liên hệ Admin.`,
      });
    }

    const distance = getDistanceMeters(
      Number(checkOutLatitude),
      Number(checkOutLongitude),
      warehouse.latitude,
      warehouse.longitude
    );

    const gpsValid = distance <= warehouse.banKinh;

    if (!gpsValid && !isForceGps(forceGps)) {
      return res.status(409).json({
        success: false,
        needConfirm: true,
        message: `Bạn đang Check Out sai tọa độ, cách kho "${warehouse.ten}" khoảng ${Math.round(
          distance
        )}m (cho phép ${warehouse.banKinh}m).`,
        distance: Math.round(distance),
        allowedRadius: warehouse.banKinh,
        khoTen: warehouse.ten,
      });
    }

    const checkOutPhotos = resolved.photos;

    await assignment.update({
      trangThai: "Hoàn thành",
      checkOutTime: new Date(),
      odoCheckOut,
      checkOutLatitude,
      checkOutLongitude,
      checkOutDistanceMeters: distance,
      checkOutGpsValid: gpsValid,
      checkOutPhotos,
      warehouseStatus: "Chờ xác nhận",
    });

    res.json({
      success: true,
      message: "Check Out thành công.",
      data: assignment,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: publicErrorMessage(err),
    });
  }
};

// ==============================
// DRIVER - LỊCH SỬ CHUYẾN
// ==============================
exports.getAssignmentHistory = async (req, res) => {
  try {
    await markOverdueAssignments();

    const { msnv } = req.params;
    const { from, to } = req.query;

    const driver = await Driver.findOne({ where: { msnv } });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài xế.",
      });
    }

    const where = { driverId: driver.id };

    if (from && to) {
      where.ngay = { [Op.between]: [from, to] };
    }

    const assignments = await Assignment.findAll({
      where,
      include: [Vehicle],
      order: [
        ["ngay", "DESC"],
        ["id", "DESC"],
      ],
      limit: 100,
    });

    res.json({
      success: true,
      data: assignments,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: publicErrorMessage(err),
    });
  }
};

// ==============================
// DRIVER - Báo cáo sự cố / sửa chữa dọc đường
// Chỉ khi đã Check In và chưa Check Out
// ==============================
exports.createIncident = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      where: { id: req.params.id },
      include: [Driver],
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    const { msnv, loai, moTa, latitude, longitude } = req.body;

    if (!msnv || assignment.Driver?.msnv !== msnv) {
      return res.status(403).json({
        success: false,
        message: "Phân công này không thuộc về tài xế đăng nhập.",
      });
    }

    if (assignment.trangThai !== "Đã Check In") {
      return res.status(400).json({
        success: false,
        message:
          "Chỉ báo cáo sự cố khi đang trong chuyến (đã Check In, chưa Check Out).",
      });
    }

    if (!loai || !["Sự cố", "Sửa chữa"].includes(loai)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại: Sự cố hoặc Sửa chữa.",
      });
    }

    if (!moTa || !String(moTa).trim()) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mô tả sự cố / hư hỏng.",
      });
    }

    let photos = [];
    const bodyUrls = req.body.photoUrls;
    const parsedUrls =
      typeof bodyUrls === "string"
        ? (() => {
            try {
              return JSON.parse(bodyUrls);
            } catch {
              return null;
            }
          })()
        : bodyUrls;

    if (Array.isArray(parsedUrls) && parsedUrls.length >= 1) {
      photos = parsedUrls.filter(isHttpUrl);
    } else {
      const files = req.files || [];

      if (files.length < 1) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng chụp ít nhất 1 ảnh minh chứng.",
        });
      }

      photos = await Promise.all(
        files.map((file) => uploadBufferToSupabase(file, "incidents"))
      );
    }

    if (photos.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chụp ít nhất 1 ảnh minh chứng.",
      });
    }

    const incident = await IncidentReport.create({
      assignmentId: assignment.id,
      loai,
      moTa: String(moTa).trim(),
      latitude: latitude != null && latitude !== "" ? Number(latitude) : null,
      longitude:
        longitude != null && longitude !== "" ? Number(longitude) : null,
      photos,
      reportedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Đã gửi báo cáo sự cố.",
      data: incident,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: publicErrorMessage(err),
    });
  }
};

// ==============================
// Danh sách báo cáo sự cố theo phân công
// ==============================
exports.getIncidents = async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công.",
      });
    }

    const incidents = await IncidentReport.findAll({
      where: { assignmentId: assignment.id },
      order: [["reportedAt", "DESC"]],
    });

    res.json({
      success: true,
      data: incidents,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: publicErrorMessage(err),
    });
  }
};
