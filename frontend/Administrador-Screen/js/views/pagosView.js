import {
  getAllPagos,
  getPagoById,
  createPago,
  getAlumnoByMatricula,
  getAlumnos,
  getSemestres,
} from "../../../Shared/js/api.js";

import {
  formatMoney,
  formatDate,
  fillTable,
  showAlert,
  Paginator,
  loadModals,
} from "../../../Shared/js/ui.js";

import { appState } from "../../../Shared/js/state.js";

// Helpers de modal

//Función para abrir el modal
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

//Función para cerrar el modal
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

//Función para cerrar el modal al dar click fuera de él y al presionar la tecla escape
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

// ── Generadores de códigos únicos ──────────────────────────────────────────────

/** Genera la siguiente referencia secuencial: R-0001, R-0002 … R-9999, R-10000 … */
function generarReferencia(pagosExistentes = []) {
  // Extrae el número de cada referencia con formato R-XXXX
  const numeros = pagosExistentes
    .map((p) => {
      const match = /^R-(\d+)$/.exec(p.referencia ?? "");
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));

  const siguiente = numeros.length > 0 ? Math.max(...numeros) + 1 : 1;

  // Mínimo 4 dígitos con relleno de ceros; si supera 9999 usa los dígitos necesarios
  const minDigits = 4;
  const padded = String(siguiente).padStart(minDigits, "0");
  return `R-${padded}`;
}

/** Genera un folio de factura tipo FAC-YYYYMM-XXXXX */
function generarFolioFactura(pagosExistentes = []) {
  const hoy = new Date();
  const mes = hoy.toISOString().slice(0, 7).replace(/-/g, "");
  const folioSet = new Set(
    pagosExistentes.map((p) => p.folioFactura).filter(Boolean),
  );
  let folio;
  do {
    const rand = Math.floor(10000 + Math.random() * 90000);
    folio = `FAC-${mes}-${rand}`;
  } while (folioSet.has(folio));
  return folio;
}

//  Tabla de pagos

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
      <td class="col-hide-mobile">${p.folioFactura ? `<span class="badge-folio">${p.folioFactura}</span>` : "<span class='text-muted'>—</span>"}</td>
      <td>${formatDate(p.fechaPago)}</td>
      <td class="col-hide-mobile">${p.alumnoID?.matricula ?? "-"}</td>
      <td>${p.alumnoID ? `${p.alumnoID.apellidoPaterno} ${p.alumnoID.apellidoMaterno} ${p.alumnoID.nombre}` : "-"}</td>
      <td class="col-hide-tablet">${p.concepto}</td>
      <td>${formatMoney(p.monto)}</td>
      <td class="col-hide-mobile">${p.metodoPago}</td>
      <td class="col-hide-mobile">${p.referencia ?? "-"}</td>
      <td class="col-hide-mobile">${p.factura === "Sí" || p.factura === true ? "<span class='badge-active'>Sí</span>" : "<span class='badge-inactive'>No</span>"}</td>
      <td>
        <button class="btn-sm btn-action btn-ver-pago" data-id="${p._id}">
          <i class="bi bi-eye-fill"></i> <span class="col-hide-mobile">Ver detalle</span><span class="col-show-mobile"><i class="bi bi-eye"></i></span>
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

// **** Buscador por nombre o matrícula ****

