/**
 * Controlador para la autenticación de usuarios.
 * Incluye login tradicional y login con Google OAuth 2.0 para alumnos.
 */

const Usuario = require("../models/Usuario");
const Alumno = require("../models/Alumno");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const axios = require("axios");

function generarToken(usuarioDB) {
  return jwt.sign(
    {
      id: usuarioDB._id,
      rol: usuarioDB.rol,
      alumnoId: usuarioDB.alumno ?? null,
    },
    process.env.SECRETOKEYJWT,
    { expiresIn: "8h" },
  );
}

exports.iniciarSesion = async (req, res, next) => {
  try {
    const { usuario, contrasena } = req.body;

    const usuarioDB = await Usuario.findOne({ usuario });
    if (!usuarioDB) {
      return res.status(400).json({ mensaje: "Usuario no encontrado" });
    }

    const contrasenaValida = await bcryptjs.compare(contrasena, usuarioDB.contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    const token = generarToken(usuarioDB);
    res.json({ token, rol: usuarioDB.rol });
  } catch (error) {
    next(error);
  }
};

exports.iniciarSesionGoogle = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ mensaje: "idToken de Google es requerido" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ mensaje: "GOOGLE_CLIENT_ID no está configurado" });
    }

    const { data: payload } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
      params: { id_token: idToken },
      timeout: 5000,
    });

    const audiencias = String(payload.aud || "").split(",").map((item) => item.trim());
    const audienciaValida = audiencias.includes(process.env.GOOGLE_CLIENT_ID);

    if (!payload?.email || payload.email_verified !== "true" || !audienciaValida) {
      return res.status(401).json({ mensaje: "Token de Google no válido" });
    }

    const alumno = await Alumno.findOne({ correo: payload.email.toLowerCase() });

    if (!alumno) {
      return res.status(403).json({
        mensaje: "Tu correo de Google no está asociado a un alumno registrado",
      });
    }

    let usuarioDB = await Usuario.findOne({ alumno: alumno._id });

    if (!usuarioDB) {
      usuarioDB = await Usuario.create({
        usuario: payload.email.toLowerCase(),
        contrasena: await bcryptjs.hash(`${payload.sub}.${Date.now()}`, 10),
        rol: "alumno",
        alumno: alumno._id,
      });
    }

    const token = generarToken(usuarioDB);

    res.json({
      token,
      rol: "alumno",
      alumno: {
        id: alumno._id,
        nombreCompleto: `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`,
        matricula: alumno.matricula,
        correo: alumno.correo,
      },
    });
  } catch (error) {
    next(error);
  }
};
