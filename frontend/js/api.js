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

// ── Alumnos ──────────────────────────────────────────────────────────────────

export function getAlumnos() {
  return request("/alumnos");
}

export function getAlumnoById(id) {
  return request(`/alumnos/${id}`);
}

export function createAlumno(data) {
  return request("/alumnos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getAlumnoPagos(id) {
  return request(`/alumnos/${id}/pagos`);
}

export function getAlumnoByMatricula(matricula) {
  return request(`/alumnos/matricula/${matricula}`);
}

// ── Pagos ─────────────────────────────────────────────────────────────────────

export function getAllPagos() {
  return request("/pagos");
}

export function getPagoById(id) {
  return request(`/pagos/${id}`);
}

export function createPago(data) {
  return request("/pagos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getPagosPorAlumno(matricula) {
  return request(`/pagos/alumno/${matricula}`);
}

// ── Otros ─────────────────────────────────────────────────────────────────────

export function getCursos() {
  return request("/cursos");
}

export function getDashboardAdmin() {
  return request("/dashboard/admin");
}
