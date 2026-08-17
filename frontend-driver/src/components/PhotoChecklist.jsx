import { useState } from "react";
import { Box, Paper, Typography, Button, Avatar } from "@mui/material";

import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import CameraCapture from "./CameraCapture";
import { PHOTO_STEPS } from "../constants/photoSteps";

// Danh sách các ảnh cần chụp, tài xế bấm vào từng mục để mở
// khung chụp riêng cho mục đó. Chụp xong quay lại thấy ảnh
// thu nhỏ + dấu tích xanh, không bắt buộc chụp theo thứ tự.
export default function PhotoChecklist({
  photoUrls,
  onPhotoConfirm,
  onAllDone,
}) {
  const [activeKey, setActiveKey] = useState(null);

  const doneCount = PHOTO_STEPS.filter(({ key }) => photoUrls[key]).length;
  const allDone = doneCount === PHOTO_STEPS.length;

  const activeStep = PHOTO_STEPS.find((s) => s.key === activeKey);

  function handleConfirm(blob) {
    onPhotoConfirm(activeKey, blob);
    setActiveKey(null);
  }

  return (
    <Box>
      <Typography sx={{ mb: 1 }}>
        Chụp đủ 6 ảnh dưới đây. Bấm từng mục → nút CHỤP ẢNH.
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Đã chụp: {doneCount}/{PHOTO_STEPS.length}
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {PHOTO_STEPS.map(({ key, label }, idx) => {
          const done = Boolean(photoUrls[key]);

          return (
            <Box
              key={key}
              onClick={() => setActiveKey(key)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom:
                  idx < PHOTO_STEPS.length - 1
                    ? "1px solid #eee"
                    : "none",
                cursor: "pointer",
                "&:active": { bgcolor: "#f4f6f8" },
              }}
            >
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={photoUrls[key]}
                  variant="rounded"
                  sx={{
                    width: 52,
                    height: 52,
                    bgcolor: done ? "transparent" : "#e3f2fd",
                  }}
                >
                  {!done && <CameraAltIcon color="primary" />}
                </Avatar>

                {done && (
                  <CheckCircleIcon
                    color="success"
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      bgcolor: "#fff",
                      borderRadius: "50%",
                      fontSize: 20,
                    }}
                  />
                )}
              </Box>

              <Box flex={1}>
                <Typography fontWeight={500}>{label}</Typography>
                <Typography variant="body2" color={done ? "success.main" : "text.secondary"}>
                  {done ? "Đã chụp" : "Chưa chụp"}
                </Typography>
              </Box>

              <ChevronRightIcon color="disabled" />
            </Box>
          );
        })}
      </Paper>

      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={!allDone}
        sx={{ mt: 3 }}
        onClick={onAllDone}
      >
        TIẾP TỤC
      </Button>

      {activeStep && (
        <CameraCapture
          label={activeStep.label}
          onConfirm={handleConfirm}
          onClose={() => setActiveKey(null)}
        />
      )}
    </Box>
  );
}