//Con esta función se quitan los caracteres especiales y convierte en minuscula
function normalizar(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

//Función para
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

    // Rellena cada campo del HTML del modal
    const set = (elId, valor) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = valor ?? "—";
    };

    set("dp-movimiento", pago.movimiento ? `#${pago.movimiento}` : null);
    set("dp-folio", pago.folioFactura ?? "Sin folio");
    set("dp-fecha", formatDate(pago.fechaPago));
    set("dp-monto", formatMoney(pago.monto));
    set("dp-concepto", pago.concepto);
    set("dp-metodo", pago.metodoPago);
    set(
      "dp-alumno",
      alumno
        ? `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`
        : null,
    );
    set("dp-matricula", alumno?.matricula ?? null);
    set("dp-referencia", pago.referencia ?? null);
    set("dp-factura", pago.factura ?? "Sin factura");

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
    // Generar referencia única automáticamente
    document.getElementById("p-referencia").value =
      generarReferencia(todosPagos);
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

  // ── Mostrar preview enriquecido ──────────────────────────────────────────────
  async function mostrarPreviewAlumno(alumno) {
    // Auto-factura: si el alumno tiene RFC registrado → Sí
    const tieneRFC = alumno.rfc && alumno.rfc.trim() !== "";
    document.getElementById("p-factura").value = tieneRFC ? "Sí" : "No";

    const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`;
    let semHTML = "";

    try {
      const semestres = await getSemestres(alumno._id);
      if (semestres && semestres.length > 0) {
        const sem = semestres.sort((a, b) => b.numSemestre - a.numSemestre)[0];
        const beca = sem.descuentoPorcentaje ?? 0;
        const mul = 1 - beca / 100;
        const fmt = (v) =>
          new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
          }).format(v);

        semHTML = `
          <div class="alumno-preview-prices">
            <span>Inscripción: <strong class="alumno-preview-price-val">${fmt(sem.inscripcion * mul)}</strong></span>
            <span>Reinscripción: <strong class="alumno-preview-price-val">${fmt(sem.reinscripcion * mul)}</strong></span>
            <span>Colegiatura: <strong class="alumno-preview-price-val">${fmt(sem.colegiaturaMensual * mul)} / mes</strong></span>
          </div>
          ${beca > 0 ? `<div class="alumno-preview-beca"><i class="bi bi-stars"></i> Beca del ${beca}% aplicada</div>` : ""}`;
      }
    } catch {
      /* sin semestres */
    }

    previewEl.innerHTML = `
      <div class="alumno-preview-card">
        <div class="alumno-preview-header">
          <strong class="alumno-preview-name"><i class="bi bi-person-check-fill"></i> ${nombreCompleto}</strong>
          ${tieneRFC ? `<span class="badge-auto-factura"><i class="bi bi-receipt"></i> Factura auto-seleccionada</span>` : ""}
        </div>
        ${semHTML}
      </div>`;
  }

  // ── Seleccionar alumno del dropdown ────────────────────────────────────────
  function seleccionarAlumno(alumno) {
    const nombreCompleto = `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`;
    inputNombre.value = nombreCompleto;
    listaSugerir.hidden = true;
    inputMatricula.value = alumno.matricula;
    mostrarPreviewAlumno(alumno);
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
        mostrarPreviewAlumno(alumno);
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

        // Folio de factura: siempre se asigna (independiente del campo "factura")
        const folioFactura = generarFolioFactura(todosPagos);

        const data = {
          alumnoID: alumno._id,
          fechaPago: document.getElementById("p-fecha").value,
          monto: Number(document.getElementById("p-monto").value),
          metodoPago: document.getElementById("p-metodo").value,
          concepto: document.getElementById("p-concepto").value,
          referencia:
            document.getElementById("p-referencia").value.trim() || undefined,
          factura: document.getElementById("p-factura").value,
          folioFactura,
        };
        await createPago(data);
        closeModal("modal-registrar-pago");
        showAlert("Pago registrado correctamente ✔", "success");

        // Redirigir al estado de cuenta del alumno registrado
        appState.alumnoActivo = alumno._id;
        document
          .querySelector(".nav-btn[data-view='estadoCuenta']")
          ?.dispatchEvent(new MouseEvent("click"));
        document.dispatchEvent(
          new CustomEvent("navigate", { detail: "estadoCuenta" }),
        );

        await cargarTodosPagos();
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initPagos() {
  await loadModals([
    "components/modals/pagos/modal-registrar-pago.html",
    "components/modals/pagos/modal-detalle-pago.html",
  ]);
  bindCloseButtons();
  initBuscador();
  initRegistrarPago();
  await cargarTodosPagos();
}
