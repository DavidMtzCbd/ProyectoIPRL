import {
  getAlumnos,
  createAlumno,
  getAlumnoById,
  getAlumnoPagos,
} from "../api.js";
import { fillTable, showAlert, formatDate, formatMoney } from "../ui.js";

// ── Helpers de modal ──────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function bindCloseButtons() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
  // Cerrar al hacer clic en el overlay (fuera del modal)
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  });
}

// ── Cargar tabla de alumnos ───────────────────────────────────────────────────

let todosLosAlumnos = [];

async function cargarAlumnos() {
  try {
    todosLosAlumnos = await getAlumnos();
    renderTablaAlumnos(todosLosAlumnos);
  } catch (error) {
    showAlert("Error al cargar alumnos: " + error.message, "error");
  }
}

function badgeEstatus(estatus) {
  const clase =
    estatus === "Al corriente"
      ? "corriente"
      : estatus === "Adeudo"
        ? "adeudo"
        : "convenio";
  return `<span class="badge badge--${clase}">${estatus}</span>`;
}

function renderTablaAlumnos(alumnos) {
  const rows = alumnos
    .map(
      (a) => `
    <tr>
      <td>${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno}</td>
      <td>${a.matricula}</td>
      <td>${a.correo}</td>
      <td>${a.ofertaAcademica}</td>
      <td>${badgeEstatus(a.estatus)}</td>
      <td>
        <button class="btn-sm btn-action btn-ver-alumno" data-id="${a._id}">
          <i class="bi bi-eye-fill"></i> Ver detalle
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
  fillTable("alumnos-table", rows);

  // Vincular botones "Ver detalle"
  document.querySelectorAll(".btn-ver-alumno").forEach((btn) => {
    btn.addEventListener("click", () => abrirDetalleAlumno(btn.dataset.id));
  });
}

// ── Detalle de alumno ─────────────────────────────────────────────────────────

async function abrirDetalleAlumno(id) {
  try {
    const [alumno, pagos] = await Promise.all([
      getAlumnoById(id),
      getAlumnoPagos(id),
    ]);

    // Información del alumno
    const grid = document.getElementById("alumno-info-grid");
    grid.innerHTML = `
      <div class="detail-item"><span>Nombre completo</span><span>${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}</span></div>
      <div class="detail-item"><span>Matrícula</span><span>${alumno.matricula}</span></div>
      <div class="detail-item"><span>Correo</span><span>${alumno.correo}</span></div>
      <div class="detail-item"><span>Oferta académica</span><span>${alumno.ofertaAcademica}</span></div>
      <div class="detail-item"><span>Estatus</span><span>${badgeEstatus(alumno.estatus)}</span></div>
      <div class="detail-item"><span>Saldo actual</span><span>${formatMoney(alumno.saldoActual)}</span></div>
    `;

    // Historial de pagos
    const rowsPagos = pagos.length
      ? pagos
          .map(
            (p) => `
          <tr>
            <td>${formatDate(p.fechaPago)}</td>
            <td>${p.concepto}</td>
            <td>${formatMoney(p.monto)}</td>
            <td>${p.metodoPago}</td>
          </tr>`,
          )
          .join("")
      : "<tr><td colspan='4'>Sin pagos registrados</td></tr>";

    fillTable("alumno-pagos-tabla", rowsPagos);
    openModal("modal-detalle-alumno");
  } catch (error) {
    showAlert("Error al cargar detalle: " + error.message, "error");
  }
}

// ── Agregar alumno ────────────────────────────────────────────────────────────

function initAgregarAlumno() {
  document
    .getElementById("btn-agregar-alumno")
    .addEventListener("click", () => {
      document.getElementById("form-agregar-alumno").reset();
      openModal("modal-agregar-alumno");
    });

  document
    .getElementById("form-agregar-alumno")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        nombre: document.getElementById("a-nombre").value.trim(),
        apellidoPaterno: document.getElementById("a-ap").value.trim(),
        apellidoMaterno: document.getElementById("a-am").value.trim(),
        matricula: Number(document.getElementById("a-matricula").value),
        correo: document.getElementById("a-correo").value.trim(),
        ofertaAcademica: document.getElementById("a-oferta").value.trim(),
        estatus: document.getElementById("a-estatus").value,
      };
      try {
        await createAlumno(data);
        closeModal("modal-agregar-alumno");
        showAlert("Alumno registrado correctamente ✔", "success");
        await cargarAlumnos();
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initAlumnos() {
  bindCloseButtons();
  initAgregarAlumno();
  await cargarAlumnos();
}
