const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");
const Alumno = require("../models/Alumno");
const { logger } = require("../config/logger");
const { recalcularAlumno } = require("../helpers/recalcularAlumno");

exports.crearPago = async (req, res) => {
  try {
    // ── Generar número de movimiento (secuencial global) ──────────────────────
    const ultimoPago = await Pago.findOne({}, { movimiento: 1 }).sort({
      movimiento: -1,
    });
    const movimiento =
      ultimoPago && ultimoPago.movimiento ? ultimoPago.movimiento + 1 : 1;

    // ── Generar folio de factura (siempre) ────────────────────
    const ultimaFactura = await Pago.findOne(
      { folioFactura: { $ne: null } },
      { folioFactura: 1 },
    ).sort({ folioFactura: -1 });
    let numFolio = 1;
    if (ultimaFactura && ultimaFactura.folioFactura) {
      // Extraer el número del formato F-0001
      numFolio = parseInt(ultimaFactura.folioFactura.replace("F-", ""), 10) + 1;
    }
    const folioFactura = `F-${String(numFolio).padStart(4, "0")}`;

    const pago = await Pago.create({ ...req.body, movimiento, folioFactura });

    // Actualiza el totalPagado del semestre si aplica
    if (pago.semestreID) {
      await Semestre.findByIdAndUpdate(pago.semestreID, {
        $inc: { totalPagado: pago.monto },
      });
    }

    // ── Recalcular saldoActual y estatus del alumno ────────────────────────────
    await recalcularAlumno(pago.alumnoID);

    res.status(201).json(pago);
  } catch (error) {
    logger.error("Error al registrar nuevo pago", error);
    res.status(400).json({ error: error.message });
  }
};

// Controlador que obtiene todos los pagos registrados
exports.obtenerTodosLosPagos = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate(
        "alumnoID",
        "nombre apellidoPaterno apellidoMaterno matricula correo",
      )
      .sort({ movimiento: -1 });
    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener todos los pagos", error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPagoPorId = async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id).populate(
      "alumnoID",
      "nombre apellidoPaterno apellidoMaterno matricula correo",
    );
    if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado" });
    res.json(pago);
  } catch (error) {
    logger.error("Error al obtener el detalle del pago", error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPagosAlumno = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ matricula: req.params.alumnoID });
    if (!alumno) {
      return res
        .status(404)
        .json({ mensaje: "Alumno no encontrado con esa matrícula" });
    }
    const pagos = await Pago.find({ alumnoID: alumno._id })
      .populate(
        "alumnoID",
        "nombre apellidoPaterno apellidoMaterno matricula correo",
      )
      .sort({ fechaPago: -1 });
    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener el historial de pagos", error);
    res.status(500).json({ error: error.message });
  }
};

exports.obtenerPagosAlumnoPorId = async (req, res) => {
  try {
    const pagos = await Pago.find({ alumnoID: req.params.id }).sort({
      fechaPago: -1,
    });
    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener pagos del alumno por ID", error);
    res.status(500).json({ error: error.message });
  }
};
