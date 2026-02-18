const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Ruta para iniciar sesión
router.post("/login", authController.iniciarSesion);

router.post("/registro", authController.registrarUsuario);

module.exports = router;
