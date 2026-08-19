import { useEffect, useState } from "react";
import {
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  Box,
  Toolbar,
  AppBar,
  Avatar,
  Stack,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Badge,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleIcon from "@mui/icons-material/People";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MapIcon from "@mui/icons-material/Map";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import GhnLogo from "../components/GhnLogo";
import { getAlerts } from "../api/statsApi";
import { brand } from "../theme/brand";

const drawerWidth = 220;
const ALERT_POLL_MS = 45000;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));

  const [alertCounts, setAlertCounts] = useState({
    total: 0,
    choXacNhan: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const res = await getAlerts();
        if (cancelled) return;

        const counts = res.data?.data?.counts;
        if (counts) {
          setAlertCounts({
            total: counts.total || 0,
            choXacNhan: counts.choXacNhan || 0,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadAlerts();
    const timer = setInterval(loadAlerts, ALERT_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [location.pathname]);

  function handleLogout() {
    const ok = window.confirm("Bạn có muốn đăng xuất?");
    if (!ok) return;

    localStorage.removeItem("user");
    navigate("/");
  }

  const menus = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
      badge: alertCounts.total,
    },
    {
      text: "Quản lý User",
      icon: <ManageAccountsIcon />,
      path: "/users",
      roles: ["SUPER_ADMIN"],
    },
    {
      text: "Quản lý xe",
      icon: <DirectionsCarIcon />,
      path: "/vehicles",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      text: "Quản lý tài xế",
      icon: <PeopleIcon />,
      path: "/drivers",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      text: "Quản lý kho",
      icon: <WarehouseIcon />,
      path: "/warehouses",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      text: "Phân công",
      icon: <AssignmentIcon />,
      path: "/assignments",
      roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
      badge: alertCounts.choXacNhan,
    },
    {
      text: "Check In",
      icon: <LoginIcon />,
      path: "/checkin",
      roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
    },
    {
      text: "Check Out",
      icon: <LogoutIcon />,
      path: "/checkout",
      roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
    },
    {
      text: "Bản đồ GPS",
      icon: <MapIcon />,
      path: "/gps-map",
      roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"],
    },
    {
      text: "Báo cáo",
      icon: <AssessmentIcon />,
      path: "/report",
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  const pageTitle =
    menus.find((m) => m.path === location.pathname)?.text ||
    "Giao Hàng Nặng";

  // Shell cố định full viewport: sidebar luôn đứng yên,
  // chỉ vùng nội dung cuộn — bảng rộng không kéo cả trang.
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        overflow: "hidden",
        bgcolor: brand.bg,
      }}
    >
      <Box
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          height: "100%",
          bgcolor: brand.black,
          color: brand.white,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
          <GhnLogo size={40} light showText={false} fullWidth />
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2 }} />

        <List sx={{ px: 1.5, py: 2, flex: 1, overflowY: "auto" }}>
          {menus
            .filter((menu) => menu.roles.includes(user?.quyen))
            .map((menu) => {
              const selected = location.pathname === menu.path;
              const badge = menu.badge || 0;

              return (
                <ListItemButton
                  key={menu.path}
                  selected={selected}
                  onClick={() => navigate(menu.path)}
                  sx={{
                    py: 1.25,
                    mb: 0.5,
                    borderRadius: 2,
                    color: selected ? brand.white : "rgba(255,255,255,0.72)",
                    "&.Mui-selected": {
                      bgcolor: brand.teal,
                      "&:hover": { bgcolor: brand.tealDark },
                    },
                    "&:hover": {
                      bgcolor: "rgba(15,155,148,0.18)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: selected ? brand.white : brand.teal,
                      minWidth: 40,
                    }}
                  >
                    <Badge
                      badgeContent={badge}
                      color="error"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: 10,
                          fontWeight: 700,
                          minWidth: 18,
                          height: 18,
                        },
                      }}
                    >
                      {menu.icon}
                    </Badge>
                  </ListItemIcon>

                  <ListItemText
                    primary={menu.text}
                    primaryTypographyProps={{
                      fontWeight: selected ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              );
            })}
        </List>

        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              px: 1,
              py: 1.25,
              borderRadius: 2,
              bgcolor: "rgba(15,155,148,0.12)",
              border: "1px solid rgba(15,155,148,0.35)",
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                color: brand.teal,
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              YOUR LOADS. OUR ROADS.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: brand.bg,
        }}
      >
        <AppBar
          position="relative"
          elevation={0}
          sx={{
            flexShrink: 0,
            bgcolor: brand.white,
            color: brand.ink,
            borderBottom: `1px solid ${brand.border}`,
          }}
        >
          <Toolbar sx={{ minHeight: 72 }}>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={800} noWrap>
                {pageTitle}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1 }}
              >
                YOUR LOADS. OUR ROADS.
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" flexShrink={0}>
              <Avatar
                sx={{
                  bgcolor: brand.teal,
                  width: 40,
                  height: 40,
                  fontWeight: 700,
                }}
              >
                {user?.hoTen?.charAt(0) || "A"}
              </Avatar>

              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography fontWeight={700}>{user?.hoTen}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.quyen}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                  borderColor: brand.border,
                  color: brand.ink,
                  "&:hover": {
                    borderColor: brand.teal,
                    color: brand.teal,
                    bgcolor: brand.tealSoft,
                  },
                }}
              >
                Đăng xuất
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            p: 3,
            overflowX: "hidden",
            overflowY: "auto",
            boxSizing: "border-box",
        }}
      >
        <Outlet />
      </Box>
      </Box>
    </Box>
  );
}
