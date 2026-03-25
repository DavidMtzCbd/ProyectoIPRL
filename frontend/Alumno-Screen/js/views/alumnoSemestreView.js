import { formatMoney } from "../../../Shared/js/ui.js";

export function renderSemestre(semestres, alumnoData) {
  const tbody = document.getElementById("colegiatura-body");
  const cardSem = document.getElementById("card-semestre");

  if (!tbody || !cardSem) return;

  const isMaestria = alumnoData && alumnoData.ofertaAcademica && alumnoData.ofertaAcademica.toLowerCase().includes("maestr");
  const textTerm = isMaestria ? "Cuatrimestre" : "Semestre";
  const textTermAbbr = isMaestria ? "Cuat." : "Sem.";

  const descColegiatura = document.getElementById("desc-colegiatura");
  if (descColegiatura) {
    descColegiatura.textContent = `Precios del ${textTerm.toLowerCase()} activo. El precio final ya incluye el descuento por beca si aplica.`;
  }

  if (!semestres || semestres.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="no-data">Sin ${textTerm.toLowerCase()}s registrados</td></tr>`;
    cardSem.textContent = "—";
    return;
  }

  // El más reciente (último en el array)
  const numSortField = isMaestria ? "numCuatrimestre" : "numSemestre";
  const sem = semestres.sort((a, b) => a[numSortField] - b[numSortField])[
    semestres.length - 1
  ];
  cardSem.textContent = `${textTermAbbr} ${sem[numSortField]} — ${sem.periodo}`;

  const descuento = sem.descuentoPorcentaje ?? 0;
  const inscBase = sem.inscripcion ?? 0;
  const reinscBase = sem.reinscripcion ?? 0;
  const colBase = sem.colegiaturaMensual ?? 0;

  const template = document.getElementById("semestre-row-template");
  if (!template) return;

  const rows = [
    {
      concepto: "Inscripción",
      base: inscBase,
      final: inscBase * (1 - descuento / 100),
    },
    {
      concepto: "Reinscripción",
      base: reinscBase,
      final: reinscBase * (1 - descuento / 100),
    },
    {
      concepto: "Colegiatura mensual",
      base: colBase,
      final: colBase * (1 - descuento / 100),
    },
  ];

  tbody.innerHTML = "";

  rows.forEach(r => {
    const clone = template.content.cloneNode(true);
    
    const conceptoEl = clone.querySelector('.sem-concepto');
    if (conceptoEl) conceptoEl.textContent = r.concepto;
    
    const baseEl = clone.querySelector('.sem-base');
    if (baseEl) baseEl.textContent = formatMoney(r.base);
    
    const becaPill = clone.querySelector('.beca-pill');
    const sinBeca = clone.querySelector('.sin-beca');
    const becaPct = clone.querySelector('.beca-pct');
    
    if (descuento > 0) {
      if (becaPill) {
        becaPill.style.display = '';
        if (becaPct) becaPct.textContent = descuento;
      }
    } else {
      if (sinBeca) sinBeca.style.display = '';
    }
    
    const finalEl = clone.querySelector('.sem-final');
    if (finalEl) finalEl.textContent = formatMoney(r.final);
    
    tbody.appendChild(clone);
  });
}
