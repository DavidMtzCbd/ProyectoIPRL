import { getPagosPorAlumno } from "../api.js";
import { formatMoney, formatDate, fillTable, showAlert } from "../ui.js";

export async function initPagos() {
  const form = document.getElementById("pagos-filter-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const matricula = document.getElementById("alumno-id").value.trim();
    try {
      const pagos = await getPagosPorAlumno(matricula);
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
    } catch (error) {
      showAlert(error.message, "error");
    }
  });
}
