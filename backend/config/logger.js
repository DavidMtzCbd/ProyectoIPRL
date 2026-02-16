const winston = require("winston");
const morgan = require("morgan");

const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

const morganMiddleware = morgan("dev");

module.exports = { logger, morganMiddleware };
