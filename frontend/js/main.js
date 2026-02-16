import {
  getAlumnos,
  getCursos,
  getDashboardAdmin,
  getDashboardAlumnoAutenticado,
  getPagosPorAlumno,
  login,
  loginWithGoogle,
} from "./api.js";
import { appState, setSession } from "./state.js";
import {
  changeView,
  renderAlumnoDashboard,
  renderAlumnos,
  renderCursos,
  renderDashboard,
  renderPagos,
  setupRoleUI,
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

async function loadDashboardAlumno() {
  const dashboard = await getDashboardAlumnoAutenticado();
  appState.alumnoDashboard = dashboard;
  renderAlumnoDashboard(dashboard, document.getElementById("alumno-search")?.value ?? "");
}

async function onViewChange(selectedView) {
  changeView(selectedView);
  appState.currentView = selectedView;

  try {
    if (selectedView === "dashboard") await loadDashboard();
    if (selectedView === "alumnos") await loadAlumnos();
    if (selectedView === "cursos") await loadCursos();
    if (selectedView === "alumno") await loadDashboardAlumno();
  } catch (error) {
    showAlert(error.message, "error");
  }
}

function initializeGoogleLogin() {
  const googleClientId = window.GOOGLE_CLIENT_ID || "";

  if (!googleClientId || !window.google?.accounts?.id) {
    showAlert(
      "Login de Google no disponible. Configura window.GOOGLE_CLIENT_ID en frontend/index.html",
      "error",
    );
    return;
  }

  window.google.accounts.id.initialize({
    client_id: googleClientId,
    callback: async (response) => {
      try {
        const data = await loginWithGoogle(response.credential);
        setSession({ token: data.token, role: data.rol });
        setupRoleUI("alumno");
        showAlert("Sesión de alumno iniciada correctamente");
        await onViewChange("alumno");
      } catch (error) {
        showAlert(error.message, "error");
      }
    },
  });

  window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
    theme: "outline",
    size: "large",
    text: "signin_with",
    locale: "es",
    width: 250,
  });
}

async function bootstrap() {
  setupRoleUI(appState.role);

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      await onViewChange(button.dataset.view);
    });
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    try {
      const data = await login({ usuario, contrasena });
      setSession({ token: data.token, role: data.rol });
      setupRoleUI(data.rol);
      showAlert("Sesión iniciada correctamente.");
      await onViewChange(data.rol === "alumno" ? "alumno" : "dashboard");
    } catch (error) {
      showAlert(error.message, "error");
    }
  });

  document.getElementById("pagos-filter-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const alumnoId = document.getElementById("alumno-id").value.trim();

    try {
      const pagos = await getPagosPorAlumno(alumnoId);
      renderPagos(pagos);
    } catch (error) {
      showAlert(error.message, "error");
    }
  });

  document.getElementById("alumno-search").addEventListener("input", (event) => {
    if (!appState.alumnoDashboard) return;
    renderAlumnoDashboard(appState.alumnoDashboard, event.target.value);
  });

  initializeGoogleLogin();

  if (appState.token) {
    try {
      await onViewChange(appState.role === "alumno" ? "alumno" : "dashboard");
    } catch (error) {
      showAlert("No se pudo restaurar la sesión guardada. Vuelve a iniciar sesión.", "error");
    }
  }
}

bootstrap();
