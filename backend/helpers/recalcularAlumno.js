/**
 * recalcularAlumno.js
 * Helper compartido para recalcular el saldoActual y el estatus del alumno
 * automáticamente cada vez que se registra un pago o se modifica un semestre.
 *
 * Lógica:
 *   totalEsperado = Σ por semestre (solo meses ya vencidos al día de hoy):
 *     - Sem 1:   inscripcion*(1-beca%) + colegiatura*(1-beca%) × mesesVencidos
 *     - Sem 2+:  reinscripcion*(1-beca%) + colegiatura*(1-beca%) × mesesVencidos
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

// Meses de cada tipo de semestre (índices JS: 0=Ene, 1=Feb, …, 11=Dic)
const MESES_IMPAR = [1, 2, 3, 4, 5, 6]; // Feb–Jul
const MESES_PAR = [7, 8, 9, 10, 11, 0]; // Ago–Ene (Ene = año +1)

/**
 * Cuántos meses de colegiatura ya vencieron para un semestre dado,
 * tomando como referencia la fecha actual.
 */
function mesesVencidos(semestre) {
  const meses = semestre.numSemestre % 2 !== 0 ? MESES_IMPAR : MESES_PAR;

  // Extraer el año de inicio del periodo, ej. "2026 Febrero-Julio" → 2026
  const añoSemestre =
    parseInt(semestre.periodo, 10) || new Date().getFullYear();

  const hoy = new Date();
  const hoyMes = hoy.getMonth();
  const hoyAño = hoy.getFullYear();

  let count = 0;
  for (const mes of meses) {
    // El mes 0 (Enero) en semestres pares pertenece al año siguiente
    const añoMes =
      semestre.numSemestre % 2 === 0 && mes === 0
        ? añoSemestre + 1
        : añoSemestre;

    const vencido = añoMes < hoyAño || (añoMes === hoyAño && mes <= hoyMes);

    if (vencido) count++;
  }
  return count;
}

async function recalcularAlumno(alumnoId) {
  // Obtener semestres y pagos en paralelo
  const [semestres, pagos] = await Promise.all([
    Semestre.find({ alumnoID: alumnoId }),
    Pago.find({ alumnoID: alumnoId }),
  ]);

  // Calcular total esperado solo con los meses ya vencidos
  const totalEsperado = semestres.reduce((acc, s) => {
    const mul = 1 - (s.descuentoPorcentaje ?? 0) / 100;
    const col0 =
      s.numSemestre === 1
        ? (s.inscripcion ?? 0) * mul
        : (s.reinscripcion ?? 0) * mul;
    const meses = s.colegiaturaMensual * mul * mesesVencidos(s);
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
