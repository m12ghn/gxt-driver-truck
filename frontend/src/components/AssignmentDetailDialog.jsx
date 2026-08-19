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
  Chip,
  Alert,
  Paper,
  Stack,
  Divider,
} from "@mui/material";

import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SpeedIcon from "@mui/icons-material/Speed";
import PlaceIcon from "@mui/icons-material/Place";

import {
  getCheckInStatus,
  getCheckOutStatus,
} from "../utils/shiftHelpers";
import { buildImageUrl, DRIVER_PHOTO_LABELS } from "../utils/imageUrl";
import { getWarehouses } from "../api/warehouseApi";
import WarehouseGpsMap from "./WarehouseGpsMap";

function formatDateTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("vi-VN");
}

function InfoRow({ icon, label, value, chip }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.25}>
        {icon}
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="body1" fontWeight={500}>
          {value ?? "-"}
        </Typography>
        {chip}
      </Stack>
    </Box>
  );
}

function PhotoGrid({ photos }) {
  if (!photos) {
    return (
      <Typography variant="body2" color="text.secondary">
        Chưa có ảnh chụp từ Driver Portal.
      </Typography>
    );
  }

  return (
    <Grid container spacing={1.5}>
      {Object.entries(DRIVER_PHOTO_LABELS).map(([key, label]) => {
        const path = photos?.[key];

        return (
          <Grid size={{ xs: 6, sm: 4 }} key={key}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              {label}
            </Typography>

            {path ? (
              <Box
                component="a"
                href={buildImageUrl(path)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "block" }}
              >
                <Box
                  component="img"
                  src={buildImageUrl(path)}
                  alt={label}
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 1.5,
                    border: "1px solid #eee",
                    display: "block",
                    transition: "opacity 0.15s",
                    "&:hover": { opacity: 0.85 },
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 1.5,
                  bgcolor: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #ddd",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Chưa có
                </Typography>
              </Box>
            )}
          </Grid>
        );
      })}
    </Grid>
  );
}

