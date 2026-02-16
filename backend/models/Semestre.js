const mongoose = require("mongoose");

/**
 * Modelo semestre, almacena datos para mantener un registro de los
 * pagos realizados durante ese periodo semestral.
 */

const semestreSchema = new mongoose.Schema(
  {
    alumnoID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
    },

    numSemestre: {
      type: Number,
      required: true,
    },

    periodo: {
      type: String,
      required: true,
    },

    inscripción: {
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

    totalPagado: {
      type: Number,
      default: 0,
    },

    saldoSemestre: {
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
          dafualt: 0,
        },
        fechaPago: Date,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Semestre", semestreSchema);
