import {
  getAlumnos,
  createAlumno,
  getAlumnoById,
  getAlumnoPagos,
  updateAlumno,
  getSemestres,
  createSemestre,
  updateSemestre,
} from "../../../Shared/js/api.js";

import {
  fillTable,
  showAlert,
  formatDate,
  formatMoney,
  Paginator,
  loadModals,
} from "../../../Shared/js/ui.js";

import { appState } from "../../../Shared/js/state.js";

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
      <td class="col-hide-mobile">${a.matricula}</td>
      <td class="col-hide-mobile">${a.correo}</td>
      <td class="col-hide-tablet">${a.ofertaAcademica}</td>
      <td>${badgeEstatus(a.estatus)}</td>
      <td class="acciones-td">
        <button class="btn-sm btn-action btn-ver-alumno" data-id="${a._id}">
          <i class="bi bi-eye-fill"></i> <span class="col-hide-mobile">Ver</span>
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
function fmt(v) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(v ?? 0));
}

// ── Detalle de alumno ─────────────────────────────────────────────────────────

let alumnoDetalleId = null;

function renderSemestresEnDetalle(semestres) {
  const container = document.getElementById("semestres-lista");
  if (!container) return;

  if (!semestres.length) {
    container.innerHTML = `<p style="color:var(--muted);font-style:italic;font-size:.85rem;">Sin semestres registrados.</p>`;
    return;
  }

  container.innerHTML = semestres
    .map((s) => {
      const beca =
        s.descuentoPorcentaje > 0
          ? `<span style="background:#fef9c3;color:#854d0e;border:1px solid #fde68a;border-radius:99px;padding:1px 8px;font-size:.75rem;font-weight:700;">Beca ${s.descuentoPorcentaje}%</span>`
          : `<span style="color:#94a3b8;font-size:.78rem;">Sin beca</span>`;

      return `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="flex:1;">
        <strong style="font-size:.88rem;">Sem. ${s.numSemestre} — ${s.periodo}</strong>
        <div style="font-size:.78rem;color:var(--muted);margin-top:2px;">
          Inscripción: ${fmt(s.inscripcion)}
          · Reinscripción: ${fmt(s.reinscripcion)}
          · Colegiatura: ${fmt(s.colegiaturaMensual)}
        </div>
      </div>
      ${beca}
      <button class="btn-sm btn-primary btn-editar-semestre"
        data-sid="${s._id}"
        data-num="${s.numSemestre}"
        data-periodo="${s.periodo}"
        data-inscripcion="${s.inscripcion ?? 0}"
        data-reinscripcion="${s.reinscripcion ?? 0}"
        data-colegiatura="${s.colegiaturaMensual ?? 0}"
        data-beca="${s.descuentoPorcentaje ?? 0}"
        style="white-space:nowrap;">
        <i class="bi bi-pencil-fill"></i> Editar
      </button>
    </div>`;
    })
    .join("");

  container.querySelectorAll(".btn-editar-semestre").forEach((btn) => {
    btn.addEventListener("click", () => {
      abrirModalSemestre({
        _id: btn.dataset.sid,
        numSemestre: Number(btn.dataset.num),
        periodo: btn.dataset.periodo,
        inscripcion: Number(btn.dataset.inscripcion),
        reinscripcion: Number(btn.dataset.reinscripcion),
        colegiaturaMensual: Number(btn.dataset.colegiatura),
        descuentoPorcentaje: Number(btn.dataset.beca),
      });
    });
  });
}

const paginadorPagosAlumno = new Paginator({
  controlsId: "alumno-pagos-pagination",
  rowOptions: [5, 10, 15],
  renderPage: (pagosSlice) => {
    const rowsPagos = pagosSlice.length
      ? pagosSlice
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
  }
});

