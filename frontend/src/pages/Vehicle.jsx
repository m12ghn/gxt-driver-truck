import { useEffect, useState } from "react";
import {
  getVehicles,
  deleteVehicle,
  importVehicleExcel,
  downloadVehicleTemplate,
} from "../api/vehicleApi";

import VehicleDialog from "../components/VehicleDialog";

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
} from "@mui/material";

export default function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await getVehicles();
      setVehicles(res.data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedVehicle(null);
    setOpenDialog(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenDialog(true);
  };

  const handleCloseDialog = (shouldReload) => {
    setOpenDialog(false);
    setSelectedVehicle(null);
    if (shouldReload) loadVehicles();
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa xe này?"
    );

    if (!confirmDelete) return;

    try {
      await deleteVehicle(id);
      alert("Đã xóa xe!");
      loadVehicles();
    } catch (err) {
      console.log(err);
      alert("Xóa thất bại!");
    }
  };

  async function handleDownloadTemplate() {
    try {
      const res = await downloadVehicleTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mau-danh-sach-xe.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Tải mẫu Excel thất bại.");
    }
  }

  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const res = await importVehicleExcel(file);
      let message = `✅ Import thành công ${res.data.imported} dòng`;

      if (res.data.created || res.data.updated) {
        message += ` (thêm mới ${res.data.created || 0}, cập nhật ${res.data.updated || 0})`;
      }

      if (res.data.errors && res.data.errors.length > 0) {
        message += `\n\n❌ Có ${res.data.errors.length} lỗi:\n\n`;
        message += res.data.errors.join("\n");
      }

      alert(message);
      loadVehicles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Import thất bại");
    }

    event.target.value = "";
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
        <Typography variant="h4">Quản lý xe</Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleDownloadTemplate}>
            TẢI MẪU
          </Button>

          <Button variant="outlined" component="label">
            IMPORT EXCEL
            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
            />
          </Button>

          <Button variant="contained" onClick={handleAdd}>
            + THÊM XE
          </Button>
        </Stack>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Biển số</TableCell>
              <TableCell>Loại xe</TableCell>
              <TableCell>Kho</TableCell>
              <TableCell>Km hiện tại</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ghi chú</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>{vehicle.id}</TableCell>
                <TableCell>{vehicle.bienSo}</TableCell>
                <TableCell>{vehicle.loaiXe}</TableCell>
                <TableCell>{vehicle.kho}</TableCell>
                <TableCell>{vehicle.kmHienTai}</TableCell>
                <TableCell>{vehicle.trangThai}</TableCell>
                <TableCell>{vehicle.ghiChu}</TableCell>
                <TableCell align="center">
                  <Button size="small" onClick={() => handleEdit(vehicle)}>
                    Sửa
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <VehicleDialog
        open={openDialog}
        vehicle={selectedVehicle}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
