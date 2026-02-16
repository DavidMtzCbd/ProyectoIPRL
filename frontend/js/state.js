export const appState = {
  token: localStorage.getItem("token") ?? "",
  role: localStorage.getItem("role") ?? "",
  currentView: "dashboard",
  alumnoDashboard: null,
};

export function setSession({ token, role }) {
  appState.token = token;
  appState.role = role;
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}
