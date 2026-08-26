import { useEffect, useState } from "react";
import { getAssignments } from "../api/assignmentApi";
import { getCheckInStatus } from "../utils/shiftHelpers";

import CheckInDialog from "../components/CheckInDialog";
import CheckInDetailDialog from "../components/CheckInDetailDialog";

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
  Chip,
  Button,
  Stack,
  TextField,
} from "@mui/material";

export default function CheckIn() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const isAdmin =
    user?.quyen === "SUPER_ADMIN" ||
    user?.quyen === "ADMIN";

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog Check In
  const [openCheckIn, setOpenCheckIn] = useState(false);

  // Dialog Chi tiết
  const [openDetail, setOpenDetail] = useState(false);

  // Chuyến đang chọn
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, [fromDate, toDate]);

  async function loadAssignments() {
    try {
      const res = await getAssignments(fromDate, toDate);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    return new Date(date + "T00:00:00")
      .toLocaleDateString("vi-VN")
      .replace(/\//g, "-");
  }

  function formatDateTime(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("vi-VN");
  }

  if (loading) {
    return <CircularProgress />;
  }

  const keyword = search.trim().toLowerCase();
  const filteredAssignments = assignments.filter((item) => {
    if (!keyword) return true;
    return [
      item.ca,
      item.kho,
      item.trangThai,
      item.Vehicle?.bienSo,
      item.Vehicle?.loaiXe,
      item.Driver?.msnv,
      item.Driver?.hoTen,
      item.Driver?.soDienThoai,
    ].some((value) => String(value || "").toLowerCase().includes(keyword));
  });

  return (
    <Box>

      <Typography variant="h4" mb={2}>
        Giám sát Check In
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          alignItems="center"
        >
          <TextField
            type="date"
            size="small"
            label="Từ ngày"
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <TextField
            type="date"
            size="small"
            label="Đến ngày"
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <TextField
            size="small"
            label="Tìm BSX / MSNV / tên / kho"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 280 }}
          />

          <Typography variant="body2" color="text.secondary">
            Tổng chuyến: {filteredAssignments.length}
            {filteredAssignments.length !== assignments.length
              ? ` / ${assignments.length}`
              : ""}
            {fromDate === toDate
              ? ` (${formatDate(fromDate)})`
              : ` (${formatDate(fromDate)} – ${formatDate(toDate)})`}
          </Typography>
        </Stack>
      </Paper>

      <Paper>

        <Table>

          <TableHead>

            <TableRow>

              <TableCell>Ngày</TableCell>
              <TableCell>Ca</TableCell>
              <TableCell>Kho</TableCell>
              <TableCell>Biển số</TableCell>
              <TableCell>MSNV</TableCell>
              <TableCell>Tài xế</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Giờ Check In</TableCell>
              <TableCell align="center">
                Thao tác
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {filteredAssignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  {keyword ? "Không tìm thấy chuyến phù hợp." : "Không có chuyến."}
                </TableCell>
              </TableRow>
            ) : (
              filteredAssignments.map((item) => (

              <TableRow key={item.id} hover>

                <TableCell>
                  {formatDate(item.ngay)}
                </TableCell>

                <TableCell>
                  {item.ca}
                </TableCell>

                <TableCell>
                  {item.kho}
                </TableCell>

                <TableCell>
                  {item.Vehicle?.bienSo}
                </TableCell>

                <TableCell>
                  {item.Driver?.msnv}
                </TableCell>

                <TableCell>
                  {item.Driver?.hoTen}
                </TableCell>

                <TableCell>

                  <Chip
                    label={item.trangThai}
                    color={
                      item.trangThai === "Hoàn thành"
                        ? "success"
                        : item.trangThai === "Đã Check In"
                        ? "warning"
                        : item.trangThai === "Chưa hoàn thành"
                        ? "error"
                        : "default"
                    }
                  />

                </TableCell>

                <TableCell>
                  {formatDateTime(item.checkInTime)}

                  {(() => {
                    const status = getCheckInStatus(
                      item.checkInTime,
                      item.ngay,
                      item.ca
                    );

                    if (!status) return null;

                    return (
                      <Chip
                        size="small"
                        sx={{ ml: 1 }}
                        label={status.label}
                        color={status.late ? "error" : "success"}
                      />
                    );
                  })()}
                </TableCell>

                <TableCell align="center">

                  {item.trangThai === "Chưa thực hiện" ? (

                    isAdmin ? (

                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          setSelectedAssignment(item);
                          setOpenCheckIn(true);
                        }}
                      >
                        CHECK IN HỘ
                      </Button>

                    ) : (

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Chưa Check In
                      </Typography>

                    )

                  ) : (

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedAssignment(item);
                        setOpenDetail(true);
                      }}
                    >
                      XEM
                    </Button>

                  )}

                </TableCell>

              </TableRow>

            ))
            )}

          </TableBody>

        </Table>

      </Paper>

      <CheckInDialog
        open={openCheckIn}
        assignment={selectedAssignment}
        onClose={() => setOpenCheckIn(false)}
        onSuccess={loadAssignments}
      />

      <CheckInDetailDialog
        open={openDetail}
        assignment={selectedAssignment}
        onClose={() => setOpenDetail(false)}
      />

    </Box>
  );
}