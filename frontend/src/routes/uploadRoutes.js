const express = require("express");
const multer = require("multer");
const path = require("path");

const uploadController = require("../controllers/uploadController");

const router = express.Router();

// ==============================
// Upload Excel
// ==============================
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/excel");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const uploadExcel = multer({
  storage: excelStorage,
});

// ==============================
// Upload Check In Images
// ==============================
const checkInStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/checkin");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1000000) +
        ext
    );
  },
});

const uploadCheckIn = multer({
  storage: checkInStorage,
});

// ==============================
// Excel
// ==============================
router.post(
  "/excel",
  uploadExcel.single("file"),
  uploadController.importExcel
);

// ==============================
// Check In Images
// ==============================
router.post(
  "/checkin",
  uploadCheckIn.single("file"),
  uploadController.uploadCheckInImage
);

module.exports = router;