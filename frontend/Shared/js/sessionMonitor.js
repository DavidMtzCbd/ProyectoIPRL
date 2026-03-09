import { appState } from "./state.js";
import { showAlert } from "./ui.js";

let monitorInterval = null;

export function initSessionMonitor() {
  if (monitorInterval) clearInterval(monitorInterval);

  // Revisa la expiración del token de inmediato y luego cada minuto
  checkExpiration();
  monitorInterval = setInterval(checkExpiration, 60000);
}

function checkExpiration() {
  const token = appState.token;
  if (!token) return;

  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));

    const expiracion = payload.exp * 1000;
    const ahora = Date.now();
    const minutosRestantes = Math.floor((expiracion - ahora) / 1000 / 60);

    console.log(
      `[Seguridad] ⏳ Quedan aproximadamente ${minutosRestantes} minuto(s) para que expire tu sesión.`,
    );

    // Advertencias precisas de sesión próxima a terminar
    if (minutosRestantes === 5 || minutosRestantes === 1) {
      showAlert(
        `Tu sesión terminará en ${minutosRestantes} minuto(s). Guarda tus cambios actuales.`,
        "error",
      );
    }

    // Expiración forzada
    if (ahora >= expiracion) {
      if (monitorInterval) clearInterval(monitorInterval);
      localStorage.removeItem("token");
      appState.token = "";
      alert(
        "Tu sesión ha expirado por inactividad. Serás redirigido al inicio de sesión.",
      );
      window.location.href = "../login.html";
    }
  } catch (error) {
    console.error("Error al monitorear el token JWT:", error);
  }
}
