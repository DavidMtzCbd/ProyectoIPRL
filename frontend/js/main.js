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
  if (appState.token) {
    console.log("Usuario: ", appState.user?.usuario || "Administrador");
    console.log("Token: ", appState.token);
  }

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
