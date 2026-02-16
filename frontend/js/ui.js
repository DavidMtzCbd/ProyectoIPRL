function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX");
}

function fillTable(tableBodyId, rowsHtml) {
  const tableBody = document.getElementById(tableBodyId);
  tableBody.innerHTML = rowsHtml || "<tr><td colspan='6'>Sin datos disponibles</td></tr>";
}

export function showAlert(message, type = "success") {
  const alerts = document.getElementById("alerts");
  alerts.innerHTML = `<div class="status ${type}">${message}</div>`;

  setTimeout(() => {
    alerts.innerHTML = "";
  }, 3500);
}

export function changeView(viewName) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === `${viewName}-view`);
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const titles = {
    dashboard: "Dashboard",
    alumnos: "Gestión de alumnos",
    cursos: "Gestión de cursos",
    pagos: "Consulta de pagos",
  };

  document.getElementById("view-title").textContent = titles[viewName] ?? "Panel";
}

export function renderDashboard(data) {
  document.getElementById("total-alumnos").textContent = data.resumen.totalAlumnos;
  document.getElementById("alumnos-adeudo").textContent = data.resumen.totalAlumnosConAdeudo;

  const rows = data.tablaPagos
    .map(
      (pago) => `
        <tr>
          <td>${formatDate(pago.fecha)}</td>
          <td>${pago.matricula}</td>
          <td>${pago.concepto}</td>
          <td>${formatMoney(pago.monto)}</td>
          <td>${pago.metodoPago}</td>
          <td>${pago.requiereFactura}</td>
        </tr>
      `,
    )
    .join("");

  fillTable("dashboard-pagos-table", rows);
}

export function renderAlumnos(alumnos) {
  const rows = alumnos
    .map(
      (alumno) => `
        <tr>
          <td>${alumno.nombre}</td>
          <td>${alumno.matricula}</td>
          <td>${alumno.correo}</td>
          <td>${alumno.curso ?? "-"}</td>
        </tr>
      `,
    )
    .join("");

  fillTable("alumnos-table", rows);
}

export function renderCursos(cursos) {
  const rows = cursos
    .map(
      (curso) => `
        <tr>
          <td>${curso.name ?? curso.nombre ?? "Sin nombre"}</td>
          <td>${curso.descripcion ?? "-"}</td>
        </tr>
      `,
    )
    .join("");

  fillTable("cursos-table", rows);
}

export function renderPagos(pagos) {
  const rows = pagos
    .map(
      (pago) => `
        <tr>
          <td>${formatDate(pago.fechaPago)}</td>
          <td>${pago.concepto}</td>
          <td>${formatMoney(pago.monto)}</td>
          <td>${pago.metodoPago}</td>
        </tr>
      `,
    )
    .join("");

  fillTable("pagos-table", rows);
}
