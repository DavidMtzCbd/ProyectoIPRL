/**
 * calculosFinancieros.js
 * Funciones matemáticas puras para calcular la deuda académica de un alumno.
 */

const MESES_IMPAR = [1, 2, 3, 4, 5, 6]; // Feb–Jul
const MESES_PAR = [7, 8, 9, 10, 11, 0]; // Ago–Ene (Ene = año +1)

//En esta funcion se calcula el numero de meses vencidos de un semestre
function mesesVencidos(semestre, fechaActual = new Date()) {
  const meses = semestre.numSemestre % 2 !== 0 ? MESES_IMPAR : MESES_PAR;
  const añoSemestre =
    parseInt(semestre.periodo, 10) || fechaActual.getFullYear();

  const hoyMes = fechaActual.getMonth();
  const hoyAño = fechaActual.getFullYear();

  let count = 0;
  for (const mes of meses) {
    const añoMes =
      semestre.numSemestre % 2 === 0 && mes === 0
        ? añoSemestre + 1
        : añoSemestre;
    const vencido = añoMes < hoyAño || (añoMes === hoyAño && mes <= hoyMes);
    if (vencido) count++;
  }
  return count;
}

//En esta funcion se calcula el numero de meses vencidos de un cuatrimestre
function mesesVencidosCuatrimestre(cuatrimestre, fechaActual = new Date()) {
  const partes = (cuatrimestre.periodo || "").split(" ");
  const anioStr =
    partes.length > 1 ? partes[0] : fechaActual.getFullYear().toString();
  const mesesStr = partes.length > 1 ? partes[1] : partes[0];

  const añoPeriodo = parseInt(anioStr, 10) || fechaActual.getFullYear();

  //Se definen los meses que corresponden a cada cuatrimestre
  let mesesIndices = [];
  if (mesesStr === "Enero-Abril") mesesIndices = [0, 1, 2, 3];
  else if (mesesStr === "Mayo-Agosto") mesesIndices = [4, 5, 6, 7];
  else if (mesesStr === "Septiembre-Diciembre") mesesIndices = [8, 9, 10, 11];
  else mesesIndices = [0, 1, 2, 3];

  const hoyMes = fechaActual.getMonth();
  const hoyAño = fechaActual.getFullYear();

  let count = 0;
  for (const mes of mesesIndices) {
    const vencido =
      añoPeriodo < hoyAño || (añoPeriodo === hoyAño && mes <= hoyMes);
    if (vencido) count++;
  }
  return count;
}

//En esta funcion se calcula el nuevo saldo y estatus del alumno
function calcularNuevoSaldoYEstatus(
  semestres,
  cuatrimestres,
  pagos,
  estatusActual,
  fechaActual = new Date(),
) {
  const totalEsperadoSemestres = semestres.reduce((acc, s) => {
    const mul = 1 - (s.descuentoPorcentaje ?? 0) / 100;
    const col0 =
      s.numSemestre === 1
        ? (s.inscripcion ?? 0) * mul
        : (s.reinscripcion ?? 0) * mul;
    const meses =
      (s.colegiaturaMensual ?? 0) * mul * mesesVencidos(s, fechaActual);
    return acc + col0 + meses;
  }, 0);
  //Se calcula el total esperado de los cuatrimestres
  const totalEsperadoCuatrimestres = cuatrimestres.reduce((acc, c) => {
    const mul = 1 - (c.descuentoPorcentaje ?? 0) / 100;
    const col0 =
      c.numCuatrimestre === 1
        ? (c.inscripcion ?? 0) * mul
        : (c.reinscripcion ?? 0) * mul;
    const meses =
      (c.colegiaturaMensual ?? 0) *
      mul *
      mesesVencidosCuatrimestre(c, fechaActual);
    return acc + col0 + meses;
  }, 0);

  const totalEsperado = totalEsperadoSemestres + totalEsperadoCuatrimestres;

  const totalPagado = pagos.reduce((acc, p) => acc + (p.monto ?? 0), 0);

  const saldoActual = Math.round((totalEsperado - totalPagado) * 100) / 100;

  let nuevoEstatus = estatusActual;
  if (estatusActual !== "Convenio") {
    nuevoEstatus = saldoActual > 0 ? "Adeudo" : "Al corriente";
  }

  return { saldoActual, nuevoEstatus };
}

module.exports = {
  mesesVencidos,
  mesesVencidosCuatrimestre,
  calcularNuevoSaldoYEstatus,
};
