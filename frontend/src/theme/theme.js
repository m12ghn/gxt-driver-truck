import { createTheme } from "@mui/material/styles";
import { brand } from "./brand";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.teal,
      dark: brand.tealDark,
      light: "#3BB5AF",
      contrastText: brand.white,
    },
    secondary: {
      main: brand.black,
      contrastText: brand.white,
    },
    background: {
      default: brand.bg,
      paper: brand.white,
    },
    text: {
      primary: brand.ink,
      secondary: brand.gray,
    },
    success: { main: "#2E7D32" },
    warning: { main: "#ED6C02" },
    error: { main: "#D32F2F" },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h3: { fontWeight: 500, fontSize: "1.75rem", letterSpacing: "-0.01em" },
    h4: { fontWeight: 500, fontSize: "1.5rem", letterSpacing: "-0.01em" },
    h5: { fontWeight: 500, fontSize: "1.25rem" },
    h6: { fontWeight: 500, fontSize: "1.05rem" },
    subtitle1: { fontWeight: 500, fontSize: "1rem" },
    subtitle2: { fontWeight: 500, fontSize: "0.875rem" },
    body1: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.5 },
    body2: { fontWeight: 400, fontSize: "0.8125rem", lineHeight: 1.43 },
    caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.4 },
    overline: {
      fontWeight: 500,
      fontSize: "0.6875rem",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    button: { fontWeight: 500, textTransform: "none", fontSize: "0.875rem" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: "100%",
          overflow: "hidden",
        },
        body: {
          height: "100%",
          overflow: "hidden",
          margin: 0,
        },
        "#root": {
          height: "100%",
          overflow: "hidden",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${brand.teal} 0%, ${brand.tealDark} 100%)`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
