const multer = require("multer");

const PHOTO_FIELDS = [
  "matTruoc",
  "matSau",
  "hongTrai",
  "hongPhai",
  "banhSoCua",
  "manOdo",
];

// Giữ file trong RAM (buffer) thay vì ghi ra đĩa cục bộ — controller sẽ
// upload buffer này lên Supabase Storage (xem utils/uploadToSupabase.js).
const storage = multer.memoryStorage();

function makeUploader() {
  const upload = multer({ storage });

  return upload.fields(
    PHOTO_FIELDS.map((name) => ({ name, maxCount: 1 }))
  );
}

// Upload ảnh báo cáo sự cố dọc đường (1–4 ảnh)
function makeIncidentUploader() {
  return multer({ storage }).array("photos", 4);
}

module.exports = { makeUploader, makeIncidentUploader, PHOTO_FIELDS };
