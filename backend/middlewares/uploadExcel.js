const multer = require("multer");

// Dùng RAM (buffer) thay vì ghi ra đĩa — bắt buộc để chạy được trên
// serverless (Vercel), nơi filesystem chỉ đọc (trừ /tmp).
module.exports = multer({
  storage: multer.memoryStorage(),
});
