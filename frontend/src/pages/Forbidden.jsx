import {
  Box,
  Typography,
  Button,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

export default function Forbidden() {

  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Typography
        variant="h2"
        color="error"
      >
        403
      </Typography>

      <Typography
        variant="h5"
        mb={3}
      >
        Bạn không có quyền truy cập.
      </Typography>

      <Button
        variant="contained"
        onClick={() =>
          navigate("/dashboard")
        }
      >
        Quay về Dashboard
      </Button>

    </Box>
  );

}