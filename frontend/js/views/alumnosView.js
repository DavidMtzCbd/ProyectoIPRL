import {
  getAlumnos,
  createAlumno,
  getAlumnoById,
  getAlumnoPagos,
  updateAlumno,
} from "../api.js";

import {
  fillTable,
  showAlert,
  formatDate,
  formatMoney,
  Paginator,
} from "../ui.js";

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

// Paginador de la tabla de alumnos
const paginadorAlumnos = new Paginator({
  controlsId: "alumnos-pagination",
  renderPage: renderTablaAlumnos,
});

async function cargarAlumnos() {
  try {
    const data = await getAlumnos();
    // Ordenar alfabéticamente: apellido paterno → materno → nombre
    todosLosAlumnos = data.sort((a, b) => {
      const nombreA = `${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombre}`;
      const nombreB = `${b.apellidoPaterno} ${b.apellidoMaterno} ${b.nombre}`;
      return nombreA.localeCompare(nombreB, "es", { sensitivity: "base" });
    });
    paginadorAlumnos.setData(todosLosAlumnos);
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
      <td>${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombre}</td>
      <td>${a.matricula}</td>
      <td>${a.correo}</td>
      <td>${a.ofertaAcademica}</td>
      <td>${badgeEstatus(a.estatus)}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sm btn-action btn-ver-alumno" data-id="${a._id}">
          <i class="bi bi-eye-fill"></i> Ver
        </button>
        <button class="btn-sm btn-primary btn-editar-alumno" data-id="${a._id}"
          data-estatus="${a.estatus}" data-saldo="${a.saldoActual}"
          data-nombre="${a.apellidoPaterno} ${a.apellidoMaterno} ${a.nombre}">
          <i class="bi bi-pencil-fill"></i> Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
  fillTable("alumnos-table", rows);

  document.querySelectorAll(".btn-ver-alumno").forEach((btn) => {
    btn.addEventListener("click", () => abrirDetalleAlumno(btn.dataset.id));
  });
  document.querySelectorAll(".btn-editar-alumno").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("edit-alumno-nombre").textContent =
        btn.dataset.nombre;
      document.getElementById("edit-estatus").value = btn.dataset.estatus;
      document.getElementById("edit-saldo").value = btn.dataset.saldo ?? 0;
      document
        .getElementById("form-editar-alumno")
        .setAttribute("data-id", btn.dataset.id);
      openModal("modal-editar-alumno");
    });
  });
}

// ── Editar alumno ─────────────────────────────────────────────────────────────

function initEditarAlumno() {
  document
    .getElementById("form-editar-alumno")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = e.target.getAttribute("data-id");
      const data = {
        estatus: document.getElementById("edit-estatus").value,
        saldoActual: Number(document.getElementById("edit-saldo").value),
      };
      try {
        await updateAlumno(id, data);
        closeModal("modal-editar-alumno");
        showAlert("Alumno actualizado correctamente ✔", "success");
        await cargarAlumnos();
        initFiltros();
      } catch (error) {
        showAlert("Error al actualizar: " + error.message, "error");
      }
    });
}

// ── Filtros de la tabla ───────────────────────────────────────────────────────

function initFiltros() {
  const inputTexto = document.getElementById("filtro-alumno-texto");
  const selectEstatus = document.getElementById("filtro-alumno-estatus");
  const btnLimpiar = document.getElementById("btn-limpiar-filtros-alumno");

  function aplicarFiltros() {
    const texto = inputTexto.value.toLowerCase().trim();
    const estatus = selectEstatus.value;

    const filtrados = todosLosAlumnos.filter((a) => {
      const nombreCompleto =
        `${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno}`.toLowerCase();
      const coincideTexto =
        !texto ||
        nombreCompleto.includes(texto) ||
        String(a.matricula).includes(texto) ||
        a.ofertaAcademica.toLowerCase().includes(texto);

      const coincideEstatus = !estatus || a.estatus === estatus;

      return coincideTexto && coincideEstatus;
    });

    paginadorAlumnos.setData(filtrados);
  }

  inputTexto.addEventListener("input", aplicarFiltros);
  selectEstatus.addEventListener("change", aplicarFiltros);

  btnLimpiar.addEventListener("click", () => {
    inputTexto.value = "";
    selectEstatus.value = "";
    paginadorAlumnos.setData(todosLosAlumnos);
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
  initEditarAlumno();
  await cargarAlumnos();
  initFiltros();
}
