const express = require("express");
const router = express.Router();
const cuatrimestreController = require("../controllers/cuatrimestreController");

router.post("/", cuatrimestreController.crearCuatrimestre);
router.get("/alumno/:alumnoID", cuatrimestreController.obtenerCuatrimestres);
router.put("/:id", cuatrimestreController.actualizarCuatrimestre);

module.exports = router;
