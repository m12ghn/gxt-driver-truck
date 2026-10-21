import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  getVehicles,
  deleteVehicle,
  importVehicleExcel,
  downloadVehicleTemplate,
} from "../api/vehicleApi";

import VehicleDialog from "../components/VehicleDialog";
import { brand } from "../theme/brand";

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
  TextField,
  Chip,
  TableContainer,
  alpha,
} from "@mui/material";

function liveStatus(vehicle) {
  return vehicle.trangThaiHomNay ||
    (vehicle.coLichHomNay ? "Hoạt động" : "Không hoạt động");
}

function formatOdoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ActiveDot() {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: "#22c55e",
        boxShadow: "0 0 0 0 rgba(34,197,94,0.55)",
        animation: "vehiclePulse 1.6s ease-out infinite",
        "@keyframes vehiclePulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.55)", transform: "scale(1)" },
          "70%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)", transform: "scale(1.15)" },
          "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)", transform: "scale(1)" },
        },
      }}
    />
  );
}

export default function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  function handleExport() {
    const rows = filteredVehicles.map((vehicle) => {
      const trip = vehicle.lichHomNay;
      const active = liveStatus(vehicle) === "Hoạt động";
      const detail = trip
        ? [trip.ca, trip.taiXe || trip.msnv, trip.trangThai]
            .filter(Boolean)
            .join(" · ")
        : "";

      return {
        ID: vehicle.id,
        "Biển số": vehicle.bienSo,
        "Loại xe": vehicle.loaiXe,
        Kho: vehicle.kho,
        "Km hiện tại": vehicle.kmHienTai,
        "Ngày cập nhật ODO gần nhất": formatOdoDate(vehicle.odoUpdatedAt),
        "Trạng thái hôm nay":
          active && detail ? `Hoạt động - ${detail}` : liveStatus(vehicle),
        "Ghi chú": vehicle.ghiChu,
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [8, 16, 18, 22, 14, 24, 40, 30].map((wch) => ({ wch }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Danh sách xe");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `danh-sach-xe-${today}.xlsx`);
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

  const keyword = search.trim().toLowerCase();
  const filteredVehicles = vehicles
    .filter((vehicle) => {
      const status = liveStatus(vehicle);
      if (statusFilter && status !== statusFilter) return false;
      if (!keyword) return true;
      const trip = vehicle.lichHomNay || {};
      return [
        vehicle.bienSo,
        vehicle.loaiXe,
        vehicle.kho,
        vehicle.trangThai,
        status,
        vehicle.ghiChu,
        vehicle.kmHienTai,
        trip.ca,
        trip.kho,
        trip.taiXe,
        trip.msnv,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    })
    .sort((a, b) => {
      const activeA = liveStatus(a) === "Hoạt động" ? 1 : 0;
      const activeB = liveStatus(b) === "Hoạt động" ? 1 : 0;
      if (activeA !== activeB) return activeB - activeA;
      return Number(b.id) - Number(a.id);
    });

  const activeCount = vehicles.filter((v) => liveStatus(v) === "Hoạt động").length;
  const idleCount = vehicles.length - activeCount;

  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>

      <Box sx={{ flexShrink: 0 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h4">Quản lý xe</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Trạng thái theo lịch phân công hôm nay
          </Typography>
        </Box>

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

          <Button
            variant="outlined"
            onClick={handleExport}
            disabled={filteredVehicles.length === 0}
          >
            XUẤT EXCEL
          </Button>

          <Button variant="contained" onClick={handleAdd}>
            + THÊM XE
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
        <Chip
          clickable
          color={statusFilter === "" ? "primary" : "default"}
          variant={statusFilter === "" ? "filled" : "outlined"}
          label={`Tổng: ${vehicles.length}`}
          onClick={() => setStatusFilter("")}
        />
        <Chip
          clickable
          color={statusFilter === "Hoạt động" ? "success" : "default"}
          variant={statusFilter === "Hoạt động" ? "filled" : "outlined"}
          label={`Hoạt động hôm nay: ${activeCount}`}
          onClick={() =>
            setStatusFilter(statusFilter === "Hoạt động" ? "" : "Hoạt động")
          }
        />
        <Chip
          clickable
          color={statusFilter === "Không hoạt động" ? "warning" : "default"}
          variant={statusFilter === "Không hoạt động" ? "filled" : "outlined"}
          label={`Không hoạt động: ${idleCount}`}
          onClick={() =>
            setStatusFilter(
              statusFilter === "Không hoạt động" ? "" : "Không hoạt động"
            )
          }
        />
      </Stack>

      <TextField
        size="small"
        label="Tìm biển số / loại xe / kho / trạng thái / tài xế"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ width: 380, mb: 2, maxWidth: "100%" }}
      />

      </Box>

      <Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Biển số</TableCell>
              <TableCell>Loại xe</TableCell>
              <TableCell>Kho</TableCell>
              <TableCell>Km hiện tại</TableCell>
              <TableCell>Ngày cập nhật ODO gần nhất</TableCell>
              <TableCell>Trạng thái hôm nay</TableCell>
              <TableCell>Ghi chú</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {keyword || statusFilter
                    ? "Không tìm thấy xe phù hợp."
                    : "Chưa có xe."}
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => {
                const active = liveStatus(vehicle) === "Hoạt động";
                const trip = vehicle.lichHomNay;

                return (
              <TableRow
                key={vehicle.id}
                hover
                sx={
                  active
                    ? {
                        bgcolor: alpha(brand.teal, 0.1),
                        "& td": { borderColor: "rgba(15,155,148,0.12)" },
                      }
                    : undefined
                }
              >
                <TableCell>{vehicle.id}</TableCell>
                <TableCell>
                  <Typography fontWeight={800} sx={{ letterSpacing: 0.3 }}>
                    {vehicle.bienSo}
                  </Typography>
                </TableCell>
                <TableCell>{vehicle.loaiXe}</TableCell>
                <TableCell>{vehicle.kho}</TableCell>
                <TableCell>{vehicle.kmHienTai}</TableCell>
                <TableCell>{formatOdoDate(vehicle.odoUpdatedAt)}</TableCell>
                <TableCell>
                  {active ? (
                    <Stack spacing={0.6} alignItems="flex-start">
                      <Chip
                        size="small"
                        color="success"
                        icon={<ActiveDot />}
                        label="Hoạt động"
                        sx={{
                          fontWeight: 700,
                          "& .MuiChip-icon": { ml: 1, mr: -0.25 },
                        }}
                      />
                      {trip && (
                        <Typography variant="caption" color="text.secondary">
                          {[trip.ca, trip.taiXe || trip.msnv, trip.trangThai]
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Không hoạt động"
                      sx={{ color: "text.secondary", borderColor: "divider" }}
                    />
                  )}
                </TableCell>
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
                );
              })
            )}
          </TableBody>
        </Table>
        </TableContainer>
      </Paper>

      <VehicleDialog
        open={openDialog}
        vehicle={selectedVehicle}
        onClose={handleCloseDialog}
      />
    </Box>
  );
}
