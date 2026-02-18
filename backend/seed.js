const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Usuario = require("./models/Usuario");
require("dotenv").config();

async function crearPrimerAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Ciframos la contraseña igual que lo hace tu authController
    const passwordHashed = await bcryptjs.hash("tu_password_aqui", 10);

    const admin = new Usuario({
      usuario: "admin_david",
      contrasena: passwordHashed,
      rol: "administrador"
    });

    await admin.save();
    console.log("¡Admin creado con éxito! Ya puedes iniciar sesión.");
    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

crearPrimerAdmin();