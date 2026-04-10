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
      const estatus = s.estatusSemestre ?? "En curso";
      const beca =
        s.descuentoPorcentaje > 0
          ? `<span class="semestre-badge-beca-aplicada">Beca ${s.descuentoPorcentaje}%</span>`
          : `<span class="semestre-badge-sin-beca">Sin beca</span>`;

      const estatusBadge = estatus === "Finalizado"
        ? `<span class="semestre-badge-finalizado"><i class="bi bi-lock-fill"></i> Finalizado</span>`
        : `<span class="semestre-badge-en-curso"><i class="bi bi-play-circle-fill"></i> En curso</span>`;

      const btnEditar = estatus === "Finalizado"
        ? `<button class="btn-sm btn-secondary btn-editar-semestre semestre-btn-editar"
            data-sid="${s._id}" data-num="${s.numSemestre}" data-periodo="${s.periodo}"
            data-inscripcion="${s.inscripcion ?? 0}" data-reinscripcion="${s.reinscripcion ?? 0}"
            data-colegiatura="${s.colegiaturaMensual ?? 0}" data-beca="${s.descuentoPorcentaje ?? 0}"
            data-estatus="${estatus}">
            <i class="bi bi-lock-fill"></i> Ver
          </button>`
        : `<button class="btn-sm btn-primary btn-editar-semestre semestre-btn-editar"
            data-sid="${s._id}" data-num="${s.numSemestre}" data-periodo="${s.periodo}"
            data-inscripcion="${s.inscripcion ?? 0}" data-reinscripcion="${s.reinscripcion ?? 0}"
            data-colegiatura="${s.colegiaturaMensual ?? 0}" data-beca="${s.descuentoPorcentaje ?? 0}"
            data-estatus="${estatus}">
            <i class="bi bi-pencil-fill"></i> Editar
          </button>`;

      return `
    <div class="semestre-item">
      <div class="semestre-item-info">
        <strong class="semestre-item-titulo">Sem. ${s.numSemestre} — ${s.periodo}</strong>
        <div class="semestre-item-detalles">
          Inscripción: ${fmt(s.inscripcion)} · Reinscripción: ${fmt(s.reinscripcion)} · Colegiatura: ${fmt(s.colegiaturaMensual)}
        </div>
      </div>
      ${estatusBadge} ${beca} ${btnEditar}
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
        estatusSemestre: btn.dataset.estatus ?? "En curso",
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

  // Helper: visibilidad del campo inscripción (solo Sem 1)
  function gestionarInscripcion(numSem) {
    const grp = document.getElementById("s-inscripcion-group");
    const inp = document.getElementById("s-inscripcion");
    if (!grp || !inp) return;
    if (numSem <= 1) { grp.style.display = ""; inp.required = true; }
    else { grp.style.display = "none"; inp.required = false; inp.value = ""; }
  }

  // Helper: bloquear/desbloquear campos
  const CAMPOS = ["s-num","s-anio","s-meses","s-inscripcion","s-reinscripcion","s-colegiatura","s-beca","s-recurso"];
  function setDisabled(disabled, except = []) {
    CAMPOS.forEach(id => { if (!except.includes(id)) { const el = document.getElementById(id); if (el) el.disabled = disabled; } });
  }

  const estatusGroup = document.getElementById("s-estatus-group");
  const notice = document.getElementById("s-finalizado-notice");

  if (semestre) {
    // Modo edición
    const estatus = semestre.estatusSemestre ?? "En curso";
    title.textContent = `Editar Semestre ${semestre.numSemestre} — ${semestre.periodo}`;
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar cambios';
    document.getElementById("s-id").value = semestre._id;
    document.getElementById("s-num").value = semestre.numSemestre;
    const [anio, meses] = (semestre.periodo || "").split(" ");
    document.getElementById("s-anio").value = anio || "";
    document.getElementById("s-meses").value = meses || "";
    document.getElementById("s-inscripcion").value = semestre.inscripcion;
    document.getElementById("s-reinscripcion").value = semestre.reinscripcion;
    document.getElementById("s-colegiatura").value = semestre.colegiaturaMensual;
    document.getElementById("s-beca").value = semestre.descuentoPorcentaje;
    gestionarInscripcion(semestre.numSemestre);
    actualizarPreviewBeca();

    if (estatusGroup) { estatusGroup.style.display = ""; document.getElementById("s-estatus").value = estatus; }

    if (estatus === "Finalizado") {
      setDisabled(true);
      document.getElementById("s-estatus")?.setAttribute("disabled", true);
      if (notice) notice.style.display = "";
      submitBtn.style.display = "none";
    } else {
      // En curso: solo beca editable
      setDisabled(true, ["s-beca"]);
      if (notice) notice.style.display = "none";
      submitBtn.style.display = "";
    }
  } else {
    // Modo creación
    title.textContent = "Registrar nuevo semestre";
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar semestre';
    submitBtn.style.display = "";
    document.getElementById("s-id").value = "";
    document.getElementById("s-anio").value = new Date().getFullYear();
    if (estatusGroup) estatusGroup.style.display = "none";
    if (notice) notice.style.display = "none";
    setDisabled(false);

    const alumnoId = alumnoIdOverride || alumnoDetalleId;
    if (alumnoId) {
      try {
        const semestres = await getSemestres(alumnoId);
        if (semestres && semestres.length > 0) {
          const semBase = semestres.sort((a,b) => a.numSemestre - b.numSemestre)[0];
          document.getElementById("s-reinscripcion").value = semBase.reinscripcion ?? 0;
          document.getElementById("s-colegiatura").value = semBase.colegiaturaMensual ?? 0;
          document.getElementById("s-beca").value = semBase.descuentoPorcentaje ?? 0;
          actualizarPreviewBeca();

          const ultimoSem = semestres.sort((a,b) => b.numSemestre - a.numSemestre)[0];
          const siguienteNum = ultimoSem.numSemestre + 1;
          document.getElementById("s-num").value = siguienteNum;
          gestionarInscripcion(siguienteNum);

          if (ultimoSem.periodo) {
            const [anioStr, mesesStr] = ultimoSem.periodo.split(" ");
            let anio = parseInt(anioStr) || new Date().getFullYear();
            if (mesesStr === "Febrero-Julio" || mesesStr === "Marzo-Agosto") {
              document.getElementById("s-anio").value = anio;
              document.getElementById("s-meses").value = mesesStr === "Febrero-Julio" ? "Agosto-Enero" : "Septiembre-Febrero";
            } else if (mesesStr === "Agosto-Enero" || mesesStr === "Septiembre-Febrero") {
              document.getElementById("s-anio").value = anio + 1;
              document.getElementById("s-meses").value = mesesStr === "Agosto-Enero" ? "Febrero-Julio" : "Marzo-Agosto";
            }
          }
        } else {
          gestionarInscripcion(1);
        }
      } catch (e) {
        console.error("No se pudieron cargar los semestres base", e);
        gestionarInscripcion(1);
      }
    } else {
      gestionarInscripcion(1);
    }

    document.getElementById("s-num")?.addEventListener("change", (e) => {
      gestionarInscripcion(Number(e.target.value));
    });
  }

  document.getElementById("s-alumno-id").value = alumnoIdOverride || alumnoDetalleId;
  openModal("modal-semestre-alumno");
}

function actualizarPreviewBeca() {
  // La beca solo aplica a colegiatura
  const cole = Number(document.getElementById("s-colegiatura").value) || 0;
  const beca = Number(document.getElementById("s-beca").value) || 0;
  const preview = document.getElementById("semestre-preview");
  if (beca > 0 && cole) {
    document.getElementById("prev-cole").textContent = fmt(cole * (1 - beca / 100));
    preview.classList.add("semestre-preview-visible");
    preview.classList.remove("semestre-preview-hidden");
  } else {
    preview.classList.add("semestre-preview-hidden");
    preview.classList.remove("semestre-preview-visible");
  }
}

function initSemestre() {
  // Solo colegiatura y beca disparan el preview
  ["s-colegiatura", "s-beca"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const newEl = el.cloneNode(true);
      el.replaceWith(newEl);
      newEl.addEventListener("input", actualizarPreviewBeca);
    }
  });

  const formS = document.getElementById("form-semestre-alumno");
  if (formS) {
    const newFormS = formS.cloneNode(true);
    formS.replaceWith(newFormS);
    newFormS.addEventListener("submit", async (e) => {
      e.preventDefault();
      const sId = document.getElementById("s-id").value;
      const alumnoID = document.getElementById("s-alumno-id").value;
      const numSemestre = Number(document.getElementById("s-num").value);
      const esRecurso = document.getElementById("s-recurso").checked;

      const anio = document.getElementById("s-anio").value.trim();
      const meses = document.getElementById("s-meses").value;
      if (!anio || !meses) { showAlert("Indica el año y el periodo de meses.", "error"); return; }
      const periodo = `${anio} ${meses}`;

      if (!sId && !esRecurso) {
        const existentes = await getSemestres(alumnoID).catch(() => []);
        if (existentes.some(s => s.numSemestre === numSemestre)) {
          showAlert(`El Semestre ${numSemestre} ya está registrado. Si es repetidor, activa la casilla 'Es repetidor'.`, "error");
          return;
        }
      }

      let data;
      if (sId) {
        // Edición: solo beca y estatus
        data = {
          descuentoPorcentaje: Number(document.getElementById("s-beca").value),
          estatusSemestre: document.getElementById("s-estatus")?.value ?? "En curso",
        };
      } else {
        // Creación: todos los campos; inscripción solo en Sem 1
        data = {
          alumnoID, numSemestre, periodo,
          inscripcion: numSemestre === 1 ? Number(document.getElementById("s-inscripcion").value) : 0,
          reinscripcion: Number(document.getElementById("s-reinscripcion").value),
          colegiaturaMensual: Number(document.getElementById("s-colegiatura").value),
          descuentoPorcentaje: Number(document.getElementById("s-beca").value),
        };
      }

      try {
        if (sId) {
          await updateSemestre(sId, data);
          showAlert("Semestre actualizado correctamente ✔", "success");
        } else {
          await createSemestre(data);
          showAlert("Semestre registrado correctamente ✔", "success");
        }
        closeModal("modal-semestre-alumno");
        const semestres = await getSemestres(alumnoID);
        renderSemestresEnDetalle(semestres);
        document.dispatchEvent(new CustomEvent("semestreActualizado", { detail: alumnoID }));
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
  }
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
      const estatus = c.estatusSemestre ?? "En curso";
      const beca =
        c.descuentoPorcentaje > 0
          ? `<span class="semestre-badge-beca-aplicada">Beca ${c.descuentoPorcentaje}%</span>`
          : `<span class="semestre-badge-sin-beca">Sin beca</span>`;

      const estatusBadge = estatus === "Finalizado"
        ? `<span class="semestre-badge-finalizado"><i class="bi bi-lock-fill"></i> Finalizado</span>`
        : `<span class="semestre-badge-en-curso"><i class="bi bi-play-circle-fill"></i> En curso</span>`;

      const btnEditar = estatus === "Finalizado"
        ? `<button class="btn-sm btn-secondary btn-editar-cuatrimestre semestre-btn-editar"
            data-cid="${c._id}" data-num="${c.numCuatrimestre}" data-periodo="${c.periodo}"
            data-inscripcion="${c.inscripcion ?? 0}" data-reinscripcion="${c.reinscripcion ?? 0}"
            data-colegiatura="${c.colegiaturaMensual ?? 0}" data-beca="${c.descuentoPorcentaje ?? 0}"
            data-estatus="${estatus}">
            <i class="bi bi-lock-fill"></i> Ver
          </button>`
        : `<button class="btn-sm btn-primary btn-editar-cuatrimestre semestre-btn-editar"
            data-cid="${c._id}" data-num="${c.numCuatrimestre}" data-periodo="${c.periodo}"
            data-inscripcion="${c.inscripcion ?? 0}" data-reinscripcion="${c.reinscripcion ?? 0}"
            data-colegiatura="${c.colegiaturaMensual ?? 0}" data-beca="${c.descuentoPorcentaje ?? 0}"
            data-estatus="${estatus}">
            <i class="bi bi-pencil-fill"></i> Editar
          </button>`;

      return `
    <div class="semestre-item">
      <div class="semestre-item-info">
        <strong class="semestre-item-titulo">Cuatrimestre ${c.numCuatrimestre} — ${c.periodo}</strong>
        <div class="semestre-item-detalles">
          Inscripción: ${fmt(c.inscripcion)} · Reinscripción: ${fmt(c.reinscripcion)} · Colegiatura: ${fmt(c.colegiaturaMensual)}
        </div>
      </div>
      ${estatusBadge} ${beca} ${btnEditar}
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
        estatusSemestre: btn.dataset.estatus ?? "En curso",
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

  function gestionarInscripcionC(numCuat) {
    const grp = document.getElementById("c-inscripcion-group");
    const inp = document.getElementById("c-inscripcion");
    if (!grp || !inp) return;
    if (numCuat <= 1) { grp.style.display = ""; inp.required = true; }
    else { grp.style.display = "none"; inp.required = false; inp.value = ""; }
  }

  const CAMPOS_C = ["c-num","c-anio","c-meses","c-inscripcion","c-reinscripcion","c-colegiatura","c-beca","c-recurso"];
  function setDisabledC(disabled, except = []) {
    CAMPOS_C.forEach(id => { if (!except.includes(id)) { const el = document.getElementById(id); if (el) el.disabled = disabled; } });
  }

  const estatusGroupC = document.getElementById("c-estatus-group");
  const noticeC = document.getElementById("c-finalizado-notice");

  if (cuatrimestre) {
    const estatus = cuatrimestre.estatusSemestre ?? "En curso";
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
    gestionarInscripcionC(cuatrimestre.numCuatrimestre);
    actualizarPreviewBecaCuatrimestre();

    if (estatusGroupC) { estatusGroupC.style.display = ""; document.getElementById("c-estatus").value = estatus; }

    if (estatus === "Finalizado") {
      setDisabledC(true);
      document.getElementById("c-estatus")?.setAttribute("disabled", true);
      if (noticeC) noticeC.style.display = "";
      submitBtn.style.display = "none";
    } else {
      setDisabledC(true, ["c-beca"]);
      if (noticeC) noticeC.style.display = "none";
      submitBtn.style.display = "";
    }
  } else {
    title.textContent = "Registrar nuevo cuatrimestre";
    submitBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> Guardar cuatrimestre';
    submitBtn.style.display = "";
    document.getElementById("c-id").value = "";
    document.getElementById("c-anio").value = new Date().getFullYear();
    if (estatusGroupC) estatusGroupC.style.display = "none";
    if (noticeC) noticeC.style.display = "none";
    setDisabledC(false);

    const alumnoId = alumnoIdOverride || alumnoDetalleId;
    if (alumnoId) {
      try {
        const cuatrimestres = await getCuatrimestres(alumnoId);
        if (cuatrimestres && cuatrimestres.length > 0) {
          const cBase = cuatrimestres.sort((a,b) => a.numCuatrimestre - b.numCuatrimestre)[0];
          document.getElementById("c-reinscripcion").value = cBase.reinscripcion ?? 0;
          document.getElementById("c-colegiatura").value = cBase.colegiaturaMensual ?? 0;
          document.getElementById("c-beca").value = cBase.descuentoPorcentaje ?? 0;
          actualizarPreviewBecaCuatrimestre();

          const ultimoC = cuatrimestres.sort((a,b) => b.numCuatrimestre - a.numCuatrimestre)[0];
          const siguienteNum = ultimoC.numCuatrimestre + 1;
          document.getElementById("c-num").value = siguienteNum;
          gestionarInscripcionC(siguienteNum);

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
        } else {
          gestionarInscripcionC(1);
        }
      } catch (e) {
        console.error("No se pudieron cargar los cuatrimestres base", e);
        gestionarInscripcionC(1);
      }
    } else {
      gestionarInscripcionC(1);
    }

    document.getElementById("c-num")?.addEventListener("change", (e) => {
      gestionarInscripcionC(Number(e.target.value));
    });
  }

  document.getElementById("c-alumno-id").value = alumnoIdOverride || alumnoDetalleId;
  openModal("modal-cuatrimestre-alumno");
}

