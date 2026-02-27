import {
  getAllPagos,
  getPagoById,
  createPago,
  getAlumnoByMatricula,
  getAlumnos,
} from "../api.js";

import {
  formatMoney,
  formatDate,
  fillTable,
  showAlert,
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
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.style.display = "none";
    });
  });
}

// ── Tabla de pagos ─────────────────────────────────────────────────────────────

let todosPagos = [];

// Paginador de la tabla de pagos
const paginadorPagos = new Paginator({
  controlsId: "pagos-pagination",
  renderPage: renderTablaPagos,
});

async function cargarTodosPagos() {
  try {
    todosPagos = await getAllPagos();
    paginadorPagos.setData(todosPagos);
  } catch (error) {
    showAlert("Error al cargar pagos: " + error.message, "error");
  }
}

function renderTablaPagos(pagos) {
  const rows = pagos
    .map(
      (p) => `
    <tr>
      <td><span class="badge-movimiento">#${p.movimiento ?? "-"}</span></td>
      <td>${p.folioFactura ? `<span class="badge-folio">${p.folioFactura}</span>` : "<span class='text-muted'>—</span>"}</td>
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

// ── Buscador por nombre o matrícula ──────────────────────────────────────────

/** Quita acentos y pasa a minúsculas para comparaciones neutrales */
function normalizar(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function initBuscador() {
  const form = document.getElementById("pagos-filter-form");
  const input = document.getElementById("alumno-id");
  const btnLimpiar = document.getElementById("btn-limpiar-filtro");

  // Filtrado en tiempo real mientras escribe
  input.addEventListener("input", () => {
    const q = normalizar(input.value.trim());
    if (!q) {
      paginadorPagos.setData(todosPagos);
      return;
    }
    const filtrados = todosPagos.filter((p) => {
      const matricula = normalizar(p.alumnoID?.matricula);
      const nombre = p.alumnoID
        ? normalizar(
            `${p.alumnoID.nombre} ${p.alumnoID.apellidoPaterno} ${p.alumnoID.apellidoMaterno}`,
          )
        : "";
      return matricula.includes(q) || nombre.includes(q);
    });
    if (!filtrados.length) {
      showAlert("No se encontraron pagos para ese alumno.", "error");
    }
    paginadorPagos.setData(filtrados);
  });

  // Submit del form también aplica el filtro
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    input.dispatchEvent(new Event("input"));
  });

  // Limpiar: vacía el input y restaura todos los pagos
  btnLimpiar.addEventListener("click", () => {
    input.value = "";
    paginadorPagos.setData(todosPagos);
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
      <div class="detail-item"><span>Movimiento</span><span>${pago.movimiento ? `<span class="badge-movimiento">#${pago.movimiento}</span>` : "—"}</span></div>
      <div class="detail-item"><span>Folio Factura</span><span>${pago.folioFactura ? `<span class="badge-folio">${pago.folioFactura}</span>` : "Sin folio"}</span></div>
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
  let catalogoAlumnos = []; // caché de alumnos para autocompletar

  const btnAbrir = document.getElementById("btn-registrar-pago");
  const inputNombre = document.getElementById("p-buscar-nombre");
  const listaSugerir = document.getElementById("p-sugerencias");
  const inputMatricula = document.getElementById("p-matricula");
  const previewEl = document.getElementById("alumno-preview");

  // ── Abrir modal ─────────────────────────────────────────────────────────────
  btnAbrir.addEventListener("click", async () => {
    document.getElementById("form-registrar-pago").reset();
    previewEl.innerHTML = "";
    listaSugerir.hidden = true;
    listaSugerir.innerHTML = "";
    document.getElementById("p-fecha").value = new Date()
      .toISOString()
      .slice(0, 10);
    document.getElementById("p-referencia").value = "R.";
    document.getElementById("p-factura").value = "No";
    openModal("modal-registrar-pago");

    // Cargar catálogo si aún no está
    if (!catalogoAlumnos.length) {
      try {
        catalogoAlumnos = await getAlumnos();
      } catch {
        // Si falla, la búsqueda por nombre simplemente no mostrará resultados
      }
    }
  });

  // ── Autocomplete por nombre ─────────────────────────────────────────────────
  inputNombre.addEventListener("input", () => {
    const q = normalizar(inputNombre.value.trim());
    listaSugerir.innerHTML = "";

    if (!q || q.length < 2) {
      listaSugerir.hidden = true;
      return;
    }

    const coincidencias = catalogoAlumnos
      .filter((a) => {
        const nombreCompleto = normalizar(
          `${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno}`,
        );
        const mat = normalizar(a.matricula);
        return nombreCompleto.includes(q) || mat.includes(q);
      })
      .slice(0, 8); // máximo 8 sugerencias

    if (!coincidencias.length) {
      listaSugerir.hidden = true;
      return;
    }

    coincidencias.forEach((a) => {
      const li = document.createElement("li");
      li.className = "autocomplete-item";
      li.innerHTML = `
        <i class="bi bi-person-fill autocomplete-item-icon"></i>
        <span class="autocomplete-item-nombre">${a.nombre} ${a.apellidoPaterno} ${a.apellidoMaterno}</span>
        <span class="autocomplete-item-mat">${a.matricula}</span>`;

      li.addEventListener("mousedown", (e) => {
        // mousedown antes que blur para que no se cierre la lista
        e.preventDefault();
        seleccionarAlumno(a);
      });
      listaSugerir.appendChild(li);
    });

    listaSugerir.hidden = false;
  });

  // Cerrar sugerencias al perder el foco
  inputNombre.addEventListener("blur", () => {
    setTimeout(() => {
      listaSugerir.hidden = true;
    }, 150);
  });

  // Cerrar sugerencias con Escape
  inputNombre.addEventListener("keydown", (e) => {
    if (e.key === "Escape") listaSugerir.hidden = true;
  });

  // ── Seleccionar alumno del dropdown ────────────────────────────────────────
  function seleccionarAlumno(alumno) {
    const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`;
    inputNombre.value = nombreCompleto;
    listaSugerir.hidden = true;

    // Autocompletar matrícula y mostrar preview
    inputMatricula.value = alumno.matricula;
    previewEl.innerHTML = `
      <span class="alumno-preview--found">
        <i class="bi bi-person-check-fill"></i>
        ${nombreCompleto}
      </span>`;
  }

  // ── Preview al escribir matrícula manualmente (debounce) ───────────────────
  let debounceTimer = null;
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

  // ── Guardar pago ───────────────────────────────────────────────────────────
  document
    .getElementById("form-registrar-pago")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const matriculaBuscar = inputMatricula.value.trim();

      try {
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
