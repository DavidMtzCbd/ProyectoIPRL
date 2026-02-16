const Alumno = require("../models/Alumno");
const Semestre = require("../models/Semestre");
const Pago = require("../models/Pago");

const { logger } = require("../config/logger");

exports.getAlumnoDashboard = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.params.id);

    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    const semestres = await Semestre.find({ alumnoID: alumno._id });

    const pagos = await Pago.find({
      alumnoID: alumno._id,
    }).sort({ fechaPago: -1 });

    const totalPagos = pagos.reduce((acc, pago) => acc + pago.monto, 0);

    const totalCostos = semestres.reduce(
      (acc, semestre) =>
        acc +
        semestre.inscripcion +
        semestre.reinscripcion +
        semestre.colegiaturaMensual * semestre.mensualidades.length,
      0,
    );

    const saldoActual = totalCostos - totalPagos;

    res.json({
      alumno,
      saldoActual,
      semestres,
      pagos,
    });
  } catch (error) {
    logger.error("Error en dashboard de Alumno", error);
    res.status(500).json({ message: "Error interno del servidor " });
  }
};

/**
 * En esta sección se obtiene la información general del dashboard para
 * el administrador, incluye total de alumnos, los pagos totales, y la parte
 * de la tabla de los ultimos pagos realizados.
 */

exports.getAdminDashboard = async (req, res) => {
  try {
    //Seccion en la que se obtendrá la informacion general del dashboard

    const totalAlumnos = await Alumno.countDocuments();

    const alumnos = await Alumno.find();

    let totalAlumnosConAdeudo = 0;

    for (const alumno of alumnos) {
      const pagos = await Pago.find({ alumnoID: alumno._id });
      const semestres = await Semestre.find({ alumnoID: alumno._id });

      const totalPagos = pagos.reduce((acc, pago) => acc + pago.monto, 0);

      const totalCostos = semestres.reduce(
        (acc, semestre) =>
          acc +
          semestre.inscripcion +
          semestre.reinscripcion +
          semestre.colegiaturaMensual * semestre.mensualidades.length,
        0,
      );

      if (totalCostos - totalPagos > 0) {
        totalAlumnosConAdeudo++;
      }
    }

    //Tabla con el registro de los pagos
    const pagos = await Pago.find()
      .populate("alumnoID", "nombre matricula correo")
      .sort({ fechaPago: -1 });

    const tablaPagos = pagos.map((pago) => ({
      fecha: pago.fechaPago,
      matricula: pago.alumnoID?.matricula || "N/A",
      concepto: pago.concepto,
      monto: pago.monto,
      metodoPago: pago.metodoPago,
      requiereFactura: pago.factura ? "Sí" : "No",
    }));

    res.json({
      resumen: {
        totalAlumnos,
        totalAlumnosConAdeudo,
      },
      tablaPagos,
    });
  } catch (error) {
    logger.error("Error en dashboard de Administrador", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
