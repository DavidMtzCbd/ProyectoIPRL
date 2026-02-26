import {
  getAllPagos,
  getPagosPorAlumno,
  getPagoById,
  createPago,
  getAlumnoByMatricula,
} from "../api.js";

import { formatMoney, formatDate, fillTable, showAlert } from "../ui.js";

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
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  });
}

// ── Tabla de pagos ─────────────────────────────────────────────────────────────

let todosPagos = [];

async function cargarTodosPagos() {
  try {
    todosPagos = await getAllPagos();
    renderTablaPagos(todosPagos);
  } catch (error) {
    showAlert("Error al cargar pagos: " + error.message, "error");
  }
}

function renderTablaPagos(pagos) {
  const rows = pagos
    .map(
      (p) => `
    <tr>
      <td>${formatDate(p.fechaPago)}</td>
      <td>${p.alumnoID?.matricula ?? "-"}</td>
      <td>${p.alumnoID ? `${p.alumnoID.apellidoPaterno} ${p.alumnoID.apellidoMaterno} ${p.alumnoID.nombre}` : "-"}</td>
      <td>${p.concepto}</td>
      <td>${formatMoney(p.monto)}</td>
      <td>${p.metodoPago}</td>
      <td>${p.referencia ?? "-"}</td>
      <td>${p.factura === "Sí" || p.factura === true ? "<span class='badge-active'>Sí</span>" : "<span class='badge-inactive'>No</span>"}</td>
      <td>
        <button class="btn-sm btn-action btn-ver-pago" data-id="${p._id}">
          <i class="bi bi-eye-fill"></i> Ver detalle
        </button>
      </td>
    </tr>
  `,
    )
    .join("");
  fillTable("pagos-table", rows);

  document.querySelectorAll(".btn-ver-pago").forEach((btn) => {
    btn.addEventListener("click", () => abrirDetallePago(btn.dataset.id));
  });
}

// ── Buscador por matrícula ────────────────────────────────────────────────────

function initBuscador() {
  const form = document.getElementById("pagos-filter-form");
  const btnLimpiar = document.getElementById("btn-limpiar-filtro");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const matricula = document.getElementById("alumno-id").value.trim();
    if (!matricula) return;
    try {
      const pagos = await getPagosPorAlumno(matricula);
      if (!pagos.length) {
        showAlert("No se encontraron pagos para esa matrícula.", "error");
        return;
      }
      // Los pagos ya vienen con populate del alumno
      const rows = pagos
        .map(
          (p) => `
        <tr>
          <td>${formatDate(p.fechaPago)}</td>
          <td>${p.alumnoID?.matricula ?? matricula}</td>
          <td>${p.alumnoID ? `${p.alumnoID.apellidoPaterno} ${p.alumnoID.apellidoMaterno} ${p.alumnoID.nombre}` : "-"}</td>
          <td>${p.concepto}</td>
          <td>${formatMoney(p.monto)}</td>
          <td>${p.metodoPago}</td>
          <td>${p.referencia ?? "-"}</td>
          <td>${p.factura === "Sí" || p.factura === true ? "<span class='badge-active'>Sí</span>" : "<span class='badge-inactive'>No</span>"}</td>
          <td>
            <button class="btn-sm btn-action btn-ver-pago" data-id="${p._id}">
              <i class="bi bi-eye-fill"></i> Ver detalle
            </button>
          </td>
        </tr>`,
        )
        .join("");

      fillTable("pagos-table", rows);
      document.querySelectorAll(".btn-ver-pago").forEach((btn) => {
        btn.addEventListener("click", () => abrirDetallePago(btn.dataset.id));
      });
    } catch (error) {
      showAlert(error.message, "error");
    }
  });

  btnLimpiar.addEventListener("click", () => {
    document.getElementById("alumno-id").value = "";
    renderTablaPagos(todosPagos);
  });
}

// ── Detalle de pago ───────────────────────────────────────────────────────────

