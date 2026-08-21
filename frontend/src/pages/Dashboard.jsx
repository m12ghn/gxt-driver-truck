import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  LinearProgress,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";

import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import LoginIcon from "@mui/icons-material/Login";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import StatCard from "../components/StatCard";
import { getDashboardStats, getAlerts } from "../api/statsApi";
import { brand } from "../theme/brand";

const REFRESH_MS = 45000;

function shortKho(kho) {
  if (!kho) return "Không rõ kho";
  return String(kho)
    .replace(/^Kho Giao Hàng Nặng\s*-\s*/i, "Kho ")
    .replace(/\s*-\s*HCM$/i, "");
}

function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  if (value < 60) return `${value} phút`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

function formatCheckInTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupAlertItems(items = []) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.type}||${item.kho || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        type: item.type,
        kho: item.kho || "Không rõ kho",
        label: item.label,
        count: 0,
        trips: [],
      });
    }
    const group = map.get(key);
    group.count += 1;
    group.trips.push({
      id: item.id,
      driverName: item.driverName,
      bienSo: item.bienSo,
      ca: item.ca,
      ngay: item.ngay,
      checkInTime: item.checkInTime,
      minutes: item.minutes || 0,
      detail: item.detail,
    });
  }
  return [...map.values()];
}

function groupAlertsByWarehouse(groups = []) {
  const map = new Map();

  for (const group of groups) {
    const kho = group.kho || "Không rõ kho";
    if (!map.has(kho)) {
      map.set(kho, {
        kho,
        choXacNhan: 0,
        late: 0,
        gps: 0,
        chuaCheckIn: 0,
        chuaHoanThanh: 0,
        lateTrips: [],
        missingTrips: [],
      });
    }

    const row = map.get(kho);
    if (group.type === "choXacNhan") row.choXacNhan += group.count;
    if (group.type === "late") {
      row.late += group.count;
      row.lateTrips = group.trips || [];
    }
    if (group.type === "gps") row.gps += group.count;
    if (group.type === "chuaCheckIn") {
      row.chuaCheckIn += group.count;
      row.missingTrips = group.trips || [];
    }
    if (group.type === "chuaHoanThanh") row.chuaHoanThanh += group.count;
  }

  return [...map.values()].sort((a, b) => {
    const score = (row) =>
      row.chuaCheckIn * 4 + row.late * 3 + row.choXacNhan * 2 + row.gps;
    return score(b) - score(a);
  });
}

