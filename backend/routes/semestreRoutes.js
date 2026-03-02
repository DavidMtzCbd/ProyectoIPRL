const express = require("express");
const router = express.Router();
const controller = require("../controllers/semestreController");

router.post("/", controller.crearSemestre);
router.get("/alumno/:alumnoID", controller.obtenerSemestres);
router.put("/:id", controller.actualizarSemestre);

module.exports = router;
