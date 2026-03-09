const mongoose = require("mongoose");

/**
 * Esquema de Pago
 * Permite el registro individual de cada pago realizado
 */

const pagoSchema = new mongoose.Schema(
  {
    alumnoID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
    },

    semestreID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semestre",
    },

    numPago: {
      type: Number,
    },

    // Número de movimiento: secuencial global automático (1, 2, 3…)
    movimiento: {
      type: Number,
      unique: true,
    },

    // Folio de factura: solo cuando factura === "Sí" (F-0001, F-0002…)
    folioFactura: {
      type: String,
      default: null,
    },

    fechaPago: {
      type: Date,
      required: true,
    },

    monto: {
      type: Number,
      required: true,
    },

    metodoPago: {
      type: String,
      enum: ["Deposito en efectivo", "Transferencia"],
      required: true,
    },

    referencia: String,
    factura: String,

    concepto: {
      type: String,
      enum: [
        "Inscripción",
        "Reinscripción",
        "Ingeniería Colegiatura",
        "Extraordinarios",
        "Maestría Colegiatura",
        "Titulación",
        "Certificados",
        "Recuperación de cartera",
        "Hergonomia colegiatura",
        "Diplomado",
        "Curso",
      ],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Pago", pagoSchema);
