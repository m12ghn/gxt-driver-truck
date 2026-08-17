import {
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

export default function UserToolbar({
  keyword,
  setKeyword,
  onAdd,
}) {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      mb={3}
    >
      <Box>
        <Typography
          variant="h5"
          fontWeight="bold"
        >
          Quản lý User
        </Typography>

        <TextField
          size="small"
          placeholder="Tìm theo MSNV, Họ tên, SĐT..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          sx={{
            mt: 2,
            width: 350,
          }}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        Thêm User
      </Button>
    </Box>
  );
}