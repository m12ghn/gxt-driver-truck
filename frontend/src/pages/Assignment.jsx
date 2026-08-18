import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Button,
  Stack,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";

import AssignmentDialog from "../components/AssignmentDialog";
import WarehouseRejectDialog from "../components/WarehouseRejectDialog";
import WarehouseDetailDialog from "../components/WarehouseDetailDialog";
import AssignmentDetailDialog from "../components/AssignmentDetailDialog";

import {
  getAssignments,
  importAssignmentExcel,
  deleteAssignment,
  confirmWarehouse,
  exportAssignmentExcel,
} from "../api/assignmentApi";

export default function Assignment() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const isAdmin =
    user?.quyen === "SUPER_ADMIN" ||
    user?.quyen === "ADMIN";

  const isWarehouse =
    user?.quyen === "WAREHOUSE";

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // ==========================
  // Khoảng ngày xem
  // Mặc định chỉ xem ngày hôm nay
  // ==========================

  const [fromDate, setFromDate] =
    useState(today);

  const [toDate, setToDate] =
    useState(today);

  const [assignments, setAssignments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [openDialog, setOpenDialog] =
    useState(false);

  // ==========================
  // Kho xác nhận
  // ==========================

  const [openReject, setOpenReject] =
    useState(false);

  const [openWarehouseDetail, setOpenWarehouseDetail] =
    useState(false);

  const [openAssignmentDetail, setOpenAssignmentDetail] =
    useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  // ==========================
  // Filter
  // ==========================

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [warehouseFilter, setWarehouseFilter] =
    useState("");

  const [khoFilter, setKhoFilter] =
    useState(isWarehouse ? (user?.kho || "") : "");

  useEffect(() => {
    if (isWarehouse && user?.kho) {
      setKhoFilter(user.kho);
    }
  }, [isWarehouse, user?.kho]);

  useEffect(() => {

    loadAssignments();

  }, [fromDate, toDate]);

  async function loadAssignments() {

    try {

      const res =
        await getAssignments(fromDate, toDate);

      setAssignments(res.data.data);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  async function handleExportExcel() {

    try {

      const res =
        await exportAssignmentExcel(fromDate, toDate);

      const url = window.URL.createObjectURL(
        new Blob([res.data])
      );

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute(
        "download",
        `phan-cong-${fromDate}_${toDate}.xlsx`
      );

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (err) {

      console.error(err);

      alert("Xuất Excel thất bại.");

    }

  }

  function formatDate(date) {

    return new Date(date + "T00:00:00")
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-");

  }

  function formatTime(time) {

    if (!time) return "--";

    return new Date(time)
      .toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });

  }

  async function handleImport(event) {

    const file = event.target.files[0];

    if (!file) return;

    try {

      const res =
        await importAssignmentExcel(file);

      let message =
        `✅ Import thành công ${res.data.imported} dòng`;

      if (
        res.data.errors &&
        res.data.errors.length > 0
      ) {

        message +=
`\n\n❌ Có ${res.data.errors.length} lỗi:\n\n`;

        message +=
          res.data.errors.join("\n");

      }

      alert(message);

      loadAssignments();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Import thất bại"
      );

    }

    event.target.value = "";

  }

  async function handleDelete(item) {

    if (
      !window.confirm(
        "Bạn có chắc muốn xóa phân công này?"
      )
    ) {
      return;
    }

    try {

      await deleteAssignment(item.id);

      alert("Xóa thành công.");

      loadAssignments();

    } catch (err) {

      console.error(err);

      alert("Xóa thất bại.");

    }

  }

  function handleAssignmentSuccess() {

    loadAssignments();

  }

  async function handleConfirmWarehouse(item) {

    if (
      !window.confirm(
        "Xác nhận phân công này đã hoàn thành?"
      )
    ) {
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user")
    );

    try {

      await confirmWarehouse(item.id, {
        action: "confirm",
        warehouseConfirmBy: user?.hoTen || "",
      });

      alert("Xác nhận thành công.");

      loadAssignments();

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Xác nhận thất bại."
      );

    }

  }

  if (loading) {
    return <CircularProgress />;
  }

  const khoOptions = [
    ...new Set(
      assignments
        .map((item) => item.kho)
        .filter(Boolean)
    ),
  ].sort();

  const filteredAssignments = assignments.filter((item) => {

    const keyword = search.toLowerCase();

    const matchSearch =
      item.Vehicle?.bienSo?.toLowerCase().includes(keyword) ||
      item.Driver?.msnv?.toLowerCase().includes(keyword) ||
      item.Driver?.hoTen?.toLowerCase().includes(keyword);

    const matchStatus =
      statusFilter === "" ||
      item.trangThai === statusFilter;

    const matchWarehouse =
      warehouseFilter === "" ||
      item.warehouseStatus === warehouseFilter;

    const matchKho =
      khoFilter === "" ||
      item.kho === khoFilter;

    return (
      matchSearch &&
      matchStatus &&
      matchWarehouse &&
      matchKho
    );

  });

  return (

    <Box sx={{ minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >

        <Typography
          variant="h4"
          noWrap
        >
          Phân công xe
        </Typography>

        {isAdmin && (

          <Stack
            direction="row"
            spacing={1}
            flexWrap="nowrap"
            flexShrink={0}
          >

            <Button
              variant="outlined"
              size="small"
              onClick={() =>
                setOpenDialog(true)
              }
            >
              + PHÂN CÔNG
            </Button>

            <Button
              variant="contained"
              size="small"
              component="label"
            >
              IMPORT EXCEL

              <input
                hidden
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
              />

            </Button>

          </Stack>

        )}

      </Box>

      <Paper
        sx={{
          p: 2,
          mb: 3,
        }}
      >

        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          alignItems="center"
          mb={2}
        >

          <TextField
            type="date"
            size="small"
            label="Từ ngày"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
          />

          <TextField
            type="date"
            size="small"
            label="Đến ngày"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) =>
              setToDate(e.target.value)
            }
          />

          <TextField
            size="small"
            label="Tìm BSX / MSNV / Tên"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            sx={{ width: 250 }}
          />

          {isWarehouse ? (
            <TextField
              size="small"
              label="Kho"
              value={user?.kho || "Chưa gán kho"}
              InputProps={{ readOnly: true }}
              sx={{ width: 160 }}
            />
          ) : (
            <TextField
              select
              size="small"
              label="Kho"
              value={khoFilter}
              onChange={(e) =>
                setKhoFilter(e.target.value)
              }
              sx={{ width: 160 }}
            >
              <MenuItem value="">
                Tất cả
              </MenuItem>

              {khoOptions.map((kho) => (
                <MenuItem key={kho} value={kho}>
                  {kho}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            size="small"
            label="Trạng thái chuyến"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            sx={{ width: 180 }}
          >

            <MenuItem value="">
              Tất cả
            </MenuItem>

            <MenuItem value="Chưa thực hiện">
              Chưa thực hiện
            </MenuItem>

            <MenuItem value="Đã Check In">
              Đã Check In
            </MenuItem>

            <MenuItem value="Chưa hoàn thành">
              Chưa hoàn thành
            </MenuItem>

            <MenuItem value="Hoàn thành">
              Hoàn thành
            </MenuItem>

          </TextField>

          <TextField
            select
            size="small"
            label="Trạng thái kho"
            value={warehouseFilter}
            onChange={(e) =>
              setWarehouseFilter(e.target.value)
            }
            sx={{ width: 180 }}
          >

            <MenuItem value="">
              Tất cả
            </MenuItem>

            <MenuItem value="Chờ xác nhận">
              Chờ xác nhận
            </MenuItem>

            <MenuItem value="Đã xác nhận">
              Đã xác nhận
            </MenuItem>

            <MenuItem value="Không xác nhận">
              Không xác nhận
            </MenuItem>

          </TextField>

        </Stack>

      </Paper>

      <Stack
        direction="row"
        spacing={2}
        mb={3}
      >

        <Chip
          color="primary"
          label={`Tổng: ${filteredAssignments.length}`}
        />

        <Chip
          color="warning"
          label={`Check In: ${
            filteredAssignments.filter(
              x => x.trangThai === "Đã Check In"
            ).length
          }`}
        />

        <Chip
          color="success"
          label={`Hoàn thành: ${
            filteredAssignments.filter(
              x => x.trangThai === "Hoàn thành"
            ).length
          }`}
        />

        <Chip
          color="info"
          label={`Đã xác nhận: ${
            filteredAssignments.filter(
              x => x.warehouseStatus === "Đã xác nhận"
            ).length
          }`}
        />

        <Chip
          color="error"
          label={`Không xác nhận: ${
            filteredAssignments.filter(
              x => x.warehouseStatus === "Không xác nhận"
            ).length
          }`}
        />

      </Stack>

      <Paper sx={{ overflow: "hidden", maxWidth: "100%" }}>

        <TableContainer
          sx={{
            overflowX: "auto",
            maxWidth: "100%",
            WebkitOverflowScrolling: "touch",
          }}
        >
        <Table size="small" sx={{ minWidth: 1100 }}>

          <TableHead>

            <TableRow>

              <TableCell sx={{ whiteSpace: "nowrap" }}>Ngày</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Ca</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Kho</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Biển số</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>MSNV</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Họ tên</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Check In</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Check Out</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Trạng thái</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Kho xác nhận</TableCell>

              {isAdmin && (
                <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                  Thao tác
                </TableCell>
              )}

            </TableRow>

          </TableHead>

          <TableBody>{filteredAssignments.map((item) => (

  <TableRow key={item.id} hover>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {formatDate(item.ngay)}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {item.ca}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {item.kho}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {item.Vehicle?.bienSo}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {item.Driver?.msnv}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {item.Driver?.hoTen}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {formatTime(item.checkInTime)}
    </TableCell>

    <TableCell sx={{ whiteSpace: "nowrap" }}>
      {formatTime(item.checkOutTime)}
    </TableCell>

    <TableCell>

      {item.trangThai === "Chưa thực hiện" && (
        <Chip
          label="Chưa thực hiện"
          color="default"
          size="small"
        />
      )}

      {item.trangThai === "Đã Check In" && (
        <Chip
          label="Đã Check In"
          color="warning"
          size="small"
        />
      )}

      {item.trangThai === "Chưa hoàn thành" && (
        <Chip
          label="Chưa hoàn thành"
          color="error"
          size="small"
        />
      )}

      {item.trangThai === "Hoàn thành" && (
        <Chip
          label="Hoàn thành"
          color="success"
          size="small"
        />
      )}

    </TableCell>

    <TableCell>

      {!item.warehouseStatus && (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          --
        </Typography>
      )}

      {item.warehouseStatus === "Chờ xác nhận" && (

        isWarehouse ? (

          <Stack
            direction="row"
            spacing={1}
          >

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedAssignment(item);
                setOpenAssignmentDetail(true);
              }}
            >
              Chi tiết
            </Button>

            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() =>
                handleConfirmWarehouse(item)
              }
            >
              Xác nhận
            </Button>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                setSelectedAssignment(item);
                setOpenReject(true);
              }}
            >
              Không xác nhận
            </Button>

          </Stack>

        ) : (

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label="Chờ xác nhận"
              color="warning"
              size="small"
            />

            <Button
              variant="text"
              size="small"
              onClick={() => {
                setSelectedAssignment(item);
                setOpenAssignmentDetail(true);
              }}
            >
              Chi tiết
            </Button>
          </Stack>

        )

      )}

      {(item.warehouseStatus === "Đã xác nhận" ||
        item.warehouseStatus === "Không xác nhận") && (

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >

          <Chip
            label={item.warehouseStatus}
            color={
              item.warehouseStatus === "Đã xác nhận"
                ? "success"
                : "error"
            }
            size="small"
          />

          <Button
            variant="text"
            size="small"
            onClick={() => {
              setSelectedAssignment(item);
              setOpenWarehouseDetail(true);
            }}
          >
            Kho
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              setSelectedAssignment(item);
              setOpenAssignmentDetail(true);
            }}
          >
            Chi tiết
          </Button>

        </Stack>

      )}

    </TableCell>

    {isAdmin && (

      <TableCell align="center">

        <Button
          color="error"
          size="small"
          onClick={() =>
            handleDelete(item)
          }
        >
          Xóa
        </Button>

      </TableCell>

    )}

  </TableRow>

))}          </TableBody>

        </Table>
        </TableContainer>

      </Paper>

      <Box
        display="flex"
        justifyContent="flex-end"
        mt={2}
      >

        <Button
          variant="outlined"
          color="success"
          onClick={handleExportExcel}
        >
          Xuất Excel
        </Button>

      </Box>

      <AssignmentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={handleAssignmentSuccess}
      />

      <WarehouseRejectDialog
        open={openReject}
        assignment={selectedAssignment}
        onClose={() => setOpenReject(false)}
        onSuccess={handleAssignmentSuccess}
      />

      <WarehouseDetailDialog
        open={openWarehouseDetail}
        assignment={selectedAssignment}
        onClose={() => setOpenWarehouseDetail(false)}
      />

      <AssignmentDetailDialog
        open={openAssignmentDetail}
        assignment={selectedAssignment}
        onClose={() => setOpenAssignmentDetail(false)}
      />

    </Box>

  );

}