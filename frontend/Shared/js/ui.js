export function formatMoney(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

export function formatDate(value) {
  if (!value) return "-";
  // Extraemos solo la parte de fecha (YYYY-MM-DD) y la construimos
  // como fecha LOCAL para evitar el desfase de zona horaria UTC vs local
  const dateStr =
    typeof value === "string"
      ? value.slice(0, 10)
      : new Date(value).toISOString().slice(0, 10);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-MX");
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

// ── Paginador reutilizable ────────────────────────────────────────────────────

/**
 * Paginator
 * @param {object} opts
 *   controlsId   – id del div donde se renderizarán los controles
 *   renderPage   – callback(items) que recibe el slice de datos a mostrar
 *   rowOptions   – [10, 15, 20] filas por página disponibles
 */
export class Paginator {
  constructor({ controlsId, renderPage, rowOptions = [10, 15, 20] }) {
    this._controlsId = controlsId;
    this._renderPage = renderPage;
    this._rowOptions = rowOptions;
    this._data = [];
    this._page = 1;
    this._perPage = rowOptions[0];
  }

  /** Carga (o actualiza) los datos y vuelve a la página 1 */
  setData(data) {
    this._data = data;
    this._page = 1;
    // Reconstruir controles si el contenedor existe pero está vacío
    // (ocurre cuando se navega entre vistas y el HTML se recarga)
    const container = document.getElementById(this._controlsId);
    if (container && !container.hasChildNodes()) {
      this._buildControls();
    }
    this._update();
  }

  /** Construye los controles de paginación una sola vez */
  _buildControls() {
    const container = document.getElementById(this._controlsId);
    if (!container) return;

    const opts = this._rowOptions
      .map((n) => `<option value="${n}">${n}</option>`)
      .join("");

    container.innerHTML = `
      <div class="pagination-bar">
        <div class="pagination-left">
          <span class="pagination-label">Filas por página:</span>
          <select class="pagination-select" id="${this._controlsId}-per-page">
            ${opts}
          </select>
          <span class="pagination-info" id="${this._controlsId}-info"></span>
        </div>
        <div class="pagination-right">
          <button class="pagination-btn" id="${this._controlsId}-prev">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="pagination-pages" id="${this._controlsId}-pages"></span>
          <button class="pagination-btn" id="${this._controlsId}-next">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>`;

    document
      .getElementById(`${this._controlsId}-per-page`)
      .addEventListener("change", (e) => {
        this._perPage = Number(e.target.value);
        this._page = 1;
        this._update();
      });

    document
      .getElementById(`${this._controlsId}-prev`)
      .addEventListener("click", () => {
        if (this._page > 1) {
          this._page--;
          this._update();
        }
      });

    document
      .getElementById(`${this._controlsId}-next`)
      .addEventListener("click", () => {
        if (this._page < this._totalPages()) {
          this._page++;
          this._update();
        }
      });
  }

  _totalPages() {
    return Math.max(1, Math.ceil(this._data.length / this._perPage));
  }

  _update() {
    const total = this._data.length;
    const totalPages = this._totalPages();
    this._page = Math.min(this._page, totalPages);

    const start = (this._page - 1) * this._perPage;
    const slice = this._data.slice(start, start + this._perPage);

    this._renderPage(slice);

    // Actualizar controles
    const infoEl = document.getElementById(`${this._controlsId}-info`);
    const pagesEl = document.getElementById(`${this._controlsId}-pages`);
    const prevBtn = document.getElementById(`${this._controlsId}-prev`);
    const nextBtn = document.getElementById(`${this._controlsId}-next`);

    if (infoEl)
      infoEl.textContent = `${start + 1}–${Math.min(start + this._perPage, total)} de ${total}`;
    if (pagesEl) pagesEl.textContent = `Página ${this._page} / ${totalPages}`;
    if (prevBtn) prevBtn.disabled = this._page === 1;
    if (nextBtn) nextBtn.disabled = this._page === totalPages;
  }
}
// ── Server Paginator (Backend Pagination) ───────────────────────────────────

/**
 * ServerPaginator
 * Descarga y renderiza datos pidiendo página por página al backend.
 * @param {object} opts
 *   controlsId   - id del div donde se renderizarán los controles
 *   fetchData    - async callback(page, limit) que debe retornar { data, total, totalPages, page }
 *   renderPage   - callback(items) que recibe el slice de datos a mostrar
 *   rowOptions   - [10, 15, 20] filas por página
 */
export class ServerPaginator {
  constructor({ controlsId, fetchData, renderPage, rowOptions = [10, 15, 20] }) {
    this._controlsId = controlsId;
    this._fetchData = fetchData;
    this._renderPage = renderPage;
    this._rowOptions = rowOptions;
    
    this._page = 1;
    this._perPage = rowOptions[0];
    this._total = 0;
    this._totalPages = 1;
    this._isControlsBuilt = false;
  }

  async load(page = 1) {
    this._page = page;
    
    try {
      const response = await this._fetchData(this._page, this._perPage);
      this._total = response.total;
      this._totalPages = response.totalPages;
      this._page = response.page;
      
      this._renderPage(response.data);
      
      if (!this._isControlsBuilt || !document.getElementById(`${this._controlsId}-per-page`)) {
        this._buildControls();
        this._isControlsBuilt = true;
      }
      this._updateControls();
    } catch (error) {
      console.error("Error al paginar:", error);
      showAlert("Error al cargar datos", "error");
    }
  }

  reset() {
    this.load(1);
  }

  _buildControls() {
    const container = document.getElementById(this._controlsId);
    if (!container) return;

    const opts = this._rowOptions
      .map((n) => `<option value="${n}" ${n === this._perPage ? 'selected' : ''}>${n}</option>`)
      .join("");

    container.innerHTML = `
      <div class="pagination-bar">
        <div class="pagination-left">
          <span class="pagination-label">Filas por página:</span>
          <select class="pagination-select" id="${this._controlsId}-per-page">
            ${opts}
          </select>
          <span class="pagination-info" id="${this._controlsId}-info"></span>
        </div>
        <div class="pagination-right">
          <button class="pagination-btn" id="${this._controlsId}-prev">
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="pagination-pages" id="${this._controlsId}-pages"></span>
          <button class="pagination-btn" id="${this._controlsId}-next">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>`;

    document
      .getElementById(`${this._controlsId}-per-page`)
      .addEventListener("change", (e) => {
        this._perPage = Number(e.target.value);
        this.load(1);
      });

    document
      .getElementById(`${this._controlsId}-prev`)
      .addEventListener("click", () => {
        if (this._page > 1) {
          this.load(this._page - 1);
        }
      });

    document
      .getElementById(`${this._controlsId}-next`)
      .addEventListener("click", () => {
        if (this._page < this._totalPages) {
          this.load(this._page + 1);
        }
      });
  }

  _updateControls() {
    const start = (this._page - 1) * this._perPage;
    
    const infoEl = document.getElementById(`${this._controlsId}-info`);
    const pagesEl = document.getElementById(`${this._controlsId}-pages`);
    const prevBtn = document.getElementById(`${this._controlsId}-prev`);
    const nextBtn = document.getElementById(`${this._controlsId}-next`);

    if (infoEl)
      infoEl.textContent = `${this._total === 0 ? 0 : start + 1}–${Math.min(start + this._perPage, this._total)} de ${this._total}`;
    if (pagesEl) pagesEl.textContent = `Página ${this._page} / ${this._totalPages}`;
    if (prevBtn) prevBtn.disabled = this._page <= 1;
    if (nextBtn) nextBtn.disabled = this._page >= this._totalPages;
  }
}

// ── Manejo de Modales ─────────────────────────────────────────────────────────

export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "flex";
  } else {
    console.error(`Modal no encontrado: ${id}`);
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = "none";
  }
}

// ── Cargador de modales como componentes ──────────────────────────────────────

/**
 * Carga uno o varios archivos HTML de componente (modales) e inyecta
 * su contenido al final del <body>. Si el modal ya existe en el DOM
 * (por una carga previa) lo omite para evitar duplicados.
 *
 * @param {string[]} paths - Rutas relativas a los archivos HTML del componente
 */
export async function loadModals(paths = []) {
  await Promise.all(
    paths.map(async (path) => {
      const modalId = path.split("/").pop().replace(".html", "");
      if (document.getElementById(modalId)) return; // ya cargado

      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`No se pudo cargar: ${path}`);
        const html = await res.text();
        document.body.insertAdjacentHTML("beforeend", html);
      } catch (err) {
        console.warn("[loadModals]", err.message);
      }
    }),
  );
}
