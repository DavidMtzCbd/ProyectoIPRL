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
      enum: ["Deposito en Cuenta", "Transferencia"],
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
      ],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Pago", pagoSchema);
