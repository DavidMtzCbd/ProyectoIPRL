import { appState } from "./state.js";

const API_BASE_URL = "http://localhost:3000/api";

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (appState.token) {
    headers.Authorization = `Bearer ${appState.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.message ?? payload.mensaje ?? "Error inesperado";
    throw new Error(message);
  }

  return response.json();
}

export function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getAlumnos() {
  return request("/alumnos");
}

export function getCursos() {
  return request("/cursos");
}

export function getDashboardAdmin() {
  return request("/dashboard/admin");
}

export function getPagosPorAlumno(alumnoId) {
  return request(`/pagos/alumno/${alumnoId}`);
}
