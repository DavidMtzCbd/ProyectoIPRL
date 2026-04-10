import { appState } from "./state.js";

export async function initLogout() {
  // 1. Cargar el CSS dinámicamente
  if (!document.querySelector('link[href*="logoutModal.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "../Shared/styles/logoutModal.css";
    document.head.appendChild(link);
  }

  // 2. Cargar el HTML del componente
  try {
    const response = await fetch("../Shared/components/logoutModal.html");
    const html = await response.text();
    document.body.insertAdjacentHTML("beforeend", html);

    setupLogoutListeners(); // Configurar botones después de cargar
  } catch (error) {
    console.error("Error cargando el modal de logout:", error);
  }
}

function setupLogoutListeners() {
  const modal = document.getElementById("logout-modal");
  const btnOpen = document.getElementById("nav-logout"); // ID del botón en tu nav/aside
  const btnCancel = document.getElementById("btn-cancel-logout");
  const btnConfirm = document.getElementById("btn-confirm-logout");
  const usernameSpan = document.getElementById("logout-username");

  if (!btnOpen || !modal || !btnCancel || !btnConfirm) return;

  if (!btnOpen) return;

  btnOpen.addEventListener("click", (e) => {
    e.preventDefault();
    if (usernameSpan)
      usernameSpan.textContent = appState.user?.usuario || "David";
    modal.classList.add("is-visible"); // Usamos 'is-visible' para mostrarlo
  });

  btnCancel.addEventListener("click", () => {
    modal.classList.remove("is-visible");
  });

  btnConfirm.addEventListener("click", () => {
    localStorage.clear();
    console.log(
      "%c👋 Sesión cerrada - Token eliminado",
      "color: red; font-weight: bold;",
    );
    window.location.replace("../login.html");
  });
}
