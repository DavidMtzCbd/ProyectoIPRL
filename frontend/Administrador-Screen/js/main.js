import { appState } from "../../Shared/js/state.js";
import { initLogout } from "../../Shared/js/logout.js";
import { showAlert, changeViewUI } from "../../Shared/js/ui.js";
import { initSessionMonitor } from "../../Shared/js/sessionMonitor.js";

//Importación de la logica de las vistas del proyecto
import { initDashboard } from "./views/dashboardView.js";
import { initAlumnos } from "./views/alumnosView.js";
import { initPagos } from "./views/pagosView.js";
import { initEstadoCuenta } from "./views/estadoCuentaView.js";

//Esta funcion se encarga de inicializar lasvistas del proyecto, dependiendo de la vista que se le indique
const VIEW_LOGIC = {
  dashboard: initDashboard,
  alumnos: initAlumnos,
  pagos: initPagos,
  estadoCuenta: initEstadoCuenta,
};

async function loadView(viewName, pushState = true) {
  const container = document.getElementById("view-container");

  try {
    //Cargar el fragmento HTML de la vista
    const response = await fetch(`views/${viewName}.html`);
    if (!response.ok) throw new Error("No se pudo cargar la vista");
    const html = await response.text();

    //Se inyecta en el contenedor
    container.innerHTML = html;
    changeViewUI(viewName);
    appState.currentView = viewName;

    // Guardar en el historial del navegador si es necesario
    if (pushState) {
      history.pushState({ view: viewName }, "", `?view=${viewName}`);
    }

    //Se ejecuta la logica especifica de la vista
    if (VIEW_LOGIC[viewName]) {
      await VIEW_LOGIC[viewName]();
    }
  } catch (error) {
    showAlert("Error al cambiar de vista: " + error.message, "error");
  }
}

async function bootstrap() {
  await initLogout();

  if (appState.token) {
    console.log("Usuario autenticado:", appState.usuario || "Administrador");
    console.log("Token de autenticación:", appState.token);
  }

  //Menu desplegable
  const menuTrigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-dropdown");
  menuTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("active");
  });

  //Navegación entre vistas
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => loadView(button.dataset.view));
  });

  // Navegación programática desde otras vistas (ej: Estado de Cuenta desde Alumnos)
  document.addEventListener("navigate", (e) => loadView(e.detail));

  // Manejar el evento de retroceso/avance del navegador
  window.addEventListener("popstate", (e) => {
    if (e.state && e.state.view) {
      loadView(e.state.view, false);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view') || "dashboard";
      loadView(view, false);
    }
  });

  //Cargar la vista inicial
  if (appState.token) {
    initSessionMonitor(); // Monitorear el progreso de la sesión JWT
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view') || "dashboard";
    history.replaceState({ view: initialView }, "", `?view=${initialView}`);
    await loadView(initialView, false);
  } else {
    window.location.replace("../login.html");
  }
}

bootstrap();
