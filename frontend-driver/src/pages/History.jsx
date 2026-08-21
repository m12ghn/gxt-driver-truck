import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

import { getAssignmentHistory } from "../api/assignmentApi";
import BottomNav from "../components/BottomNav";
import {
  getCheckInStatus,
  getCheckOutStatus,
  SHIFT_PAY,
  currentPayPeriod,
  getPayPeriodRange,
} from "../utils/shiftHelpers";

const TEAL = "#0F9B94";

const STATUS_META = {
  "Chưa thực hiện": { color: "default", accent: "#9CA3AF" },
  "Đã Check In": { color: "warning", accent: "#F59E0B" },
  "Hoàn thành": { color: "success", accent: TEAL },
  "Chưa hoàn thành": { color: "error", accent: "#EF4444" },
};

const WAREHOUSE_META = {
  "Chờ xác nhận": { color: "warning", label: "Chờ xác nhận" },
  "Đã xác nhận": { color: "success", label: "Đã xác nhận" },
  "Không xác nhận": { color: "error", label: "Không xác nhận" },
};

function formatDay(ngay) {
  if (!ngay) return "—";
  const iso = String(ngay).slice(0, 10);
  const [y, m, d] = iso.split("-");
  if (!d) return String(ngay);
  return `${d}/${m}/${y}`;
}

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOdo(value) {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("vi-VN");
}

function formatVnd(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function gpsChip(valid) {
  if (valid === false) {
    return { label: "Sai GPS", color: "warning" };
  }
  if (valid === true) {
    return { label: "Đúng GPS", color: "success" };
  }
  return null;
}

function PunchColumn({
  title,
  icon,
  time,
  odo,
  timeStatus,
  gpsValid,
}) {
  const gps = gpsChip(gpsValid);

  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.75}>
        {icon}
        <Typography
          variant="caption"
          fontWeight={700}
          letterSpacing={0.6}
          color="text.secondary"
        >
          {title}
        </Typography>
      </Stack>

      <Typography fontWeight={800} fontSize={22} lineHeight={1.1}>
        {time}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        ODO {odo}
      </Typography>

      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={1}>
        {timeStatus && (
          <Chip
            size="small"
            label={timeStatus.label}
            color={timeStatus.late ? "error" : "success"}
            sx={{ height: 22, fontWeight: 600 }}
          />
        )}
        {gps && (
          <Chip
            size="small"
            label={gps.label}
            color={gps.color}
            variant={gps.color === "success" ? "outlined" : "filled"}
            sx={{ height: 22, fontWeight: 600 }}
          />
        )}
      </Stack>
    </Box>
  );
}

