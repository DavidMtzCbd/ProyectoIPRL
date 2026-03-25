import { formatMoney } from "../../../Shared/js/ui.js";

export function renderPerfil(alumno) {
  const nombre = `${alumno.apellidoPaterno} ${alumno.apellidoMaterno} ${alumno.nombre}`;

  const elNombre = document.getElementById("alumno-nombre");
  if (elNombre) elNombre.textContent = nombre;

  const elOferta = document.getElementById("alumno-oferta");
  if (elOferta) elOferta.textContent = alumno.ofertaAcademica;

  const elMat = document.getElementById("alumno-matricula-text");
  if (elMat)
    elMat.textContent = `Matrícula: ${alumno.matricula}`;

  // Estatus chip
  const estatusChip = document.getElementById("alumno-estatus-chip");
  const estatusChipText = document.getElementById("alumno-estatus-text");
  if (estatusChip && estatusChipText) {
    const cls =
      alumno.estatus === "Al corriente"
        ? "success"
        : alumno.estatus === "Adeudo"
          ? "danger"
          : "warning";
    estatusChip.className = `chip chip--${cls}`;
    estatusChipText.textContent = alumno.estatus;
  }

  // Tarjeta hero de saldo
  const cardSaldo = document.getElementById("card-saldo");
  if (cardSaldo) {
    cardSaldo.textContent = formatMoney(alumno.saldoActual);
    const cls =
      alumno.saldoActual > 0
        ? "saldo-hero__amount--deuda"
        : alumno.saldoActual < 0
          ? "saldo-hero__amount--favor"
          : "saldo-hero__amount--cero";
    cardSaldo.className = `saldo-hero__amount ${cls}`;
  }

  // Nota descriptiva del saldo
  const saldoNota = document.getElementById("saldo-nota");
  if (saldoNota) {
    if (alumno.saldoActual > 0)
      saldoNota.textContent = "Tienes un adeudo pendiente con la institución.";
    else if (alumno.saldoActual < 0)
      saldoNota.textContent =
        "Tienes saldo a favor. Contacta a Control Escolar.";
    else saldoNota.textContent = "Tu cuenta está al corriente. ¡Sigue así!";
  }

  const estatusBadge = document.getElementById("card-estatus");
  const estatusBadgeText = document.getElementById("card-estatus-text");
  if (estatusBadge && estatusBadgeText) {
    const clsBadge =
      alumno.estatus === "Al corriente"
        ? "corriente"
        : alumno.estatus === "Adeudo"
          ? "adeudo"
          : "convenio";
    estatusBadge.className = `status-badge status-badge--${clsBadge}`;
    estatusBadgeText.textContent = alumno.estatus;
  }
  // Oferta educativa en la tarjeta del grid
  const cardOferta = document.getElementById("card-oferta");
  if (cardOferta) cardOferta.textContent = alumno.ofertaAcademica || "—";

  // Label "Semestre/Cuatrimestre activo"
  const lblSemestreActivo = document.getElementById("label-semestre-activo");
  if (lblSemestreActivo) {
    const isMaestria = alumno.ofertaAcademica && alumno.ofertaAcademica.toLowerCase().includes("maestr");
    lblSemestreActivo.innerHTML = `<i class="bi bi-calendar3"></i> <span>${isMaestria ? "Cuatrimestre" : "Semestre"} activo</span>`;
  }
}

export function renderFacturacion(alumno) {
  const elRfc = document.getElementById("f-rfc");
  if (elRfc) elRfc.value = alumno.rfc ?? "";

  const elRazon = document.getElementById("f-razon");
  if (elRazon) elRazon.value = alumno.razonSocial ?? "";

  const elCfdi = document.getElementById("f-cfdi");
  if (elCfdi) elCfdi.value = alumno.usoCFDI ?? "";

  const elRegimen = document.getElementById("f-regimen");
  if (elRegimen) elRegimen.value = alumno.regimenFiscal ?? "";

  const elDom = document.getElementById("f-domicilio");
  if (elDom) elDom.value = alumno.domicilioFiscal ?? "";
}
