const express = require("express");
const router = express.Router();

const warehouseController = require("../controllers/warehouseController");
const attachUser = require("../middlewares/attachUser");
const { requireAuth, requireRole } = require("../middlewares/auth");

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE"), attachUser);

router.get("/", warehouseController.getWarehouses);
router.put("/:id", requireRole("SUPER_ADMIN", "ADMIN"), warehouseController.updateWarehouse);

module.exports = router;
