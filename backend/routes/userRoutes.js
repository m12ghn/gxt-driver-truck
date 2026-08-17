const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// ==========================
// Danh sách User
// ==========================
router.get("/", userController.getAll);

// ==========================
// Thêm User
// ==========================
router.post("/", userController.create);

// ==========================
// Cập nhật User
// ==========================
router.put("/:id", userController.update);

// ==========================
// Khóa / Mở User
// ==========================
router.patch("/:id/status", userController.changeStatus);

module.exports = router;