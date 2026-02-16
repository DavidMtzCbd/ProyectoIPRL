/**
 * En este JS definimos las rutas para el manejo de los cursos,
 * cada ruta está asociada a una función del controlador de cursos
 * que maneja la lógica de la operación correspondiente.
 */

const express = require("express");
const router = express.Router();
const cursosController = require("../controllers/cursosController");

// Ruta para obtener todos los cursos
router.get("/", cursosController.getCursos);

// Ruta para obtener un curso por ID
router.get("/:id", cursosController.getCursoById);

// Ruta para crear un nuevo curso
router.post("/", cursosController.createCurso);

// Ruta para actualizar un curso por ID
router.put("/:id", cursosController.updateCurso);

// Ruta para eliminar un curso por ID
router.delete("/:id", cursosController.deleteCurso);

module.exports = router;
