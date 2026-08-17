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
  Stack,
  Button,
  Grid,
  Chip,
  LinearProgress,
  TextField,
  MenuItem,
  alpha,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PersonIcon from "@mui/icons-material/Person";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import StatCard from "../components/StatCard";
import { getReportStats, exportReportExcel } from "../api/statsApi";
import { getWarehouses } from "../api/warehouseApi";
import { warehouses as fallbackWarehouses } from "../constants/warehouses";
import { brand } from "../theme/brand";

function SectionHeading({ icon, children, hint }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={1.5} mt={0.5}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          bgcolor: alpha(brand.teal, 0.12),
          color: brand.teal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
          {children}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function RateCell({ value, color = brand.teal }) {
  return (
    <Box sx={{ minWidth: 90 }}>
      <Typography
        variant="body2"
        fontWeight={700}
        sx={{ color, mb: 0.5 }}
        align="center"
      >
        {value}%
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, value))}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(color, 0.12),
          "& .MuiLinearProgress-bar": {
            bgcolor: color,
            borderRadius: 3,
          },
        }}
      />
    </Box>
  );
}

export default function Report() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 8) + "01";

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [kho, setKho] = useState("");
  const [khoOptions, setKhoOptions] = useState(fallbackWarehouses);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadReport();
  }, [fromDate, toDate, kho]);

  async function loadWarehouses() {
    try {
      const res = await getWarehouses();
      const list = (res.data?.data || [])
        .map((w) => w.ten || w.name || w)
        .filter(Boolean);

      if (list.length > 0) setKhoOptions(list);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadReport() {
    setLoading(true);

    try {
      const res = await getReportStats(fromDate, toDate, kho || undefined);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);

    try {
      const res = await exportReportExcel(fromDate, toDate, kho || undefined);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `bao-cao-${fromDate}_${toDate}.xlsx`);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Xuất Excel thất bại.");
    } finally {
      setExporting(false);
    }
  }

  const summary = data?.summary;

  const completeRate =
    summary && summary.total > 0
      ? Math.round((summary.hoanThanh / summary.total) * 100)
      : 0;

  const summaryCards = summary
    ? [
        {
          title: "Tổng chuyến",
          value: summary.total,
          icon: <AssignmentTurnedInIcon />,
          color: brand.teal,
          hint: "trong khoảng đã chọn",
        },
        {
          title: "Hoàn thành",
          value: summary.hoanThanh,
          icon: <TaskAltIcon />,
          color: "#43a047",
          hint: `${completeRate}% tổng chuyến`,
        },
        {
          title: "Chưa hoàn thành",
          value: summary.chuaHoanThanh,
          icon: <ReportProblemIcon />,
          color: "#c62828",
          hint: "quá hạn chưa Check Out",
        },
        {
          title: "Trễ giờ Check In",
          value: summary.late,
          icon: <AccessTimeIcon />,
          color: "#ef6c00",
          hint: "sau 7:30",
        },
        {
          title: "Vi phạm GPS",
          value: summary.gpsViolation,
          icon: <GpsOffIcon />,
          color: "#ad1457",
          hint: "Check In/Out sai tọa độ",
        },
        {
          title: "Chờ kho xác nhận",
          value: summary.choXacNhan,
          icon: <HourglassEmptyIcon />,
          color: "#6a1b9a",
          hint: "cần kho xử lý",
        },
      ]
    : [];

  const rangeLabel = `${new Date(fromDate + "T00:00:00").toLocaleDateString(
    "vi-VN"
  )} – ${new Date(toDate + "T00:00:00").toLocaleDateString("vi-VN")}`;

  return (
    <Box sx={{ pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${brand.black} 0%, #1c2a2a 55%, ${brand.tealDark} 100%)`,
          color: "#fff",
          border: "1px solid rgba(15,155,148,0.35)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <AssessmentIcon sx={{ color: brand.teal }} />
              <Typography
                sx={{
                  color: brand.teal,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  fontSize: 12,
                }}
              >
                YOUR LOADS. OUR ROADS.
              </Typography>
            </Stack>

            <Typography variant="h5" fontWeight={800}>
              Báo cáo vận hành
            </Typography>

            <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
              Khoảng thời gian: {rangeLabel}
              {kho ? ` · Kho ${kho}` : " · Tất cả kho"}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={exporting || loading}
            onClick={handleExport}
            sx={{
              bgcolor: brand.teal,
              fontWeight: 700,
              px: 2.5,
              py: 1.1,
              "&:hover": { bgcolor: brand.tealDark },
            }}
          >
            {exporting ? "Đang xuất..." : "Xuất Excel"}
          </Button>
        </Stack>

        {summary && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={2.5}>
            <Chip
              size="small"
              label={`Hoàn thành ${completeRate}%`}
              sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 600 }}
            />
            <Chip
              size="small"
              label={`${summary.daXacNhan} kho đã xác nhận`}
              sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 600 }}
            />
            <Chip
              size="small"
              label={`${summary.late} trễ giờ`}
              sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 600 }}
            />
          </Stack>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 3,
          border: `1px solid ${brand.border}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            type="date"
            size="small"
            label="Từ ngày"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            type="date"
            size="small"
            label="Đến ngày"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            select
            size="small"
            label="Kho"
            value={kho}
            onChange={(e) => setKho(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Tất cả kho</MenuItem>
            {khoOptions.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress sx={{ color: brand.teal }} />
        </Box>
      )}

      {!loading && data && (
        <>
          <SectionHeading
            icon={<AssessmentIcon fontSize="small" />}
            hint="Tổng quan nhanh theo khoảng đã chọn"
          >
            Chỉ số tổng hợp
          </SectionHeading>

          <Grid container spacing={2} mb={4}>
            {summaryCards.map((card) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={card.title}>
                <StatCard {...card} />
              </Grid>
            ))}
          </Grid>

          <SectionHeading
            icon={<PersonIcon fontSize="small" />}
            hint="Đánh giá hiệu suất theo từng tài xế"
          >
            Thống kê theo tài xế
          </SectionHeading>

          <Paper
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 3,
              border: `1px solid ${brand.border}`,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(brand.teal, 0.06) }}>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      MSNV
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      Họ tên
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Tổng chuyến
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Hoàn thành
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Trễ giờ
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Vi phạm GPS
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Tỷ lệ đúng giờ
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.byDriver.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          Không có dữ liệu trong khoảng thời gian này.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {data.byDriver.map((d) => (
                    <TableRow key={d.msnv} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                        {d.msnv}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {d.hoTen}
                      </TableCell>
                      <TableCell align="center">{d.total}</TableCell>
                      <TableCell align="center">{d.hoanThanh}</TableCell>
                      <TableCell align="center">
                        {d.late > 0 ? (
                          <Chip size="small" color="error" label={d.late} />
                        ) : (
                          <Typography color="text.secondary">0</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {d.gpsViolation > 0 ? (
                          <Chip
                            size="small"
                            color="warning"
                            label={d.gpsViolation}
                          />
                        ) : (
                          <Typography color="text.secondary">0</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          <RateCell
                            value={d.onTimeRate}
                            color={
                              d.onTimeRate >= 80
                                ? "#43a047"
                                : d.onTimeRate >= 50
                                  ? "#ef6c00"
                                  : "#c62828"
                            }
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <SectionHeading
            icon={<WarehouseIcon fontSize="small" />}
            hint="Theo dõi xác nhận kho theo từng điểm"
          >
            Thống kê theo kho
          </SectionHeading>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${brand.border}`,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(brand.teal, 0.06) }}>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      Kho
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Tổng chuyến
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Chờ xác nhận
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Đã xác nhận
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Không xác nhận
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                    >
                      Tỷ lệ xác nhận
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {data.byWarehouse.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          Không có dữ liệu trong khoảng thời gian này.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {data.byWarehouse.map((w) => (
                    <TableRow key={w.kho} hover>
                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                        {w.kho}
                      </TableCell>
                      <TableCell align="center">{w.total}</TableCell>
                      <TableCell align="center">
                        {w.choXacNhan > 0 ? (
                          <Chip
                            size="small"
                            color="warning"
                            label={w.choXacNhan}
                          />
                        ) : (
                          0
                        )}
                      </TableCell>
                      <TableCell align="center">{w.daXacNhan}</TableCell>
                      <TableCell align="center">
                        {w.khongXacNhan > 0 ? (
                          <Chip
                            size="small"
                            color="error"
                            label={w.khongXacNhan}
                          />
                        ) : (
                          0
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" justifyContent="center">
                          <RateCell
                            value={w.confirmRate}
                            color={
                              w.confirmRate >= 80
                                ? "#43a047"
                                : w.confirmRate >= 50
                                  ? "#ef6c00"
                                  : brand.teal
                            }
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
