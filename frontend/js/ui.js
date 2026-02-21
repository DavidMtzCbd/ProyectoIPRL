export function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX");
}

export function showAlert(message, type = "success") {
  const alerts = document.getElementById("alerts");
  alerts.innerHTML = `<div class="status ${type}">${message}</div>`;
  setTimeout(() => {
    alerts.innerHTML = "";
  }, 3500);
}

export function changeViewUI(viewName) {
  const titles = {
    dashboard: "Dashboard",
    alumnos: "Gestión de alumnos",
    pagos: "Consulta de pagos",
  };
  document.getElementById("view-title").textContent =
    titles[viewName] ?? "Panel";

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });
}

export function fillTable(tableBodyId, rowsHtml) {
  const tableBody = document.getElementById(tableBodyId);
  if (tableBody) {
    tableBody.innerHTML =
      rowsHtml || "<tr><td colspan='10'>Sin datos disponibles</td></tr>";
  }
}
