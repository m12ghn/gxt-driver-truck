import { useEffect, useState } from "react";
import { createVehicle, updateVehicle } from "../api/vehicleApi";
import { warehouses } from "../constants/warehouses";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from "@mui/material";

const LOAI_XE_OPTIONS = ["Van", "1T9", "5T", "8T", "15T"];

const emptyForm = {
  bienSo: "",
  loaiXe: "",
  kho: "",
  trangThai: "Hoạt động",
  kmHienTai: 0,
  ghiChu: "",
};

export default function VehicleDialog({
  open,
  onClose,
  vehicle,
}) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(vehicle);

  useEffect(() => {
    if (!open) return;

    if (vehicle) {
      setForm({
        bienSo: vehicle.bienSo || "",
        loaiXe: vehicle.loaiXe || "",
        kho: vehicle.kho || "",
        trangThai: vehicle.trangThai || "Hoạt động",
        kmHienTai: vehicle.kmHienTai ?? 0,
        ghiChu: vehicle.ghiChu || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, vehicle]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!form.bienSo || !form.loaiXe || !form.kho) {
      alert("Vui lòng nhập biển số, loại xe và kho.");
      return;
    }

    try {
      const payload = {
        ...form,
        kmHienTai: Number(form.kmHienTai) || 0,
      };

      if (isEdit) {
        await updateVehicle(vehicle.id, payload);
        alert("Cập nhật xe thành công!");
      } else {
        await createVehicle(payload);
        alert("Thêm xe thành công!");
      }

      onClose(true);
    } catch (err) {
      console.log(err);
      alert(
        err.response?.data?.message ||
          (isEdit ? "Cập nhật xe thất bại!" : "Thêm xe thất bại!")
      );
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? "Sửa xe" : "Thêm xe"}</DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Biển số"
              name="bienSo"
              value={form.bienSo}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              label="Loại xe"
              name="loaiXe"
              value={form.loaiXe}
              onChange={handleChange}
              fullWidth
            >
              {LOAI_XE_OPTIONS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              label="Kho"
              name="kho"
              value={form.kho}
              onChange={handleChange}
              fullWidth
            >
              {warehouses.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              label="Trạng thái"
              name="trangThai"
              value={form.trangThai}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Hoạt động">Hoạt động</MenuItem>
              <MenuItem value="Bảo dưỡng">Bảo dưỡng</MenuItem>
              <MenuItem value="Ngưng">Ngưng</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label="Km hiện tại"
              name="kmHienTai"
              type="number"
              value={form.kmHienTai}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Ghi chú"
              name="ghiChu"
              value={form.ghiChu}
              onChange={handleChange}
              multiline
              rows={3}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)}>Hủy</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEdit ? "Cập nhật" : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
