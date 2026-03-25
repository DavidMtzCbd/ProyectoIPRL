import { setToken, setUsuario } from "./state.js";
import { API_BASE } from "./api.js";

/**
 * Callback global que llama Google Identity Services cuando el usuario
 * completa el Sign In. Debe ser una función global (no módulo).
 */
window.handleGoogleCredential = async function (response) {
  const errorEl = document.getElementById("login-error");
  const loadingEl = document.getElementById("login-loading");

  errorEl.style.display = "none";
  loadingEl.style.display = "flex";

  try {
    // Enviar el ID Token de Google a nuestro backend
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: response.credential }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.mensaje ?? "Error al iniciar sesión");
    }

    // Guardar el JWT y redirigir según el rol (mismo flujo que antes)
    setToken(data.token);
    setUsuario(data.rol);

    console.log("✅ Acceso concedido | Rol:", data.rol);

    if (data.rol === "alumno") {
      window.location.href = "Alumno-Screen/index.html";
    } else {
      window.location.href = "Administrador-Screen/index.html";
    }
  } catch (error) {
    loadingEl.style.display = "none";
    errorEl.style.display = "block";
    errorEl.textContent = error.message;
    console.error("❌ Error en login con Google:", error);
  }
};