async function abrirDetalleAlumno(id) {
  alumnoDetalleId = id;
  try {
    const [alumno, pagos, semestres] = await Promise.all([
      getAlumnoById(id),
      getAlumnoPagos(id),
      getSemestres(id).catch(() => []),
    ]);

    // Rellena campos del modal (estructura estática en HTML, datos en JS)
    const set = (elId, valor) => {
      const el = document.getElementById(elId);
      if (el) el.textContent = valor ?? "—";
    };

    set(
      "da-nombre",
      `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`,
    );
    set("da-matricula", alumno.matricula);
    set("da-correo", alumno.correo);
    set("da-oferta", alumno.ofertaAcademica);
    set("da-saldo", formatMoney(alumno.saldoActual));

    // Estatus requiere HTML (badge con clase)
    const daEstatus = document.getElementById("da-estatus");
    if (daEstatus) daEstatus.innerHTML = badgeEstatus(alumno.estatus);

    // Semestres
    const semContainer = document.getElementById("semestres-lista");
    if (semContainer) renderSemestresEnDetalle(semestres);

    // Botón agregar semestre
    const btnNuevoSem = document.getElementById("btn-nuevo-semestre");
    if (btnNuevoSem) {
      btnNuevoSem.onclick = () => {
        closeModal("modal-detalle-alumno");
        abrirModalSemestre(null);
      };
    }

    // Historial de pagos
    paginadorPagosAlumno.setData(pagos);

    openModal("modal-detalle-alumno");

    // Botón Ver Estado de Cuenta
    const btnEC = document.getElementById("btn-estado-cuenta");
    if (btnEC) {
      btnEC.onclick = () => {
        appState.alumnoActivo = id;
        closeModal("modal-detalle-alumno");
        // Disparar la navegación al Estado de Cuenta
        document
          .querySelector(".nav-btn[data-view='estadoCuenta']")
          ?.dispatchEvent(new MouseEvent("click"));
        // Fallback: el evento loadView también se dispara via el import en main.js
        document.dispatchEvent(
          new CustomEvent("navigate", { detail: "estadoCuenta" }),
        );
      };
    }
  } catch (error) {
    showAlert("Error al cargar detalle: " + error.message, "error");
  }
}

// ── Modal de semestre ─────────────────────────────────────────────────────────

export async function abrirModalSemestre(semestre = null, alumnoIdOverride = null) {
  const form = document.getElementById("form-semestre-alumno");
  const title = document.getElementById("semestre-modal-title");
  const submitBtn = document.getElementById("semestre-submit-btn");
  if (!form) return;

  form.reset();
  document.getElementById("semestre-preview").style.display = "none";
  document.getElementById("s-recurso").checked = false;

  if (semestre) {
    // Modo edición
    title.textContent = `Editar Semestre ${semestre.numSemestre} — ${semestre.periodo}`;
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar cambios';
    document.getElementById("s-id").value = semestre._id;
    document.getElementById("s-num").value = semestre.numSemestre;

    // Parsear el periodo guardado, ej. "2026 Febrero-Julio" → año + meses
    const [anio, meses] = (semestre.periodo || "").split(" ");
    document.getElementById("s-anio").value = anio || "";
    document.getElementById("s-meses").value = meses || "";

    document.getElementById("s-inscripcion").value = semestre.inscripcion;
    document.getElementById("s-reinscripcion").value = semestre.reinscripcion;
    document.getElementById("s-colegiatura").value =
      semestre.colegiaturaMensual;
    document.getElementById("s-beca").value = semestre.descuentoPorcentaje;
    actualizarPreviewBeca();
  } else {
    // Modo creación — sugerir año actual
    title.textContent = "Registrar nuevo semestre";
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar semestre';
    document.getElementById("s-id").value = "";
    document.getElementById("s-anio").value = new Date().getFullYear();
    
    // Autocompletar precios del último semestre (si existe)
    const alumnoId = alumnoIdOverride || alumnoDetalleId;
    if (alumnoId) {
        try {
            const semestres = await getSemestres(alumnoId);
            if (semestres && semestres.length > 0) {
                // Tomamos el último semestre o el semestre 1 para las colegiaturas base
                const semBase = semestres.sort((a,b) => a.numSemestre - b.numSemestre)[0];
                document.getElementById("s-inscripcion").value = semBase.inscripcion ?? 0;
                document.getElementById("s-reinscripcion").value = semBase.reinscripcion ?? 0;
                document.getElementById("s-colegiatura").value = semBase.colegiaturaMensual ?? 0;
                document.getElementById("s-beca").value = semBase.descuentoPorcentaje ?? 0;
                actualizarPreviewBeca();
                
                // Sugerir también el siguiente número de semestre y periodo
                const ultimoSem = semestres.sort((a,b) => b.numSemestre - a.numSemestre)[0];
                document.getElementById("s-num").value = ultimoSem.numSemestre + 1;
                
                // Intentar inferir el siguiente periodo basado en el último registrado
                if (ultimoSem.periodo) {
                    const [anioStr, mesesStr] = ultimoSem.periodo.split(" ");
                    let anio = parseInt(anioStr) || new Date().getFullYear();
                    
                    if (mesesStr === "Febrero-Julio" || mesesStr === "Marzo-Agosto") {
                        // El siguiente semestre cae en el mismo año, en la segunda mitad
                        document.getElementById("s-anio").value = anio;
                        document.getElementById("s-meses").value = mesesStr === "Febrero-Julio" ? "Agosto-Enero" : "Septiembre-Febrero"; // aproximación basada en ciclos de 6 meses
                    } else if (mesesStr === "Agosto-Enero" || mesesStr === "Septiembre-Febrero") {
                        // El siguiente semestre cae en el año siguiente, en la primera mitad
                        document.getElementById("s-anio").value = anio + 1;
                        document.getElementById("s-meses").value = mesesStr === "Agosto-Enero" ? "Febrero-Julio" : "Marzo-Agosto";
                    }
                }
            }
        } catch (e) {
            console.error("No se pudieron cargar los semestres base", e);
        }
    }
  }

  document.getElementById("s-alumno-id").value =
    alumnoIdOverride || alumnoDetalleId;
  openModal("modal-semestre-alumno");
}

