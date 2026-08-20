import { useEffect, useMemo } from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../utils/mapIcons.css";
import { warehouseIcon, truckIcon, truckPinColor } from "../utils/mapIcons";

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 16);
      return;
    }

    map.fitBounds(points, { padding: [28, 28], maxZoom: 17 });
  }, [map, points]);

  return null;
}

function InvalidateOnOpen({ open }) {
  const map = useMap();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map, open]);

  return null;
}

/**
 * Bản đồ kho: tâm kho + vòng bán kính + pin Check In/Out.
 */
export default function WarehouseGpsMap({
  warehouse,
  checkIn,
  checkOut,
  height = 300,
  open = true,
}) {
  const center = useMemo(() => {
    if (warehouse?.latitude != null && warehouse?.longitude != null) {
      return [warehouse.latitude, warehouse.longitude];
    }
    if (checkIn?.lat != null && checkIn?.lng != null) {
      return [checkIn.lat, checkIn.lng];
    }
    if (checkOut?.lat != null && checkOut?.lng != null) {
      return [checkOut.lat, checkOut.lng];
    }
    return null;
  }, [warehouse, checkIn, checkOut]);

  const points = useMemo(() => {
    const list = [];
    if (warehouse?.latitude != null && warehouse?.longitude != null) {
      list.push([warehouse.latitude, warehouse.longitude]);
    }
    if (checkIn?.lat != null && checkIn?.lng != null) {
      list.push([checkIn.lat, checkIn.lng]);
    }
    if (checkOut?.lat != null && checkOut?.lng != null) {
      list.push([checkOut.lat, checkOut.lng]);
    }
    return list;
  }, [warehouse, checkIn, checkOut]);

  if (!center) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f5f5",
          borderRadius: 2,
          border: "1px dashed #ddd",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Chưa có tọa độ để hiển thị bản đồ.
        </Typography>
      </Box>
    );
  }

  const radius = warehouse?.banKinh || 50;

  return (
    <Box>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={1}>
        <Chip size="small" label={`Kho: ${warehouse?.ten || "—"}`} />
        <Chip size="small" label={`Bán kính ${radius}m`} color="primary" variant="outlined" />
        {checkIn?.lat != null && (
          <Chip
            size="small"
            label="Check In"
            sx={{ bgcolor: "#0F9B9422", color: "#0A7A74" }}
          />
        )}
        {checkOut?.lat != null && (
          <Chip
            size="small"
            label="Check Out"
            sx={{ bgcolor: "#ef6c0022", color: "#ef6c00" }}
          />
        )}
      </Stack>

      <Box
        sx={{
          height,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          "& .leaflet-container": { height: "100%", width: "100%", fontFamily: "inherit" },
        }}
      >
        <MapContainer
          center={center}
          zoom={16}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds points={points} />
          <InvalidateOnOpen open={open} />

          {warehouse?.latitude != null && (
            <>
              <Circle
                center={[warehouse.latitude, warehouse.longitude]}
                radius={radius}
                pathOptions={{
                  color: "#0F9B94",
                  fillColor: "#0F9B94",
                  fillOpacity: 0.12,
                  weight: 2,
                }}
              />
              <Marker
                position={[warehouse.latitude, warehouse.longitude]}
                icon={warehouseIcon()}
              >
                <Popup>
                  Kho {warehouse.ten}
                  <br />
                  Bán kính cho phép: {radius}m
                </Popup>
              </Marker>
            </>
          )}

          {checkIn?.lat != null && checkIn?.lng != null && (
            <Marker
              position={[checkIn.lat, checkIn.lng]}
              icon={truckIcon(truckPinColor({ type: "in", valid: checkIn.valid }))}
            >
              <Popup>
                Check In
                {checkIn.valid === false
                  ? " — Sai tọa độ"
                  : checkIn.valid === true
                    ? " — Đúng tọa độ"
                    : ""}
              </Popup>
            </Marker>
          )}

          {checkOut?.lat != null && checkOut?.lng != null && (
            <Marker
              position={[checkOut.lat, checkOut.lng]}
              icon={truckIcon(truckPinColor({ type: "out", valid: checkOut.valid }))}
            >
              <Popup>
                Check Out
                {checkOut.valid === false
                  ? " — Sai tọa độ"
                  : checkOut.valid === true
                    ? " — Đúng tọa độ"
                    : ""}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </Box>
    </Box>
  );
}
