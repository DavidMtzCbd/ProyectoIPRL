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

function fillTable(tableBodyId, rowsHtml, colspan = 6) {
  const tableBody = document.getElementById(tableBodyId);
  tableBody.innerHTML = rowsHtml || `<tr><td colspan='${colspan}'>Sin datos disponibles</td></tr>`;
}

export function showAlert(message, type = "success") {
  const alerts = document.getElementById("alerts");
  alerts.innerHTML = `<div class="status ${type}">${message}</div>`;

  setTimeout(() => {
    alerts.innerHTML = "";
  }, 3500);
}

export function setupRoleUI(role) {
  const isAlumno = role === "alumno";

  document.querySelectorAll(".admin-only").forEach((element) => {
    element.style.display = isAlumno ? "none" : "";
  });

  document.querySelectorAll(".alumno-only").forEach((element) => {
    element.style.display = isAlumno ? "" : "none";
  });
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
    alumno: "Dashboard Alumno",
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

  fillTable("alumnos-table", rows, 4);
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

  fillTable("cursos-table", rows, 2);
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

  fillTable("pagos-table", rows, 4);
}

export function renderAlumnoDashboard(data, searchTerm = "") {
  document.getElementById("alumno-nombre").textContent = [
    data.alumno.nombre,
    data.alumno.apellidoPaterno,
    data.alumno.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");
  document.getElementById("alumno-matricula").textContent = data.alumno.matricula;
  document.getElementById("alumno-saldo").textContent = formatMoney(data.saldoActual);

  const semestreActual = data.semestres?.[0];
  document.getElementById("alumno-inscripcion").textContent = formatMoney(semestreActual?.inscripcion);
  document.getElementById("alumno-reinscripcion").textContent = formatMoney(semestreActual?.reinscripcion);
  document.getElementById("alumno-colegiatura").textContent = formatMoney(
    semestreActual?.colegiaturaMensual,
  );

  const textoBusqueda = searchTerm.trim().toLowerCase();
  const pagosFiltrados = data.pagos.filter((pago) => {
    if (!textoBusqueda) return true;

    const fecha = formatDate(pago.fechaPago).toLowerCase();
    const concepto = String(pago.concepto ?? "").toLowerCase();
    return fecha.includes(textoBusqueda) || concepto.includes(textoBusqueda);
  });

  const rows = pagosFiltrados
    .map(
      (pago) => `
      <tr>
        <td>${formatDate(pago.fechaPago)}</td>
        <td>${pago.concepto}</td>
        <td>${formatMoney(pago.monto)}</td>
        <td>Pagado</td>
      </tr>
    `,
    )
    .join("");

  fillTable("alumno-pagos-table", rows, 4);
}
