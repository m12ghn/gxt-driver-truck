import { useEffect, useState } from "react";
import { createWarehouse, updateWarehouse } from "../api/warehouseApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";

const EMPTY_FORM = {
  ten: "",
  latitude: "",
  longitude: "",
  banKinh: 100,
};

export default function WarehouseDialog({ open, onClose, warehouse }) {
  const isEdit = Boolean(warehouse?.id);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (warehouse) {
      setForm({
        ten: warehouse.ten ?? "",
        latitude: warehouse.latitude ?? "",
        longitude: warehouse.longitude ?? "",
        banKinh: warehouse.banKinh ?? 100,
      });
      return;
    }
    setForm(EMPTY_FORM);
  }, [open, warehouse]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    if (!isEdit && !String(form.ten || "").trim()) {
      alert("Vui lòng nhập tên kho.");
      return;
    }

    if (form.latitude === "" || form.longitude === "") {
      alert("Vui lòng nhập tọa độ GPS.");
      return;
    }

    const payload = {
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      banKinh: Number(form.banKinh),
    };

    try {
      if (isEdit) {
        const res = await updateWarehouse(warehouse.id, payload);
        alert(
          res.data?.message ||
            "Đã cập nhật kho và tính lại GPS Check In/Out theo bán kính mới."
        );
      } else {
        const res = await createWarehouse({
          ...payload,
          ten: String(form.ten).trim(),
        });
        alert(res.data?.message || "Đã thêm kho mới.");
      }
      onClose(true);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          (isEdit ? "Cập nhật thất bại." : "Thêm kho thất bại.")
      );
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? `Tọa độ kho ${warehouse?.ten || ""}` : "Thêm kho"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Tên kho"
              name="ten"
              value={form.ten}
              onChange={handleChange}
              InputProps={{ readOnly: isEdit }}
              placeholder="Ví dụ: Kho Giao Hàng Nặng - ..."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Latitude"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Longitude"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              type="number"
              label="Bán kính cho phép (mét)"
              name="banKinh"
              value={form.banKinh}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Hủy</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEdit ? "Lưu" : "Thêm kho"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
