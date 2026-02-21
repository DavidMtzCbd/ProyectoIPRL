import { login } from "./api.js";
import { setToken, setUser } from "./state.js"; // Importar setUser

const loginForm = document.getElementById("login-form");
const submitBtn = loginForm.querySelector(".btn-login");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuarioInput = document.getElementById("usuario").value; // Obtener el nombre escrito
  const contrasena = document.getElementById("contrasena").value;

  // UI: Botón cargando
  submitBtn.disabled = true;

  try {
    const data = await login({ usuario: usuarioInput, contrasena });

    // Guardamos ambos datos para que persistan tras la redirección
    setToken(data.token);
    setUser(usuarioInput);

    // Opcional: Log rápido antes de redirigir
    console.log("Acceso concedido para:", usuarioInput);

    window.location.href = "index.html";
  } catch (error) {
    alert("Error de acceso: " + error.message);
    submitBtn.disabled = false;
  }
});
