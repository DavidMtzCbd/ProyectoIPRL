/* 
JS en el que se definen las rutas para las operaciones CRUD de los alumnos.
Cada ruta está asociada a una función del controlador de alumnos que maneja la lógica de la operación correspondiente.
*/

const express = require("express");
const router = express.Router();
const alumnosController = require("../controllers/alumnosController");

// Ruta para obtener todos los alumnos
router.get("/", alumnosController.getAlumnos);

// Ruta para obtener un alumno por ID
router.get("/:id", alumnosController.getAlumnoById);

// Ruta para crear un nuevo alumno
router.post("/", alumnosController.createAlumno);

// Ruta para actualizar un alumno por ID
router.put("/:id", alumnosController.updateAlumno);

// Ruta para eliminar un alumno por ID
router.delete("/:id", alumnosController.deleteAlumno);

module.exports = router;
