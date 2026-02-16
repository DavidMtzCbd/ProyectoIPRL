//Configuración de la base de datos usando Mongoose

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Conexión a la base de datos exitosa :D");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
  }
};

module.exports = connectDB;
