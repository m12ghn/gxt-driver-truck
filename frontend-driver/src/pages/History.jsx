import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { getAssignmentHistory } from "../api/assignmentApi";
import BottomNav from "../components/BottomNav";

export default function History() {
  const user = JSON.parse(
    localStorage.getItem("driverUser")
  );

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {

    setLoading(true);
    setConnectionError(false);

    try {

      const res = await getAssignmentHistory(user.msnv);

      setAssignments(res.data.data);

    } catch (err) {

      console.error(err);
      setConnectionError(true);

    } finally {

      setLoading(false);

    }

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
        size="small"
        label={trangThai}
        color={colorMap[trangThai] || "default"}
      />
    );
  }

  function renderWarehouseChip(warehouseStatus) {
    if (!warehouseStatus) return null;

    const colorMap = {
      "Chờ xác nhận": "warning",
      "Đã xác nhận": "success",
      "Không xác nhận": "error",
    };

    return (
      <Chip
        size="small"
        variant="outlined"
        label={`Kho: ${warehouseStatus}`}
        color={colorMap[warehouseStatus] || "default"}
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
        <Typography variant="h6" fontWeight="bold">
          Lịch sử chuyến
        </Typography>

        <IconButton onClick={loadHistory}>
          <RefreshIcon />
        </IconButton>
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

      {!loading && !connectionError && assignments.length === 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            Chưa có chuyến nào.
          </Typography>
        </Paper>
      )}

      {!loading &&
        assignments.map((item) => (
          <Paper key={item.id} sx={{ p: 2, borderRadius: 3, mb: 2 }}>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography fontWeight="bold">
                {item.ngay} - {item.ca}
              </Typography>

              {renderTrangThaiChip(item.trangThai)}
            </Box>

            <Typography variant="body2">
              Kho: {item.kho}
            </Typography>

            <Typography variant="body2">
              Biển số: {item.Vehicle?.bienSo || "-"}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body2" color="text.secondary">
              Check In: {formatDateTime(item.checkInTime)}
              {item.odoCheckIn ? ` - ODO ${item.odoCheckIn}` : ""}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Check Out: {formatDateTime(item.checkOutTime)}
              {item.odoCheckOut ? ` - ODO ${item.odoCheckOut}` : ""}
            </Typography>

            {item.warehouseStatus && (
              <Box sx={{ mt: 1.5 }}>
                {renderWarehouseChip(item.warehouseStatus)}

                {item.warehouseStatus === "Không xác nhận" &&
                  item.warehouseReason && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{ mt: 0.75 }}
                    >
                      Lý do: {item.warehouseReason}
                    </Typography>
                  )}
              </Box>
            )}

          </Paper>
        ))}

      <BottomNav />

    </Box>
  );
}
