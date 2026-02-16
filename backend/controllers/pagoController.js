const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");

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
    const pagos = await Pago.find({
      alumnoID: req.params.alumnoID,
    }).sort({ fechaPago: -1 });
    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener el historial de pagos", error);
    res.status(500).json({ error: error.message });
  }
};
