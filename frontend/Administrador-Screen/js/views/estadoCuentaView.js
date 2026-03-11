import { appState } from "../../../Shared/js/state.js";
import {
  getAlumnoById,
  getAlumnoPagos,
  getSemestres,
  updateAlumno,
} from "../../../Shared/js/api.js";
import { showAlert, formatMoney, formatDate } from "../../../Shared/js/ui.js";
import { abrirModalSemestre } from "./alumnosView.js";

// ── Listener Global de Refresco ───────────────────────────────────────────────
let isSemestreListenerBound = false;
function bindSemestreListener() {
  if (isSemestreListenerBound) return;
  document.addEventListener("semestreActualizado", async (e) => {
    if (
      appState.currentView === "estadoCuenta" &&
      appState.alumnoActivo === e.detail
    ) {
      await initEstadoCuenta();
    }
  });
  isSemestreListenerBound = true;
}
bindSemestreListener();

// ── Definición de columnas por semestre ───────────────────────────────────────
//
// Semestre 1 (único con Inscripción):  Inscripción, Feb, Mar, Abr, May, Jun, Jul
// Semestres impares >= 3:              Re-Inscripción, Feb, Mar, Abr, May, Jun, Jul
// Semestres pares:                     Re-Inscripción, Ago, Sep, Oct, Nov, Dic, Ene

const COLS_IMPAR = ["Inscripción/Reinscripción", 1, 2, 3, 4, 5, 6]; // mes 1=Ene
const COLS_PAR = ["Inscripción/Reinscripción", 7, 8, 9, 10, 11, 0]; // 0=Ene(año sig.)

const MES_NOMBRES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function colsParaSemestre(numSemestre) {
  return numSemestre % 2 !== 0 ? COLS_IMPAR : COLS_PAR;
}

function encabezado0(numSemestre) {
  return numSemestre === 1 ? "Inscripción" : "Re-Inscripción";
}

// ── Algoritmo de mapeo ────────────────────────────────────────────────────────
//
// Para cada semestre, construye un array de 7 celdas:
//   [{ montoPagado, saldoVencido, fechaPago }]
//
// Reglas de asignación:
//   - concepto "Inscripción"   → celda 0  (solo sem 1)
//   - concepto "Reinscripción" → celda 0  (semestres >= 2)
//   - concepto *Colegiatura*   → celda según mes de fechaPago
//   - Si varios pagos caen en la misma celda, se suman

