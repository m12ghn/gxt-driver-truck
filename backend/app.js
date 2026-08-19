require("dotenv").config();

const express = require("express");
const cors = require("cors");

const sequelize = require("./database/database");
const { ensureWarehouses } = require("./utils/ensureWarehouses");
const { ensureAssignmentColumns } = require("./utils/ensureAssignmentColumns");
const { ensureStorageBucket } = require("./utils/uploadToSupabase");

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

function publicDbError(err) {
  const msg = err?.message || "";
  if (/EMAXCONNSESSION|max clients reached|too many clients/i.test(msg)) {
    return "Hệ thống đang bận, vui lòng đợi 5 giây rồi gửi lại.";
  }
  return "Database connection error";
}

// ==============================
// DATABASE
// Không gọi sequelize.sync() trên Vercel: schema đã có, sync() giữ
// connection lâu và dễ làm đầy pool 15 slot của Supabase session mode.
// ==============================
let connected = false;

async function ensureConnected() {
  if (connected) return;

  if (process.env.VERCEL) {
    await sequelize.authenticate();
  } else {
    await sequelize.sync();
  }

  connected = true;
  console.log("✅ Database Connected");

  try {
    await ensureWarehouses();
  } catch (err) {
    console.error("⚠️  Seed warehouses failed:", err.message);
  }

  try {
    await ensureAssignmentColumns();
  } catch (err) {
    console.error("⚠️  Ensure assignment columns failed:", err.message);
  }

  try {
    await ensureStorageBucket();
  } catch (err) {
    console.error("⚠️  Storage bucket setup failed:", err.message);
  }
}

app.use(async (req, res, next) => {
  if (skipDatabase(req)) {
    return next();
  }

  try {
    await ensureConnected();
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
