const express = require("express");
const router = express.Router();
const controller = require("../controllers/dashboardController");
const { verificarToken, soloAlumno } = require("../middlewares/authMiddleware");

router.get("/alumno/me", verificarToken, soloAlumno, controller.getMiDashboardAlumno);
router.get("/alumno/:id", controller.getAlumnoDashboard);
router.get("/admin", controller.getAdminDashboard);

module.exports = router;
