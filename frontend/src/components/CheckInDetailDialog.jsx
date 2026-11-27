import { useEffect, useState } from "react";
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
  Chip,
  Alert,
  TextField,
  Stack,
} from "@mui/material";

import { getCheckInStatus } from "../utils/shiftHelpers";
import { buildImageUrl, DRIVER_PHOTO_LABELS } from "../utils/imageUrl";
import { updateAssignmentOdo } from "../api/assignmentApi";

export default function CheckInDetailDialog({
  open,
  onClose,
  assignment,
  onUpdated,
}) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canEditOdo = user?.quyen === "SUPER_ADMIN";
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(assignment?.odoCheckIn ?? "");
  }, [assignment?.id, assignment?.odoCheckIn, open]);

  if (!assignment) return null;

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("vi-VN");
  }

  const checkInStatus = getCheckInStatus(
    assignment.checkInTime,
    assignment.ngay,
    assignment.ca
  );

  async function handleSaveOdo() {
    const next = String(draft).trim();
    if (!next || Number(next) < 0 || !Number.isFinite(Number(next))) {
      alert("Vui lòng nhập số ODO hợp lệ.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateAssignmentOdo(assignment.id, {
        odoCheckIn: Number(next),
      });
      const updated = res.data?.data || { ...assignment, odoCheckIn: Number(next) };
      onUpdated?.(updated);
      alert(res.data?.message || "Đã cập nhật ODO Check In.");
    } catch (err) {
      alert(err.response?.data?.message || "Không lưu được số ODO.");
    } finally {
      setSaving(false);
    }
  }

  const odoChanged =
    String(draft) !== String(assignment.odoCheckIn ?? "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Chi tiết Check In
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
              <b>Giờ Check In</b>
            </Typography>

            <Typography>
              {formatDate(assignment.checkInTime)}
            </Typography>

            {checkInStatus && (
              <Chip
                size="small"
                sx={{ mt: 0.5 }}
                label={checkInStatus.label}
                color={checkInStatus.late ? "error" : "success"}
              />
            )}
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>ODO</b>
            </Typography>

            {canEditOdo ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <TextField
                  size="small"
                  type="number"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ maxWidth: 180 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  disabled={!odoChanged || saving}
                  onClick={handleSaveOdo}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </Stack>
            ) : (
              <Typography>
                {assignment.odoCheckIn || "-"}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Latitude</b>
            </Typography>

            <Typography>
              {assignment.checkInLatitude || "-"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Longitude</b>
            </Typography>

            <Typography>
              {assignment.checkInLongitude || "-"}
            </Typography>
          </Grid>

        </Grid>

        {assignment.checkInGpsValid === false && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tài xế đã Check In sai tọa độ — cách kho khoảng{" "}
            <b>{Math.round(assignment.checkInDistanceMeters)}m</b>.
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Hình ảnh
        </Typography>

        {assignment.checkInPhotos ? (
          <Grid container spacing={2}>
            {Object.entries(DRIVER_PHOTO_LABELS).map(([key, label]) => {
              const path = assignment.checkInPhotos?.[key];

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
                          border: "1px solid", borderColor: "divider",
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

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Đóng
        </Button>

      </DialogActions>

    </Dialog>
  );
}