import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import { isVungHcm } from "../constants/projects";

export default function WarehouseDetailDialog({
  open,
  onClose,
  assignment,
  canAdjust,
  onReconfirm,
  onReject,
}) {
  if (!assignment) return null;

  const hcm = isVungHcm(assignment.duAn);

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("vi-VN");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {hcm ? "Chi tiết xác nhận AM" : "Chi tiết xác nhận kho"}
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
              <b>Biển số:</b>
            </Typography>

            <Typography>
              {assignment.Vehicle?.bienSo}
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

          <Grid size={{ xs: 12 }}>
            <Typography sx={{ mb: 1 }}>
              <b>{hcm ? "Trạng thái AM:" : "Trạng thái kho:"}</b>
            </Typography>

            {assignment.warehouseStatus === "Đã xác nhận" && (
              <Chip
                label="Đã xác nhận"
                color="success"
                size="small"
              />
            )}

            {assignment.warehouseStatus === "Không xác nhận" && (
              <Chip
                label="Không xác nhận"
                color="error"
                size="small"
              />
            )}

          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Người xác nhận</b>
            </Typography>

            <Typography>
              {assignment.warehouseConfirmBy || "-"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Thời gian</b>
            </Typography>

            <Typography>
              {formatDate(assignment.warehouseConfirmTime)}
            </Typography>
          </Grid>

          {assignment.warehouseStatus === "Không xác nhận" && (

            <Grid size={{ xs: 12 }}>
              <Typography>
                <b>Lí do không xác nhận</b>
              </Typography>

              <Typography>
                {assignment.warehouseReason || "-"}
              </Typography>
            </Grid>

          )}

          {assignment.maChuyenDi && (

            <Grid size={{ xs: 12 }}>
              <Typography>
                <b>{hcm ? "Mã chuyến" : "Mã chuyến đi"}</b>
              </Typography>

              <Typography>
                {assignment.maChuyenDi}
              </Typography>
            </Grid>

          )}

          {hcm && assignment.warehouseStatus === "Đã xác nhận" && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography>
                  <b>Số NVPTTT đi theo xe</b>
                </Typography>
                <Typography>
                  {assignment.soNvpTtt ?? "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography>
                  <b>Số đơn gán giao</b>
                </Typography>
                <Typography>
                  {assignment.soDonGanGiao ?? "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography>
                  <b>Số đơn gán lấy</b>
                </Typography>
                <Typography>
                  {assignment.soDonGanLay ?? "-"}
                </Typography>
              </Grid>
            </>
          )}

        </Grid>

      </DialogContent>

      <DialogActions>

        <Button onClick={onClose}>
          Đóng
        </Button>

        {canAdjust &&
          assignment.warehouseStatus === "Đã xác nhận" && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => onReject?.(assignment)}
            >
              Không xác nhận
            </Button>
          )}

        {canAdjust &&
          assignment.warehouseStatus === "Không xác nhận" && (
            <Button
              variant="contained"
              color="success"
              onClick={() => onReconfirm?.(assignment)}
            >
              Xác nhận lại
            </Button>
          )}

      </DialogActions>
    </Dialog>
  );
}
