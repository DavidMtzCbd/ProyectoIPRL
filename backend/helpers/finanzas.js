/**
 * En este JS se van a realizar los calculos para el
 * saldo del alumno
 */

exports.calcularSaldoTotal = (costosTotales, pagos) => {
  const totalPagos = pagos.reduce((acc, pago) => acc + pago.monto, 0);
  return costosTotales - totalPagos;
};

/**
 * Calculará el costo total de los semestres uno por uno
 */

exports.calcularCostoSemestre = (semestre) => {
  const mensualTotal =
    semestre.colegiaturaMensual *
    (1 - semestre.descuentoPorcentaje / 100) *
    semestre.mensualidades.length;

  return mensualTotal + semestre.inscripcion + semestre.reinscripcion;
};
