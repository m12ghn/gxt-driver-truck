const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// ==============================
// ADMIN LOGIN
// ==============================
router.post(
  "/admin-login",
  authController.adminLogin
);

// ==============================
// DRIVER LOGIN
// ==============================
router.post(
  "/driver-login",
  authController.driverLogin
);

module.exports = router;