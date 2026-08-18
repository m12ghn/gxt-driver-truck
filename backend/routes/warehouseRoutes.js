const express = require("express");
const router = express.Router();

const warehouseController = require("../controllers/warehouseController");
const attachUser = require("../middlewares/attachUser");

router.use(attachUser);

router.get("/", warehouseController.getWarehouses);
router.put("/:id", warehouseController.updateWarehouse);

module.exports = router;
