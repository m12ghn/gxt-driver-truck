const express = require("express");
const multer = require("multer");

console.log("✅ uploadRoutes loaded");

const uploadController = require("../controllers/uploadController");
const {
  requireAuth,
  requireDriverPortalAuth,
  requireRole,
} = require("../middlewares/auth");

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

router.post("/excel", requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE"), (req, res, next) => {
  console.log("🔥 POST /api/upload/excel HIT");
  next();
});

router.post(
  "/excel",
  upload.single("file"),
  uploadController.importExcel
);

router.post("/signed", requireDriverPortalAuth, uploadController.createSignedUpload);

router.post(
  "/driver-photo",
  requireDriverPortalAuth,
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
  }).single("photo"),
  uploadController.uploadDriverPhoto
);

module.exports = router;