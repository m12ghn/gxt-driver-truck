import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
} from "@mui/material";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { getAssignments } from "../api/assignmentApi";
import { getWarehouses } from "../api/warehouseApi";
import { brand } from "../theme/brand";

function FitAll({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);

  return null;
}

export default function GpsMap() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isWarehouse = user?.quyen === "WAREHOUSE";

  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [khoFilter, setKhoFilter] = useState(user?.kho || "");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [aRes, wRes] = await Promise.all([
        getAssignments(today, today),
        getWarehouses(),
      ]);
      setAssignments(aRes.data.data || []);
      setWarehouses(wRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const activeWarehouses = useMemo(() => {
    if (isWarehouse && user?.kho) {
      return warehouses.filter((w) => w.ten === user.kho);
    }
    if (khoFilter) {
      return warehouses.filter((w) => w.ten === khoFilter);
    }
    return warehouses;
  }, [warehouses, khoFilter, isWarehouse, user?.kho]);

  const pins = useMemo(() => {
    return assignments
      .filter((a) => !khoFilter || a.kho === khoFilter)
      .flatMap((a) => {
        const list = [];
        if (a.checkInLatitude != null && a.checkInLongitude != null) {
          list.push({
            key: `in-${a.id}`,
            type: "in",
            lat: a.checkInLatitude,
            lng: a.checkInLongitude,
            valid: a.checkInGpsValid,
            assignment: a,
          });
        }
        if (a.checkOutLatitude != null && a.checkOutLongitude != null) {
          list.push({
            key: `out-${a.id}`,
            type: "out",
            lat: a.checkOutLatitude,
            lng: a.checkOutLongitude,
            valid: a.checkOutGpsValid,
            assignment: a,
          });
        }
        return list;
      });
  }, [assignments, khoFilter]);

  const mapPoints = useMemo(() => {
    const pts = [];
    activeWarehouses.forEach((w) => {
      if (w.latitude != null && w.longitude != null) {
        pts.push([w.latitude, w.longitude]);
      }
    });
    pins.forEach((p) => pts.push([p.lat, p.lng]));
    return pts;
  }, [activeWarehouses, pins]);

  const center = mapPoints[0] || [10.78, 106.7];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${brand.border}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Bản đồ GPS kho
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pin Check In/Out hôm nay so với bán kính kho
              {isWarehouse && user?.kho ? ` · Kho ${user.kho}` : ""}
            </Typography>
          </Box>

          {!isWarehouse && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Kho</InputLabel>
              <Select
                label="Kho"
                value={khoFilter}
                onChange={(e) => setKhoFilter(e.target.value)}
              >
                <MenuItem value="">Tất cả kho</MenuItem>
                {warehouses.map((w) => (
                  <MenuItem key={w.ten} value={w.ten}>
                    {w.ten}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={2}>
          <Chip size="small" label={`${pins.filter((p) => p.type === "in").length} Check In`} />
          <Chip size="small" label={`${pins.filter((p) => p.type === "out").length} Check Out`} />
          <Chip
            size="small"
            color="warning"
            label={`${pins.filter((p) => p.valid === false).length} sai tọa độ`}
          />
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: `1px solid ${brand.border}`,
          height: { xs: 420, md: 560 },
          "& .leaflet-container": { height: "100%", width: "100%" },
        }}
      >
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitAll points={mapPoints} />

          {activeWarehouses.map((w) => (
            <Fragment key={w.ten}>
              <Circle
                center={[w.latitude, w.longitude]}
                radius={w.banKinh || 50}
                pathOptions={{
                  color: brand.teal,
                  fillColor: brand.teal,
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
              <CircleMarker
                center={[w.latitude, w.longitude]}
                radius={7}
                pathOptions={{
                  color: brand.teal,
                  fillColor: brand.teal,
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  Kho {w.ten} · bán kính {w.banKinh}m
                </Popup>
              </CircleMarker>
            </Fragment>
          ))}

          {pins.map((p) => {
            const ok = p.valid !== false;
            const color =
              p.type === "in"
                ? ok
                  ? brand.teal
                  : "#ed6c02"
                : ok
                  ? "#ef6c00"
                  : "#c62828";

            return (
              <CircleMarker
                key={p.key}
                center={[p.lat, p.lng]}
                radius={8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.95,
                  weight: 2,
                }}
              >
                <Popup>
                  <b>
                    {p.type === "in" ? "Check In" : "Check Out"}
                    {p.valid === false ? " · Sai tọa độ" : ""}
                  </b>
                  <br />
                  {p.assignment.Driver?.hoTen || "—"} ·{" "}
                  {p.assignment.Vehicle?.bienSo || "—"}
                  <br />
                  {p.assignment.kho} · {p.assignment.ca}
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </Paper>

      {pins.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, p: 2, bgcolor: alpha(brand.teal, 0.06), borderRadius: 2 }}
        >
          Hôm nay chưa có điểm Check In/Out để hiển thị trên bản đồ.
        </Typography>
      )}
    </Box>
  );
}
