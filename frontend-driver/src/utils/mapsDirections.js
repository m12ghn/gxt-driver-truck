export function isBuuCucAssignment(assignment) {
  return Boolean(
    assignment?.location?.isBuuCuc || assignment?.duAn === "VUNG_HCM"
  );
}

export function mapsDirectionsUrl(assignment) {
  const lat = Number(assignment?.location?.latitude);
  const lng = Number(assignment?.location?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }

  const name = String(assignment?.location?.ten || assignment?.kho || "").trim();
  if (!name) return "";

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    name
  )}&travelmode=driving`;
}

export function directionsLabel(assignment) {
  return isBuuCucAssignment(assignment)
    ? "Chỉ đường đến bưu cục"
    : "Chỉ đường đến kho";
}
