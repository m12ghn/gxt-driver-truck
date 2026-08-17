const express = require("express");
const multer = require("multer");

console.log("✅ uploadRoutes loaded");

const uploadController = require("../controllers/uploadController");

const router = express.Router();

// Dùng RAM (buffer) thay vì ghi ra đĩa — bắt buộc để chạy được trên
// serverless (Vercel), nơi filesystem chỉ đọc (trừ /tmp).
const upload = multer({ storage: multer.memoryStorage() });

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload Route OK",
  });
});

router.post("/excel", (req, res, next) => {
  console.log("🔥 POST /api/upload/excel HIT");
  next();
});

router.post(
  "/excel",
  upload.single("file"),
  uploadController.importExcel
);

module.exports = router;