function TripCard({ item }) {
  const status = STATUS_META[item.trangThai] || STATUS_META["Chưa thực hiện"];
  const pay = SHIFT_PAY[item.ca] || 0;
  const warehouse = item.warehouseStatus
    ? WAREHOUSE_META[item.warehouseStatus]
    : item.checkOutTime
      ? WAREHOUSE_META["Chờ xác nhận"]
      : null;

  const checkInStatus = getCheckInStatus(
    item.checkInTime,
    item.ngay,
    item.ca
  );
  const checkOutStatus = getCheckOutStatus(
    item.checkOutTime,
    item.ngay,
    item.ca
  );

  const payNote =
    item.warehouseStatus === "Đã xác nhận"
      ? "Đã xác nhận"
      : item.warehouseStatus === "Không xác nhận"
        ? "Không được tính"
        : item.checkOutTime
          ? "Tạm tính"
          : "Chưa hoàn thành";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        mb: 1.75,
        overflow: "hidden",
        border: "1px solid #E5E7EB",
        boxShadow: "0 8px 24px rgba(17,17,17,0.04)",
      }}
    >
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 5, bgcolor: status.accent, flexShrink: 0 }} />

        <Box sx={{ p: 2, flex: 1 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
            mb={1.25}
          >
            <Box>
              <Typography fontWeight={800} fontSize={16}>
                {formatDay(item.ngay)} · {item.ca}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {item.Vehicle?.bienSo || "—"}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={item.trangThai}
              color={status.color}
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {item.kho}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              bgcolor: "#F8FAFB",
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <PunchColumn
              title="CHECK IN"
              icon={<LoginIcon sx={{ fontSize: 16, color: TEAL }} />}
              time={formatTime(item.checkInTime)}
              odo={formatOdo(item.odoCheckIn)}
              timeStatus={checkInStatus}
              gpsValid={item.checkInGpsValid}
            />
            <PunchColumn
              title="CHECK OUT"
              icon={<LogoutIcon sx={{ fontSize: 16, color: "#EF6C00" }} />}
              time={formatTime(item.checkOutTime)}
              odo={formatOdo(item.odoCheckOut)}
              timeStatus={checkOutStatus}
              gpsValid={item.checkOutGpsValid}
            />
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1}
            mt={1.5}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                letterSpacing={0.4}
              >
                KHO XÁC NHẬN
              </Typography>
              <Box mt={0.5}>
                {warehouse ? (
                  <Chip
                    size="small"
                    label={warehouse.label}
                    color={warehouse.color}
                    variant={
                      item.warehouseStatus === "Đã xác nhận"
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa Check Out
                  </Typography>
                )}
              </Box>
              {item.warehouseStatus === "Không xác nhận" &&
                item.warehouseReason && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                    {item.warehouseReason}
                  </Typography>
                )}
            </Box>

            <Box textAlign="right">
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                letterSpacing={0.4}
              >
                LƯƠNG CA
              </Typography>
              <Typography
                fontWeight={800}
                fontSize={18}
                sx={{
                  color:
                    item.warehouseStatus === "Không xác nhận"
                      ? "#9CA3AF"
                      : TEAL,
                  textDecoration:
                    item.warehouseStatus === "Không xác nhận"
                      ? "line-through"
                      : "none",
                }}
              >
                {formatVnd(pay)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {payNote}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

export default function History() {
  const user = JSON.parse(localStorage.getItem("driverUser") || "null");
  const initialPeriod = currentPayPeriod();

  const [monthValue, setMonthValue] = useState(
    `${initialPeriod.year}-${String(initialPeriod.month).padStart(2, "0")}`
  );
  const [ky, setKy] = useState(initialPeriod.ky);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  const [year, month] = monthValue.split("-").map(Number);
  const range = getPayPeriodRange(year, month, ky);

  useEffect(() => {
    loadHistory();
  }, [monthValue, ky]);

  async function loadHistory() {
    setLoading(true);
    setConnectionError(false);

    try {
      const res = await getAssignmentHistory(user.msnv, range.from, range.to);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error(err);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }

  const totalPay = assignments.reduce(
    (sum, item) => sum + (SHIFT_PAY[item.ca] || 0),
    0
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F3F5F7",
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
              color: TEAL,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1.2,
            }}
          >
            GHN DRIVER
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            Lịch sử chuyến
          </Typography>
        </Box>

        <IconButton onClick={loadHistory} sx={{ color: TEAL }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #E5E7EB",
        }}
      >
        <Stack spacing={1.25}>
          <TextField
            type="month"
            size="small"
            label="Tháng"
            value={monthValue}
            onChange={(e) => {
              if (e.target.value) setMonthValue(e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={ky}
            onChange={(_, value) => {
              if (value) setKy(value);
            }}
            sx={{
              "& .MuiToggleButton-root": {
                fontWeight: 700,
                textTransform: "none",
              },
              "& .Mui-selected": {
                bgcolor: `${TEAL} !important`,
                color: "#fff !important",
              },
            }}
          >
            <ToggleButton value={1}>Kỳ 1 · 01–15</ToggleButton>
            <ToggleButton value={2}>Kỳ 2 · 16–cuối tháng</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary">
            {formatDay(range.from)} – {formatDay(range.to)}
            {!loading && !connectionError
              ? ` · ${assignments.length} chuyến · ${formatVnd(totalPay)}`
              : ""}
          </Typography>
        </Stack>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: TEAL }} />
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
            Không có chuyến trong kỳ này.
          </Typography>
        </Paper>
      )}

      {!loading &&
        assignments.map((item) => <TripCard key={item.id} item={item} />)}

      <BottomNav />
    </Box>
  );
}