function actualizarPreviewBecaCuatrimestre() {
  // La beca solo aplica a colegiatura
  const cole = Number(document.getElementById("c-colegiatura").value) || 0;
  const beca = Number(document.getElementById("c-beca").value) || 0;
  const preview = document.getElementById("cuatrimestre-preview");
  if (beca > 0 && cole) {
    document.getElementById("prev-c-cole").textContent = fmt(cole * (1 - beca / 100));
    preview.classList.add("semestre-preview-visible");
    preview.classList.remove("semestre-preview-hidden");
  } else {
    preview.classList.add("semestre-preview-hidden");
    preview.classList.remove("semestre-preview-visible");
  }
}

function initCuatrimestre() {
  ["c-colegiatura", "c-beca"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const newEl = el.cloneNode(true);
      el.replaceWith(newEl);
      newEl.addEventListener("input", actualizarPreviewBecaCuatrimestre);
    }
  });

  const formC = document.getElementById("form-cuatrimestre-alumno");
  if (formC) {
    const newFormC = formC.cloneNode(true);
    formC.replaceWith(newFormC);
    newFormC.addEventListener("submit", async (e) => {
      e.preventDefault();
      const cId = document.getElementById("c-id").value;
      const alumnoID = document.getElementById("c-alumno-id").value;
      const numCuatrimestre = Number(document.getElementById("c-num").value);
      const esRecurso = document.getElementById("c-recurso").checked;

      const anio = document.getElementById("c-anio").value.trim();
      const meses = document.getElementById("c-meses").value;
      if (!anio || !meses) { showAlert("Indica el año y el periodo de meses.", "error"); return; }
      const periodo = `${anio} ${meses}`;

      if (!cId && !esRecurso) {
        const existentes = await getCuatrimestres(alumnoID).catch(() => []);
        if (existentes.some(c => c.numCuatrimestre === numCuatrimestre)) {
          showAlert(`El Cuatrimestre ${numCuatrimestre} ya está registrado. Si es repetidor, activa la casilla 'Es repetidor'.`, "error");
          return;
        }
      }

      let dataC;
      if (cId) {
        // Edición: solo beca y estatus
        dataC = {
          descuentoPorcentaje: Number(document.getElementById("c-beca").value),
          estatusSemestre: document.getElementById("c-estatus")?.value ?? "En curso",
        };
      } else {
        // Creación: todos los campos; inscripción solo en Cuatrimestre 1
        dataC = {
          alumnoID, numCuatrimestre, periodo,
          inscripcion: numCuatrimestre === 1 ? Number(document.getElementById("c-inscripcion").value) : 0,
          reinscripcion: Number(document.getElementById("c-reinscripcion").value),
          colegiaturaMensual: Number(document.getElementById("c-colegiatura").value),
          descuentoPorcentaje: Number(document.getElementById("c-beca").value),
        };
      }

      try {
        if (cId) {
          await updateCuatrimestre(cId, dataC);
          showAlert("Cuatrimestre actualizado correctamente ✔", "success");
        } else {
          await createCuatrimestre(dataC);
          showAlert("Cuatrimestre registrado correctamente ✔", "success");
        }
        closeModal("modal-cuatrimestre-alumno");
        const cuatrimestres = await getCuatrimestres(alumnoID);
        renderCuatrimestresEnDetalle(cuatrimestres);
        document.dispatchEvent(new CustomEvent("semestreActualizado", { detail: alumnoID }));
      } catch (error) {
        showAlert("Error: " + error.message, "error");
      }
    });
  }
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
