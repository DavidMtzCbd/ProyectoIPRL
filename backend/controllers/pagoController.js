const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");
const Alumno = require("../models/Alumno");

const { logger } = require("../config/logger");

exports.crearPago = async (req, res) => {
  try {
    const pago = await Pago.create(req.body);

    //Función que actualiza el totalPagado del semestre
    if (pago.semestreID) {
      await Semestre.findByIdAndUpdate(pago.semestreID, {
        $inc: { totalPagado: pago.monto },
      });
    }

    res.status(201).json(pago);
  } catch (error) {
    logger.error("Error al registrar nuevo pago", error);
    res.status(400).json({ error: error.message });
  }
};

//Controlador que obtiene el listado de pagos por alumno
exports.obtenerPagosAlumno = async (req, res) => {
  try {
    // 1. Buscamos al alumno usando la matrícula que viene en los parámetros
    const alumno = await Alumno.findOne({ matricula: req.params.alumnoID });

    if (!alumno) {
      return res.status(404).json({ mensaje: "Alumno no encontrado con esa matrícula" });
    }

    // 2. Ahora buscamos los pagos usando el ID real del alumno encontrado
    const pagos = await Pago.find({
      alumnoID: alumno._id,
    }).sort({ fechaPago: -1 });

    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener el historial de pagos", error);
    res.status(500).json({ error: error.message });
  }
};