function actualizarPreviewBeca() {
  const insc = Number(document.getElementById("s-inscripcion").value) || 0;
  const reinsc = Number(document.getElementById("s-reinscripcion").value) || 0;
  const cole = Number(document.getElementById("s-colegiatura").value) || 0;
  const beca = Number(document.getElementById("s-beca").value) || 0;
  const preview = document.getElementById("semestre-preview");

  if (beca > 0 && (insc || reinsc || cole)) {
    const mul = 1 - beca / 100;
    document.getElementById("prev-insc").textContent = fmt(insc * mul);
    document.getElementById("prev-reinsc").textContent = fmt(reinsc * mul);
    document.getElementById("prev-cole").textContent = fmt(cole * mul);
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
}

function initSemestre() {
  // Preview dinámico al cambiar valores
  ["s-inscripcion", "s-reinscripcion", "s-colegiatura", "s-beca"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", actualizarPreviewBeca);
    },
  );

  // Submit del formulario
  document
    .getElementById("form-semestre-alumno")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const sId = document.getElementById("s-id").value;
      const alumnoID = document.getElementById("s-alumno-id").value;
      const numSemestre = Number(document.getElementById("s-num").value);
      const esRecurso = document.getElementById("s-recurso").checked;

      // Construir el campo periodo a partir de año + selección de meses
      const anio = document.getElementById("s-anio").value.trim();
      const meses = document.getElementById("s-meses").value;
      if (!anio || !meses) {
        showAlert("Indica el año y el periodo de meses.", "error");
        return;
      }
      const periodo = `${anio} ${meses}`;

      // Validar que el número de semestre no se repita (salvo si es recurso)
      if (!sId && !esRecurso) {
        const semestresExistentes = await getSemestres(alumnoID).catch(
          () => [],
        );
        const duplicado = semestresExistentes.some(
          (s) => s.numSemestre === numSemestre,
        );
        if (duplicado) {
          showAlert(
            `El Semestre ${numSemestre} ya está registrado. Si es repetidor, activa la casilla 'Es repetidor'.`,
            "error",
          );
          return;
        }
      }

      const data = {
        alumnoID,
        numSemestre,
        periodo,
        inscripcion: Number(document.getElementById("s-inscripcion").value),
        reinscripcion: Number(document.getElementById("s-reinscripcion").value),
        colegiaturaMensual: Number(
          document.getElementById("s-colegiatura").value,
        ),
        descuentoPorcentaje: Number(document.getElementById("s-beca").value),
      };

      try {
        if (sId) {
          await updateSemestre(sId, data);
          showAlert("Semestre actualizado correctamente ✔", "success");
        } else {
          await createSemestre(data);
          showAlert("Semestre registrado correctamente ✔", "success");
        }
        closeModal("modal-semestre-alumno");
        // Refrescar la sección de semestres en el detalle abierto
        const semestres = await getSemestres(alumnoID);
        renderSemestresEnDetalle(semestres);

        // Avisar a toda la app que un semestre cambió
        document.dispatchEvent(
          new CustomEvent("semestreActualizado", { detail: alumnoID }),
        );
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
}

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
      const gmail = document.getElementById("a-correo").value.trim();
      const alumnoData = {
        googleEmail: gmail, // el backend usará esto para el correo y el Usuario
        nombre: document.getElementById("a-nombre").value.trim(),
        apellidoPaterno: document.getElementById("a-ap").value.trim(),
        apellidoMaterno: document.getElementById("a-am").value.trim(),
        matricula: Number(document.getElementById("a-matricula").value),
        ofertaAcademica: document.getElementById("a-oferta").value.trim(),
        estatus: document.getElementById("a-estatus").value,
      };

      try {
        await createAlumno(alumnoData);
        closeModal("modal-agregar-alumno");
        showAlert(`Alumno registrado ✔ — Gmail vinculado: ${gmail}`, "success");
        await cargarAlumnos();
        initFiltros();
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initAlumnos() {
  await loadModals([
    "components/modals/alumnos/modal-agregar-alumno.html",
    "components/modals/alumnos/modal-editar-alumno.html",
    "components/modals/alumnos/modal-detalle-alumno.html",
    "components/modals/alumnos/modal-semestre-alumno.html",
  ]);
  bindCloseButtons();
  initAgregarAlumno();
  initEditarAlumno();
  initSemestre();
  await cargarAlumnos();
  initFiltros();
}