function mapearPagos(semestre, pagos) {
  const cols = colsParaSemestre(semestre.numSemestre);
  const esperadoColegiatura =
    semestre.colegiaturaMensual *
    (1 - (semestre.descuentoPorcentaje ?? 0) / 100);
  const esperadoInscripcion =
    semestre.numSemestre === 1
      ? semestre.inscripcion * (1 - (semestre.descuentoPorcentaje ?? 0) / 100)
      : semestre.reinscripcion *
        (1 - (semestre.descuentoPorcentaje ?? 0) / 100);

  // Montos esperados por celda
  const esperados = cols.map((c, i) =>
    i === 0 ? esperadoInscripcion : esperadoColegiatura,
  );

  // Inicializar celdas vacías
  const celdas = cols.map((_, i) => ({
    montoPagado: 0,
    fechaPago: null,
    esperado: esperados[i],
    esCondonacion: false,
  }));

  // Separar pagos: los que van a este semestre explícitamente y los automáticos
  const pagosParaEsteSemestre = pagos.filter((p) => {
    if (p.semestreDestinoID) {
      return p.semestreDestinoID === semestre._id; // Solo entra si es para este semestre
    }
    return true; // Si es Automático, entra para ser evaluado
  });

  pagosParaEsteSemestre.forEach((p) => {
    const concepto = p.concepto ?? "";
    const esColegiatura = concepto.toLowerCase().includes("colegiatura");
    const esInscripcion = concepto === "Inscripción";
    const esReinscripcion = concepto === "Reinscripción";

    if (concepto === "Condonación de deuda") {
        // Condonación se aplica como un saldo global o en todas las celdas, 
        // pero la interfaz ya lo calculará a 0 si la suma de pagos es suficiente.
        // Simularemos un pago a la primera celda
        celdas[0].montoPagado += p.monto;
        celdas[0].esCondonacion = true;
        return;
    }

    if (esInscripcion && semestre.numSemestre === 1) {
      celdas[0].montoPagado += p.monto;
      if (!celdas[0].fechaPago) celdas[0].fechaPago = p.fechaPago;
      return;
    }

    if (esReinscripcion && semestre.numSemestre > 1) {
      celdas[0].montoPagado += p.monto;
      if (!celdas[0].fechaPago) celdas[0].fechaPago = p.fechaPago;
      return;
    }

    if (esColegiatura) {
      const mesDelPago = new Date(p.fechaPago).getMonth(); // 0-11
      const colIdx = cols.findIndex((c, i) => i > 0 && c === mesDelPago);
      if (colIdx !== -1) {
        celdas[colIdx].montoPagado += p.monto;
        if (!celdas[colIdx].fechaPago) celdas[colIdx].fechaPago = p.fechaPago;
      }
    }
  });

  // ── Detectar si un mes ya venció ──────────────────────────────────────────
  // Extraemos el año de inicio del periodo, ej. "2026 Febrero-Julio" → 2026
  const añoSemestre =
    parseInt(semestre.periodo, 10) || new Date().getFullYear();
  const hoy = new Date();
  const hoyMes = hoy.getMonth(); // 0-11
  const hoyAño = hoy.getFullYear();

  return celdas.map((c, i) => {
    // La celda 0 (Inscripción/Reinscripción) siempre se muestra — es al inicio
    let saldoVencido;
    if (i === 0) {
      saldoVencido = c.montoPagado - c.esperado;
    } else {
      const mesColumna = cols[i]; // número de mes 0-11
      // Para semestres pares, el mes 0 (Enero) pertenece al año siguiente
      const añoColumna =
        semestre.numSemestre % 2 === 0 && mesColumna === 0
          ? añoSemestre + 1
          : añoSemestre;

      const esPasadoOActual =
        añoColumna < hoyAño || (añoColumna === hoyAño && mesColumna <= hoyMes);

      saldoVencido = esPasadoOActual ? c.montoPagado - c.esperado : 0;
    }

    return { ...c, saldoVencido };
  });
}

// ── Render ────────────────────────────────────────────────────────────────────

function fmt(v) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(v ?? 0));
}

function renderSemestreTabla(semestre, pagos) {
  const cols = colsParaSemestre(semestre.numSemestre);
  const celdas = mapearPagos(semestre, pagos);
  const enc0 = encabezado0(semestre.numSemestre);

  const saldoTotal = celdas.reduce((acc, c) => acc + c.saldoVencido, 0);
  const saldoClass = saldoTotal >= 0 ? "ec-saldo--verde" : "ec-saldo--rojo";

  function thTxt(c, i) {
    if (i === 0) return enc0;
    return MES_NOMBRES[c];
  }

  const ths = cols.map((c, i) => `<th>${thTxt(c, i)}</th>`).join("");

  function celda(row) {
    return celdas
      .map((c) => {
        if (row === "monto") {
          if (c.montoPagado === 0)
            return `<td class="ec-cell--empty">$0.00</td>`;
          return `<td class="ec-cell--pagado">${fmt(c.montoPagado)}</td>`;
        }
        if (row === "saldo") {
          if (c.saldoVencido === 0)
            return `<td class="ec-cell--vencido-pos">$0.00</td>`;
          if (c.saldoVencido > 0)
            return `<td class="ec-cell--vencido-pos">${fmt(c.saldoVencido)}</td>`;
          return `<td class="ec-cell--vencido-neg">${fmt(c.saldoVencido)}</td>`;
        }
        if (row === "fecha") {
          if (!c.fechaPago) return `<td class="ec-cell--empty">—</td>`;
          return `<td class="ec-cell--fecha">${formatDate(c.fechaPago)}</td>`;
        }
      })
      .join("");
  }

  const tieneCondonacion = celdas.some(c => c.esCondonacion) || celdas.some(c => c.saldoVencido < -100 && saldoTotal === 0);

  return `
  <div class="ec-section">
    <div class="ec-section-header">
      <i class="bi bi-calendar3"></i>
      <span class="ec-sem-title">Semestre ${semestre.numSemestre} &mdash; ${semestre.periodo}</span>
      ${tieneCondonacion ? '<span class="badge badge--convenio" style="margin-left: 10px; padding: 2px 8px; font-size: 0.75rem;"><i class="bi bi-magic"></i> Condonado</span>' : ''}
    </div>
    <div class="ec-table-wrap">
      <table class="ec-table">
        <thead><tr><th></th>${ths}</tr></thead>
        <tbody>
          <tr><td>Monto Pagado</td>${celda("monto")}</tr>
          <tr><td>Saldo Vencido</td>${celda("saldo")}</tr>
          <tr><td>Fecha de Pago</td>${celda("fecha")}</tr>
        </tbody>
      </table>
    </div>
    <div class="ec-sem-saldo ${saldoClass}">
      Saldo del semestre: ${fmt(saldoTotal)}
    </div>
  </div>`;
}

