/**
 * recalcularAlumno.js
 * Helper compartido para recalcular el saldoActual y el estatus del alumno.
 */

const Alumno = require("../models/Alumno");
const Semestre = require("../models/Semestre");
const Cuatrimestre = require("../models/Cuatrimestre");
const Pago = require("../models/Pago");
const { calcularNuevoSaldoYEstatus } = require("./calculosFinancieros");

async function recalcularAlumno(alumnoId) {
  // Obtener todos los datos de la base de datos
  const [semestres, cuatrimestres, pagos, alumno] = await Promise.all([
    Semestre.find({ alumnoID: alumnoId }),
    Cuatrimestre.find({ alumnoID: alumnoId }),
    Pago.find({ alumnoID: alumnoId }),
    Alumno.findById(alumnoId),
  ]);

  if (!alumno) return;

  //Inyectar al helper los datos para calcular el nuevo saldo y estatus
  const { saldoActual, nuevoEstatus } = calcularNuevoSaldoYEstatus(
    semestres,
    cuatrimestres,
    pagos,
    alumno.estatus,
  );

  // Se guardan los nuevos valores en la base de datos
  await Alumno.findByIdAndUpdate(alumnoId, {
    saldoActual,
    estatus: nuevoEstatus,
  });
}

module.exports = { recalcularAlumno };
