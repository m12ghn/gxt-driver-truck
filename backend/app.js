require("dotenv").config();

const express = require("express");
const cors = require("cors");

const sequelize = require("./database/database");

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

// ==============================
// DATABASE
// Trên serverless (Vercel) mỗi cold start có thể chạy lại module này —
// sequelize.sync() chỉ tạo bảng nếu chưa có nên gọi lại vẫn an toàn,
// nhưng chỉ chạy 1 lần cho mỗi instance đang sống (biến `synced` ở
// module scope) để đỡ tốn thời gian mỗi request.
// Không dùng alter:true vì SQLite/Postgres hay lỗi FOREIGN KEY
// constraint khi model có ràng buộc khóa ngoại. Cần đổi schema thì
// dùng script migrate riêng.
// ==============================
let synced = false;

async function ensureSynced() {
  if (synced) return;

  await sequelize.sync();
  synced = true;

  console.log("✅ Database Connected");
}

app.use(async (req, res, next) => {
  try {
    await ensureSynced();
    next();
  } catch (err) {
    console.error("❌ Database Error:", err);

    res.status(500).json({
      success: false,
      message: "Database connection error",
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