function renderHeader(alumno, semestres) {
  document.getElementById("ec-nombre").textContent =
    `${alumno.apellidoPaterno} ${alumno.apellidoMaterno} ${alumno.nombre}`;
  document.getElementById("ec-oferta").textContent = alumno.ofertaAcademica;

  // Chips
  const estatusCls =
    alumno.estatus === "Al corriente"
      ? "corriente"
      : alumno.estatus === "Adeudo"
        ? "adeudo"
        : "convenio";
  document.getElementById("ec-chips").innerHTML = `
    <span class="ec-chip"><i class="bi bi-person-badge-fill"></i> Matrícula: ${alumno.matricula}</span>
    <span class="ec-chip"><i class="bi bi-circle-fill" style="font-size:.5rem"></i> ${alumno.estatus}</span>`;

  // Precios del semestre más reciente
  const sem = semestres.length ? semestres[semestres.length - 1] : null;
  if (sem) {
    const beca = sem.descuentoPorcentaje ?? 0;
    const mul = 1 - beca / 100;
    document.getElementById("ec-prices").innerHTML = `
      <span class="price-label">Inscripción</span>
      <span class="price-base">${fmt(sem.inscripcion)}</span>
      <span class="price-final">${fmt(sem.inscripcion * mul)}</span>
      <span class="price-label">Re-Inscripción</span>
      <span class="price-base">${fmt(sem.reinscripcion)}</span>
      <span class="price-final">${fmt(sem.reinscripcion * mul)}</span>
      <span class="price-label">Colegiatura</span>
      <span class="price-base">${fmt(sem.colegiaturaMensual)}</span>
      <span class="price-final">${fmt(sem.colegiaturaMensual * mul)}</span>`;

    document.getElementById("ec-beca-badge").innerHTML =
      beca > 0
        ? `<span class="ec-beca-badge"><i class="bi bi-stars"></i> ${beca}% Beca</span>`
        : "";
  }

  // Saldo
  const saldoEl = document.getElementById("ec-saldo");
  saldoEl.textContent = `Saldo actual: ${fmt(alumno.saldoActual)}`;
  saldoEl.className = `ec-saldo ${alumno.saldoActual <= 0 ? "ec-saldo--rojo" : "ec-saldo--verde"}`;
}

function renderGlobalPagos(pagos) {
  const sorted = [...pagos].sort(
    (a, b) => new Date(a.fechaPago) - new Date(b.fechaPago),
  );
  const tbody = document.getElementById("ec-global-body");

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="ec-no-data">Sin pagos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map(
      (p, i) => `
    <tr>
      <td><span class="ec-num-badge">${i + 1}</span></td>
      <td>${formatDate(p.fechaPago)}</td>
      <td>${p.concepto}</td>
      <td class="monto">${fmt(p.monto)}</td>
      <td>${p.metodoPago}</td>
      <td>${p.referencia ?? "—"}</td>
      <td>${p.folioFactura ? `<span class="folio">${p.folioFactura}</span>` : "—"}</td>
    </tr>`,
    )
    .join("");
}

