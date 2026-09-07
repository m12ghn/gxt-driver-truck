import { useEffect, useState } from "react";
import { getVehicles } from "../api/vehicleApi";
import { getDrivers } from "../api/driverApi";
import { createAssignment, updateAssignment } from "../api/assignmentApi";
import { getWarehouses } from "../api/warehouseApi";
import {
  warehouses as fallbackWarehouses,
  officialWarehouseNames,
  shortKhoName,
} from "../constants/warehouses";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Autocomplete,
} from "@mui/material";

export default function AssignmentDialog({
  open,
  onClose,
  onSuccess,
  assignment,
}) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [khoOptions, setKhoOptions] = useState(fallbackWarehouses);

  const vietnamToday = () =>
    new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

  const [ngay, setNgay] = useState(vietnamToday());
  const [ca, setCa] = useState("");
  const [kho, setKho] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");

  const isEdit = Boolean(assignment?.id);

  useEffect(() => {
    if (!open) return;

    loadVehicles();
    loadDrivers();
    loadWarehouses();

    if (assignment) {
      setNgay(String(assignment.ngay || "").slice(0, 10) || vietnamToday());
      setCa(assignment.ca || "");
      setKho(assignment.kho || "");
      setVehicleId(assignment.vehicleId || "");
      setDriverId(assignment.driverId || "");
    } else {
      setNgay(vietnamToday());
      setCa("");
      setKho("");
      setVehicleId("");
      setDriverId("");
    }
  }, [open, assignment]);

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
      const list = officialWarehouseNames(res.data?.data || []);
      if (list.length) {
        setKhoOptions(list);
        setKho((prev) => {
          if (!prev) return list.length === 1 ? list[0] : "";
          const matched = list.find(
            (item) => item === prev || shortKhoName(item) === shortKhoName(prev)
          );
          return matched || prev;
        });
      }
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
      const payload = {
        ngay,
        ca,
        kho,
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
      };

      if (isEdit) {
        await updateAssignment(assignment.id, payload);
        alert("Cập nhật phân công thành công.");
      } else {
        await createAssignment(payload);
        alert("Thêm phân công thành công!");
      }

      if (onSuccess) {
        onSuccess();
      }

      handleClose();

    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          (isEdit ? "Cập nhật phân công thất bại." : "Thêm phân công thất bại!")
      );
    }
  }

  function handleClose() {
    setNgay(vietnamToday());
    setCa("");
    setKho("");
    setVehicleId("");
    setDriverId("");

    onClose();
  }

  const vehicleOptions = vehicles.filter(
    (v) =>
      v.trangThai === "Hoạt động" || Number(v.id) === Number(vehicleId)
  );
  const driverOptions = drivers.filter(
    (d) =>
      d.trangThai === "Đang làm" || Number(d.id) === Number(driverId)
  );
  const selectedVehicle =
    vehicleOptions.find((v) => Number(v.id) === Number(vehicleId)) || null;
  const selectedDriver =
    driverOptions.find((d) => Number(d.id) === Number(driverId)) || null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? "Sửa phân công" : "Thêm phân công"}
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
            <Autocomplete
              options={vehicleOptions}
              value={selectedVehicle}
              onChange={(_, value) => setVehicleId(value?.id || "")}
              getOptionLabel={(option) =>
                `${option.bienSo || ""} - ${option.loaiXe || ""}`.trim()
              }
              isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
              filterOptions={(options, { inputValue }) => {
                const keyword = inputValue.trim().toLowerCase();
                if (!keyword) return options;
                return options.filter((item) =>
                  [item.bienSo, item.loaiXe, item.kho]
                    .some((value) =>
                      String(value || "").toLowerCase().includes(keyword)
                    )
                );
              }}
              noOptionsText="Không tìm thấy xe"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Xe"
                  placeholder="Gõ biển số / loại xe"
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={driverOptions}
              value={selectedDriver}
              onChange={(_, value) => setDriverId(value?.id || "")}
              getOptionLabel={(option) =>
                `${option.msnv || ""} - ${option.hoTen || ""}`.trim()
              }
              isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
              filterOptions={(options, { inputValue }) => {
                const keyword = inputValue.trim().toLowerCase();
                if (!keyword) return options;
                return options.filter((item) =>
                  [item.msnv, item.hoTen, item.soDienThoai, item.kho]
                    .some((value) =>
                      String(value || "").toLowerCase().includes(keyword)
                    )
                );
              }}
              noOptionsText="Không tìm thấy tài xế"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tài xế"
                  placeholder="Gõ MSNV / họ tên / SĐT"
                />
              )}
            />
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
          {isEdit ? "Cập nhật" : "Lưu"}
        </Button>

      </DialogActions>

    </Dialog>
  );
}