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
  const template = document.getElementById("pago-item-template");
  if (!feed || !template) return;

  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const fin = inicio + PAGE_SIZE;
  const slice = pagosOrdenados.slice(inicio, fin);

  feed.innerHTML = "";

  slice.forEach((p) => {
    const icon = CONCEPTO_ICON[p.concepto] ?? "bi-receipt";
    const clone = template.content.cloneNode(true);

    const iconEl = clone.querySelector(".pago-icon i");
    if (iconEl) iconEl.classList.add(icon);

    const conceptoEl = clone.querySelector(".pago-concepto");
    if (conceptoEl) conceptoEl.textContent = p.concepto;

    const fechaEl = clone.querySelector(".pago-fecha");
    if (fechaEl) fechaEl.textContent = formatDate(p.fechaPago);

    const metodoEl = clone.querySelector(".pago-metodo");
    if (metodoEl) metodoEl.textContent = p.metodoPago;

    const montoEl = clone.querySelector(".pago-monto");
    if (montoEl) montoEl.textContent = `+${formatMoney(p.monto)}`;

    feed.appendChild(clone);
  });

  renderPaginacion();
}

function renderPaginacion() {
  const totalPaginas = Math.ceil(pagosOrdenados.length / PAGE_SIZE);
  const pag = document.getElementById("pagos-paginacion");

  if (!pag) return;

  if (totalPaginas <= 1) {
    pag.style.display = "none";
    return;
  }

  pag.style.display = "flex";
  
  const infoText = document.getElementById("pag-info-text");
  if (infoText) infoText.textContent = `Página ${paginaActual} de ${totalPaginas}`;

  const btnPrev = document.getElementById("pag-prev");
  if (btnPrev) {
    btnPrev.disabled = paginaActual === 1;
    btnPrev.onclick = () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderPagina();
      }
    };
  }

  const btnNext = document.getElementById("pag-next");
  if (btnNext) {
    btnNext.disabled = paginaActual === totalPaginas;
    btnNext.onclick = () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderPagina();
      }
    };
  }
}

export function renderHistorial(pagos) {
  const cardPagos = document.getElementById("card-pagos");
  const feed = document.getElementById("pagos-feed");

  if (cardPagos) cardPagos.textContent = pagos.length;
  if (!feed) return;

  if (!pagos.length) {
    feed.innerHTML = "";
    const p = document.createElement("p");
    p.className = "no-data";
    p.textContent = "Sin pagos registrados";
    feed.appendChild(p);
    
    // Ocultar paginacion si existe
    const pag = document.getElementById("pagos-paginacion");
    if (pag) pag.style.display = "none";
    return;
  }

  // Ordenar por fecha descendente y guardar globalmente
  pagosOrdenados = [...pagos].sort(
    (a, b) => new Date(b.fechaPago) - new Date(a.fechaPago),
  );
  paginaActual = 1;
  renderPagina();
}
