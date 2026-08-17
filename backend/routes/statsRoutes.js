const express = require("express");
const router = express.Router();

const statsController = require("../controllers/statsController");
const attachUser = require("../middlewares/attachUser");

router.use(attachUser);

router.get("/dashboard", statsController.getDashboardStats);
router.get("/alerts", statsController.getAlerts);
router.get("/report", statsController.getReportStats);
router.get("/report/export", statsController.exportReportExcel);

module.exports = router;
