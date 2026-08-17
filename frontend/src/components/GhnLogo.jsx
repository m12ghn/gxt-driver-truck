import { Box, Typography } from "@mui/material";
import { brand } from "../theme/brand";

// Logo GHN — ảnh logo ôm sát chữ, khung trắng chỉ vừa logo (không kéo full sidebar).
export default function GhnLogo({
  size = 42,
  showText = true,
  light = false,
  subtitle = "Admin Portal",
}) {
  const sloganColor = brand.teal;
  const subColor = light ? "rgba(255,255,255,0.72)" : brand.gray;

  const logoImg = (
    <Box
      component="img"
      src="/ghn-logo.png"
      alt="GHN"
      sx={{
        height: size,
        width: "auto",
        maxWidth: light ? 160 : "100%",
        display: "block",
        objectFit: "contain",
      }}
    />
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={0.5}
    >
      {light ? (
        <Box
          sx={{
            bgcolor: brand.white,
            borderRadius: 2,
            px: 1.5,
            py: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
          }}
        >
          {logoImg}
        </Box>
      ) : (
        logoImg
      )}

      {showText && (
        <Box textAlign="center">
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: Math.max(11, size * 0.28),
              lineHeight: 1.2,
              color: sloganColor,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            YOUR LOADS. OUR ROADS.
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                fontSize: Math.max(10, size * 0.24),
                color: subColor,
                fontWeight: 500,
                letterSpacing: 1,
                textTransform: "uppercase",
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
