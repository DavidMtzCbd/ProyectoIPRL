const Semestre = require("../models/Semestre");
const { recalcularAlumno } = require("../helpers/recalcularAlumno");

exports.crearSemestre = async (req, res) => {
  try {
    const semestre = await Semestre.create(req.body);
    // Recalcular saldo y estatus al registrar nuevo semestre
    await recalcularAlumno(semestre.alumnoID);
    res.status(201).json(semestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerSemestres = async (req, res) => {
  try {
    const semestres = await Semestre.find({
      alumnoID: req.params.alumnoID,
    }).sort({ numSemestre: 1 });
    res.json(semestres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarSemestre = async (req, res) => {
  try {
    const semestreActual = await Semestre.findById(req.params.id);
    if (!semestreActual)
      return res.status(404).json({ error: "Semestre no encontrado" });

    // Regla: semestre finalizado no puede modificarse
    if (semestreActual.estatusSemestre === "Finalizado") {
      return res.status(403).json({
        error: "Este semestre ya finalizó y no puede ser modificado.",
      });
    }

    // Regla: semestre en curso solo permite cambiar descuentoPorcentaje y estatusSemestre
    if (semestreActual.estatusSemestre === "En curso") {
      const camposPermitidos = ["descuentoPorcentaje", "estatusSemestre"];
      const camposEnviados = Object.keys(req.body);
      const camposNoPermitidos = camposEnviados.filter(
        (c) => !camposPermitidos.includes(c)
      );
      if (camposNoPermitidos.length > 0) {
        return res.status(403).json({
          error: `Semestre en curso: solo se puede modificar el porcentaje de beca. Campos no permitidos: ${camposNoPermitidos.join(", ")}`,
        });
      }
    }

    const semestre = await Semestre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    await recalcularAlumno(semestre.alumnoID);
    res.json(semestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
