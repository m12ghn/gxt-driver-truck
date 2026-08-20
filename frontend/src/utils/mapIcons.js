import L from "leaflet";

const WAREHOUSE_COLOR = "#0F9B94";

const WAREHOUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M3 20V8.5L12 3l9 5.5V20H3z" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M8 20v-7h8v7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M10.5 16.5h3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const TRUCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
  <path d="M3 7h11v9H3V7z" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M14 10h4.2L21 13.2V16h-7v-6z" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="7" cy="17.5" r="1.7" fill="#fff"/>
  <circle cx="17" cy="17.5" r="1.7" fill="#fff"/>
</svg>`;

const iconCache = new Map();

function pinHtml(color, innerSvg) {
  return `<div style="
      width:36px;
      height:44px;
      display:flex;
      flex-direction:column;
      align-items:center;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));
    ">
      <div style="
        width:32px;
        height:32px;
        border-radius:50%;
        background:${color};
        border:2px solid #fff;
        display:flex;
        align-items:center;
        justify-content:center;
      ">${innerSvg}</div>
      <div style="
        width:0;
        height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:10px solid ${color};
        margin-top:-1px;
      "></div>
    </div>`;
}

function makeIcon(key, color, innerSvg) {
  if (iconCache.has(key)) return iconCache.get(key);

  const icon = L.divIcon({
    className: "gxt-map-icon",
    html: pinHtml(color, innerSvg),
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -38],
  });

  iconCache.set(key, icon);
  return icon;
}

export function warehouseIcon(color = WAREHOUSE_COLOR) {
  return makeIcon(`warehouse-${color}`, color, WAREHOUSE_SVG);
}

export function truckIcon(color) {
  return makeIcon(`truck-${color}`, color, TRUCK_SVG);
}

export function truckPinColor({ type, valid }) {
  const ok = valid !== false;
  if (type === "in") return ok ? WAREHOUSE_COLOR : "#ed6c02";
  return ok ? "#ef6c00" : "#c62828";
}

export { WAREHOUSE_COLOR, WAREHOUSE_SVG, TRUCK_SVG };
