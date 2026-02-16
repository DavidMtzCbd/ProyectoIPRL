const express = require("express");
const router = express.Router();
const controller = require("../controllers/pagoController");

router.post("/", controller.crearPago);
router.get("/alumno/:alumnoID", controller.obtenerPagosAlumno);

module.exports = router;
