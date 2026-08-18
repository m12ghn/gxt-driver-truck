import { useEffect, useState } from "react";

import {
  createDriver,
  updateDriver,
} from "../api/driverApi";

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

import { getWarehouses } from "../api/warehouseApi";
import { warehouses as fallbackWarehouses, officialWarehouseNames } from "../constants/warehouses";

const defaultForm = {
  msnv: "",
  hoTen: "",
  soDienThoai: "",
  bangLai: "",
  loaiBang: "",
  kho: "",
  trangThai: "Đang làm",
};

export default function DriverDialog({
  open,
  onClose,
  onSuccess,
  driver,
}) {

  const [form, setForm] = useState(defaultForm);
  const [khoOptions, setKhoOptions] = useState(fallbackWarehouses);

  useEffect(() => {

    if (!open) return;

    // Lấy danh sách kho thực tế từ bảng Warehouses (Supabase) thay vì
    // dùng danh sách cố định trong code — giữ fallbackWarehouses chỉ để
    // dùng khi API lỗi hoặc bảng Warehouses chưa có dữ liệu.
    getWarehouses()
      .then((res) => {
        const list = officialWarehouseNames(res.data?.data || []);
        if (list.length) setKhoOptions(list);
      })
      .catch(() => {});

    if (driver) {

      setForm({
        msnv: driver.msnv || "",
        hoTen: driver.hoTen || "",
        soDienThoai: driver.soDienThoai || "",
        bangLai: driver.bangLai || "",
        loaiBang: driver.loaiBang || "",
        kho: driver.kho || "",
        trangThai: driver.trangThai || "Đang làm",
      });

    } else {

      setForm(defaultForm);

    }

  }, [open, driver]);

  function handleChange(e) {

    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

  }

  function handleClose() {

    setForm(defaultForm);

    onClose();

  }

  async function handleSave() {

    if (
      !form.msnv ||
      !form.hoTen ||
      !form.soDienThoai ||
      !form.kho ||
      !form.loaiBang
    ) {

      alert("Vui lòng nhập đầy đủ thông tin.");

      return;

    }

    try {

      if (driver) {

        await updateDriver(driver.id, form);

        alert("Cập nhật tài xế thành công.");

      } else {

        await createDriver(form);

        alert(
`Thêm tài xế thành công.

Tài khoản: ${form.soDienThoai}
Mật khẩu: ${form.msnv}`
        );

      }

      if (onSuccess) {
        onSuccess();
      }

      handleClose();

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.message ||
        "Có lỗi xảy ra."
      );

    }

  }

  return (

    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >

      <DialogTitle>
        {driver
          ? "Cập nhật tài xế"
          : "Thêm tài xế"}
      </DialogTitle>

      <DialogContent>

        <Grid
          container
          spacing={2}
          sx={{ mt: 1 }}
        >          <Grid size={{ xs: 6 }}>
            <TextField
              label="MSNV"
              name="msnv"
              value={form.msnv}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label="Họ tên"
              name="hoTen"
              value={form.hoTen}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label="Số điện thoại"
              name="soDienThoai"
              value={form.soDienThoai}
              onChange={handleChange}
              fullWidth
            />
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
              {khoOptions.map((item) => (
                <MenuItem
                  key={item}
                  value={item}
                >
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              label="Số GPLX"
              name="bangLai"
              value={form.bangLai}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              label="Loại bằng"
              name="loaiBang"
              value={form.loaiBang}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="B2">
                B2
              </MenuItem>

              <MenuItem value="C">
                C
              </MenuItem>

              <MenuItem value="C1">
                C1
              </MenuItem>

              <MenuItem value="D">
                D
              </MenuItem>

            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Trạng thái"
              name="trangThai"
              value={form.trangThai}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Đang làm">
                Đang làm
              </MenuItem>

              <MenuItem value="Nghỉ việc">
                Nghỉ việc
              </MenuItem>

            </TextField>
          </Grid>        </Grid>

      </DialogContent>

      <DialogActions>

        <Button
          onClick={handleClose}
        >
          Hủy
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          {driver
            ? "Cập nhật"
            : "Lưu"}
        </Button>

      </DialogActions>

    </Dialog>

  );

}