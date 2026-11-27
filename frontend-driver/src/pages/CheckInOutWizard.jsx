import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DirectionsIcon from "@mui/icons-material/Directions";

import PhotoChecklist from "../components/PhotoChecklist";
import { PHOTO_STEPS } from "../constants/photoSteps";
import { driverCheckIn, driverCheckOut, getTodayAssignment } from "../api/assignmentApi";
import { compareEnteredOdo, readOdoFromPhoto } from "../utils/odoOcr";
import { uploadErrorMessage } from "../utils/compressImage";
import { uploadDriverPhotos } from "../utils/uploadPhoto";
import {
  directionsLabel,
  mapsDirectionsUrl,
} from "../utils/mapsDirections";

const MAX_DAILY_KM = 100;

// step 0 : nhập số ODO
// step 1 : chụp 6 ảnh (gồm màn ODO)
// step 2 : đọc số trên ảnh + xem lại

const STEP_ODO = 0;
const STEP_PHOTOS = 1;
const STEP_REVIEW = 2;

function geoErrorMessage(err) {
  switch (err.code) {
    case 1: // PERMISSION_DENIED
      return "Bạn đã từ chối quyền truy cập vị trí cho trang này. Vui lòng vào phần cài đặt của trình duyệt (biểu tượng khóa/i cạnh địa chỉ trang) > Quyền truy cập > Vị trí > Cho phép, rồi tải lại trang.";
    case 2: // POSITION_UNAVAILABLE
      return "Không xác định được vị trí GPS. Vui lòng kiểm tra đã bật Định vị (GPS/Location) trong Cài đặt điện thoại, ra khu vực thoáng (ngoài trời/gần cửa sổ) rồi thử lại.";
    case 3: // TIMEOUT
      return "Lấy vị trí GPS quá lâu (tín hiệu yếu). Vui lòng ra khu vực thoáng hơn rồi thử lại.";
    default:
      return "Không lấy được vị trí GPS. Vui lòng bật định vị (GPS) rồi thử lại.";
  }
}

