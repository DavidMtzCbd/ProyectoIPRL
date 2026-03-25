import {
  getAlumnos,
  createAlumno,
  getAlumnoById,
  getAlumnoPagos,
  updateAlumno,
  getSemestres,
  createSemestre,
  updateSemestre,
  getCuatrimestres,
  createCuatrimestre,
  updateCuatrimestre,
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
    container.innerHTML = `<p class="semestres-lista-vacio">Sin semestres registrados.</p>`;
    return;
  }

  container.innerHTML = semestres
    .map((s) => {
      const beca =
        s.descuentoPorcentaje > 0
          ? `<span class="semestre-badge-beca-aplicada">Beca ${s.descuentoPorcentaje}%</span>`
          : `<span class="semestre-badge-sin-beca">Sin beca</span>`;

      return `
    <div class="semestre-item">
      <div class="semestre-item-info">
        <strong class="semestre-item-titulo">Sem. ${s.numSemestre} — ${s.periodo}</strong>
        <div class="semestre-item-detalles">
          Inscripción: ${fmt(s.inscripcion)}
          · Reinscripción: ${fmt(s.reinscripcion)}
          · Colegiatura: ${fmt(s.colegiaturaMensual)}
        </div>
      </div>
      ${beca}
      <button class="btn-sm btn-primary btn-editar-semestre semestre-btn-editar"
        data-sid="${s._id}"
        data-num="${s.numSemestre}"
        data-periodo="${s.periodo}"
        data-inscripcion="${s.inscripcion ?? 0}"
        data-reinscripcion="${s.reinscripcion ?? 0}"
        data-colegiatura="${s.colegiaturaMensual ?? 0}"
        data-beca="${s.descuentoPorcentaje ?? 0}">
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
    const [alumno, pagos] = await Promise.all([
      getAlumnoById(id),
      getAlumnoPagos(id),
    ]);

    const esMaestria = alumno.ofertaAcademica && alumno.ofertaAcademica.includes("Maestría");
    let periodos = [];
    if (esMaestria) {
      periodos = await getCuatrimestres(id).catch(() => []);
    } else {
      periodos = await getSemestres(id).catch(() => []);
    }

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

    // Semestres o Cuatrimestres
    const semContainer = document.getElementById("semestres-lista");
    if (semContainer) {
      if (esMaestria) renderCuatrimestresEnDetalle(periodos);
      else renderSemestresEnDetalle(periodos);
    }

    // Botón agregar semestre o cuatrimestre
    const btnNuevoSem = document.getElementById("btn-nuevo-semestre");
    if (btnNuevoSem) {
      if (esMaestria) {
        btnNuevoSem.innerHTML = '<i class="bi bi-plus-lg"></i> Nuevo Cuatrimestre';
        btnNuevoSem.onclick = () => {
          closeModal("modal-detalle-alumno");
          abrirModalCuatrimestre(null);
        };
      } else {
        btnNuevoSem.innerHTML = '<i class="bi bi-plus-lg"></i> Nuevo Semestre';
        btnNuevoSem.onclick = () => {
          closeModal("modal-detalle-alumno");
          abrirModalSemestre(null);
        };
      }
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
  document.getElementById("semestre-preview").classList.add("semestre-preview-hidden");
  document.getElementById("semestre-preview").classList.remove("semestre-preview-visible");
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
    preview.classList.add("semestre-preview-visible");
    preview.classList.remove("semestre-preview-hidden");
  } else {
    preview.classList.add("semestre-preview-hidden");
    preview.classList.remove("semestre-preview-visible");
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

// ── Cuatrimestres (Maestrías) ─────────────────────────────────────────────────

function renderCuatrimestresEnDetalle(cuatrimestres) {
  const container = document.getElementById("semestres-lista");
  if (!container) return;

  if (!cuatrimestres.length) {
    container.innerHTML = `<p class="semestres-lista-vacio">Sin cuatrimestres registrados.</p>`;
    return;
  }

  container.innerHTML = cuatrimestres
    .map((c) => {
      const beca =
        c.descuentoPorcentaje > 0
          ? `<span class="semestre-badge-beca-aplicada">Beca ${c.descuentoPorcentaje}%</span>`
          : `<span class="semestre-badge-sin-beca">Sin beca</span>`;

      return `
    <div class="semestre-item">
      <div class="semestre-item-info">
        <strong class="semestre-item-titulo">Cuatrimestre ${c.numCuatrimestre} — ${c.periodo}</strong>
        <div class="semestre-item-detalles">
          Inscripción: ${fmt(c.inscripcion)}
          · Reinscripción: ${fmt(c.reinscripcion)}
          · Colegiatura: ${fmt(c.colegiaturaMensual)}
        </div>
      </div>
      ${beca}
      <button class="btn-sm btn-primary btn-editar-cuatrimestre semestre-btn-editar"
        data-cid="${c._id}"
        data-num="${c.numCuatrimestre}"
        data-periodo="${c.periodo}"
        data-inscripcion="${c.inscripcion ?? 0}"
        data-reinscripcion="${c.reinscripcion ?? 0}"
        data-colegiatura="${c.colegiaturaMensual ?? 0}"
        data-beca="${c.descuentoPorcentaje ?? 0}">
        <i class="bi bi-pencil-fill"></i> Editar
      </button>
    </div>`;
    })
    .join("");

  container.querySelectorAll(".btn-editar-cuatrimestre").forEach((btn) => {
    btn.addEventListener("click", () => {
      abrirModalCuatrimestre({
        _id: btn.dataset.cid,
        numCuatrimestre: Number(btn.dataset.num),
        periodo: btn.dataset.periodo,
        inscripcion: Number(btn.dataset.inscripcion),
        reinscripcion: Number(btn.dataset.reinscripcion),
        colegiaturaMensual: Number(btn.dataset.colegiatura),
        descuentoPorcentaje: Number(btn.dataset.beca),
      });
    });
  });
}

export async function abrirModalCuatrimestre(cuatrimestre = null, alumnoIdOverride = null) {
  const form = document.getElementById("form-cuatrimestre-alumno");
  const title = document.getElementById("cuatrimestre-modal-title");
  const submitBtn = document.getElementById("cuatrimestre-submit-btn");
  if (!form) return;

  form.reset();
  document.getElementById("cuatrimestre-preview").classList.add("semestre-preview-hidden");
  document.getElementById("cuatrimestre-preview").classList.remove("semestre-preview-visible");
  document.getElementById("c-recurso").checked = false;

  if (cuatrimestre) {
    title.textContent = `Editar Cuatrimestre ${cuatrimestre.numCuatrimestre} — ${cuatrimestre.periodo}`;
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar cambios';
    document.getElementById("c-id").value = cuatrimestre._id;
    document.getElementById("c-num").value = cuatrimestre.numCuatrimestre;

    const [anio, meses] = (cuatrimestre.periodo || "").split(" ");
    document.getElementById("c-anio").value = anio || "";
    document.getElementById("c-meses").value = meses || "";

    document.getElementById("c-inscripcion").value = cuatrimestre.inscripcion;
    document.getElementById("c-reinscripcion").value = cuatrimestre.reinscripcion;
    document.getElementById("c-colegiatura").value = cuatrimestre.colegiaturaMensual;
    document.getElementById("c-beca").value = cuatrimestre.descuentoPorcentaje;
    actualizarPreviewBecaCuatrimestre();
  } else {
    title.textContent = "Registrar nuevo cuatrimestre";
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar cuatrimestre';
    document.getElementById("c-id").value = "";
    document.getElementById("c-anio").value = new Date().getFullYear();
    
    const alumnoId = alumnoIdOverride || alumnoDetalleId;
    if (alumnoId) {
        try {
            const cuatrimestres = await getCuatrimestres(alumnoId);
            if (cuatrimestres && cuatrimestres.length > 0) {
                const cBase = cuatrimestres.sort((a,b) => a.numCuatrimestre - b.numCuatrimestre)[0];
                document.getElementById("c-inscripcion").value = cBase.inscripcion ?? 0;
                document.getElementById("c-reinscripcion").value = cBase.reinscripcion ?? 0;
                document.getElementById("c-colegiatura").value = cBase.colegiaturaMensual ?? 0;
                document.getElementById("c-beca").value = cBase.descuentoPorcentaje ?? 0;
                actualizarPreviewBecaCuatrimestre();
                
                const ultimoC = cuatrimestres.sort((a,b) => b.numCuatrimestre - a.numCuatrimestre)[0];
                document.getElementById("c-num").value = ultimoC.numCuatrimestre + 1;
                
                if (ultimoC.periodo) {
                    const [anioStr, mesesStr] = ultimoC.periodo.split(" ");
                    let anio = parseInt(anioStr) || new Date().getFullYear();
                    
                    if (mesesStr === "Enero-Abril") {
                        document.getElementById("c-anio").value = anio;
                        document.getElementById("c-meses").value = "Mayo-Agosto";
                    } else if (mesesStr === "Mayo-Agosto") {
                        document.getElementById("c-anio").value = anio;
                        document.getElementById("c-meses").value = "Septiembre-Diciembre";
                    } else if (mesesStr === "Septiembre-Diciembre") {
                        document.getElementById("c-anio").value = anio + 1;
                        document.getElementById("c-meses").value = "Enero-Abril";
                    }
                }
            }
        } catch (e) {
            console.error("No se pudieron cargar los cuatrimestres base", e);
        }
    }
  }

  document.getElementById("c-alumno-id").value = alumnoIdOverride || alumnoDetalleId;
  openModal("modal-cuatrimestre-alumno");
}

function actualizarPreviewBecaCuatrimestre() {
  const insc = Number(document.getElementById("c-inscripcion").value) || 0;
  const reinsc = Number(document.getElementById("c-reinscripcion").value) || 0;
  const cole = Number(document.getElementById("c-colegiatura").value) || 0;
  const beca = Number(document.getElementById("c-beca").value) || 0;
  const preview = document.getElementById("cuatrimestre-preview");

  if (beca > 0 && (insc || reinsc || cole)) {
    const mul = 1 - beca / 100;
    document.getElementById("prev-c-insc").textContent = fmt(insc * mul);
    document.getElementById("prev-c-reinsc").textContent = fmt(reinsc * mul);
    document.getElementById("prev-c-cole").textContent = fmt(cole * mul);
    preview.classList.add("semestre-preview-visible");
    preview.classList.remove("semestre-preview-hidden");
  } else {
    preview.classList.add("semestre-preview-hidden");
    preview.classList.remove("semestre-preview-visible");
  }
}

function initCuatrimestre() {
  ["c-inscripcion", "c-reinscripcion", "c-colegiatura", "c-beca"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", actualizarPreviewBecaCuatrimestre);
    },
  );

  document
    .getElementById("form-cuatrimestre-alumno")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const cId = document.getElementById("c-id").value;
      const alumnoID = document.getElementById("c-alumno-id").value;
      const numCuatrimestre = Number(document.getElementById("c-num").value);
      const esRecurso = document.getElementById("c-recurso").checked;

      const anio = document.getElementById("c-anio").value.trim();
      const meses = document.getElementById("c-meses").value;
      if (!anio || !meses) {
        showAlert("Indica el año y el periodo de meses.", "error");
        return;
      }
      const periodo = `${anio} ${meses}`;

      if (!cId && !esRecurso) {
        const cuatrimestresExistentes = await getCuatrimestres(alumnoID).catch(
          () => [],
        );
        const duplicado = cuatrimestresExistentes.some(
          (c) => c.numCuatrimestre === numCuatrimestre,
        );
        if (duplicado) {
          showAlert(
            `El Cuatrimestre ${numCuatrimestre} ya está registrado. Si es repetidor, activa la casilla 'Es repetidor'.`,
            "error",
          );
          return;
        }
      }

      const data = {
        alumnoID,
        numCuatrimestre,
        periodo,
        inscripcion: Number(document.getElementById("c-inscripcion").value),
        reinscripcion: Number(document.getElementById("c-reinscripcion").value),
        colegiaturaMensual: Number(document.getElementById("c-colegiatura").value),
        descuentoPorcentaje: Number(document.getElementById("c-beca").value),
      };

      try {
        if (cId) {
          await updateCuatrimestre(cId, data);
          showAlert("Cuatrimestre actualizado correctamente ✔", "success");
        } else {
          await createCuatrimestre(data);
          showAlert("Cuatrimestre registrado correctamente ✔", "success");
        }
        closeModal("modal-cuatrimestre-alumno");
        const cuatrimestres = await getCuatrimestres(alumnoID);
        renderCuatrimestresEnDetalle(cuatrimestres);

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
        ofertaAcademica: document.getElementById("a-oferta").value.trim()
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
    "components/modals/alumnos/modal-cuatrimestre-alumno.html",
  ]);
  bindCloseButtons();
  initAgregarAlumno();
  initEditarAlumno();
  initSemestre();
  initCuatrimestre();
  await cargarAlumnos();
  initFiltros();
}
