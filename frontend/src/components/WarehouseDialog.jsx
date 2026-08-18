import { useEffect, useState } from "react";
import { updateWarehouse } from "../api/warehouseApi";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from "@mui/material";

export default function WarehouseDialog({ open, onClose, warehouse }) {
  const [form, setForm] = useState({
    latitude: "",
    longitude: "",
    banKinh: 400,
  });

  useEffect(() => {
    if (!open || !warehouse) return;
    setForm({
      latitude: warehouse.latitude ?? "",
      longitude: warehouse.longitude ?? "",
      banKinh: warehouse.banKinh ?? 400,
    });
  }, [open, warehouse]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    if (form.latitude === "" || form.longitude === "") {
      alert("Vui lòng nhập tọa độ GPS.");
      return;
    }

    try {
      await updateWarehouse(warehouse.id, {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        banKinh: Number(form.banKinh),
      });
      alert("Đã cập nhật tọa độ kho.");
      onClose(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Cập nhật thất bại.");
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>Tọa độ kho {warehouse?.ten || ""}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
