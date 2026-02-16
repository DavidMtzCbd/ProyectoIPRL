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
  },
  { timestamps: true },
);

module.exports = mongoose.model("Alumno", alumnoSchema);
