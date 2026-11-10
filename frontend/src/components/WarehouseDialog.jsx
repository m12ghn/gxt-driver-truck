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
  MenuItem,
} from "@mui/material";

function guessLoai(ten) {
  const n = String(ten || "");
  if (/\(HCM\)/i.test(n) || /(^|\s)CK(\s|$)/i.test(n)) return "BUU_CUC";
  return "KHO";
}

const EMPTY_FORM = {
  idKho: "",
  ten: "",
  loai: "KHO",
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
        idKho: warehouse.idKho ?? "",
        ten: warehouse.ten ?? "",
        loai: warehouse.loai === "BUU_CUC" || warehouse.loai === "KHO"
          ? warehouse.loai
          : guessLoai(warehouse.ten),
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
    if (!String(form.idKho || "").trim()) {
      alert("Vui lòng nhập ID.");
      return;
    }

    if (!isEdit && !String(form.ten || "").trim()) {
      alert("Vui lòng nhập tên.");
      return;
    }

    if (form.latitude === "" || form.longitude === "") {
      alert("Vui lòng nhập tọa độ GPS.");
      return;
    }

    const payload = {
      idKho: String(form.idKho).trim(),
      loai: form.loai === "BUU_CUC" ? "BUU_CUC" : "KHO",
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      banKinh: Number(form.banKinh),
    };

    try {
      if (isEdit) {
        const res = await updateWarehouse(warehouse.id, payload);
        alert(res.data?.message || "Đã cập nhật.");
      } else {
        const res = await createWarehouse({
          ...payload,
          ten: String(form.ten).trim(),
        });
        alert(res.data?.message || "Đã thêm mới.");
      }
      onClose(true);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          (isEdit ? "Cập nhật thất bại." : "Thêm thất bại.")
      );
    }
  }

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? warehouse?.ten || "Sửa kho/bưu cục" : "Thêm kho/bưu cục"}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="ID"
              name="idKho"
              value={form.idKho}
              onChange={handleChange}
              placeholder="Ví dụ: TB01"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              select
              fullWidth
              label="Loại"
              name="loai"
              value={form.loai}
              onChange={handleChange}
            >
              <MenuItem value="KHO">Kho</MenuItem>
              <MenuItem value="BUU_CUC">Bưu cục</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Tên"
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
          {isEdit ? "Lưu" : "Thêm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
