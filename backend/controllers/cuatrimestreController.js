const Cuatrimestre = require("../models/Cuatrimestre");
const { recalcularAlumno } = require("../helpers/recalcularAlumno");

exports.crearCuatrimestre = async (req, res) => {
  try {
    const cuatrimestre = await Cuatrimestre.create(req.body);
    // Recalcular saldo y estatus al registrar nuevo cuatrimestre
    await recalcularAlumno(cuatrimestre.alumnoID);
    res.status(201).json(cuatrimestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerCuatrimestres = async (req, res) => {
  try {
    const cuatrimestres = await Cuatrimestre.find({
      alumnoID: req.params.alumnoID,
    }).sort({ numCuatrimestre: 1 });
    res.json(cuatrimestres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarCuatrimestre = async (req, res) => {
  try {
    const cuatrimestre = await Cuatrimestre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cuatrimestre)
      return res.status(404).json({ error: "Cuatrimestre no encontrado" });
    // Recalcular saldo y estatus al modificar un cuatrimestre (beca, colegiatura, etc.)
    await recalcularAlumno(cuatrimestre.alumnoID);
    res.json(cuatrimestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
