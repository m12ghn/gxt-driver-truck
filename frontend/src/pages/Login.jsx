import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

import GhnLogo from "../components/GhnLogo";
import { brand } from "../theme/brand";

export default function Login() {
  const navigate = useNavigate();

  const [taiKhoan, setTaiKhoan] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!taiKhoan || !matKhau) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/admin-login", {
        taiKhoan,
        matKhau,
      });

      const loggedIn = res.data.data;
      localStorage.setItem("user", JSON.stringify(loggedIn));

      // WAREHOUSE vào Phân công; admin vào Dashboard
      navigate(
        loggedIn?.quyen === "WAREHOUSE" ? "/assignments" : "/dashboard"
      );
    } catch (err) {
      alert(err.response?.data?.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          alignItems: "flex-end",
          p: 5,
          backgroundImage: "url(/ghn-brand.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: brand.white,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.15) 0%, rgba(17,17,17,0.72) 100%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
          <Typography
            sx={{
              color: brand.teal,
              fontWeight: 700,
              letterSpacing: 2,
              mb: 1,
            }}
          >
            YOUR LOADS. OUR ROADS.
          </Typography>

          <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5 }}>
            GXT Driver Truck
          </Typography>

          <Typography sx={{ opacity: 0.88, lineHeight: 1.6 }}>
            Check In / Check Out, phân công chuyến và giám sát vận hành theo
            thời gian thực.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2.5, md: 5 },
          bgcolor: brand.bg,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: { xs: 3, md: 4.5 },
            borderRadius: 3,
            border: `1px solid ${brand.border}`,
        }}
      >
        <Stack spacing={1} mb={3.5} alignItems="flex-start">
          <GhnLogo size={36} subtitle="Admin Portal" />
        </Stack>

        <Typography variant="h5" fontWeight={800} mb={0.5}>
          Đăng nhập
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Dành cho Admin / Kho
        </Typography>

        <TextField
          label="Tài khoản"
          fullWidth
          margin="normal"
          value={taiKhoan}
          onChange={(e) => setTaiKhoan(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <TextField
          label="Mật khẩu"
          type="password"
          fullWidth
          margin="normal"
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ mt: 3, py: 1.4 }}
          onClick={handleLogin}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </Paper>
    </Box>
  </Box>
  );
}
