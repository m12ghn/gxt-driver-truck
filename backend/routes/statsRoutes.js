const express = require("express");
const router = express.Router();

const statsController = require("../controllers/statsController");
const attachUser = require("../middlewares/attachUser");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE"), attachUser);

router.get("/dashboard", statsController.getDashboardStats);
router.get("/alerts", statsController.getAlerts);
router.get("/report", statsController.getReportStats);
router.get("/report/export", statsController.exportReportExcel);

module.exports = router;
