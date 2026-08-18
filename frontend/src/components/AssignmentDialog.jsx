import { useEffect, useState } from "react";
import { getVehicles } from "../api/vehicleApi";
import { getDrivers } from "../api/driverApi";
import { createAssignment } from "../api/assignmentApi";
import { getWarehouses } from "../api/warehouseApi";
import { warehouses as fallbackWarehouses } from "../constants/warehouses";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
} from "@mui/material";

export default function AssignmentDialog({
  open,
  onClose,
  onSuccess,
}) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [khoOptions, setKhoOptions] = useState(fallbackWarehouses);

  const [ngay, setNgay] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ca, setCa] = useState("");
  const [kho, setKho] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  useEffect(() => {
    if (open) {
      loadVehicles();
      loadDrivers();
      loadWarehouses();
    }
  }, [open]);

  async function loadVehicles() {
    try {
      const res = await getVehicles();
      setVehicles(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Lấy danh sách kho thực tế từ bảng Warehouses (Supabase) thay vì dùng
  // danh sách cố định trong code — fallbackWarehouses chỉ dùng khi API
  // lỗi hoặc bảng Warehouses chưa có dữ liệu.
  async function loadWarehouses() {
    try {
      const res = await getWarehouses();
      const list = (res.data?.data || [])
        .map((w) => w.ten || w)
        .filter(Boolean);
      if (list.length) setKhoOptions(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadDrivers() {
    try {
      const res = await getDrivers();
      setDrivers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave() {
    if (
      !ngay ||
      !ca ||
      !kho ||
      !vehicleId ||
      !driverId
    ) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      await createAssignment({
        ngay,
        ca,
        kho,
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
      });

      alert("Thêm phân công thành công!");

      if (onSuccess) {
        onSuccess();
      }

      handleClose();

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Thêm phân công thất bại!"
      );
    }
  }

  function handleClose() {
    setNgay(new Date().toISOString().split("T")[0]);
    setCa("");
    setKho("");
    setVehicleId("");
    setDriverId("");

    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Thêm phân công
      </DialogTitle>

      <DialogContent>

        <Grid container spacing={2} sx={{ mt: 1 }}>

          <Grid size={{ xs: 6 }}>
            <TextField
              type="date"
              fullWidth
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              label="Ca"
              fullWidth
              value={ca}
              onChange={(e) => setCa(e.target.value)}
            >
              <MenuItem value="Ca 1">
                Ca 1
              </MenuItem>

              <MenuItem value="Ca 2">
                Ca 2
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Kho"
              fullWidth
              value={kho}
              onChange={(e) => setKho(e.target.value)}
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

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Xe"
              fullWidth
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              {vehicles
                .filter(
                  (v) => v.trangThai === "Hoạt động"
                )
                .map((vehicle) => (
                  <MenuItem
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.bienSo} - {vehicle.loaiXe}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Tài xế"
              fullWidth
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              {drivers
                .filter(
                  (d) => d.trangThai === "Đang làm"
                )
                .map((driver) => (
                  <MenuItem
                    key={driver.id}
                    value={driver.id}
                  >
                    {driver.msnv} - {driver.hoTen}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

        </Grid>

      </DialogContent>

      <DialogActions>

        <Button onClick={handleClose}>
          Hủy
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          Lưu
        </Button>

      </DialogActions>

    </Dialog>
  );
}