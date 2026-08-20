const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");
const vehicleImportController = require("../controllers/vehicleImportController");
const upload = require("../middlewares/uploadExcel");

router.get("/template", vehicleImportController.downloadTemplate);

router.post(
  "/import",
  upload.single("file"),
  vehicleImportController.importExcel
);

router.get("/", vehicleController.getVehicles);
router.get("/:id", vehicleController.getVehicle);
router.post("/", vehicleController.createVehicle);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

module.exports = router;
