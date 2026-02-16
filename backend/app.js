//Configuración de variables de entorno y dependencias como express y cors
const express = require("express");
const cors = require("cors");

//Importar configuración de la base de datos y middlewares personalizados
const connectDB = require("./config/db");
const apiLogger = require("./middlewares/apiLogger");
const errorHandler = require("./middlewares/errorHandler");

//Importar rutas de la aplicación
const cursosRoutes = require("./routes/cursosRoutes");
const alumnosRoutes = require("./routes/alumnosRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const semestreRoutes = require("./routes/semestreRoutes");
const pagoRoutes = require("./routes/pagoRoutes");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

//Conectar a la base de datos
connectDB();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use(apiLogger);

//Rutas de la aplicación
app.use("/api/cursos", cursosRoutes);
app.use("/api/alumnos", alumnosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/semestres", semestreRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/", healthRoutes);
app.use("/api/auth", authRoutes);

//Manejo de errores
app.use(errorHandler);

//Exportar la aplicación para su uso en otros módulos
module.exports = app;
