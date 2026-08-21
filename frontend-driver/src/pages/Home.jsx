import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
} from "@mui/material";

import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getTodayAssignment } from "../api/assignmentApi";
import BottomNav from "../components/BottomNav";

export default function Home() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("driverUser")
  );

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState(
    "Hôm nay chưa có phân công."
  );
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, []);

  async function loadAssignment() {

    setLoading(true);
    setNotFound(false);
    setNotFoundMessage("Hôm nay chưa có phân công.");
    setConnectionError(false);
    setAssignment(null);

    try {

      const res = await getTodayAssignment(user.msnv);

      setAssignment(res.data.data);

    } catch (err) {

      console.error(err);

      if (err.response?.status === 404) {
        setNotFound(true);
        setNotFoundMessage(
          err.response?.data?.message || "Hôm nay chưa có phân công."
        );
      } else if (!err.response) {
        setConnectionError(true);
      }

    } finally {

      setLoading(false);

    }

  }

  function handleLogout() {

    localStorage.removeItem("driverUser");

    navigate("/login");

  }

  function formatDateTime(date) {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN");
  }

  function renderTrangThaiChip(trangThai) {

    const colorMap = {
      "Chưa thực hiện": "default",
      "Đã Check In": "warning",
      "Hoàn thành": "success",
      "Chưa hoàn thành": "error",
    };

    return (
      <Chip
        label={trangThai}
        color={colorMap[trangThai] || "default"}
      />
    );

  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f8",
        p: 2,
        pb: 9,
      }}
    >

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >

        <Box>
          <Typography
            sx={{
              color: "#0F9B94",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1.2,
              mb: 0.25,
            }}
          >
            GHN DRIVER
          </Typography>

          <Typography variant="h6" fontWeight="bold">
            Xin chào, {user?.hoTen}
          </Typography>

          <Typography color="text.secondary" variant="body2">
            MSNV: {user?.msnv}
          </Typography>
        </Box>

        <Box>
          <IconButton onClick={loadAssignment}>
            <RefreshIcon />
          </IconButton>

          <IconButton onClick={handleLogout} color="error">
            <LogoutIcon />
          </IconButton>
        </Box>

      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && connectionError && (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
          <Typography color="error">
            Không kết nối được tới server. Vui lòng thử lại sau.
          </Typography>
        </Paper>
      )}

      {!loading && !connectionError && notFound && (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            {notFoundMessage}
          </Typography>
        </Paper>
      )}

      {!loading && assignment && (

        <Paper sx={{ p: 3, borderRadius: 3 }}>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Chuyến hôm nay
            </Typography>

            {renderTrangThaiChip(assignment.trangThai)}
          </Box>

          <Typography>
            <b>Ngày:</b> {assignment.ngay}
          </Typography>

          <Typography>
            <b>Ca:</b> {assignment.ca}
          </Typography>

          <Typography>
            <b>Kho:</b> {assignment.kho}
          </Typography>

          <Typography>
            <b>Biển số xe:</b> {assignment.Vehicle?.bienSo}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {assignment.trangThai === "Chưa thực hiện" && (

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate(`/checkin/${assignment.id}`)}
            >
              CHECK IN
            </Button>

          )}

          {assignment.trangThai === "Đã Check In" && (

            <>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Đã Check In lúc {formatDateTime(assignment.checkInTime)}
              </Typography>

              {(assignment.incidents?.length || 0) > 0 && (
                <Typography
                  variant="body2"
                  sx={{ mb: 1.5, color: "#ef6c00", fontWeight: 600 }}
                >
                  Đã có {assignment.incidents.length} báo cáo sự cố trong chuyến
                </Typography>
              )}

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate(`/incident/${assignment.id}`)}
                sx={{
                  mb: 1.5,
                  borderColor: "#ef6c00",
                  color: "#ef6c00",
                  fontWeight: 700,
                  "&:hover": {
                    borderColor: "#e65100",
                    bgcolor: "rgba(239,108,0,0.06)",
                  },
                }}
              >
                Báo cáo sự cố / sửa chữa
              </Button>

              <Button
                fullWidth
                variant="contained"
                color="warning"
                size="large"
                onClick={() => navigate(`/checkout/${assignment.id}`)}
              >
                CHECK OUT
              </Button>
            </>

          )}

          {assignment.trangThai === "Hoàn thành" && (

            <Box>
              <Typography sx={{ mb: 1 }}>
                Check In: {formatDateTime(assignment.checkInTime)}
              </Typography>

              <Typography sx={{ mb: 1 }}>
                Check Out: {formatDateTime(assignment.checkOutTime)}
              </Typography>

              <Typography color="success.main" fontWeight="bold">
                Chuyến đã hoàn thành.
              </Typography>
            </Box>

          )}

          {assignment.trangThai === "Chưa hoàn thành" && (

            <Typography color="error">
              Chuyến này đã quá hạn nhưng chưa Check Out.
              Vui lòng liên hệ Admin để được hỗ trợ Check Out hộ.
            </Typography>

          )}

        </Paper>

      )}

      <BottomNav />

    </Box>
  );
}
