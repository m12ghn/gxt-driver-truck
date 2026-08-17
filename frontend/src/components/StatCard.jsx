import { Box, Paper, Typography, alpha } from "@mui/material";

// Thẻ số liệu: tiêu đề + icon bên trái, số lớn căn phải — tránh khoảng trống lệch.
export default function StatCard({ title, value, icon, color, hint }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: "grey.200",
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          borderColor: alpha(color, 0.35),
        },
      }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
      >
        <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(color, 0.12),
              color: color,
              flexShrink: 0,
              "& .MuiSvgIcon-root": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>

          <Box minWidth={0}>
            <Typography
              sx={{
                fontWeight: 500,
                fontSize: 13,
                color: "text.secondary",
                lineHeight: 1.25,
              }}
            >
              {title}
            </Typography>

            {hint && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.15, lineHeight: 1.25 }}
              >
                {hint}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 24,
            lineHeight: 1,
            color: "text.primary",
            flexShrink: 0,
            minWidth: 28,
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
