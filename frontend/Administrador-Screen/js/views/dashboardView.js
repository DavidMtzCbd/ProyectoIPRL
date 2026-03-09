import { getDashboardAdmin } from "../../../Shared/js/api.js";
import { formatMoney, formatDate, Paginator } from "../../../Shared/js/ui.js";

function buildRow(pago) {
  return `
    <tr>
      <td>${formatDate(pago.fecha)}</td>
      <td>${pago.matricula}</td>
      <td>${pago.concepto}</td>
      <td>${formatMoney(pago.monto)}</td>
      <td>${pago.metodoPago}</td>
      <td>${pago.requiereFactura}</td>
    </tr>`;
}

function renderPaginaDashboard(pagos) {
  const tbody = document.getElementById("dashboard-pagos-table");
  if (tbody) tbody.innerHTML = pagos.map(buildRow).join("");
}

const paginadorDashboard = new Paginator({
  controlsId: "dashboard-paginacion",
  renderPage: renderPaginaDashboard,
  rowOptions: [10, 15, 25],
});

export async function initDashboard() {
  const data = await getDashboardAdmin();

  document.getElementById("total-alumnos").textContent =
    data.resumen.totalAlumnos;
  document.getElementById("alumnos-adeudo").textContent =
    data.resumen.totalAlumnosConAdeudo;

  // Reconstruir controles si el HTML fue recargado dinámicamente
  const ctrl = document.getElementById("dashboard-paginacion");
  if (ctrl) ctrl.innerHTML = "";

  paginadorDashboard.setData(data.tablaPagos ?? []);
}