function renderFacturacion(alumno) {
  const grid = document.getElementById("ec-fact-grid");
  const campos = [
    ["RFC", alumno.rfc],
    ["Razón Social", alumno.razonSocial],
    ["Uso CFDI", alumno.usoCFDI],
    ["Régimen Fiscal", alumno.regimenFiscal],
    ["Domicilio Fiscal (CP)", alumno.domicilioFiscal],
  ].filter(([, v]) => v);

  if (!campos.length) {
    grid.innerHTML = `<p class="ec-no-data" style="padding:0;">Sin datos fiscales registrados.</p>`;
    return;
  }
  grid.innerHTML = campos
    .map(
      ([label, val]) => `
    <div class="ec-fact-item">
      <span>${label}</span><span>${val}</span>
    </div>`,
    )
    .join("");
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initEstadoCuenta() {
  const alumnoId = appState.alumnoActivo;
  if (!alumnoId) {
    showAlert("No se seleccionó un alumno.", "error");
    return;
  }

  try {
    const [alumno, pagos, semestres] = await Promise.all([
      getAlumnoById(alumnoId),
      getAlumnoPagos(alumnoId),
      getSemestres(alumnoId).catch(() => []),
    ]);

    renderHeader(alumno, semestres);

    // Renderizar tablas de semestres
    const semContainer = document.getElementById("ec-semestres");
    if (semestres.length) {
      semContainer.innerHTML = semestres
        .sort((a, b) => a.numSemestre - b.numSemestre)
        .map((s) => renderSemestreTabla(s, pagos))
        .join("");
    } else {
      semContainer.innerHTML = `<div class="ec-section"><p class="ec-no-data">Sin semestres registrados.</p></div>`;
    }

    renderGlobalPagos(pagos);
    renderFacturacion(alumno);

    // Notas
    document.getElementById("ec-notas").value = alumno.notas ?? "";

    document
      .getElementById("ec-save-notas")
      .addEventListener("click", async () => {
        try {
          await updateAlumno(alumnoId, {
            notas: document.getElementById("ec-notas").value,
          });
          showAlert("Notas guardadas ✔", "success");
        } catch (e) {
          showAlert("Error al guardar: " + e.message, "error");
        }
      });

    // Regresar a alumnos
    document.getElementById("ec-back").addEventListener("click", () => {
      document.querySelector(".nav-btn[data-view='alumnos']")?.click();
    });

    // Botón Registrar semestre
    document
      .getElementById("ec-btn-nuevo-semestre")
      ?.addEventListener("click", () => {
        abrirModalSemestre(null, alumnoId);
      });
      
    // Botón Condonar Deuda
    document
      .getElementById("ec-btn-condonar")
      ?.addEventListener("click", async () => {
        if(alumno.saldoActual >= 0) {
            showAlert("El alumno no tiene deuda que condonar.", "info");
            return;
        }
        
        const confirmar = confirm(`¿Estás seguro que deseas condonar la deuda total de ${fmt(alumno.saldoActual)}?\n\nEsto actualizará el saldo del alumno a $0.00 y registrará un movimiento de 'Condonación de Deuda'.`);
        if(!confirmar) return;

        try {
            // Registrar pago para la condonación (monto positivo porque es deuda negativa)
            const pagoVal = Math.abs(alumno.saldoActual);
            
            // Si quieres asignarlo a un semestre en particular, aquí podrías,
            // pero lo dejaremos general (Automático = null)
            const { createPago } = await import("../../../Shared/js/api.js");
            
            const numReq = await createPago({
                alumnoID: alumnoId,
                fechaPago: new Date().toISOString().slice(0, 10),
                monto: pagoVal,
                concepto: 'Condonación de deuda',
                metodoPago: 'Condonación',
                factura: 'No'
            });

            // Actualizar el saldo y estatus en el perfil
            await updateAlumno(alumnoId, { 
                estatus: 'Al corriente', 
                saldoActual: 0 
            });

            showAlert(`Deuda por ${fmt(pagoVal)} condonada correctamente.`, "success");
            // Recargar la vista actual
            await initEstadoCuenta();
        } catch(error) {
            showAlert("Error al condonar deuda: " + error.message, "error");
        }
      });
  } catch (error) {
    showAlert("Error al cargar Estado de Cuenta: " + error.message, "error");
  }
}