async function abrirDetallePago(id) {
  try {
    const pago = await getPagoById(id);
    const alumno = pago.alumnoID;
    const nombreAlumno = alumno
      ? `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`
      : "—";

    const grid = document.getElementById("pago-info-grid");
    grid.innerHTML = `
      <div class="detail-item"><span>Fecha de pago</span><span>${formatDate(pago.fechaPago)}</span></div>
      <div class="detail-item"><span>Monto</span><span>${formatMoney(pago.monto)}</span></div>
      <div class="detail-item"><span>Concepto</span><span>${pago.concepto}</span></div>
      <div class="detail-item"><span>Método de pago</span><span>${pago.metodoPago}</span></div>
      <div class="detail-item"><span>Alumno</span><span>${nombreAlumno}</span></div>
      <div class="detail-item"><span>Matrícula</span><span>${alumno?.matricula ?? "—"}</span></div>
      <div class="detail-item"><span>Referencia</span><span>${pago.referencia ?? "—"}</span></div>
      <div class="detail-item"><span>Factura</span><span>${pago.factura ?? "Sin factura"}</span></div>
    `;
    openModal("modal-detalle-pago");
  } catch (error) {
    showAlert("Error al cargar el pago: " + error.message, "error");
  }
}

// ── Registrar pago ────────────────────────────────────────────────────────────

function initRegistrarPago() {
  document
    .getElementById("btn-registrar-pago")
    .addEventListener("click", () => {
      document.getElementById("form-registrar-pago").reset();
      document.getElementById("alumno-preview").innerHTML = "";
      // Fecha de hoy por defecto
      document.getElementById("p-fecha").value = new Date()
        .toISOString()
        .slice(0, 10);
      // Prefijo R. en referencia
      document.getElementById("p-referencia").value = "R.";
      // Factura en No por defecto
      document.getElementById("p-factura").value = "No";
      openModal("modal-registrar-pago");
    });

  // Preview de alumno con debounce
  let debounceTimer = null;
  const inputMatricula = document.getElementById("p-matricula");
  const previewEl = document.getElementById("alumno-preview");

  inputMatricula.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const val = inputMatricula.value.trim();

    if (!val) {
      previewEl.innerHTML = "";
      return;
    }

    previewEl.innerHTML = `<span class="alumno-preview--loading"><i class="bi bi-hourglass-split"></i> Buscando...</span>`;

    debounceTimer = setTimeout(async () => {
      try {
        const alumno = await getAlumnoByMatricula(val);
        previewEl.innerHTML = `
          <span class="alumno-preview--found">
            <i class="bi bi-person-check-fill"></i>
            ${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}
          </span>`;
      } catch {
        previewEl.innerHTML = `
          <span class="alumno-preview--not-found">
            <i class="bi bi-person-x-fill"></i>
            Alumno no encontrado con esa matrícula
          </span>`;
      }
    }, 500);
  });

  document
    .getElementById("form-registrar-pago")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const matriculaBuscar = document
        .getElementById("p-matricula")
        .value.trim();

      try {
        // Buscar el alumno por matrícula para obtener su _id
        const alumno = await getAlumnoByMatricula(matriculaBuscar);

        const data = {
          alumnoID: alumno._id,
          fechaPago: document.getElementById("p-fecha").value,
          monto: Number(document.getElementById("p-monto").value),
          metodoPago: document.getElementById("p-metodo").value,
          concepto: document.getElementById("p-concepto").value,
          referencia:
            document.getElementById("p-referencia").value.trim() || undefined,
          factura: document.getElementById("p-factura").value,
        };

        await createPago(data);
        closeModal("modal-registrar-pago");
        showAlert("Pago registrado correctamente ✔", "success");
        await cargarTodosPagos();
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initPagos() {
  bindCloseButtons();
  initBuscador();
  initRegistrarPago();
  await cargarTodosPagos();
}
