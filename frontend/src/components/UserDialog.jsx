import { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

import {
  createUser,
  updateUser,
} from "../api/userApi";
import { getWarehouses } from "../api/warehouseApi";
import { warehouses as fallbackWarehouses, officialWarehouseNames } from "../constants/warehouses";

export default function UserDialog({
  open,
  onClose,
  onSuccess,
  user,
}) {
  const [msnv, setMsnv] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [quyen, setQuyen] = useState("");
  const [kho, setKho] = useState("");
  const [khoOptions, setKhoOptions] = useState(fallbackWarehouses);

  useEffect(() => {
    if (!open) return;

    getWarehouses()
      .then((res) => {
        const list = officialWarehouseNames(res.data?.data || []);
        if (list.length) setKhoOptions(list);
      })
      .catch(() => {});

    if (user) {
      setMsnv(user.msnv);
      setHoTen(user.hoTen);
      setSoDienThoai(user.soDienThoai);
      setQuyen(user.quyen);
      setKho(user.kho || "");
    } else {
      resetForm();
    }
  }, [open, user]);

  function resetForm() {
    setMsnv("");
    setHoTen("");
    setSoDienThoai("");
    setQuyen("");
    setKho("");
  }

  async function handleSave() {
    if (!msnv || !hoTen || !soDienThoai || !quyen) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (quyen === "WAREHOUSE" && !kho) {
      alert("Vui lòng chọn kho phụ trách cho tài khoản WAREHOUSE.");
      return;
    }

    try {
      const payload = {
        msnv,
        hoTen,
        soDienThoai,
        quyen,
        kho: quyen === "WAREHOUSE" ? kho : null,
      };

      if (user) {
        await updateUser(user.id, {
          ...payload,
          trangThai: user.trangThai,
        });
        alert("Cập nhật User thành công.");
      } else {
        await createUser(payload);
        alert("Tạo User thành công.");
      }

      onSuccess();
      handleClose();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra.");
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {user ? "Cập nhật User" : "Thêm User"}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="MSNV"
              value={msnv}
              onChange={(e) => setMsnv(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Họ tên"
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={soDienThoai}
              onChange={(e) => setSoDienThoai(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Quyền"
              value={quyen}
              onChange={(e) => {
                setQuyen(e.target.value);
                if (e.target.value !== "WAREHOUSE") setKho("");
              }}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="WAREHOUSE">WAREHOUSE</MenuItem>
            </TextField>
          </Grid>

          {quyen === "WAREHOUSE" && (
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Kho phụ trách"
                value={kho}
                onChange={(e) => setKho(e.target.value)}
              >
                {khoOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave}>
          {user ? "Cập nhật" : "Lưu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
