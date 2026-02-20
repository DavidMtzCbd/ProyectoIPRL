import {
  getAlumnos,
  getCursos,
  getDashboardAdmin,
  getPagosPorAlumno,
  login,
} from "./api.js";
import { appState, setToken } from "./state.js";
import {
  changeView,
  renderAlumnos,
  renderCursos,
  renderDashboard,
  renderPagos,
  showAlert,
} from "./ui.js";
import { initLogout } from "./logout.js";

async function loadDashboard() {
  const dashboard = await getDashboardAdmin();
  renderDashboard(dashboard);
}

async function loadAlumnos() {
  const alumnos = await getAlumnos();
  renderAlumnos(alumnos);
}

async function loadCursos() {
  const cursos = await getCursos();
  renderCursos(cursos);
}

async function bootstrap() {
  // Inicializar funcionalidad de logout
  await initLogout();

  // Manejo del menú desplegable del usuario
  const menuTrigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-dropdown");

  // Abrir/Cerrar menú al hacer clic en el avatar
  menuTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
  });

  document.getElementById("nav-logout").addEventListener("click", () => {
    dropdown.classList.remove("active");
  });

  // Mostrar información del usuario en la consola (para desarrollo)
  if (appState.token) {
    console.log("Usuario: ", appState.user?.usuario || "Administrador");
    console.log("Token: ", appState.token);
  }

  // Manejo de navegación entre vistas
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedView = button.dataset.view;
      changeView(selectedView);
      appState.currentView = selectedView;

      try {
        if (selectedView === "dashboard") await loadDashboard();
        if (selectedView === "alumnos") await loadAlumnos();
        if (selectedView === "cursos") await loadCursos();
      } catch (error) {
        showAlert(error.message, "error");
      }
    });
  });

  document
    .getElementById("login-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();

      const usuario = document.getElementById("usuario").value;
      const contrasena = document.getElementById("contrasena").value;

      try {
        const data = await login({ usuario, contrasena });
        setToken(data.token);
        showAlert("Sesión iniciada correctamente.");
        await loadDashboard();
      } catch (error) {
        showAlert(error.message, "error");
      }
    });

  document
    .getElementById("pagos-filter-form")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const matricula = document.getElementById("alumno-id").value.trim();

      try {
        const pagos = await getPagosPorAlumno(matricula);
        renderPagos(pagos);
      } catch (error) {
        showAlert(error.message, "error");
      }
    });

  if (appState.token) {
    try {
      await loadDashboard();
    } catch (error) {
      showAlert(
        "Hay token guardado, pero no se pudo cargar dashboard. Vuelve a iniciar sesión.",
        "error",
      );
    }
  }
}

bootstrap();
