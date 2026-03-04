import { formatMoney } from "../ui.js";

export function renderSemestre(semestres) {
  const tbody = document.getElementById("colegiatura-body");
  const cardSem = document.getElementById("card-semestre");

  if (!tbody || !cardSem) return;

  if (!semestres || semestres.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="no-data">Sin semestres registrados</td></tr>`;
    cardSem.textContent = "—";
    return;
  }

  // El más reciente (último en el array)
  const sem = semestres.sort((a, b) => a.numSemestre - b.numSemestre)[
    semestres.length - 1
  ];
  cardSem.textContent = `Sem. ${sem.numSemestre} — ${sem.periodo}`;

  const descuento = sem.descuentoPorcentaje ?? 0;
  const inscBase = sem.inscripcion ?? 0;
  const reinscBase = sem.reinscripcion ?? 0;
  const colBase = sem.colegiaturaMensual ?? 0;

  const becaPill =
    descuento > 0
      ? `<span class="beca-pill"><i class="bi bi-stars"></i> ${descuento}% beca</span>`
      : `<span style="color:var(--muted);font-size:.8rem">Sin beca</span>`;

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

  tbody.innerHTML = rows
    .map(
      (r) => `
    <tr>
      <td>${r.concepto}</td>
      <td class="price-base">${formatMoney(r.base)}</td>
      <td>${becaPill}</td>
      <td class="price-final">${formatMoney(r.final)}</td>
    </tr>`,
    )
    .join("");
}