function SectionHeading({ children, sx }) {
  return (
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      sx={{
        mb: 1.25,
        pl: 1.5,
        borderLeft: `4px solid ${brand.teal}`,
        color: "text.primary",
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ counts: {}, items: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [expandedKho, setExpandedKho] = useState(null);

  useEffect(() => {
    loadAll(true);

    const timer = setInterval(() => loadAll(false), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  async function loadAll(isFirst = false) {
    if (isFirst) setLoading(true);
    else setRefreshing(true);

    try {
      const statsRes = await getDashboardStats();
      setStats(statsRes.data.data);
      setLoading(false);

      const alertsRes = await getAlerts();
      setAlerts(alertsRes.data.data || { counts: {}, items: [] });
      setRefreshedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return (
      <Typography color="error">
        Không tải được số liệu Dashboard.
      </Typography>
    );
  }

  const { today, vehicles, drivers, trend } = stats;

  const overviewCards = [
    {
      title: "Tổng chuyến hôm nay",
      value: today.total,
      icon: <AssignmentTurnedInIcon />,
      color: brand.teal,
    },
    {
      title: "Đã Check In",
      value: today.daCheckIn,
      icon: <LoginIcon />,
      color: "#f9a825",
    },
    {
      title: "Hoàn thành",
      value: today.hoanThanh,
      icon: <TaskAltIcon />,
      color: "#43a047",
    },
    {
      title: "Chưa hoàn thành (quá hạn)",
      value: today.chuaHoanThanh,
      icon: <ReportProblemIcon />,
      color: "#c62828",
    },
  ];

  const alertCounts = alerts.counts || {};
  const alertGroups =
    alerts.groups?.length > 0
      ? alerts.groups
      : groupAlertItems(alerts.items || []);
  const warehouseAlerts = groupAlertsByWarehouse(alertGroups);

  const alertCards = [
    {
      title: "Chưa Check In",
      value: alertCounts.chuaCheckIn ?? 0,
      icon: <LoginIcon />,
      color: "#d32f2f",
      hint: "sau 7:30 vẫn chưa Check In",
    },
    {
      title: "Trễ giờ Check In",
      value: alertCounts.late ?? today.late,
      icon: <AccessTimeIcon />,
      color: "#ef6c00",
      hint: "đã CI nhưng sau 7:30",
    },
    {
      title: "Vi phạm GPS",
      value: alertCounts.gpsViolation ?? today.gpsViolation,
      icon: <GpsOffIcon />,
      color: "#ad1457",
      hint: "Check In/Out ngoài bán kính kho",
    },
    {
      title: "Chờ kho xác nhận",
      value: alertCounts.choXacNhan ?? today.choXacNhan,
      icon: <HourglassEmptyIcon />,
      color: "#6a1b9a",
      hint: "còn pending (mọi ngày)",
    },
  ];

  const refreshedLabel = refreshedAt
    ? refreshedAt.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  const trendLabels = trend.map((t) =>
    new Date(t.ngay + "T00:00:00").toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    })
  );

  const vehicleRate =
    vehicles.total > 0
      ? Math.round((vehicles.active / vehicles.total) * 100)
      : 0;

  const driverRate =
    drivers.total > 0
      ? Math.round((drivers.active / drivers.total) * 100)
      : 0;

  return (
    <Box sx={{ pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${brand.black} 0%, #1c2a2a 55%, ${brand.tealDark} 100%)`,
          color: "#fff",
          border: `1px solid rgba(15,155,148,0.35)`,
        }}
      >
        <Typography
          sx={{
            color: brand.teal,
            fontWeight: 700,
            letterSpacing: 0.8,
            fontSize: 12,
            mb: 0.75,
            textTransform: "uppercase",
          }}
        >
          GIAO HÀNG.KÊNH BÁN LẺ.TOÀN QUỐC
        </Typography>

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={2}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Xin chào, {user?.hoTen || "Admin"}
            </Typography>

            <Typography sx={{ opacity: 0.85, mt: 0.5 }}>
              Tổng quan hoạt động
              {user?.quyen === "WAREHOUSE" && (stats.kho || user?.kho)
                ? ` ${stats.kho || user.kho}`
                : ""}{" "}
              ngày{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </Typography>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            {refreshedLabel && (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Cập nhật {refreshedLabel}
              </Typography>
            )}
            <Tooltip title="Làm mới ngay">
              <IconButton
                size="small"
                onClick={() => loadAll(false)}
                disabled={refreshing}
                sx={{
                  color: brand.teal,
                  bgcolor: "rgba(15,155,148,0.15)",
                  "&:hover": { bgcolor: "rgba(15,155,148,0.28)" },
                }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: refreshing ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": {
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 1.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <SectionHeading>Tình trạng chuyến hôm nay</SectionHeading>

        <Grid container spacing={1.25} mb={1.5}>
          {overviewCards.map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <SectionHeading>Cần chú ý</SectionHeading>

        <Grid container spacing={1.25} mb={2}>
          {alertCards.map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.25}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <NotificationsActiveIcon sx={{ color: brand.teal, fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Cảnh báo theo kho
            </Typography>
            {(alertCounts.total || 0) > 0 && (
              <Chip
                size="small"
                label={alertCounts.total}
                color="error"
                sx={{ height: 22, fontWeight: 700 }}
              />
            )}
          </Stack>

          <Button
            size="small"
            onClick={() => navigate("/assignments")}
            sx={{ fontWeight: 600, color: brand.teal }}
          >
            Xem phân công
          </Button>
        </Stack>

        {(warehouseAlerts || []).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Không có cảnh báo cần xử lý.
          </Typography>
        ) : (
          <Grid container spacing={1.25}>
            {warehouseAlerts.map((row) => {
              const open = expandedKho === row.kho;
              const detailTrips = [
                ...row.missingTrips.map((trip) => ({
                  ...trip,
                  kind: "missing",
                })),
                ...row.lateTrips.map((trip) => ({ ...trip, kind: "late" })),
              ];

              return (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={row.kho}>
                  <Box
                    sx={{
                      height: "100%",
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "grey.200",
                      bgcolor: "#fff",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        minWidth={0}
                      >
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: alpha(brand.teal, 0.12),
                            color: brand.teal,
                            flexShrink: 0,
                          }}
                        >
                          <WarehouseIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <Typography fontWeight={800} fontSize={14} noWrap>
                          {shortKho(row.kho)}
                        </Typography>
                      </Stack>
                      {detailTrips.length > 0 && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedKho(open ? null : row.kho)
                          }
                          sx={{
                            p: 0.25,
                            transform: open ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          <KeyboardArrowDownIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      useFlexGap
                      mt={1}
                    >
                      {row.chuaCheckIn > 0 && (
                        <Chip
                          size="small"
                          icon={<LoginIcon />}
                          label={`Chưa CI ${row.chuaCheckIn}`}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha("#d32f2f", 0.12),
                            color: "#d32f2f",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      )}
                      {row.late > 0 && (
                        <Chip
                          size="small"
                          icon={<AccessTimeIcon />}
                          label={`Trễ ${row.late}`}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha("#ef6c00", 0.12),
                            color: "#ef6c00",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      )}
                      {row.choXacNhan > 0 && (
                        <Chip
                          size="small"
                          icon={<HourglassEmptyIcon />}
                          label={`Chờ XN ${row.choXacNhan}`}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha("#6a1b9a", 0.12),
                            color: "#6a1b9a",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      )}
                      {row.gps > 0 && (
                        <Chip
                          size="small"
                          icon={<GpsOffIcon />}
                          label={`GPS ${row.gps}`}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha("#ad1457", 0.12),
                            color: "#ad1457",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      )}
                      {row.chuaHoanThanh > 0 && (
                        <Chip
                          size="small"
                          icon={<ReportProblemIcon />}
                          label={`Quá hạn ${row.chuaHoanThanh}`}
                          sx={{
                            height: 24,
                            fontWeight: 700,
                            bgcolor: alpha("#c62828", 0.12),
                            color: "#c62828",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              fontSize: 16,
                            },
                          }}
                        />
                      )}
                    </Stack>

                    {open && detailTrips.length > 0 && (
                      <Stack spacing={0.5} sx={{ mt: 1.25 }}>
                        {detailTrips.map((trip) => (
                          <Stack
                            key={`${trip.kind}-${trip.id}`}
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                          >
                            {trip.kind === "late" ? (
                              <AccessTimeIcon
                                sx={{ fontSize: 14, color: "#ef6c00" }}
                              />
                            ) : (
                              <LoginIcon
                                sx={{ fontSize: 14, color: "#d32f2f" }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary", lineHeight: 1.45 }}
                            >
                              {trip.driverName} · {trip.bienSo}
                              {trip.checkInTime
                                ? ` · ${formatCheckInTime(trip.checkInTime)}`
                                : ""}
                              {trip.minutes
                                ? ` · ${formatMinutes(trip.minutes)}`
                                : ""}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      <SectionHeading sx={{ mb: 1 }}>Nguồn lực</SectionHeading>

      <Grid container spacing={1.5} mb={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#00897b", 0.12),
                  color: "#00897b",
                  flexShrink: 0,
                }}
              >
                <LocalShippingIcon />
              </Box>

              <Box flex={1}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  Xe đang hoạt động
                </Typography>

                <Typography variant="h5" fontWeight="bold">
                  {vehicles.active}/{vehicles.total}
                </Typography>
              </Box>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={vehicleRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha("#00897b", 0.12),
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#00897b",
                  borderRadius: 4,
                },
              }}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha("#37474f", 0.12),
                  color: "#37474f",
                  flexShrink: 0,
                }}
              >
                <PersonIcon />
              </Box>

              <Box flex={1}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontWeight={500}
                >
                  Tài xế đang làm
                </Typography>

                <Typography variant="h5" fontWeight="bold">
                  {drivers.active}/{drivers.total}
                </Typography>
              </Box>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={driverRate}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha("#37474f", 0.12),
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#37474f",
                  borderRadius: 4,
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <ShowChartIcon color="primary" />

          <Typography variant="h6" fontWeight="bold">
            Xu hướng 7 ngày gần nhất
          </Typography>
        </Stack>

        <LineChart
          height={320}
          xAxis={[{ data: trendLabels, scaleType: "point" }]}
          series={[
            {
              data: trend.map((t) => t.total),
              label: "Tổng chuyến",
              color: brand.teal,
              curve: "monotone",
            },
            {
              data: trend.map((t) => t.hoanThanh),
              label: "Hoàn thành",
              color: "#43a047",
              curve: "monotone",
            },
            {
              data: trend.map((t) => t.late),
              label: "Trễ giờ",
              color: "#ef6c00",
              curve: "monotone",
            },
            {
              data: trend.map((t) => t.gpsViolation),
              label: "Vi phạm GPS",
              color: "#ad1457",
              curve: "monotone",
            },
          ]}
          grid={{ horizontal: true }}
          margin={{ left: 40 }}
        />
      </Paper>
    </Box>
  );
}
