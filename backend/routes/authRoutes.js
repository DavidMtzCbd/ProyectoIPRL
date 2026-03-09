const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken } = require("../middlewares/authMiddleware");

// Inicio de sesión con Google OAuth 2.0
router.post("/google", authController.googleLogin);

// Registro de usuario (solo admins crean cuentas — requiere token de admin)
router.post("/registro", verificarToken, authController.registrarUsuario);

// Datos del usuario autenticado (requiere token)
router.get("/me", verificarToken, authController.getMe);

module.exports = router;
