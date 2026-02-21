import { appState } from "./state.js";
import { initLogout } from "./logout.js";
import { showAlert, changeViewUI } from "./ui.js";

//Importación de la logica de las vistas del proyecto
import { initDashboard } from "./views/dashboardView.js";
import { initAlumnos } from "./views/alumnosView.js";
import { initPagos } from "./views/pagosView.js";

//Esta funcion se encarga de inicializar lasvistas del proyecto, dependiendo de la vista que se le indique
const VIEW_LOGIC = {
  dashboard: initDashboard,
  alumnos: initAlumnos,
  pagos: initPagos,
};

async function loadView(viewName) {
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

  //Cargar la vista inicial
  if (appState.token) {
    await loadView("dashboard");
  } else {
    window.location.href = "login.html";
  }
}

bootstrap();
