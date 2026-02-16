const jwt = require("jsonwebtoken");

/**
 * Se verifica que el token JWT sea valido
 * El objetivo es proteger las rutas antes de que accedan a ellas
 */

exports.verificarToken = (req, res, next) => {
  const encabezado = req.headers.authorization;

  //Si no hay header authorization
  if (!encabezado) {
    return res.status(401).json({
      mensaje: "Token requerido",
    });
  }

  //El token aparece como Bearer token
  const token = encabezado.split(" ")[1];

  try {
    //Verificación de los datos del token
    const datos = jwt.verify(token, process.env.SECRETOKEYJWT);

    //Se guardan los datos del usuario en el request
    req.usario = datos;

    next(); //Continua en la ruta
  } catch (error) {
    res.status(401).json({
      mensaje: "Token no valido",
    });
  }
};

/**
 * Permite el acceso UNICAMENTE a los administradores
 */

exports.soloAdministrador = (req, res, next) => {
  if (req.usario.rol !== "administrador") {
    return res.status(403).json({
      mensaje: "Acceso denegado, no cuentas con los permisos necesarios",
    });
  }
  next();
};
