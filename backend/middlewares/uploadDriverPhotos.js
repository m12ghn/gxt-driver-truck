const multer = require("multer");

const PHOTO_FIELDS = [
  "matTruoc",
  "matSau",
  "hongTrai",
  "hongPhai",
  "banhSoCua",
  "manOdo",
];

// Giữ file trong RAM (buffer) thay vì ghi ra đĩa cục bộ — controller sẽ
// upload buffer này lên Supabase Storage (xem utils/uploadToSupabase.js).
const storage = multer.memoryStorage();

function makeUploader() {
  const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
  });

  return upload.fields(
    PHOTO_FIELDS.map((name) => ({ name, maxCount: 1 }))
  );
}

// Upload ảnh báo cáo sự cố dọc đường (1–4 ảnh)
function makeIncidentUploader() {
  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
  }).array("photos", 4);
}

function optionalMultipart(uploader) {
  return (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      return uploader(req, res, next);
    }
    next();
  };
}

module.exports = {
  makeUploader,
  makeIncidentUploader,
  optionalMultipart,
  PHOTO_FIELDS,
};
