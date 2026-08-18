import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

import { driverLogin } from "../api/authApi";

const TEAL = "#0F9B94";

export default function Login() {
  const navigate = useNavigate();

  const [msnv, setMsnv] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!msnv || !matKhau) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    setLoading(true);

    try {
      const res = await driverLogin(msnv.trim(), matKhau.trim());

      localStorage.setItem("driverUser", JSON.stringify(res.data.data));
      navigate("/");
    } catch (err) {
      console.error(err);

      if (err.response) {
        alert(err.response.data?.message || "Sai MSNV hoặc mật khẩu.");
      } else {
        alert(
          "Không kết nối được tới server. Vui lòng kiểm tra lại kết nối hoặc liên hệ Admin."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
        backgroundImage: "url(/ghn-brand.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(17,17,17,0.35) 0%, rgba(17,17,17,0.78) 100%)",
        }}
      />

      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 380,
          borderRadius: 4,
          p: 3.5,
          position: "relative",
          zIndex: 1,
          border: "1px solid rgba(15,155,148,0.35)",
        }}
      >
        <Stack spacing={0.5} alignItems="center" mb={3}>
          <Box
            component="img"
            src="/ghn-logo.png"
            alt="GHN"
            sx={{ height: 48, width: "auto", objectFit: "contain" }}
          />

          <Typography
            sx={{
              color: TEAL,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1.5,
            }}
          >
            YOUR LOADS. OUR ROADS.
          </Typography>

          <Typography color="text.secondary" variant="body2">
            Driver Portal
          </Typography>
        </Stack>

        <TextField
          fullWidth
          label="Mã nhân viên"
          margin="normal"
          value={msnv}
          onChange={(e) => setMsnv(e.target.value)}
        />

        <TextField
          fullWidth
          label="Mật khẩu"
          type="password"
          margin="normal"
          value={matKhau}
          onChange={(e) => setMatKhau(e.target.value)}
          helperText="Mật khẩu là số điện thoại của tài xế"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 3,
            py: 1.4,
            bgcolor: TEAL,
            fontWeight: 700,
            "&:hover": { bgcolor: "#0A7A74" },
          }}
          onClick={handleLogin}
        >
          {loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
        </Button>
      </Paper>
    </Box>
  );
}
