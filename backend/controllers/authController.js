/**
 * Controlador para la autenticación de usuarios.
 */

const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

exports.iniciarSesion = async (req, res) => {
  const { usuario, contrasena } = req.body;

  const usuarioDB = await Usuario.findOne({ usuario });
  if (!usuarioDB) {
    return res.status(400).json({ mensaje: "Usuario no encontrado" });
  }

  const contrasenaValida = await bcryptjs.compare(
    contrasena,
    usuarioDB.contrasena,
  );
  if (!contrasenaValida) {
    return res.status(400).json({ mensaje: "Contraseña incorrecta" });
  }

  const token = jwt.sign(
    { id: usuarioDB._id, rol: usuarioDB.rol },
    process.env.SECRETOKEYJWT,
    { expiresIn: "1h" },
  );
  res.json({ token, rol: usuarioDB.rol });
};

exports.registrarUsuario = async (req, res) => {
  try {
    const { usuario, contrasena, rol, alumno } = req.body;
    const salt = await bcryptjs.genSalt(10);
    const contrasenaHashed = await bcryptjs.hash(contrasena, salt);

    const nuevoUsuario = await Usuario.create({
      usuario,
      contrasena: contrasenaHashed,
      rol,
      alumno: alumno ?? undefined,
    });

    res
      .status(201)
      .json({ mensaje: "Usuario creado", usuario: nuevoUsuario.usuario });
  } catch (error) {
    res
      .status(400)
      .json({ mensaje: "Error al registrar", error: error.message });
  }
};

/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado. Si es alumno, incluye
 * el documento Alumno completo (con datos de facturación).
 */
exports.getMe = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usario.id).populate("alumno");
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({
      id: usuario._id,
      usuario: usuario.usuario,
      rol: usuario.rol,
      alumno: usuario.alumno ?? null,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener datos del usuario" });
  }
};
