require("dotenv").config();

const express = require("express");
const cors = require("cors");

const sequelize = require("./database/database");
const { ensureWarehouses } = require("./utils/ensureWarehouses");
const { ensureAssignmentColumns } = require("./utils/ensureAssignmentColumns");

// ==============================
// Models
// ==============================
require("./models/User");
require("./models/Vehicle");
require("./models/Driver");
require("./models/Assignment");
require("./models/CheckIn");
require("./models/Warehouse");
require("./models/IncidentReport");

// ==============================
// Routes
// ==============================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const statsRoutes = require("./routes/statsRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");

const app = express();

// ==============================
// Middleware
// ==============================
app.use(cors());
app.use(express.json());

function skipDatabase(req) {
  const path = req.path || "";
  const url = req.originalUrl || "";
  return (
    path === "/" ||
    /\/upload\/(signed|driver-photo|test)/.test(path) ||
    /\/upload\/(signed|driver-photo|test)/.test(url)
  );
}

function isAuthRoute(req) {
  const url = req.originalUrl || req.path || "";
  return /\/api\/auth\//.test(url) || /\/auth\//.test(url);
}

function isSuperAdminLogin(req) {
  if (!isAuthRoute(req) || !/admin-login/.test(req.originalUrl || req.path || "")) {
    return false;
  }

  return (
    req.body?.taiKhoan === process.env.SUPER_ADMIN_USER &&
    req.body?.matKhau === process.env.SUPER_ADMIN_PASS
  );
}

function publicDbError(err) {
  const msg = err?.message || "";
  if (/EMAXCONNSESSION|max clients reached|too many clients/i.test(msg)) {
    return "Hệ thống đang bận, vui lòng đợi 5 giây rồi gửi lại.";
  }
  return "Database connection error";
}

let connected = false;
let warmupStarted = false;

async function ensureConnected() {
  if (connected) return;

  if (!process.env.VERCEL) {
    await sequelize.sync();
  }

  connected = true;
}

function kickWarmup() {
  if (warmupStarted) return;
  warmupStarted = true;

  Promise.resolve()
    .then(() => ensureConnected())
    .then(() => ensureWarehouses())
    .then(() => ensureAssignmentColumns())
    .catch((err) => {
      warmupStarted = false;
      console.error("⚠️  Warmup failed:", err.message);
    });
}

app.use(async (req, res, next) => {
  if (skipDatabase(req) || isSuperAdminLogin(req)) {
    kickWarmup();
    return next();
  }

  try {
    await ensureConnected();
    kickWarmup();
    next();
  } catch (err) {
    console.error("❌ Database Error:", err);

    res.status(503).json({
      success: false,
      message: publicDbError(err),
    });
  }
});

// ==============================
// API
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/warehouses", warehouseRoutes);

// ==============================
// HOME
// ==============================
app.get("/", (req, res) => {
  res.send("GXT Driver Truck API Running");
});

module.exports = app;
