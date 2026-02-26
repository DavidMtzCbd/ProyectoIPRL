const express = require("express");
const router = express.Router();
const controller = require("../controllers/pagoController");

router.get("/", controller.obtenerTodosLosPagos);
// IMPORTANTE: /alumno/:alumnoID debe ir ANTES de /:id para evitar conflictos de rutas
router.get("/alumno/:alumnoID", controller.obtenerPagosAlumno);
router.get("/:id", controller.obtenerPagoPorId);
router.post("/", controller.crearPago);

module.exports = router;
