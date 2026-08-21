import { useEffect, useState } from "react";
import { getAssignments } from "../api/assignmentApi";

import CheckOutDialog from "../components/CheckOutDialog";
import CheckOutDetailDialog from "../components/CheckOutDetailDialog";
import AdminCheckoutDialog from "../components/AdminCheckoutDialog";

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

export default function CheckOut() {

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

  // Dialog Check Out
  const [openCheckOut, setOpenCheckOut] = useState(false);

  // Dialog Admin Check Out hộ
  const [openAdminCheckOut, setOpenAdminCheckOut] = useState(false);

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

  return (
    <Box>

      <Typography variant="h4" mb={2}>
        Giám sát Check Out
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

          <Typography variant="body2" color="text.secondary">
            Tổng chuyến: {assignments.length}
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
              <TableCell>Giờ Check Out</TableCell>
              <TableCell align="center">
                Thao tác
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {assignments.map((item) => (

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
                  {formatDateTime(item.checkOutTime)}
                </TableCell>

                <TableCell align="center">

                  {item.trangThai === "Hoàn thành" && (

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

                  {item.trangThai === "Đã Check In" && (

                    isAdmin ? (

                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => {
                          setSelectedAssignment(item);
                          setOpenAdminCheckOut(true);
                        }}
                      >
                        CHECK OUT HỘ
                      </Button>

                    ) : (

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Chờ Check Out
                      </Typography>

                    )

                  )}

                  {item.trangThai === "Chưa hoàn thành" && (

                    isAdmin ? (

                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => {
                          setSelectedAssignment(item);
                          setOpenAdminCheckOut(true);
                        }}
                      >
                        CHECK OUT HỘ
                      </Button>

                    ) : (

                      <Typography
                        variant="body2"
                        color="error"
                      >
                        Quá hạn - chưa Check Out
                      </Typography>

                    )

                  )}

                  {item.trangThai === "Chưa thực hiện" && (

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Chưa Check In
                    </Typography>

                  )}

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

      <CheckOutDialog
        open={openCheckOut}
        assignment={selectedAssignment}
        onClose={() => setOpenCheckOut(false)}
        onSuccess={loadAssignments}
      />

      <AdminCheckoutDialog
        open={openAdminCheckOut}
        assignment={selectedAssignment}
        onClose={() => setOpenAdminCheckOut(false)}
        onSuccess={loadAssignments}
      />

      <CheckOutDetailDialog
        open={openDetail}
        assignment={selectedAssignment}
        onClose={() => setOpenDetail(false)}
      />

    </Box>
  );
}
