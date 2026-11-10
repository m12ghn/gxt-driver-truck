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
  parseKhoList,
  shortKhoName,
} from "../constants/warehouses";
import { parseLoaiViTri } from "../utils/userScope";

function asLocationOptions(list) {
  return (list || [])
    .map((item) =>
      typeof item === "string"
        ? { ten: item, loai: "KHO", idKho: "" }
        : {
            ten: item?.ten || "",
            loai: item?.loai === "BUU_CUC" ? "BUU_CUC" : "KHO",
            idKho: item?.idKho || "",
          }
    )
    .filter((item) => item.ten)
    .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
}

function locationLabel(item) {
  const ten = typeof item === "string" ? item : item?.ten || "";
  const short = shortKhoName(ten);
  return short || ten;
}

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
  const [loaiViTri, setLoaiViTri] = useState("");
  const [khoList, setKhoList] = useState([]);
  const [khoOptions, setKhoOptions] = useState(
    asLocationOptions(fallbackWarehouses)
  );

  useEffect(() => {
    if (!open) return;

    getWarehouses()
      .then((res) => {
        const list = asLocationOptions(res.data?.data || []);
        if (list.length) setKhoOptions(list);
      })
      .catch(() => {});

    if (user) {
      setMsnv(user.msnv);
      setHoTen(user.hoTen);
      setSoDienThoai(user.soDienThoai);
      setQuyen(user.quyen);
      setLoaiViTri(parseLoaiViTri(user.loaiViTri));
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
      const matched = khoOptions.find(
        (item) => item.ten === name || shortKhoName(item.ten) === short
      );
      return matched?.ten || name;
    });
    if (mapped.some((name, index) => name !== current[index])) {
      setKhoList(mapped);
    }
    if (!loaiViTri) {
      const matched = khoOptions.find((item) => mapped.includes(item.ten));
      if (matched) {
        setLoaiViTri(matched.loai === "BUU_CUC" ? "BUU_CUC" : "KHO");
      }
    }
  }, [khoOptions, khoList, loaiViTri]);

  function resetForm() {
    setMsnv("");
    setHoTen("");
    setSoDienThoai("");
    setQuyen("");
    setLoaiViTri("");
    setKhoList([]);
  }

  async function handleSave() {
    if (!msnv || !hoTen || !soDienThoai || !quyen) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!loaiViTri) {
      alert("Vui lòng chọn loại vị trí: Kho hoặc Bưu cục.");
      return;
    }

    if (!khoList.length) {
      alert(
        loaiViTri === "BUU_CUC"
          ? "Vui lòng chọn ít nhất một bưu cục phụ trách."
          : "Vui lòng chọn ít nhất một kho phụ trách."
      );
      return;
    }

    try {
      const payload = {
        msnv,
        hoTen,
        soDienThoai,
        quyen,
        loaiViTri,
        kho: khoList,
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
              label="Loại vị trí"
              value={loaiViTri}
              onChange={(e) => {
                setLoaiViTri(e.target.value);
                setKhoList([]);
              }}
            >
              <MenuItem value="KHO">Kho</MenuItem>
              <MenuItem value="BUU_CUC">Bưu cục</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Quyền"
              value={quyen}
              onChange={(e) => setQuyen(e.target.value)}
            >
              <MenuItem value="ADMIN">ADMIN</MenuItem>
              <MenuItem value="WAREHOUSE">WAREHOUSE</MenuItem>
            </TextField>
          </Grid>

          {loaiViTri && (
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel id="user-kho-label">
                  {loaiViTri === "BUU_CUC" ? "Bưu cục phụ trách" : "Kho phụ trách"}
                </InputLabel>
                <Select
                  labelId="user-kho-label"
                  multiple
                  label={
                    loaiViTri === "BUU_CUC" ? "Bưu cục phụ trách" : "Kho phụ trách"
                  }
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
                          label={locationLabel(value)}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {khoOptions
                    .filter((item) =>
                      loaiViTri === "BUU_CUC"
                        ? item.loai === "BUU_CUC"
                        : item.loai !== "BUU_CUC"
                    )
                    .map((item) => (
                    <MenuItem key={item.ten} value={item.ten}>
                      <Checkbox
                        checked={parseKhoList(khoList).includes(item.ten)}
                      />
                      <ListItemText
                        primary={locationLabel(item)}
                        secondary={[item.idKho, item.ten !== locationLabel(item) ? item.ten : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      />
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {loaiViTri === "BUU_CUC"
                    ? "Tài khoản chỉ xem dữ liệu bưu cục đã chọn"
                    : "Tài khoản chỉ xem dữ liệu kho đã chọn"}
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
