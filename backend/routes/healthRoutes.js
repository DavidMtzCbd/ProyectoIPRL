const express = require("express");
const router = express.Router();

// Ruta para verificar el estado del servidor
router.get("/health", (req, res) => {
  res.json({ status: "UP", uptime: proccess.uptime() });
});

module.exports = router;
