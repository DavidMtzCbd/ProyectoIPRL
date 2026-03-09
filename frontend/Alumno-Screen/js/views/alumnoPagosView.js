import { formatMoney, formatDate } from "../../../Shared/js/ui.js";

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

const PAGE_SIZE = 4; // items por página
let pagosOrdenados = [];
let paginaActual = 1;

function renderPagina() {
  const feed = document.getElementById("pagos-feed");
  if (!feed) return;

  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const fin = inicio + PAGE_SIZE;
  const slice = pagosOrdenados.slice(inicio, fin);

  feed.innerHTML = slice
    .map((p) => {
      const icon = CONCEPTO_ICON[p.concepto] ?? "bi-receipt";
      return `
      <div class="pago-item">
        <div class="pago-icon"><i class="bi ${icon}"></i></div>
        <div class="pago-info">
          <div class="pago-concepto">${p.concepto}</div>
          <div class="pago-meta">
            <span><i class="bi bi-calendar3"></i> ${formatDate(p.fechaPago)}</span>
            <span><i class="bi bi-credit-card"></i> ${p.metodoPago}</span>
          </div>
        </div>
        <div class="pago-monto">+${formatMoney(p.monto)}</div>
      </div>`;
    })
    .join("");

  renderPaginacion();
}

function renderPaginacion() {
  const totalPaginas = Math.ceil(pagosOrdenados.length / PAGE_SIZE);
  let pag = document.getElementById("pagos-paginacion");

  if (!pag) {
    pag = document.createElement("div");
    pag.id = "pagos-paginacion";
    pag.className = "pagos-paginacion";
    document
      .getElementById("pagos-feed")
      .insertAdjacentElement("afterend", pag);
  }

  if (totalPaginas <= 1) {
    pag.innerHTML = "";
    return;
  }

  pag.innerHTML = `
    <button class="pag-btn" id="pag-prev" ${paginaActual === 1 ? "disabled" : ""}>
      <i class="bi bi-chevron-left"></i>
    </button>
    <span class="pag-info">Página ${paginaActual} de ${totalPaginas}</span>
    <button class="pag-btn" id="pag-next" ${paginaActual === totalPaginas ? "disabled" : ""}>
      <i class="bi bi-chevron-right"></i>
    </button>
  `;

  document.getElementById("pag-prev")?.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      renderPagina();
    }
  });
  document.getElementById("pag-next")?.addEventListener("click", () => {
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderPagina();
    }
  });
}

export function renderHistorial(pagos) {
  const cardPagos = document.getElementById("card-pagos");
  const feed = document.getElementById("pagos-feed");

  if (cardPagos) cardPagos.textContent = pagos.length;
  if (!feed) return;

  if (!pagos.length) {
    feed.innerHTML = `<p class="no-data">Sin pagos registrados</p>`;
    return;
  }

  // Ordenar por fecha descendente y guardar globalmente
  pagosOrdenados = [...pagos].sort(
    (a, b) => new Date(b.fechaPago) - new Date(a.fechaPago),
  );
  paginaActual = 1;
  renderPagina();
}
