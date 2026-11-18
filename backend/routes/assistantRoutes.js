const express = require("express");
const router = express.Router();

const assistantController = require("../controllers/assistantController");
const attachUser = require("../middlewares/attachUser");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(
  requireAuth,
  requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE"),
  attachUser
);

router.post("/chat", assistantController.chat);

module.exports = router;
