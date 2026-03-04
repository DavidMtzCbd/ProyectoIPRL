import { formatMoney } from "../ui.js";

export function renderPerfil(alumno) {
  const nombre = `${alumno.apellidoPaterno} ${alumno.apellidoMaterno} ${alumno.nombre}`;

  const elNombre = document.getElementById("alumno-nombre");
  if (elNombre) elNombre.textContent = nombre;

  const elOferta = document.getElementById("alumno-oferta");
  if (elOferta) elOferta.textContent = alumno.ofertaAcademica;

  const elMat = document.getElementById("alumno-matricula-chip");
  if (elMat)
    elMat.innerHTML = `<i class="bi bi-person-badge-fill"></i> Matrícula: ${alumno.matricula}`;

  // Estatus chip
  const estatusChip = document.getElementById("alumno-estatus-chip");
  if (estatusChip) {
    const cls =
      alumno.estatus === "Al corriente"
        ? "success"
        : alumno.estatus === "Adeudo"
          ? "danger"
          : "warning";
    estatusChip.className = `chip chip--${cls}`;
    estatusChip.innerHTML = `<i class="bi bi-circle-fill" style="font-size:.5rem"></i> ${alumno.estatus}`;
  }

  // Tarjetas de resumen
  const cardSaldo = document.getElementById("card-saldo");
  if (cardSaldo) {
    cardSaldo.textContent = formatMoney(alumno.saldoActual);
    cardSaldo.className = `summary-card__value ${alumno.saldoActual > 0 ? "summary-card__value--red" : "summary-card__value--green"}`;
  }

  const estatusBadge = document.getElementById("card-estatus");
  if (estatusBadge) {
    const clsBadge =
      alumno.estatus === "Al corriente"
        ? "corriente"
        : alumno.estatus === "Adeudo"
          ? "adeudo"
          : "convenio";
    estatusBadge.className = `status-badge status-badge--${clsBadge}`;
    estatusBadge.innerHTML = `<i class="bi bi-circle-fill" style="font-size:.5rem"></i> ${alumno.estatus}`;
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
