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
    const semestre = await Semestre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!semestre)
      return res.status(404).json({ error: "Semestre no encontrado" });
    // Recalcular saldo y estatus al modificar un semestre (beca, colegiatura, etc.)
    await recalcularAlumno(semestre.alumnoID);
    res.json(semestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
