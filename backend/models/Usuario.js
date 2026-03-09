const mongoose = require("mongoose");

// Definición del esquema para el modelo Usuario.
// Autenticación vía Google OAuth 2.0 — sin usuario/contraseña local.

const UsuarioSchema = new mongoose.Schema(
  {
    googleEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    googleId: {
      type: String,
      default: null,
      // No unique: la búsqueda siempre es por googleEmail.
      // Se actualiza en el primer login con Google.
    },

    nombre: {
      type: String,
      required: true,
    },

    rol: {
      type: String,
      enum: ["administrador", "alumno"],
      required: true,
    },

    // Relación opcional con alumno (solo cuando rol === "alumno")
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: function () {
        return this.rol === "alumno";
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Usuario", UsuarioSchema);
