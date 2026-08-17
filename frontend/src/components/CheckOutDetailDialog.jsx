import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Alert,
} from "@mui/material";

import { buildImageUrl, DRIVER_PHOTO_LABELS } from "../utils/imageUrl";

export default function CheckOutDetailDialog({
  open,
  onClose,
  assignment,
}) {
  if (!assignment) return null;

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("vi-VN");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Chi tiết Check Out
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Ngày:</b>
            </Typography>

            <Typography>
              {assignment.ngay}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Ca:</b>
            </Typography>

            <Typography>
              {assignment.ca}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Kho:</b>
            </Typography>

            <Typography>
              {assignment.kho}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Biển số:</b>
            </Typography>

            <Typography>
              {assignment.Vehicle?.bienSo}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>MSNV:</b>
            </Typography>

            <Typography>
              {assignment.Driver?.msnv}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Tài xế:</b>
            </Typography>

            <Typography>
              {assignment.Driver?.hoTen}
            </Typography>
          </Grid>

        </Grid>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={2}>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Giờ Check Out</b>
            </Typography>

            <Typography>
              {formatDate(assignment.checkOutTime)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>ODO Check Out</b>
            </Typography>

            <Typography>
              {assignment.odoCheckOut || "-"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Latitude</b>
            </Typography>

            <Typography>
              {assignment.checkOutLatitude || "-"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Longitude</b>
            </Typography>

            <Typography>
              {assignment.checkOutLongitude || "-"}
            </Typography>
          </Grid>

        </Grid>

        {assignment.checkOutGpsValid === false && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tài xế đã Check Out sai tọa độ — cách kho khoảng{" "}
            <b>{Math.round(assignment.checkOutDistanceMeters)}m</b> (đã chọn
            "Tiếp tục Check Out sai tọa độ").
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Hình ảnh
        </Typography>

        {assignment.checkOutPhotos ? (
          <Grid container spacing={2}>
            {Object.entries(DRIVER_PHOTO_LABELS).map(([key, label]) => {
              const path = assignment.checkOutPhotos?.[key];

              return (
                <Grid size={{ xs: 4 }} key={key}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {label}
                  </Typography>

                  {path ? (
                    <Box
                      component="a"
                      href={buildImageUrl(path)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Box
                        component="img"
                        src={buildImageUrl(path)}
                        alt={label}
                        sx={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: 1,
                          border: "1px solid #eee",
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chưa có
                    </Typography>
                  )}
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography color="text.secondary">
            Chuyến này chưa có ảnh chụp từ Driver Portal.
          </Typography>
        )}

        {assignment.checkOutBy && (

          <>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom color="warning.main">
              Admin Check Out hộ
            </Typography>

            <Grid container spacing={2}>

              <Grid size={{ xs: 6 }}>
                <Typography>
                  <b>Người thực hiện</b>
                </Typography>

                <Typography>
                  {assignment.checkOutBy}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography>
                  <b>Lí do</b>
                </Typography>

                <Typography>
                  {assignment.adminCheckoutReason || "-"}
                </Typography>
              </Grid>

            </Grid>

          </>

        )}

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Đóng
        </Button>

      </DialogActions>

    </Dialog>
  );
}
