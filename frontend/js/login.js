import { login } from "./api.js";
import { setToken } from "./state.js";

const loginForm = document.getElementById("login-form");
const submitBtn = loginForm.querySelector(".btn-login");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // UI: Botón cargando
  const originalText = submitBtn.innerText;
  submitBtn.innerHTML = '<span class="spinner"></span> Verificando...';
  submitBtn.disabled = true;

  const usuario = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;

  try {
    const data = await login({ usuario, contrasena });
    setToken(data.token); // Guarda el token en localStorage

    // Redirige al panel principal
    window.location.href = "index.html";
  } catch (error) {
    alert("Error de acceso: " + error.message);
    // UI: Restaurar botón
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});
