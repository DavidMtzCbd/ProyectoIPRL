import { getDashboardAdmin } from "../api.js";
import { formatMoney, formatDate, fillTable } from "../ui.js";

export async function initDashboard() {
  const data = await getDashboardAdmin();
  document.getElementById("total-alumnos").textContent =
    data.resumen.totalAlumnos;
  document.getElementById("alumnos-adeudo").textContent =
    data.resumen.totalAlumnosConAdeudo;

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
