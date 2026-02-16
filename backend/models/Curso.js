const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true },
    descripcion: { type: String, required: true },
    duracionMeses: { type: Number, required: true },
    status: {
      type: String,
      enum: ["disponible", "no disponible"],
      default: "disponible",
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
  },
);

module.exports = mongoose.model("Curso", usuarioSchema);
