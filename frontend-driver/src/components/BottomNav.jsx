import { useNavigate, useLocation } from "react-router-dom";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";

import HomeIcon from "@mui/icons-material/Home";
import HistoryIcon from "@mui/icons-material/History";

const TEAL = "#0F9B94";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const value = location.pathname === "/history" ? "/history" : "/";

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderTop: `1px solid rgba(15,155,148,0.25)`,
      }}
    >
      <BottomNavigation
        value={value}
        onChange={(e, newValue) => navigate(newValue)}
        showLabels
        sx={{
          "& .Mui-selected": {
            color: `${TEAL} !important`,
          },
        }}
      >
        <BottomNavigationAction
          label="Trang chủ"
          value="/"
          icon={<HomeIcon />}
        />

        <BottomNavigationAction
          label="Lịch sử"
          value="/history"
          icon={<HistoryIcon />}
        />
      </BottomNavigation>
    </Paper>
  );
}