export default function CheckInOutWizard({ mode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = JSON.parse(localStorage.getItem("driverUser"));

  const isCheckIn = mode === "checkin";

  const [step, setStep] = useState(STEP_ODO);
  const [odo, setOdo] = useState("");
  const [photos, setPhotos] = useState({});
  const [photoUrls, setPhotoUrls] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [gpsAlert, setGpsAlert] = useState(null);
  const [odoAlert, setOdoAlert] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [confirmAbnormalOdo, setConfirmAbnormalOdo] = useState(false);
  const [aiVerify, setAiVerify] = useState(null);
  const [aiOverride, setAiOverride] = useState(false);
  const uploadedPhotosRef = useRef(null);

  useEffect(() => {
    if (!user?.msnv) return;
    getTodayAssignment(user.msnv)
      .then((res) => {
        const item = res.data?.data;
        if (item && (!id || Number(item.id) === Number(id))) {
          setAssignment(item);
        }
      })
      .catch(() => {});
  }, [id, user?.msnv]);

  function handleOdoNext() {
    const value = Number(odo);
    if (!odo || !Number.isFinite(value) || value < 0) {
      alert("Vui lòng nhập số ODO hợp lệ.");
      return;
    }

    if (isCheckIn) {
      const lastOdo = Number(assignment?.Vehicle?.kmHienTai);
      if (Number.isFinite(lastOdo) && lastOdo > 0 && value <= lastOdo) {
        alert(
          `Số ODO phải lớn hơn ODO gần nhất của xe (${lastOdo}). Vui lòng kiểm tra lại đồng hồ ODO.`
        );
        return;
      }
    } else {
      const checkIn = Number(assignment?.odoCheckIn);
      if (Number.isFinite(checkIn) && value <= checkIn) {
        alert(
          `ODO Check Out phải lớn hơn ODO Check In (${checkIn}). Vui lòng kiểm tra lại đồng hồ ODO.`
        );
        return;
      }
      if (
        Number.isFinite(checkIn) &&
        value - checkIn > MAX_DAILY_KM &&
        !confirmAbnormalOdo
      ) {
        const km = value - checkIn;
        setOdoAlert({
          message: `ODO bất thường: chuyến này phát sinh ${km} km (Check In ${checkIn} → Check Out ${value}), vượt ${MAX_DAILY_KM} km/ngày. Vui lòng kiểm tra lại đồng hồ ODO.`,
        });
        return;
      }
    }

    setAiOverride(false);
    setAiVerify(null);
    setStep(STEP_PHOTOS);
  }

  async function runOdoAi() {
    if (!photos.manOdo) {
      setAiVerify({
        status: "unreadable",
        match: false,
        message: "Thiếu ảnh màn hình ODO để đối chiếu.",
      });
      return;
    }

    setAiVerify({
      status: "loading",
      message: "Đang đọc số trên ảnh ODO...",
    });
    try {
      const reading = await readOdoFromPhoto(photos.manOdo);
      if (!reading) {
        const message =
          "Không đọc được số trên ảnh ODO. Hãy chụp gần, rõ số, tránh phản quang rồi thử lại.";
        setAiVerify({
          status: "unreadable",
          match: false,
          reading: null,
          message,
        });
        setOdoAlert({ type: "ai", message });
        return;
      }

      const { match } = compareEnteredOdo(odo, reading);
      if (match) {
        setAiVerify({
          status: "ok",
          match: true,
          reading: Number(reading),
          message: `Đọc được ${reading}, khớp với số bạn nhập.`,
        });
        setAiOverride(false);
        return;
      }

      const message = `Đọc được ${reading}, khác số bạn nhập (${odo}). Vui lòng kiểm tra lại đồng hồ.`;
      setAiVerify({
        status: "mismatch",
        match: false,
        reading: Number(reading),
        message,
      });
      setOdoAlert({ type: "ai", message });
    } catch (err) {
      console.error(err);
      setAiVerify({
        status: "error",
        match: null,
        message: "Đọc ảnh thất bại. Bạn có thể chụp lại hoặc tiếp tục.",
      });
    }
  }

  async function handlePhotosDone() {
    setStep(STEP_REVIEW);
    await runOdoAi();
  }

  function handlePhotoConfirm(key, blob) {
    setPhotos((prev) => ({ ...prev, [key]: blob }));
    setPhotoUrls((prev) => ({
      ...prev,
      [key]: URL.createObjectURL(blob),
    }));
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Trình duyệt không hỗ trợ GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (err) => {
          console.error("Geolocation error", err);

          // Thử lại 1 lần với độ chính xác thấp hơn (dựa vào mạng),
          // thường nhanh hơn khi GPS vệ tinh khó bắt tín hiệu.
          if (err.code === 3 || err.code === 2) {
            navigator.geolocation.getCurrentPosition(
              resolve,
              (err2) => {
                console.error("Geolocation retry error", err2);
                reject(new Error(geoErrorMessage(err2)));
              },
              { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
            );
            return;
          }

          reject(new Error(geoErrorMessage(err)));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function sendCheckPayload(payload) {
    const send = () =>
      isCheckIn ? driverCheckIn(id, payload) : driverCheckOut(id, payload);

    try {
      await send();
    } catch (err) {
      if (err.response?.status === 503) {
        setSubmitStatus("Máy chủ bận, đang thử lại...");
        await new Promise((resolve) => setTimeout(resolve, 2500));
        await send();
        return;
      }
      throw err;
    }
  }

  async function handleSubmit(
    confirmOdo = confirmAbnormalOdo,
    overrideAi = aiOverride
  ) {
    if (aiVerify?.status === "loading") {
      alert("Đợi hệ thống đọc ảnh ODO xong rồi gửi.");
      return;
    }
    if (
      (aiVerify?.status === "mismatch" ||
        aiVerify?.status === "unreadable" ||
        aiVerify?.status === "error") &&
      !overrideAi
    ) {
      setOdoAlert({
        type: "ai",
        message:
          aiVerify.message ||
          "Số ODO bạn nhập không khớp với ảnh. Vui lòng kiểm tra lại.",
      });
      return;
    }

    setSubmitting(true);
    setSubmitStatus("Đang lấy GPS và tải ảnh...");

    try {
      const folder = isCheckIn ? "checkin" : "checkout";
      const [position, uploaded] = await Promise.all([
        getCurrentPosition(),
        uploadedPhotosRef.current
          ? Promise.resolve(uploadedPhotosRef.current)
          : uploadDriverPhotos(photos, folder, (current, total) => {
              setSubmitStatus(`Đang tải ảnh ${current}/${total}...`);
            }),
      ]);
      const photoMap = uploaded;
      uploadedPhotosRef.current = photoMap;

      setSubmitStatus("Đang gửi check-in...");

      const payload = {
        msnv: user.msnv,
        photos: photoMap,
      };

      if (isCheckIn) {
        payload.odoCheckIn = odo;
        payload.checkInLatitude = position.coords.latitude;
        payload.checkInLongitude = position.coords.longitude;
      } else {
        payload.odoCheckOut = odo;
        payload.checkOutLatitude = position.coords.latitude;
        payload.checkOutLongitude = position.coords.longitude;
        payload.confirmAbnormalOdo = confirmOdo;
        setSubmitStatus("Đang gửi check-out...");
      }

      if (aiVerify?.reading != null) {
        payload.odoAiReading = aiVerify.reading;
      }
      if (aiVerify?.status === "ok") payload.odoAiMatch = true;
      if (
        aiVerify?.status === "mismatch" ||
        aiVerify?.status === "unreadable" ||
        aiVerify?.status === "error"
      ) {
        payload.odoAiMatch = false;
      }

      await sendCheckPayload(payload);

      alert(isCheckIn ? "Check In thành công!" : "Check Out thành công!");

      navigate("/");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.gpsInvalid) {
        setGpsAlert(err.response.data);
        return;
      }

      if (err.response?.data?.needConfirmOdo) {
        setOdoAlert(err.response.data);
        return;
      }

      alert(
        uploadErrorMessage(err, "Có lỗi xảy ra, vui lòng thử lại.")
      );
    } finally {
      setSubmitting(false);
      setSubmitStatus("");
    }
  }

  function handleBack() {
    if (step === STEP_ODO) {
      navigate("/");
      return;
    }

    if (step === STEP_PHOTOS) {
      setStep(STEP_ODO);
      return;
    }

    if (step === STEP_REVIEW) {
      setStep(STEP_PHOTOS);
      return;
    }
  }

  const title = isCheckIn ? "CHECK IN" : "CHECK OUT";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        p: 2,
      }}
    >
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight="bold" ml={1} sx={{ flex: 1 }}>
          {title}
        </Typography>
      </Box>

      {!isCheckIn && (
        <Button
          fullWidth
          variant="outlined"
          size="medium"
          startIcon={<WarningAmberIcon />}
          onClick={() => navigate(`/incident/${id}`)}
          sx={{
            mb: 2,
            borderColor: "#ef6c00",
            color: "#ef6c00",
            fontWeight: 700,
            "&:hover": {
              borderColor: "#e65100",
              bgcolor: "rgba(239,108,0,0.06)",
            },
          }}
        >
          Báo cáo sự cố / sửa chữa dọc đường
        </Button>
      )}

      {step === STEP_ODO && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography sx={{ mb: 1.5 }} fontWeight={700}>
            Nhập số ODO trên đồng hồ xe.
          </Typography>

          <TextField
            fullWidth
            autoFocus
            label={isCheckIn ? "ODO Check In" : "ODO Check Out"}
            type="number"
            value={odo}
            onChange={(e) => {
              setOdo(e.target.value);
              setConfirmAbnormalOdo(false);
            }}
            helperText={
              !isCheckIn && assignment?.odoCheckIn
                ? `ODO Check In: ${assignment.odoCheckIn}`
                : isCheckIn && Number(assignment?.Vehicle?.kmHienTai) > 0
                  ? `ODO gần nhất của xe: ${assignment.Vehicle.kmHienTai}`
                  : " "
            }
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleOdoNext}
          >
            TIẾP TỤC CHỤP ẢNH
          </Button>
        </Paper>
      )}

      {step === STEP_PHOTOS && (
        <PhotoChecklist
          photoUrls={photoUrls}
          onPhotoConfirm={handlePhotoConfirm}
          onAllDone={handlePhotosDone}
        />
      )}

      {step === STEP_REVIEW && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            Xem lại trước khi gửi
          </Typography>

          <Typography sx={{ mb: 1.5 }}>
            Số ODO: <b>{odo}</b>
          </Typography>

          {photoUrls.manOdo && (
            <Box
              component="img"
              src={photoUrls.manOdo}
              alt="Màn hình ODO"
              sx={{
                width: "100%",
                maxHeight: 220,
                objectFit: "contain",
                borderRadius: 2,
                bgcolor: "#111",
                mb: 2,
              }}
            />
          )}

          {aiVerify?.status === "loading" && (
            <Alert
              icon={<CircularProgress size={18} />}
              severity="info"
              sx={{ mb: 2 }}
            >
              {aiVerify.message}
            </Alert>
          )}
          {aiVerify?.status === "ok" && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {aiVerify.message || "Số ODO khớp với ảnh."}
            </Alert>
          )}
          {(aiVerify?.status === "mismatch" ||
            aiVerify?.status === "unreadable") && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {aiVerify.message}
              {aiOverride ? " Bạn đã xác nhận số nhập là đúng." : ""}
            </Alert>
          )}
          {aiVerify?.status === "skipped" && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {aiVerify.message}
            </Alert>
          )}
          {aiVerify?.status === "error" && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={runOdoAi}>
                  Thử lại
                </Button>
              }
            >
              {aiVerify.message}
            </Alert>
          )}

          <Grid container spacing={1} mb={3}>
            {PHOTO_STEPS.map(({ key, label }) => (
              <Grid size={{ xs: 4 }} key={key}>
                <Box
                  component="img"
                  src={photoUrls[key]}
                  alt={label}
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Hệ thống sẽ lấy vị trí GPS hiện tại của bạn để kiểm tra bạn đang
            ở trong bán kính cho phép của kho.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            color={isCheckIn ? "primary" : "warning"}
            size="large"
            disabled={submitting || aiVerify?.status === "loading"}
            onClick={() => handleSubmit()}
          >
            {submitting
              ? submitStatus || "Đang xử lý..."
              : `XÁC NHẬN ${title}`}
          </Button>
        </Paper>
      )}

      <Dialog open={Boolean(odoAlert)} onClose={() => setOdoAlert(null)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          {odoAlert?.type === "ai" ? "ODO lệch ảnh" : "ODO bất thường"}
        </DialogTitle>

        <DialogContent>
          <Typography>{odoAlert?.message}</Typography>
        </DialogContent>

        <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setOdoAlert(null);
              if (odoAlert?.type === "ai") setStep(STEP_PHOTOS);
            }}
          >
            {odoAlert?.type === "ai" ? "Chụp lại ảnh ODO" : "Kiểm tra lại"}
          </Button>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            onClick={() => {
              const isAi = odoAlert?.type === "ai";
              setOdoAlert(null);
              if (isAi) {
                setAiOverride(true);
                handleSubmit(confirmAbnormalOdo, true);
                return;
              }
              setConfirmAbnormalOdo(true);
              if (step === STEP_ODO) {
                setStep(STEP_PHOTOS);
                return;
              }
              handleSubmit(true, overrideAi);
            }}
          >
            Số đúng, tiếp tục
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(gpsAlert)} onClose={() => setGpsAlert(null)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Sai tọa độ
        </DialogTitle>

        <DialogContent>
          <Typography>{gpsAlert?.message}</Typography>
        </DialogContent>

        <DialogActions sx={{ flexDirection: "column", gap: 1, p: 2 }}>
          {mapsDirectionsUrl(assignment) && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DirectionsIcon />}
                href={mapsDirectionsUrl(assignment)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {directionsLabel(assignment)}
              </Button>
            )}
          <Button
            fullWidth
            variant="contained"
            onClick={() => setGpsAlert(null)}
          >
            {assignment?.location?.isBuuCuc || assignment?.duAn === "VUNG_HCM"
              ? "Di chuyển về khu vực bưu cục"
              : "Di chuyển về khu vực kho"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
