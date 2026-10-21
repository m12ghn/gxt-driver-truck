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
} from "@mui/material";

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  async function loadWarehouses() {
    try {
      const res = await getWarehouses();
      setWarehouses(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert("Không tải được danh sách kho.");
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
      <Typography variant="h5" fontWeight={700} mb={2}>
        Quản lý kho
      </Typography>

      </Box>

      <Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Tên kho</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Bán kính (m)</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.ten}</TableCell>
                <TableCell>{item.latitude}</TableCell>
                <TableCell>{item.longitude}</TableCell>
                <TableCell>{item.banKinh}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => setSelected(item)}>
                    Sửa GPS
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Paper>

      <WarehouseDialog
        open={Boolean(selected)}
        warehouse={selected}
        onClose={(reload) => {
          setSelected(null);
          if (reload) loadWarehouses();
        }}
      />
    </Box>
  );
}
