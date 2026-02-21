/**
 * En este archivo se define el estado global de la aplicación y las funciones para actualizarlo.
 * El estado incluye el token de autenticación, el nombre de usuario y la vista actual.
 * Las funciones permiten actualizar el token y el nombre de usuario, y se aseguran de que los cambios se reflejen en el almacenamiento local.
 */
export const appState = {
  token: localStorage.getItem("token") ?? "",
  usuario: localStorage.getItem("usuario") ?? "",
  currentView: "dashboard",
};

export function setToken(token) {
  appState.token = token;
  localStorage.setItem("token", token);
}

export function setUsuario(usuario) {
  appState.usuario = usuario;
  localStorage.setItem("usuario", usuario);
}
