const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");
const vehicleImportController = require("../controllers/vehicleImportController");
const upload = require("../middlewares/uploadExcel");
const { requireAuth, requireRole } = require("../middlewares/auth");
const adminSide = requireRole("SUPER_ADMIN", "ADMIN", "WAREHOUSE");
const adminOnly = requireRole("SUPER_ADMIN", "ADMIN");

router.use(requireAuth);

router.get("/template", adminOnly, vehicleImportController.downloadTemplate);

router.post(
  "/import",
  adminOnly,
  upload.single("file"),
  vehicleImportController.importExcel
);

router.get("/", adminSide, vehicleController.getVehicles);
router.get("/:id", adminSide, vehicleController.getVehicle);
router.post("/", adminOnly, vehicleController.createVehicle);
router.put("/:id", adminOnly, vehicleController.updateVehicle);
router.delete("/:id", adminOnly, vehicleController.deleteVehicle);

module.exports = router;
