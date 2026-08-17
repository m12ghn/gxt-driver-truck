import { useEffect, useRef, useState } from "react";
import { Box, Button, Typography, IconButton } from "@mui/material";

import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

// Dùng camera native của điện thoại (input capture) — hiện nút
// "CHỤP ẢNH" ngay, không mở live preview WebRTC trong trang.
export default function CameraCapture({ label, onConfirm, onClose }) {
  const inputRef = useRef(null);

  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  function openNativeCamera() {
    setError("");
    inputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    // Cho phép chọn lại cùng file
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn ảnh từ camera.");
      return;
    }

    if (photoUrl) URL.revokeObjectURL(photoUrl);

    setPhotoBlob(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  function handleRetake() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoBlob(null);
    setPhotoUrl(null);
    setError("");
    // Mở lại camera ngay
    setTimeout(() => openNativeCamera(), 50);
  }

  function handleConfirm() {
    if (!photoBlob) return;
    onConfirm(photoBlob);
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: photoUrl ? "black" : "#111",
        zIndex: 1300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1, py: 1, color: "#fff" }}
      >
        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>

        <Typography variant="subtitle1" fontWeight="bold">
          {label}
        </Typography>

        <Box width={40} />
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2, px: 2, textAlign: "center" }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          position: "relative",
          flex: 1,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        {!photoUrl && (
          <Box textAlign="center" sx={{ color: "rgba(255,255,255,0.85)" }}>
            <CameraAltIcon sx={{ fontSize: 64, mb: 1, opacity: 0.85 }} />
            <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
              Bấm nút bên dưới để chụp
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Mở camera điện thoại — không xem live trong app
            </Typography>
          </Box>
        )}

        {photoUrl && (
          <img
            src={photoUrl}
            alt="preview"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}
      </Box>

      <Box display="flex" gap={2} sx={{ p: 2 }}>
        {!photoUrl && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<CameraAltIcon />}
            onClick={openNativeCamera}
            sx={{
              bgcolor: "#0F9B94",
              fontWeight: 700,
              py: 1.5,
              "&:hover": { bgcolor: "#0A7A74" },
            }}
          >
            CHỤP ẢNH
          </Button>
        )}

        {photoUrl && (
          <>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={handleRetake}
              sx={{ color: "#fff", borderColor: "#fff" }}
            >
              CHỤP LẠI
            </Button>

            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              startIcon={<CheckIcon />}
              onClick={handleConfirm}
            >
              XÁC NHẬN
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
