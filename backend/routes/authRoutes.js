const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken } = require("../middlewares/authMiddleware");

// Ruta para iniciar sesión
router.post("/login", authController.iniciarSesion);

// Registro de usuario (solo admins crean cuentas)
router.post("/registro", authController.registrarUsuario);

// Datos del usuario autenticado (requiere token)
router.get("/me", verificarToken, authController.getMe);

module.exports = router;
