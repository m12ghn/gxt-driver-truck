import { useEffect, useState } from "react";
import { confirmWarehouse } from "../api/assignmentApi";
import { isVungHcm } from "../constants/projects";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
} from "@mui/material";

const EMPTY_HCM = {
  maChuyenDi: "",
  soNvpTtt: "",
  soDonGanGiao: "",
  soDonGanLay: "",
};

export default function WarehouseConfirmDialog({
  open,
  onClose,
  assignment,
  onSuccess,
}) {
  const hcm = isVungHcm(assignment?.duAn);
  const [form, setForm] = useState(EMPTY_HCM);

  useEffect(() => {
    if (!open) return;
    setForm({
      maChuyenDi: assignment?.maChuyenDi || "",
      soNvpTtt: assignment?.soNvpTtt ?? "",
      soDonGanGiao: assignment?.soDonGanGiao ?? "",
      soDonGanLay: assignment?.soDonGanLay ?? "",
    });
  }, [open, assignment]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    const tripCode = String(form.maChuyenDi || "").trim();

    if (!tripCode) {
      alert(hcm ? "Vui lòng nhập mã chuyến." : "Vui lòng nhập mã chuyến đi.");
      return;
    }

    if (hcm) {
      const counts = [
        ["soNvpTtt", "số NVPTTT đi theo xe"],
        ["soDonGanGiao", "số đơn gán giao"],
        ["soDonGanLay", "số đơn gán lấy"],
      ];
      for (const [key, label] of counts) {
        const raw = String(form[key] ?? "").trim();
        if (raw === "") {
          alert(`Vui lòng nhập ${label}.`);
          return;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0) {
          alert(`${label} phải là số nguyên từ 0 trở lên.`);
          return;
        }
      }
    }

    const user = JSON.parse(localStorage.getItem("user"));

    const payload = {
      action: "confirm",
      warehouseConfirmBy: user?.hoTen || "",
      maChuyenDi: tripCode,
    };

    if (hcm) {
      payload.soNvpTtt = Number(form.soNvpTtt);
      payload.soDonGanGiao = Number(form.soDonGanGiao);
      payload.soDonGanLay = Number(form.soDonGanLay);
    }

    try {
      await confirmWarehouse(assignment.id, payload);

      alert(
        assignment.warehouseStatus === "Không xác nhận"
          ? "Đã xác nhận lại."
          : hcm
            ? "AM xác nhận thành công."
            : "Xác nhận thành công."
      );

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Xác nhận thất bại.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {assignment?.warehouseStatus === "Không xác nhận"
          ? hcm
            ? "AM xác nhận lại"
            : "Xác nhận lại phân công"
          : hcm
            ? "AM xác nhận"
            : "Xác nhận phân công"}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              autoFocus
              fullWidth
              required
              name="maChuyenDi"
              label={hcm ? "Mã chuyến" : "Mã chuyến đi"}
              placeholder={hcm ? "Nhập mã chuyến" : "Nhập mã chuyến đi"}
              helperText={
                hcm
                  ? "Bắt buộc nhập mã chuyến mới xác nhận được."
                  : "Bắt buộc nhập mã chuyến đi mới xác nhận được."
              }
              value={form.maChuyenDi}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !hcm) handleSave();
              }}
            />
          </Grid>

          {hcm && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="soNvpTtt"
                  label="Số NVPTTT đi theo xe"
                  value={form.soNvpTtt}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="soDonGanGiao"
                  label="Số đơn gán giao"
                  value={form.soDonGanGiao}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="soDonGanLay"
                  label="Số đơn gán lấy"
                  value={form.soDonGanLay}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" color="success" onClick={handleSave}>
          XÁC NHẬN
        </Button>
      </DialogActions>
    </Dialog>
  );
}
