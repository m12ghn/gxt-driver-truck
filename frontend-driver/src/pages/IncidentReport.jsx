import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Stack,
  Chip,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import CameraCapture from "../components/CameraCapture";
import { reportIncident } from "../api/assignmentApi";
import { uploadErrorMessage } from "../utils/compressImage";
import { uploadDriverPhoto } from "../utils/uploadPhoto";

const MAX_PHOTOS = 4;

export default function IncidentReport() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("driverUser") || "{}");

  const [loai, setLoai] = useState("Sự cố");
  const [moTa, setMoTa] = useState("");
  const [photos, setPhotos] = useState([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  function handlePhotoConfirm(blob) {
    setPhotos((prev) => {
      if (prev.length >= MAX_PHOTOS) return prev;
      return [
        ...prev,
        { blob, url: URL.createObjectURL(blob) },
      ];
    });
    setCameraOpen(false);
  }

  function removePhoto(index) {
    setPhotos((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      return next;
    });
  }

  function getCurrentPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => resolve({ latitude: null, longitude: null }),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      );
    });
  }

  async function handleSubmit() {
    if (!moTa.trim()) {
      alert("Vui lòng mô tả sự cố / hư hỏng.");
      return;
    }

    if (photos.length < 1) {
      alert("Vui lòng chụp ít nhất 1 ảnh.");
      return;
    }

    setSubmitting(true);
    setSubmitStatus("Đang tải ảnh...");

    try {
      const gps = await getCurrentPosition();
      const photoUrls = [];

      for (let i = 0; i < photos.length; i++) {
        setSubmitStatus(`Đang tải ảnh ${i + 1}/${photos.length}...`);
        photoUrls.push(await uploadDriverPhoto(photos[i].blob, "incidents"));
      }

      setSubmitStatus("Đang gửi báo cáo...");

      await reportIncident(id, {
        msnv: user.msnv,
        loai,
        moTa: moTa.trim(),
        latitude: gps.latitude,
        longitude: gps.longitude,
        photoUrls,
      });

      alert("Đã gửi báo cáo sự cố.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(uploadErrorMessage(err, "Gửi báo cáo thất bại."));
    } finally {
      setSubmitting(false);
      setSubmitStatus("");
    }
  }

  if (cameraOpen) {
    return (
      <CameraCapture
        label="Chụp ảnh sự cố / hư hỏng"
        onConfirm={handlePhotoConfirm}
        onClose={() => setCameraOpen(false)}
      />
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: 2, pb: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Báo cáo sự cố
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Ghi nhận hư hỏng / sự cố dọc đường
          </Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 2.5, borderRadius: 3, mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <ReportProblemIcon sx={{ color: "#ef6c00" }} />
          <Typography fontWeight={600}>
            Trong lúc đang chạy chuyến
          </Typography>
        </Stack>

        <TextField
          select
          fullWidth
          size="small"
          label="Loại"
          value={loai}
          onChange={(e) => setLoai(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="Sự cố">Sự cố</MenuItem>
          <MenuItem value="Sửa chữa">Sửa chữa</MenuItem>
        </TextField>

        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Mô tả chi tiết"
          placeholder="Vd: nổ lốp sau trái, va quẹt gương, cần sửa đèn..."
          value={moTa}
          onChange={(e) => setMoTa(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Ảnh minh chứng ({photos.length}/{MAX_PHOTOS})
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          {photos.map((p, index) => (
            <Box
              key={p.url}
              sx={{
                position: "relative",
                width: 88,
                height: 88,
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box
                component="img"
                src={p.url}
                alt={`Ảnh ${index + 1}`}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                size="small"
                onClick={() => removePhoto(index)}
                sx={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                }}
              >
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          {photos.length < MAX_PHOTOS && (
            <Button
              variant="outlined"
              onClick={() => setCameraOpen(true)}
              sx={{
                width: 88,
                height: 88,
                minWidth: 88,
                borderStyle: "dashed",
                flexDirection: "column",
                gap: 0.5,
                color: "#0F9B94",
                borderColor: "#0F9B94",
              }}
            >
              <CameraAltIcon />
              <Typography variant="caption">Chụp</Typography>
            </Button>
          )}
        </Stack>

        <Chip
          size="small"
          label="GPS sẽ được gắn tự động khi gửi (nếu cho phép)"
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={submitting}
          onClick={handleSubmit}
          sx={{
            bgcolor: "#ef6c00",
            fontWeight: 700,
            "&:hover": { bgcolor: "#e65100" },
          }}
        >
          {submitting ? submitStatus || "Đang gửi..." : "Gửi báo cáo"}
        </Button>
      </Paper>
    </Box>
  );
}
