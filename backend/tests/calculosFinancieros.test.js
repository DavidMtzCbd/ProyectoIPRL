const {
  mesesVencidos,
  calcularNuevoSaldoYEstatus
} = require("../helpers/calculosFinancieros");

describe("Motor de Cálculos Financieros", () => {
  // Simulamos que hoy es Octubre de 2026.
  const fechaActualSimulada = new Date(2026, 9, 15); // Mes 9 = Octubre

  describe("Cálculo de Meses Vencidos", () => {
    test("Semestre 1 (Febrero-Julio) debe cobrar los 6 meses si ya pasó de julio", () => {
      const semestre = { numSemestre: 1, periodo: "2026 Febrero-Julio" }; // Meses 1, 2, 3, 4, 5, 6
      const count = mesesVencidos(semestre, fechaActualSimulada);
      expect(count).toBe(6);
    });

    test("Semestre 2 (Agosto-Enero) debe cobrar solo los meses que ya pasaron hasta Octubre", () => {
      // Ago(7), Sep(8), Oct(9) -> Han iniciado 3 meses.
      const semestre = { numSemestre: 2, periodo: "2026 Agosto-Enero" };
      const count = mesesVencidos(semestre, fechaActualSimulada);
      expect(count).toBe(3);
    });
  });

  describe("Cálculo de Nuevo Saldo Estatus", () => {
    test("Prueba 1: Beca del 50% debe aplicarse a inscripción y colegiatura", () => {
      const semestres = [{
        numSemestre: 1,
        periodo: "2026 Febrero-Julio",
        inscripcion: 2000,
        reinscripcion: 0,
        colegiaturaMensual: 1000,
        descuentoPorcentaje: 50 // 50%
      }];

      // Total Original: 2000 Insc + (1000 * 6 mesesVencidos) = 8000
      // Reducido a la mitad: 4000
      const { saldoActual } = calcularNuevoSaldoYEstatus(semestres, [], [], "Adeudo", fechaActualSimulada);
      expect(saldoActual).toBe(4000);
    });

    test("Prueba 2: Semestre 2 debe cobrar reinscripción y JAMÁS inscripción", () => {
       const semestres = [{
        numSemestre: 2,
        periodo: "2026 Agosto-Enero", // Meses vencidos: 3
        inscripcion: 999999, // Debe ignorarse
        reinscripcion: 1500,
        colegiaturaMensual: 1000,
        descuentoPorcentaje: 0
      }];
      
      // Debe ser: 1500 (Reinsc) + (1000 * 3) = 4500
      const { saldoActual } = calcularNuevoSaldoYEstatus(semestres, [], [], "Adeudo", fechaActualSimulada);
      expect(saldoActual).toBe(4500);
    });

    test("Prueba 3: Si tiene 'Convenio' el estatus JAMÁS se debe pasar a 'Adeudo' por deudas", () => {
      const semestres = [{
        numSemestre: 1,
        periodo: "2026 Febrero-Julio",
        inscripcion: 1000,
        reinscripcion: 0,
        colegiaturaMensual: 500,
        descuentoPorcentaje: 0
      }];
      // Debe 4000 pesos
      const { nuevoEstatus, saldoActual } = calcularNuevoSaldoYEstatus(semestres, [], [], "Convenio", fechaActualSimulada);
      expect(saldoActual).toBeGreaterThan(0);
      expect(nuevoEstatus).toBe("Convenio");
    });

    test("Prueba 4: Pagos totales balancean la cuenta a $0 (Al corriente)", () => {
      const semestres = [{
        numSemestre: 1,
        periodo: "2026 Febrero-Julio", // 6 meses vencidos
        inscripcion: 1000,
        reinscripcion: 0,
        colegiaturaMensual: 500, // Total: 1000 + 3000 = 4000
        descuentoPorcentaje: 0
      }];

      const pagos = [
        { monto: 1000 },
        { monto: 500 },
        { monto: 2500 }
      ];

      const { saldoActual, nuevoEstatus } = calcularNuevoSaldoYEstatus(semestres, [], pagos, "Adeudo", fechaActualSimulada);
      expect(saldoActual).toBe(0);
      expect(nuevoEstatus).toBe("Al corriente");
    });
  });
});
