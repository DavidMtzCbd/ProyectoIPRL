import { formatMoney, formatDate } from "../ui.js";

const CONCEPTO_ICON = {
  Inscripción: "bi-file-earmark-text-fill",
  Reinscripción: "bi-arrow-repeat",
  "Ingeniería Colegiatura": "bi-calendar-check-fill",
  "Maestría Colegiatura": "bi-calendar-check-fill",
  "Hergonomia colegiatura": "bi-calendar-check-fill",
  Extraordinarios: "bi-exclamation-circle-fill",
  Titulación: "bi-award-fill",
  Certificados: "bi-patch-check-fill",
  "Recuperación de cartera": "bi-cash-coin",
  Diplomado: "bi-journal-bookmark-fill",
  Curso: "bi-book-fill",
};

export function renderHistorial(pagos) {
  const feed = document.getElementById("pagos-feed");
  const cardPagos = document.getElementById("card-pagos");

  if (cardPagos) cardPagos.textContent = pagos.length;
  if (!feed) return;

  if (!pagos.length) {
    feed.innerHTML = `<p class="no-data">Sin pagos registrados</p>`;
    return;
  }

  // Ordenar por fecha descendente
  const sorted = [...pagos].sort(
    (a, b) => new Date(b.fechaPago) - new Date(a.fechaPago),
  );

  feed.innerHTML = sorted
    .map((p) => {
      const icon = CONCEPTO_ICON[p.concepto] ?? "bi-receipt";
      const folioPill = p.folioFactura
        ? `<span class="pago-folio"><i class="bi bi-file-earmark-fill"></i> Folio ${p.folioFactura}</span>`
        : "";
      return `
      <div class="pago-item">
        <div class="pago-icon"><i class="bi ${icon}"></i></div>
        <div class="pago-info">
          <div class="pago-concepto">${p.concepto}</div>
          <div class="pago-meta">
            <span><i class="bi bi-calendar3"></i> ${formatDate(p.fechaPago)}</span>
            <span><i class="bi bi-credit-card"></i> ${p.metodoPago}</span>
            ${p.referencia ? `<span><i class="bi bi-hash"></i> ${p.referencia}</span>` : ""}
          </div>
        </div>
        <div>
          <div class="pago-monto">+${formatMoney(p.monto)}</div>
          ${folioPill}
        </div>
      </div>`;
    })
    .join("");
}
