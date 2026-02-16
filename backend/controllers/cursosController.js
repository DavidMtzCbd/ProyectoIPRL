/*
En este JS definimos las operaciones CRUD para el modelo Cursos 
*/

const Curso = require("../models/Curso");
const Alumno = require("../models/Alumno");

//Controlador que obtiene la lista de todos los cursos registrados
//en la base de datos, ordenados por nombre de forma ascendente.
exports.getCursos = async (req, res) => {
  const cursos = await Curso.find().sort({ name: 1 });
  res.json(cursos);
};

//Controlador que crea un nuevo curso a partir de los datos enviados en el cuerpo de la solicitud.
exports.createCurso = async (req, res) => {
  const curso = new Curso(req.body);
  const nuevoCurso = await curso.save();
  res.status(201).json(nuevoCurso);
};

//Controlador que obtiene un curso específico por su ID.
exports.getCursoById = async (req, res) => {
  const curso = await Curso.findById(req.params.id);
  if (!curso) return res.status(404).json({ message: "Curso no encontrado" });
  res.json(curso);
};

//Controlador que actualiza un curso específico por su ID con los datos enviados en el cuerpo de la solicitud.
exports.updateCurso = async (req, res) => {
  const curso = await Curso.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!curso) return res.status(404).json({ message: "Curso no encontrado" });
  res.json(curso);
};

//Controlador que elimina un curso específico por su ID, pero solo si no tiene alumnos inscritos.
exports.deleteCurso = async (req, res) => {
  const alumnos = await Alumno.countDocuments({ curso: req.params.id });
  if (alumnos > 0) {
    return res.status(400).json({
      message: "No se puede eliminar el curso porque tiene alumnos inscritos",
    });
  }
  await Curso.findByIdAndDelete(req.params.id);
  res.json({ message: "Curso eliminado" });
};
