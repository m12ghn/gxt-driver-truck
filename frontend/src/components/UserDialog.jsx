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
  Checkbox,
  ListItemText,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material";

import {
  createUser,
  updateUser,
} from "../api/userApi";
import { getWarehouses } from "../api/warehouseApi";
import {
  warehouses as fallbackWarehouses,
  officialWarehouseNames,
  parseKhoList,
  shortKhoName,
} from "../constants/warehouses";

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
  const [khoList, setKhoList] = useState([]);
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
      setKhoList(parseKhoList(user.khoList?.length ? user.khoList : user.kho));
    } else {
      resetForm();
    }
  }, [open, user]);

  useEffect(() => {
    const current = parseKhoList(khoList);
    if (!current.length || !khoOptions.length) return;
    const mapped = current.map((name) => {
      const short = shortKhoName(name);
      return (
        khoOptions.find((item) => item === name || shortKhoName(item) === short) ||
        name
      );
    });
    if (mapped.some((name, index) => name !== current[index])) {
      setKhoList(mapped);
    }
  }, [khoOptions, khoList]);

  function resetForm() {
    setMsnv("");
    setHoTen("");
    setSoDienThoai("");
    setQuyen("");
    setKhoList([]);
  }

  async function handleSave() {
    if (!msnv || !hoTen || !soDienThoai || !quyen) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (quyen === "WAREHOUSE" && !khoList.length) {
      alert("Vui lòng chọn ít nhất một kho phụ trách cho tài khoản WAREHOUSE.");
      return;
    }

    try {
      const payload = {
        msnv,
        hoTen,
        soDienThoai,
        quyen,
        kho: quyen === "WAREHOUSE" ? khoList : null,
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
                if (e.target.value !== "WAREHOUSE") setKhoList([]);
              }}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="WAREHOUSE">WAREHOUSE</MenuItem>
            </TextField>
          </Grid>

          {quyen === "WAREHOUSE" && (
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel id="user-kho-label">Kho phụ trách</InputLabel>
                <Select
                  labelId="user-kho-label"
                  multiple
                  label="Kho phụ trách"
                  value={Array.isArray(khoList) ? khoList : []}
                  onChange={(e) => {
                    const next = e.target.value;
                    setKhoList(
                      Array.isArray(next) ? next : parseKhoList(next)
                    );
                  }}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {parseKhoList(selected).map((value) => (
                        <Chip
                          key={value}
                          size="small"
                          label={shortKhoName(value)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {khoOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      <Checkbox
                        checked={parseKhoList(khoList).includes(item)}
                      />
                      <ListItemText
                        primary={shortKhoName(item)}
                        secondary={item}
                      />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Có thể chọn nhiều kho nếu quản lý hơn 1 kho
                </FormHelperText>
              </FormControl>
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
