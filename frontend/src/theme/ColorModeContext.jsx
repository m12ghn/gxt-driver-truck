import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";

import { createAppTheme } from "./theme";

const STORAGE_KEY = "colorMode";

const ColorModeContext = createContext({
  mode: "light",
  toggleColorMode: () => {},
});

function getInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage không khả dụng
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // bỏ qua
    }
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
