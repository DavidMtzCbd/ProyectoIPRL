const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");

router.get("/alumno/:id", controller.getAlumnoDashboard);

module.exports = router;
