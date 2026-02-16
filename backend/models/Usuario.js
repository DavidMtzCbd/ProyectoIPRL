const mongoose = require("mongoose");

// Definición del esquema para el modelo Usuario.
// No hay registro público; solo admins crean cuentas.

const UsuarioSchema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },
    rol: { type: String, enum: ["administrador", "alumno"], required: true },

    // Relación opcional con alumno
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: function () {
        return this.rol === "alumno";
      },
    },
  },
  {
    timestamps: true, // Añade createdAt y updatedAt automáticamente
  },
);

module.exports = mongoose.model("Usuario", UsuarioSchema);
