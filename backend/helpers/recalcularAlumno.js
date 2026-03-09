/**
 * recalcularAlumno.js
 * Helper compartido para recalcular el saldoActual y el estatus del alumno
 * automáticamente cada vez que se registra un pago o se modifica un semestre.
 *
 * Lógica:
 *   totalEsperado = Σ por semestre:
 *     - Sem 1:   inscripcion*(1-beca%) + colegiatura*(1-beca%)*6
 *     - Sem 2+:  reinscripcion*(1-beca%) + colegiatura*(1-beca%)*6
 *   totalPagado = Σ monto de todos los pagos del alumno
 *   saldoActual = totalEsperado - totalPagado
 *     > 0 → El alumno debe dinero   → "Adeudo"
 *    <= 0 → El alumno está al día   → "Al corriente"
 *
 * "Convenio" nunca se sobreescribe automáticamente.
 */

const Alumno = require("../models/Alumno");
const Semestre = require("../models/Semestre");
const Pago = require("../models/Pago");

async function recalcularAlumno(alumnoId) {
  // Obtener semestres y pagos en paralelo
  const [semestres, pagos] = await Promise.all([
    Semestre.find({ alumnoID: alumnoId }),
    Pago.find({ alumnoID: alumnoId }),
  ]);

  // Calcular total esperado según estructura de cada semestre (7 columnas)
  const totalEsperado = semestres.reduce((acc, s) => {
    const mul = 1 - (s.descuentoPorcentaje ?? 0) / 100;
    const col0 =
      s.numSemestre === 1
        ? (s.inscripcion ?? 0) * mul
        : (s.reinscripcion ?? 0) * mul;
    const meses = s.colegiaturaMensual * mul * 6; // 6 mensualidades por semestre
    return acc + col0 + meses;
  }, 0);

  // Total pagado real
  const totalPagado = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);

  // saldoActual: positivo = adeuda, negativo o cero = al corriente
  const saldoActual = Math.round((totalEsperado - totalPagado) * 100) / 100;

  // Obtener alumno para respetar "Convenio"
  const alumno = await Alumno.findById(alumnoId);
  if (!alumno) return;

  const nuevoEstatus =
    alumno.estatus === "Convenio"
      ? "Convenio"
      : saldoActual > 0
        ? "Adeudo"
        : "Al corriente";

  await Alumno.findByIdAndUpdate(alumnoId, {
    saldoActual,
    estatus: nuevoEstatus,
  });
}

module.exports = { recalcularAlumno };
