const jwt = require("jsonwebtoken");

exports.verificarToken = (req, res, next) => {
  const encabezado = req.headers.authorization;

  if (!encabezado) {
    return res.status(401).json({
      mensaje: "Token requerido",
    });
  }

  const token = encabezado.split(" ")[1];

  try {
    const datos = jwt.verify(token, process.env.SECRETOKEYJWT);
    req.usuario = datos;
    req.usario = datos;
    next();
  } catch (error) {
    res.status(401).json({
      mensaje: "Token no valido",
    });
  }
};

exports.soloAdministrador = (req, res, next) => {
  if (req.usuario.rol !== "administrador") {
    return res.status(403).json({
      mensaje: "Acceso denegado, no cuentas con los permisos necesarios",
    });
  }
  next();
};

exports.soloAlumno = (req, res, next) => {
  if (req.usuario.rol !== "alumno") {
    return res.status(403).json({
      mensaje: "Acceso denegado, esta ruta es para alumnos",
    });
  }
  next();
};
