/**
 * Controlador para la autenticación de usuarios.
 * Permite a los usuarios iniciar sesión y obtener un token JWT.
 * Solo los administradores pueden crear cuentas, por lo que no hay registro público.
 */

const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

exports.iniciarSesion = async (req, res) => {
  // Extraer usuario y contraseña del cuerpo de la solicitud
  const { usuario, contrasena } = req.body;

  // Verificar que el usuario exista en la base de datos
  const usuarioDB = await Usuario.findOne({ usuario });
  if (!usuarioDB) {
    return res.status(400).json({ mensaje: "Usuario no encontrado" });
  }

  // Verificar que la contraseña sea correcta
  const contrasenaValida = await bcryptjs.compare(contrasena, usuarioDB.contrasena);
  if (!contrasenaValida) {
    return res.status(400).json({ mensaje: "Contraseña incorrecta" });
  }
  // Generar token JWT con el ID y rol del usuario
  const token = jwt.sign(
    {
      id: usuarioDB._id,
      rol: usuarioDB.rol,
    },
    process.env.SECRETOKEYJWT,
    { expiresIn: "8h" },
  );
  res.json({ token, rol: usuarioDB.rol });
};

exports.registrarUsuario = async (req, res) => {
  try {
    const { usuario, contrasena, rol } = req.body;
    const salt = await bcryptjs.genSalt(10);
    const contrasenaHashed = await bcryptjs.hash(contrasena, salt);

    const nuevoUsuario = await Usuario.create({
      usuario,
      contrasena: contrasenaHashed,
      rol
    });

    res.status(201).json({ mensaje: "Usuario creado", usuario: nuevoUsuario.usuario });
  } catch (error) {
    res.status(400).json({ mensaje: "Error al registrar", error: error.message });
  }
};
