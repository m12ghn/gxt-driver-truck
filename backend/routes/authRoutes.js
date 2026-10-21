const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const loginLimiter = require("../middlewares/loginLimiter");

// ==============================
// ADMIN LOGIN
// ==============================
router.post(
  "/admin-login",
  loginLimiter,
  authController.adminLogin
);

// ==============================
// DRIVER LOGIN
// ==============================
router.post(
  "/driver-login",
  loginLimiter,
  authController.driverLogin
);

module.exports = router;