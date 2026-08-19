import { useEffect, useState } from "react";
import { confirmWarehouse } from "../api/assignmentApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

export default function WarehouseConfirmDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const [maChuyenDi, setMaChuyenDi] = useState("");

  useEffect(() => {
    if (!open) return;
    setMaChuyenDi(assignment?.maChuyenDi || "");
  }, [open, assignment]);

  async function handleSave() {
    const tripCode = String(maChuyenDi || "").trim();

    if (!tripCode) {
      alert("Vui lòng nhập mã chuyến đi.");
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    try {
      await confirmWarehouse(assignment.id, {
        action: "confirm",
        warehouseConfirmBy: user?.hoTen || "",
        maChuyenDi: tripCode,
      });

      alert(
        assignment.warehouseStatus === "Không xác nhận"
          ? "Đã xác nhận lại."
          : "Xác nhận thành công."
      );

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Xác nhận thất bại."
      );
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {assignment?.warehouseStatus === "Không xác nhận"
          ? "Xác nhận lại phân công"
          : "Xác nhận phân công"}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              autoFocus
              fullWidth
              required
              label="Mã chuyến đi"
              placeholder="Nhập mã chuyến đi"
              helperText="Bắt buộc nhập mã chuyến đi mới xác nhận được."
              value={maChuyenDi}
              onChange={(e) => setMaChuyenDi(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Hủy
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
        >
          XÁC NHẬN
        </Button>
      </DialogActions>
    </Dialog>
  );
}
