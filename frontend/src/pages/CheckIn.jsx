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
} from "@mui/material";

export default function CheckIn() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const isAdmin =
    user?.quyen === "SUPER_ADMIN" ||
    user?.quyen === "ADMIN";

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog Check In
  const [openCheckIn, setOpenCheckIn] = useState(false);

  // Dialog Chi tiết
  const [openDetail, setOpenDetail] = useState(false);

  // Chuyến đang chọn
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      const res = await getAssignments();

      const today = new Date().toISOString().split("T")[0];

      const data = res.data.data.filter(
        (item) => item.ngay === today
      );

      setAssignments(data);

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

      <Typography variant="h4" mb={3}>
        Giám sát Check In
      </Typography>

      <Typography mb={2}>
        Tổng chuyến hôm nay: {assignments.length}
      </Typography>

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

            ))}

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