/**
 * Controlador de autenticación — Google OAuth 2.0
 * Reemplaza el login usuario/contraseña por verificación del ID Token de Google.
 */

const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── POST /api/auth/google ─────────────────────────────────────────────────────

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ mensaje: "Token de Google requerido" });
    }

    // 1. Verificar el ID Token con los servidores de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // 2. Buscar el usuario en la BD por su email de Google
    const usuario = await Usuario.findOne({
      googleEmail: email.toLowerCase(),
    }).populate("alumno");

    if (!usuario) {
      return res.status(403).json({
        mensaje:
          "Tu cuenta de Google no está registrada en el sistema. Contacta al administrador.",
      });
    }

    // 3. Actualizar googleId si es la primera vez que inicia sesión con este token
    if (!usuario.googleId || usuario.googleId !== googleId) {
      usuario.googleId = googleId;
      usuario.nombre = name;
      await usuario.save();
    }

    // 4. Emitir JWT igual que antes (el resto del sistema no cambia)
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.SECRETOKEYJWT,
      { expiresIn: "1h" },
    );

    res.json({ token, rol: usuario.rol });
  } catch (error) {
    console.error("Error en googleLogin:", error);
    res.status(500).json({ mensaje: "Error al autenticar con Google" });
  }
};

// ── POST /api/auth/registro ───────────────────────────────────────────────────
// Solo un administrador autenticado puede registrar nuevos usuarios.

exports.registrarUsuario = async (req, res) => {
  try {
    const { googleEmail, rol, alumno } = req.body;

    if (!googleEmail || !rol) {
      return res
        .status(400)
        .json({ mensaje: "googleEmail y rol son requeridos" });
    }

    // Verificar que no exista ya ese email
    const existe = await Usuario.findOne({
      googleEmail: googleEmail.toLowerCase(),
    });
    if (existe) {
      return res.status(409).json({ mensaje: "Ese correo ya está registrado" });
    }

    const nuevoUsuario = await Usuario.create({
      googleEmail: googleEmail.toLowerCase(),
      nombre: googleEmail.split("@")[0], // Nombre provisional, se actualiza en primer login
      rol,
      alumno: alumno ?? undefined,
    });

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      googleEmail: nuevoUsuario.googleEmail,
    });
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al registrar", error: error.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usario.id).populate("alumno");
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({
      id: usuario._id,
      googleEmail: usuario.googleEmail,
      nombre: usuario.nombre,
      rol: usuario.rol,
      alumno: usuario.alumno ?? null,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener datos del usuario" });
  }
};
