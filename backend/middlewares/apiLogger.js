/**
 * API Logger Middleware
 * Se encarga del registro de información en las solicitudes API
 * registrando el método, la ruta, el estado de la respuesta y la duración de la solicitud.
 * Utiliza el logger configurado en utils/logger.js para almacenar los registros.
 */

const { logger } = require("../config/logger");

module.exports = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
    });
  });
  next();
};
