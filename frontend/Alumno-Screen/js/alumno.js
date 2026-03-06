import { appState, setToken } from "../../Shared/js/state.js";
import {
  getMe,
  getSemestres,
  getAlumnoPagos,
  updateAlumno,
} from "../../Shared/js/api.js";
import { showAlert } from "../../Shared/js/ui.js";
import { initSessionMonitor } from "../../Shared/js/sessionMonitor.js";
import { initLogout } from "../../Shared/js/logout.js";

// Importar Controladores de Vista
import { renderPerfil, renderFacturacion } from "./views/alumnoPerfilView.js";
import { renderSemestre } from "./views/alumnoSemestreView.js";
import { renderHistorial } from "./views/alumnoPagosView.js";

let alumnoData = null;

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
  ]);
}

// ── Facturación ───────────────────────────────────────────────────────────────

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
    const [semestres, pagos] = await Promise.all([
      getSemestres(alumnoData._id).catch(() => []),
      getAlumnoPagos(alumnoData._id).catch(() => []),
    ]);

    // 4. Poblar vistas delegando a los Controladores
    renderPerfil(alumnoData);
    renderFacturacion(alumnoData);
    renderSemestre(semestres);
    renderHistorial(pagos);

    // 5. Escuchar eventos UI
    const btnGuardarFact = document.getElementById("btn-guardar-fact");
    if (btnGuardarFact)
      btnGuardarFact.addEventListener("click", guardarFacturacion);
  } catch (error) {
    // Token expirado o inválido
    console.error("Bootstrap error:", error);
    window.location.href = "../login.html";
  }

  // Modal compartido de Cerrar sesión
  await initLogout();
}

bootstrap();
