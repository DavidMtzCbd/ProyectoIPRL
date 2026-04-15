const mongoose = require("mongoose");

const alumnoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    apellidoPaterno: {
      type: String,
      required: true,
      trim: true,
    },

    apellidoMaterno: {
      type: String,
      required: true,
      trim: true,
    },

    matricula: {
      type: Number,
      required: true,
      unique: true,
      uppercase: true,
    },

    correo: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    ofertaAcademica: {
      type: String,
      required: true,
    },

    //Se queda en 0 porque se define más adelante para recalcularse
    saldoActual: {
      type: Number,
      default: 0,
    },

    estatus: {
      type: String,
      enum: ["Al corriente", "Adeudo", "Convenio"],
      default: "Al corriente",
    },

    // ── Datos de facturación (opcionales, los registra el alumno) ─────────
    rfc: { type: String, trim: true, uppercase: true, default: null },
    razonSocial: { type: String, trim: true, default: null },
    usoCFDI: { type: String, trim: true, default: null },
    regimenFiscal: { type: String, trim: true, default: null },
    domicilioFiscal: { type: String, trim: true, default: null },

    // ── Notas del administrador ───────────────────────────────────
    notas: { type: String, default: "" },

    // ── Titulación y Certificado ──────────────────────────────────
    titulacion: {
      activo: { type: Boolean, default: false },
      costoCertificado: { type: Number, default: 0 },
      costoTitulacion: { type: Number, default: 0 }
    }
  },
  { timestamps: true },
);

module.exports = mongoose.model("Alumno", alumnoSchema);