function CheckSection({
  title,
  icon,
  accentColor,
  time,
  odo,
  latitude,
  longitude,
  timeStatus,
  gpsValid,
  distanceMeters,
  gpsLabel,
  photos,
  emptyMessage,
  extra,
}) {
  const hasData = Boolean(time);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: "100%",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "grey.200",
        borderTop: `4px solid ${accentColor}`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: `${accentColor}18`,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
      </Stack>

      {!hasData ? (
        <Typography color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <>
          <InfoRow
            icon={<AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
            label="Thời gian"
            value={formatDateTime(time)}
            chip={
              timeStatus && (
                <Chip
                  size="small"
                  label={timeStatus.label}
                  color={timeStatus.late ? "error" : "success"}
                />
              )
            }
          />

          <InfoRow
            icon={<SpeedIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
            label="ODO"
            value={odo ?? "-"}
          />

          <InfoRow
            icon={<PlaceIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
            label="GPS"
            value={
              latitude != null && longitude != null
                ? `${latitude}, ${longitude}`
                : "-"
            }
            chip={
              gpsValid === true ? (
                <Chip size="small" label="Đúng tọa độ" color="success" />
              ) : gpsValid === false ? (
                <Chip size="small" label="Sai tọa độ" color="warning" />
              ) : null
            }
          />

          {gpsValid === false && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {gpsLabel} sai tọa độ — cách kho khoảng{" "}
              <b>{Math.round(distanceMeters || 0)}m</b>.
            </Alert>
          )}

          {extra}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" mb={1.5}>
            Hình ảnh
          </Typography>

          <PhotoGrid photos={photos} />
        </>
      )}
    </Paper>
  );
}

export default function AssignmentDetailDialog({ open, onClose, assignment }) {
  const [warehouse, setWarehouse] = useState(null);

  useEffect(() => {
    if (!open || !assignment?.kho) {
      setWarehouse(null);
      return;
    }

    let cancelled = false;

    getWarehouses()
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data || [];
        setWarehouse(list.find((w) => w.ten === assignment.kho) || null);
      })
      .catch(() => {
        if (!cancelled) setWarehouse(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, assignment?.kho]);

  if (!assignment) return null;

  const checkInStatus = getCheckInStatus(
    assignment.checkInTime,
    assignment.ngay,
    assignment.ca
  );

  const checkOutStatus = getCheckOutStatus(
    assignment.checkOutTime,
    assignment.ngay,
    assignment.ca
  );

  const warehouseColorMap = {
    "Chờ xác nhận": "warning",
    "Đã xác nhận": "success",
    "Không xác nhận": "error",
  };

  const hasGpsPoints =
    (assignment.checkInLatitude != null &&
      assignment.checkInLongitude != null) ||
    (assignment.checkOutLatitude != null &&
      assignment.checkOutLongitude != null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pb: 1 }}>
        Chi tiết phân công
      </DialogTitle>

      <DialogContent>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            bgcolor: "#f8fafc",
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Ngày
              </Typography>
              <Typography fontWeight={600}>{assignment.ngay}</Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Ca
              </Typography>
              <Typography fontWeight={600}>{assignment.ca}</Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Kho
              </Typography>
              <Typography fontWeight={600}>{assignment.kho}</Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Biển số
              </Typography>
              <Typography fontWeight={600}>
                {assignment.Vehicle?.bienSo || "-"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Tài xế
              </Typography>
              <Typography fontWeight={600}>
                {assignment.Driver?.hoTen || "-"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assignment.Driver?.msnv}
                {assignment.Driver?.soDienThoai
                  ? ` · ${assignment.Driver.soDienThoai}`
                  : ""}
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Trạng thái
              </Typography>
              <Box mt={0.5}>
                <Chip
                  size="small"
                  label={assignment.trangThai}
                  color={
                    assignment.trangThai === "Hoàn thành"
                      ? "success"
                      : assignment.trangThai === "Đã Check In"
                        ? "warning"
                        : assignment.trangThai === "Chưa hoàn thành"
                          ? "error"
                          : "default"
                  }
                />
              </Box>
            </Grid>
          </Grid>

          {assignment.warehouseStatus && (
            <Stack direction="row" spacing={1} alignItems="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Kho xác nhận:
              </Typography>
              <Chip
                size="small"
                label={assignment.warehouseStatus}
                color={warehouseColorMap[assignment.warehouseStatus] || "default"}
              />
              {assignment.warehouseStatus === "Không xác nhận" &&
                assignment.warehouseReason && (
                  <Typography variant="body2" color="error">
                    — {assignment.warehouseReason}
                  </Typography>
                )}
              {assignment.maChuyenDi && (
                <Typography variant="body2" color="text.secondary">
                  — Mã chuyến: {assignment.maChuyenDi}
                </Typography>
              )}
            </Stack>
          )}
        </Paper>

        {(hasGpsPoints || warehouse) && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
              Bản đồ GPS
            </Typography>
            <WarehouseGpsMap
              open={open}
              warehouse={warehouse}
              checkIn={
                assignment.checkInLatitude != null
                  ? {
                      lat: assignment.checkInLatitude,
                      lng: assignment.checkInLongitude,
                      valid: assignment.checkInGpsValid,
                    }
                  : null
              }
              checkOut={
                assignment.checkOutLatitude != null
                  ? {
                      lat: assignment.checkOutLatitude,
                      lng: assignment.checkOutLongitude,
                      valid: assignment.checkOutGpsValid,
                    }
                  : null
              }
              height={280}
            />
          </Paper>
        )}

        {(assignment.incidents?.length || 0) > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
              Báo cáo sự cố dọc đường ({assignment.incidents.length})
            </Typography>

            <Stack spacing={1.5}>
              {assignment.incidents.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "grey.200",
                    bgcolor: "#fffaf5",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.75}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      size="small"
                      label={item.loai}
                      color={item.loai === "Sửa chữa" ? "warning" : "error"}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(item.reportedAt)}
                    </Typography>
                    {item.latitude != null && (
                      <Typography variant="caption" color="text.secondary">
                        GPS: {item.latitude}, {item.longitude}
                      </Typography>
                    )}
                  </Stack>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {item.moTa}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {(item.photos || []).map((path) => (
                      <Box
                        key={path}
                        component="a"
                        href={buildImageUrl(path)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Box
                          component="img"
                          src={buildImageUrl(path)}
                          alt="Sự cố"
                          sx={{
                            width: 72,
                          height: 72,
                          objectFit: "cover",
                          borderRadius: 1.5,
                          border: "1px solid #eee",
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <CheckSection
              title="Check In"
              icon={<LoginIcon />}
              accentColor="#0F9B94"
              time={assignment.checkInTime}
              odo={assignment.odoCheckIn}
              latitude={assignment.checkInLatitude}
              longitude={assignment.checkInLongitude}
              timeStatus={checkInStatus}
              gpsValid={assignment.checkInGpsValid}
              distanceMeters={assignment.checkInDistanceMeters}
              gpsLabel="Check In"
              photos={assignment.checkInPhotos}
              emptyMessage="Chưa Check In."
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <CheckSection
              title="Check Out"
              icon={<LogoutIcon />}
              accentColor="#ef6c00"
              time={assignment.checkOutTime}
              odo={assignment.odoCheckOut}
              latitude={assignment.checkOutLatitude}
              longitude={assignment.checkOutLongitude}
              timeStatus={checkOutStatus}
              gpsValid={assignment.checkOutGpsValid}
              distanceMeters={assignment.checkOutDistanceMeters}
              gpsLabel="Check Out"
              photos={assignment.checkOutPhotos}
              emptyMessage="Chưa Check Out."
              extra={
                assignment.checkOutBy ? (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Admin Check Out hộ bởi <b>{assignment.checkOutBy}</b>
                    {assignment.adminCheckoutReason
                      ? ` — ${assignment.adminCheckoutReason}`
                      : ""}
                  </Alert>
                ) : null
              }
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
