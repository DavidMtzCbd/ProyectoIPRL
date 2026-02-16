export const appState = {
  token: localStorage.getItem("token") ?? "",
  currentView: "dashboard",
};

export function setToken(token) {
  appState.token = token;
  localStorage.setItem("token", token);
}
