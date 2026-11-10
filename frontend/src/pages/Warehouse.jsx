import { useEffect, useState } from "react";
import { getWarehouses } from "../api/warehouseApi";
import WarehouseDialog from "../components/WarehouseDialog";

import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Button,
  Stack,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loaiFilter, setLoaiFilter] = useState("");

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function loadWarehouses() {
    try {
      const res = await getWarehouses();
      setWarehouses(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || "Không tải được danh sách kho."
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>

      <Box sx={{ flexShrink: 0 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1.5}
      >
        <Typography variant="h5" fontWeight={700}>
          Quản lý kho/bưu cục
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Loại"
            value={loaiFilter}
            onChange={(e) => setLoaiFilter(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="KHO">Kho</MenuItem>
            <MenuItem value="BUU_CUC">Bưu cục</MenuItem>
          </TextField>
          <Button
            variant="contained"
            onClick={() => {
              setSelected(null);
              setOpenDialog(true);
            }}
          >
            + THÊM
          </Button>
        </Stack>
      </Stack>
      </Box>

      <Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Bán kính (m)</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses
              .filter((item) => !loaiFilter || (item.loai || "KHO") === loaiFilter)
              .map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.idKho || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={item.loai === "BUU_CUC" ? "Bưu cục" : "Kho"}
                    color={item.loai === "BUU_CUC" ? "warning" : "success"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{item.ten}</TableCell>
                <TableCell>{item.latitude}</TableCell>
                <TableCell>{item.longitude}</TableCell>
                <TableCell>{item.banKinh}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => {
                      setSelected(item);
                      setOpenDialog(true);
                    }}
                  >
                    Sửa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Paper>

      <WarehouseDialog
        open={openDialog}
        warehouse={selected}
        onClose={(reload) => {
          setOpenDialog(false);
          setSelected(null);
          if (reload) loadWarehouses();
        }}
      />
    </Box>
  );
}
