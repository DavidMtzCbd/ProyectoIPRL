const Alumno = require("../models/Alumno");
const Semestre = require("../models/Semestre");
const Pago = require("../models/Pago");

const { logger } = require("../config/logger");

async function construirDashboardAlumno(alumnoId) {
  const alumno = await Alumno.findById(alumnoId);

  if (!alumno) {
    return null;
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

  return {
    alumno,
    saldoActual,
    semestres,
    pagos,
  };
}

exports.getAlumnoDashboard = async (req, res) => {
  try {
    const data = await construirDashboardAlumno(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    res.json(data);
  } catch (error) {
    logger.error("Error en dashboard de Alumno", error);
    res.status(500).json({ message: "Error interno del servidor " });
  }
};

exports.getMiDashboardAlumno = async (req, res) => {
  try {
    const data = await construirDashboardAlumno(req.usuario.alumnoId);

    if (!data) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }

    res.json(data);
  } catch (error) {
    logger.error("Error en dashboard de Alumno autenticado", error);
    res.status(500).json({ message: "Error interno del servidor " });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
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
