const mongoose = require("mongoose");

/**
 * Modelo cuatrimestre, almacena datos para mantener un registro de los
 * pagos realizados durante ese periodo cuatrimestral (Maestrías).
 */

const cuatrimestreSchema = new mongoose.Schema(
  {
    alumnoID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
    },

    numCuatrimestre: {
      type: Number,
      required: true,
    },

    periodo: {
      type: String, // ej. "2026 Enero-Abril"
      required: true,
    },

    inscripcion: {
      type: Number,
      default: 0,
      required: true,
    },

    reinscripcion: {
      type: Number,
      default: 0,
      required: true,
    },

    colegiaturaMensual: {
      type: Number,
      required: true,
    },

    descuentoPorcentaje: {
      type: Number,
      required: true,
    },

    estatusSemestre: {
      type: String,
      enum: ["En curso", "Finalizado"],
      default: "En curso",
    },

    totalPagado: {
      type: Number,
      default: 0,
    },

    saldoCuatrimestre: {
      type: Number,
      default: 0,
    },

    mensualidades: [
      {
        mes: String,
        montoPagado: {
          type: Number,
          default: 0,
        },
        saldoVencido: {
          type: Number,
          default: 0,
        },
        fechaPago: Date,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cuatrimestre", cuatrimestreSchema);
