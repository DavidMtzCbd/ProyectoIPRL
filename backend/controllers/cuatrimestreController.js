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
    const cuatrimestreActual = await Cuatrimestre.findById(req.params.id);
    if (!cuatrimestreActual)
      return res.status(404).json({ error: "Cuatrimestre no encontrado" });

    // Regla: cuatrimestre finalizado no puede modificarse
    if (cuatrimestreActual.estatusSemestre === "Finalizado") {
      return res.status(403).json({
        error: "Este cuatrimestre ya finalizó y no puede ser modificado.",
      });
    }

    // Regla: cuatrimestre en curso solo permite cambiar descuentoPorcentaje y estatusSemestre
    if (cuatrimestreActual.estatusSemestre === "En curso") {
      const camposPermitidos = ["descuentoPorcentaje", "estatusSemestre"];
      const camposEnviados = Object.keys(req.body);
      const camposNoPermitidos = camposEnviados.filter(
        (c) => !camposPermitidos.includes(c)
      );
      if (camposNoPermitidos.length > 0) {
        return res.status(403).json({
          error: `Cuatrimestre en curso: solo se puede modificar el porcentaje de beca. Campos no permitidos: ${camposNoPermitidos.join(", ")}`,
        });
      }
    }

    const cuatrimestre = await Cuatrimestre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    await recalcularAlumno(cuatrimestre.alumnoID);
    res.json(cuatrimestre);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
