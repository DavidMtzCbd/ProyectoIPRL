import { appState, setToken } from "./state.js";
import { getMe, getSemestres, getAlumnoPagos, updateAlumno } from "./api.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function showAlert(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `portal-alert portal-alert--${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Estado global ─────────────────────────────────────────────────────────────

let alumnoData = null;

// ── Perfil ────────────────────────────────────────────────────────────────────

function renderPerfil(alumno) {
  alumnoData = alumno;
  const nombre = `${alumno.apellidoPaterno} ${alumno.apellidoMaterno} ${alumno.nombre}`;

  document.getElementById("alumno-nombre").textContent = nombre;
  document.getElementById("alumno-oferta").textContent = alumno.ofertaAcademica;
  document.getElementById("alumno-matricula-chip").textContent =
    `Matrícula: ${alumno.matricula}`;

  // Estatus chip
  const estatusChip = document.getElementById("alumno-estatus-chip");
  const cls =
    alumno.estatus === "Al corriente"
      ? "success"
      : alumno.estatus === "Adeudo"
        ? "danger"
        : "warning";
  estatusChip.className = `chip chip--${cls}`;
  estatusChip.innerHTML = `<i class="bi bi-circle-fill" style="font-size:.5rem"></i> ${alumno.estatus}`;

  // Tarjetas de resumen
  document.getElementById("card-saldo").textContent = fmt(alumno.saldoActual);
  document.getElementById("card-saldo").className =
    `summary-card__value ${alumno.saldoActual > 0 ? "summary-card__value--red" : "summary-card__value--green"}`;

  const estatusBadge = document.getElementById("card-estatus");
  estatusBadge.className = `status-badge status-badge--${cls === "success" ? "corriente" : cls === "danger" ? "adeudo" : "convenio"}`;
  estatusBadge.innerHTML = `<i class="bi bi-circle-fill" style="font-size:.5rem"></i> ${alumno.estatus}`;

  // Rellenar facturación
  renderFacturacion(alumno);
}

// ── Semestre activo ───────────────────────────────────────────────────────────

function renderSemestre(semestres) {
  const tbody = document.getElementById("colegiatura-body");
  const cardSem = document.getElementById("card-semestre");

  if (!semestres || semestres.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="no-data">Sin semestres registrados</td></tr>`;
    cardSem.textContent = "—";
    return;
  }

  // El más reciente (último en el array)
  const sem = semestres[semestres.length - 1];
  cardSem.textContent = `Sem. ${sem.numSemestre} — ${sem.periodo}`;

  const descuento = sem.descuentoPorcentaje ?? 0;
  const inscBase = sem.inscripcion ?? 0;
  const reinscBase = sem.reinscripcion ?? 0;
  const colBase = sem.colegiaturaMensual ?? 0;

  const becaPill =
    descuento > 0
      ? `<span class="beca-pill"><i class="bi bi-stars"></i> ${descuento}% beca</span>`
      : `<span style="color:var(--muted);font-size:.8rem">Sin beca</span>`;

  const rows = [
    {
      concepto: "Inscripción",
      base: inscBase,
      final: inscBase * (1 - descuento / 100),
    },
    {
      concepto: "Reinscripción",
      base: reinscBase,
      final: reinscBase * (1 - descuento / 100),
    },
    {
      concepto: "Colegiatura mensual",
      base: colBase,
      final: colBase * (1 - descuento / 100),
    },
  ];

  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.concepto}</td>
      <td class="price-base">${fmt(r.base)}</td>
      <td>${becaPill}</td>
      <td class="price-final">${fmt(r.final)}</td>
    </tr>`,
    )
    .join("");
}

// ── Historial de pagos ────────────────────────────────────────────────────────

