import { appState, setToken } from "../../Shared/js/state.js";
import {
  getMe,
  getSemestres,
  getCuatrimestres,
  getAlumnoPagos,
  updateAlumno,
} from "../../Shared/js/api.js";
import { showAlert, openModal, closeModal } from "../../Shared/js/ui.js";
import { initSessionMonitor } from "../../Shared/js/sessionMonitor.js";
import { initLogout } from "../../Shared/js/logout.js";

// Importar Controladores de Vista
import { renderPerfil, renderFacturacion } from "./views/alumnoPerfilView.js";
import { renderSemestre } from "./views/alumnoSemestreView.js";
import { renderHistorial } from "./views/alumnoPagosView.js";

let alumnoData = null;

// Exponer closeModal al objeto global para que los onclick en el HTML funcionen
window.closeModal = closeModal;

// ── Carga de Componentes HTML ─────────────────────────────────────────────────

async function renderComponent(containerId, componentPath) {
  try {
    const res = await fetch(componentPath);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const html = await res.text();
    document.getElementById(containerId).innerHTML = html;
  } catch (err) {
    console.error(`Error cargando componente ${componentPath}:`, err);
  }
}

async function loadPortalComponents() {
  await Promise.all([
    renderComponent("comp-perfil", "components/alumno/perfil-header.html"),
    renderComponent("comp-semestre", "components/alumno/tarjeta-semestre.html"),
    renderComponent("comp-pagos", "components/alumno/historial-pagos.html"),
    renderComponent(
      "comp-facturacion",
      "components/alumno/formulario-facturacion.html",
    ),
    renderComponent(
      "comp-modals-fact",
      "components/alumno/modal-confirmar-facturacion.html",
    ),
  ]);
}

// ── Facturación ───────────────────────────────────────────────────────────────

function abrirModalConfirmarFacturacion() {
  if (!alumnoData) return;

  // Llenar datos en el modal
  const rfc =
    document.getElementById("f-rfc").value.trim().toUpperCase() || "—";
  const razon = document.getElementById("f-razon").value.trim() || "—";

  const cfdiEl = document.getElementById("f-cfdi");
  const cfdi = cfdiEl.options[cfdiEl.selectedIndex]?.text || "—";

  const regimenEl = document.getElementById("f-regimen");
  const regimen = regimenEl.options[regimenEl.selectedIndex]?.text || "—";

  const domicilio = document.getElementById("f-domicilio").value.trim() || "—";

  document.getElementById("v-rfc").textContent = rfc;
  document.getElementById("v-razon").textContent = razon;
  document.getElementById("v-cfdi").textContent = cfdi;
  document.getElementById("v-regimen").textContent = regimen;
  document.getElementById("v-domicilio").textContent = domicilio;

  openModal("modal-confirmar-fact");
}

async function guardarFacturacion() {
  if (!alumnoData) return;

  const btn = document.getElementById("btn-confirmar-guardar-fact");
  const modalContent = document.querySelector("#modal-confirmar-fact .modal");

  if (!btn || !modalContent) return;

  // Guardamos el HTML original del modal por si el usuario lo vuelve a abrir después
  const originalModalHTML = modalContent.innerHTML;

  const originalText = btn.innerHTML;
  btn.innerHTML = `<i class="bi bi-hourglass-split"></i> Guardando...`;
  btn.disabled = true;

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

    // 1. Mostrar pantalla de éxito DENTRO del modal
    modalContent.innerHTML = `
      <div class="fact-success-container">
        <i class="bi bi-check-circle-fill fact-success-icon"></i>
        <h2 class="fact-success-title">¡Datos guardados!</h2>
        <p class="fact-success-text">Tu información fiscal ha sido actualizada correctamente.</p>
      </div>
    `;

    // 2. Esperar 2 segundos para que el usuario lo lea
    setTimeout(() => {
      closeModal("modal-confirmar-fact");
      // Restaurar el HTML original por si el usuario vuelve a darle click a guardar
      setTimeout(() => {
        modalContent.innerHTML = originalModalHTML;
        // Restaurar botón (ya que lo reescribimos)
        const btnRedo = document.getElementById("btn-confirmar-guardar-fact");
        if (btnRedo) {
          btnRedo.innerHTML = originalText;
          btnRedo.disabled = false;
          // Hay que volver a atar el evento click porque se destruyó al hacer innerHTML
          btnRedo.addEventListener("click", guardarFacturacion);
        }
      }, 300); // 300ms de gracia mientras termina la animación de cierre
    }, 2000);
  } catch (error) {
    showAlert("Error al guardar: " + error.message, "error");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Verificar sesión
  if (!appState.token) {
    window.location.href = "../login.html";
    return;
  }

  initSessionMonitor();

  try {
    const me = await getMe();

    // Si no es alumno, redirigir al panel admin
    if (me.rol !== "alumno" || !me.alumno) {
      window.location.href = "../Administrador-Screen/index.html";
      return;
    }

    alumnoData = me.alumno;

    // 2. Cargar HTML de componentes
    await loadPortalComponents();

    // 3. Cargar datos en paralelo
    const isMaestria = alumnoData.ofertaAcademica && alumnoData.ofertaAcademica.toLowerCase().includes("maestr");
    const semestresPromise = isMaestria 
      ? getCuatrimestres(alumnoData._id).catch(() => []) 
      : getSemestres(alumnoData._id).catch(() => []);

    const [semestres, pagos] = await Promise.all([
      semestresPromise,
      getAlumnoPagos(alumnoData._id).catch(() => []),
    ]);

    // 4. Poblar vistas delegando a los Controladores
    renderPerfil(alumnoData);
    renderFacturacion(alumnoData);
    renderSemestre(semestres, alumnoData);
    renderHistorial(pagos);

    // 5. Escuchar eventos UI
    const btnGuardarFact = document.getElementById("btn-guardar-fact");
    if (btnGuardarFact)
      btnGuardarFact.addEventListener("click", abrirModalConfirmarFacturacion);

    const btnConfirmarFact = document.getElementById(
      "btn-confirmar-guardar-fact",
    );
    if (btnConfirmarFact)
      btnConfirmarFact.addEventListener("click", guardarFacturacion);
  } catch (error) {
    // Token expirado o inválido
    console.error("Bootstrap error:", error);
    window.location.href = "../login.html";
  }

  // Modal compartido de Cerrar sesión
  await initLogout();
}

bootstrap();
