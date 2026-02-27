const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");
const Alumno = require("../models/Alumno");

const { logger } = require("../config/logger");

exports.crearPago = async (req, res) => {
  try {
    // ── Generar número de movimiento (secuencial global) ──────────────────────
    const totalPagos = await Pago.countDocuments();
    const movimiento = totalPagos + 1;

    // ── Generar folio de factura (solo si requiere factura) ────────────────────
    let folioFactura = null;
    if (req.body.factura === "Sí") {
      const totalFacturas = await Pago.countDocuments({
        folioFactura: { $ne: null },
      });
      const numFolio = totalFacturas + 1;
      folioFactura = `F-${String(numFolio).padStart(4, "0")}`;
    }

    const pago = await Pago.create({ ...req.body, movimiento, folioFactura });

    // Actualiza el totalPagado del semestre si aplica
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

// Controlador que obtiene todos los pagos registrados
exports.obtenerTodosLosPagos = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate(
        "alumnoID",
        "nombre apellidoPaterno apellidoMaterno matricula correo",
      )
      .sort({ movimiento: -1 }); // ordenar por movimiento descendente
    res.json(pagos);
  } catch (error) {
    logger.error("Error al obtener todos los pagos", error);
    res.status(500).json({ error: error.message });
  }
};

//Controlador que obtiene el detalle de un pago por su ID
exports.obtenerPagoPorId = async (req, res) => {
  try {
    const pago = await Pago.findById(req.params.id).populate(
      "alumnoID",
      "nombre apellidoPaterno apellidoMaterno matricula correo",
    );
    if (!pago) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }
    res.json(pago);
  } catch (error) {
    logger.error("Error al obtener el detalle del pago", error);
    res.status(500).json({ error: error.message });
  }
};

//Controlador que obtiene el listado de pagos por alumno
exports.obtenerPagosAlumno = async (req, res) => {
  try {
    // 1. Buscamos al alumno usando la matrícula que viene en los parámetros
    const alumno = await Alumno.findOne({ matricula: req.params.alumnoID });

    if (!alumno) {
      return res
        .status(404)
        .json({ mensaje: "Alumno no encontrado con esa matrícula" });
    }

    // 2. Ahora buscamos los pagos usando el ID real del alumno encontrado
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

//Controlador que obtiene los pagos de un alumno por su ObjectId (_id)
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