const CONCEPTO_ICON = {
  Inscripción: "bi-file-earmark-text-fill",
  Reinscripción: "bi-arrow-repeat",
  "Ingeniería Colegiatura": "bi-calendar-check-fill",
  "Maestría Colegiatura": "bi-calendar-check-fill",
  "Hergonomia colegiatura": "bi-calendar-check-fill",
  Extraordinarios: "bi-exclamation-circle-fill",
  Titulación: "bi-award-fill",
  Certificados: "bi-patch-check-fill",
  "Recuperación de cartera": "bi-cash-coin",
  Diplomado: "bi-journal-bookmark-fill",
  Curso: "bi-book-fill",
};

function renderHistorial(pagos) {
  const feed = document.getElementById("pagos-feed");
  document.getElementById("card-pagos").textContent = pagos.length;

  if (!pagos.length) {
    feed.innerHTML = `<p class="no-data">Sin pagos registrados</p>`;
    return;
  }

  // Ordenar por fecha descendente
  const sorted = [...pagos].sort(
    (a, b) => new Date(b.fechaPago) - new Date(a.fechaPago),
  );

  feed.innerHTML = sorted
    .map((p) => {
      const icon = CONCEPTO_ICON[p.concepto] ?? "bi-receipt";
      const folioPill = p.folioFactura
        ? `<span class="pago-folio"><i class="bi bi-file-earmark-fill"></i> Folio ${p.folioFactura}</span>`
        : "";
      return `
      <div class="pago-item">
        <div class="pago-icon"><i class="bi ${icon}"></i></div>
        <div class="pago-info">
          <div class="pago-concepto">${p.concepto}</div>
          <div class="pago-meta">
            <span><i class="bi bi-calendar3"></i> ${fmtDate(p.fechaPago)}</span>
            <span><i class="bi bi-credit-card"></i> ${p.metodoPago}</span>
            ${p.referencia ? `<span><i class="bi bi-hash"></i> ${p.referencia}</span>` : ""}
          </div>
        </div>
        <div>
          <div class="pago-monto">+${fmt(p.monto)}</div>
          ${folioPill}
        </div>
      </div>`;
    })
    .join("");
}

// ── Facturación ───────────────────────────────────────────────────────────────

function renderFacturacion(alumno) {
  document.getElementById("f-rfc").value = alumno.rfc ?? "";
  document.getElementById("f-razon").value = alumno.razonSocial ?? "";
  document.getElementById("f-cfdi").value = alumno.usoCFDI ?? "";
  document.getElementById("f-regimen").value = alumno.regimenFiscal ?? "";
  document.getElementById("f-domicilio").value = alumno.domicilioFiscal ?? "";
}

async function guardarFacturacion() {
  if (!alumnoData) return;
  const payload = {
    rfc: document.getElementById("f-rfc").value.trim().toUpperCase() || null,
    razonSocial: document.getElementById("f-razon").value.trim() || null,
    usoCFDI: document.getElementById("f-cfdi").value || null,
    regimenFiscal: document.getElementById("f-regimen").value.trim() || null,
    domicilioFiscal:
      document.getElementById("f-domicilio").value.trim() || null,
  };

  try {
    const updated = await updateAlumno(alumnoData._id, payload);
    alumnoData = updated;
    showAlert("Datos de facturación guardados correctamente ✔", "success");
  } catch (error) {
    showAlert("Error al guardar: " + error.message, "error");
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  // Verificar sesión
  if (!appState.token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const me = await getMe();

    // Si no es alumno, redirigir al panel admin
    if (me.rol !== "alumno" || !me.alumno) {
      window.location.href = "index.html";
      return;
    }

    const alumno = me.alumno;

    // Cargar datos en paralelo
    const [semestres, pagos] = await Promise.all([
      getSemestres(alumno._id).catch(() => []),
      getAlumnoPagos(alumno._id).catch(() => []),
    ]);

    renderPerfil(alumno);
    renderSemestre(semestres);
    renderHistorial(pagos);
  } catch (error) {
    // Token expirado o inválido
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }

  // Botón logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
  });

  // Guardar facturación
  document
    .getElementById("btn-guardar-fact")
    .addEventListener("click", guardarFacturacion);
}

bootstrap();
