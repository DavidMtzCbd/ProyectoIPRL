import { login } from "./api.js";
import { setToken, setUsuario } from "./state.js";

const loginForm = document.getElementById("login-form");
const submitBtn = loginForm.querySelector(".btn-login");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuarioInput = document.getElementById("usuario").value;
  const contrasena = document.getElementById("contrasena").value;

  submitBtn.disabled = true;

  try {
    const data = await login({ usuario: usuarioInput, contrasena });

    setToken(data.token);
    setUsuario(usuarioInput);

    console.log("Acceso concedido para:", usuarioInput, "| Rol:", data.rol);

    // Redirigir según el rol
    if (data.rol === "alumno") {
      window.location.href = "Alumno-Screen/alumno.html";
    } else {
      window.location.href = "Administrador-Screen/index.html";
    }
  } catch (error) {
    alert("Error de acceso: " + error.message);
    submitBtn.disabled = false;
  }
});
