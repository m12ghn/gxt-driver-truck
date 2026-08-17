import { useEffect, useState } from "react";

import {
  getDrivers,
  changeDriverStatus,
  deleteDriver,
} from "../api/driverApi";

import DriverDialog from "../components/DriverDialog";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Button,
  Stack,
  Chip,
} from "@mui/material";

export default function Driver() {

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
  }, []);

  async function loadDrivers() {

    try {

      const res = await getDrivers();

      setDrivers(res.data.data);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  }

  async function handleChangeStatus(id) {

    const ok = window.confirm(
      "Bạn có muốn thay đổi trạng thái tài xế?"
    );

    if (!ok) return;

    try {

      await changeDriverStatus(id);

      alert("Cập nhật thành công.");

      loadDrivers();

    } catch (err) {

      alert(
        err.response?.data?.message ||
        "Có lỗi xảy ra."
      );

    }

  }

  async function handleDelete(id) {
    const ok = window.confirm(
      "Bạn có chắc muốn xóa tài xế này? Tài khoản đăng nhập Driver cũng sẽ bị xóa."
    );

    if (!ok) return;

    try {
      await deleteDriver(id);
      alert("Đã xóa tài xế.");
      loadDrivers();
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Xóa thất bại."
      );
    }
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (

    <Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >

        <Typography variant="h4">
          Quản lý tài xế
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            setSelectedDriver(null);
            setOpenDialog(true);
          }}
        >
          + THÊM TÀI XẾ
        </Button>

      </Stack>

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell>ID</TableCell>

              <TableCell>MSNV</TableCell>

              <TableCell>Họ tên</TableCell>

              <TableCell>SĐT</TableCell>

              <TableCell>Kho</TableCell>              <TableCell>GPLX</TableCell>

              <TableCell>Loại bằng</TableCell>

              <TableCell>Trạng thái</TableCell>

              <TableCell align="center">
                Thao tác
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {drivers.map((driver) => (

              <TableRow key={driver.id}>

                <TableCell>{driver.id}</TableCell>

                <TableCell>{driver.msnv}</TableCell>

                <TableCell>{driver.hoTen}</TableCell>

                <TableCell>{driver.soDienThoai}</TableCell>

                <TableCell>{driver.kho}</TableCell>

                <TableCell>{driver.bangLai}</TableCell>

                <TableCell>{driver.loaiBang}</TableCell>

                <TableCell>

                  <Chip
                    label={driver.trangThai}
                    color={
                      driver.trangThai === "Đang làm"
                        ? "success"
                        : "default"
                    }
                    size="small"
                  />

                </TableCell>

                <TableCell align="center">

                  <Button
                    size="small"
                    onClick={() => {

                      setSelectedDriver(driver);

                      setOpenDialog(true);

                    }}
                  >
                    Sửa
                  </Button>

                  <Button
                    size="small"
                    color={
                      driver.trangThai === "Đang làm"
                        ? "warning"
                        : "success"
                    }
                    onClick={() =>
                      handleChangeStatus(driver.id)
                    }
                  >
                    {driver.trangThai === "Đang làm"
                      ? "Khóa"
                      : "Mở"}
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(driver.id)}
                  >
                    Xóa
                  </Button>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

      <DriverDialog
        open={openDialog}        driver={selectedDriver}
        onClose={() => {

          setOpenDialog(false);

          setSelectedDriver(null);

        }}
        onSuccess={loadDrivers}
      />

    </Box>

  );

}