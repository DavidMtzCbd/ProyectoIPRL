/* 
En este JS definimos las operaciones CRUD para el modelo Alumno para
el manejo de la logica de negocio relacionada a los alumnos.
*/

const Alumno = require("../models/Alumno");
const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");

const { logger } = require("../config/logger");

//Controlador que obtiene la lista de todos los alumos registrados
//en la base de datos, ordenados por fecha de creación
//en orden en el que se registran (último registrado primero).
exports.getAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumno.find().sort({ createdAt: -1 });
    res.json(alumnos);
  } catch (error) {
    logger.error("Error al obtener lista de alumnos", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

//Controlador que crea un nuevo alumno a partir de los datos enviados en el cuerpo de la solicitud.
exports.createAlumno = async (req, res) => {
  try {
    const alumno = new Alumno(req.body);
    const nuevoAlumno = await alumno.save();
    logger.info("Alumno creado: " + nuevoAlumno.nombre);
    res.status(201).json(nuevoAlumno);
  } catch (error) {
    logger.error("Error al crear alumno", error);
    res.status(400).json({ message: error.message });
  }
};

//Controlador que obtiene un alumno específico por su ID.
exports.getAlumnoById = async (req, res) => {
  try {
    const alumno = await Alumno.findById(req.params.id);
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }
    res.json(alumno);
  } catch (error) {
    logger.error("Error al obtener alumno", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

//Controlador que actualiza un alumno específico por su ID con los datos enviados en el cuerpo de la solicitud.
exports.updateAlumno = async (req, res) => {
  try {
    const alumno = await Alumno.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!alumno) {
      return res.status(404).json({ message: "Alumno no encontrado" });
    }
    res.json(alumno);
  } catch (error) {
    logger.error("Error al actualizar alumno", error);
    res.status(400).json({ message: error.message });
  }
};

//Controlador que elimina un alumno específico por su ID.
exports.deleteAlumno = async (req, res) => {
  const alumno = await Alumno.findByIdAndDelete(req.params.id);
  if (!alumno) return res.status(404).json({ message: "Alumno no encontrado" });
  logger.info("Alumno eliminado: " + alumno.nombre);
  res.json({ message: "Alumno eliminado" });
};
