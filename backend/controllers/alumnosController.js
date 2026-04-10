/* 
En este JS definimos las operaciones CRUD para el modelo Alumno para
el manejo de la logica de negocio relacionada a los alumnos.
*/

const Alumno = require("../models/Alumno");
const Pago = require("../models/Pago");
const Semestre = require("../models/Semestre");
const Usuario = require("../models/Usuario");

const { logger } = require("../config/logger");

//Controlador que obtiene la lista de todos los alumos registrados
//en la base de datos, ordenados por fecha de creación
//en orden en el que se registran (último registrado primero).
exports.getAlumnos = async (req, res) => {
  try {
    const pagina = parseInt(req.query.pagina) || 1;
    const limite = parseInt(req.query.limite) || 0; // 0 significa sin limite
    const { busqueda, estatus } = req.query;

    const filtro = {};
    if (estatus) {
      filtro.estatus = estatus;
    }

    if (busqueda) {
      const isNum = !isNaN(busqueda) && busqueda.trim() !== '';
      if (isNum) {
        filtro.$or = [
          { matricula: Number(busqueda) }
        ];
      } else {
        filtro.$or = [
          { nombre: { $regex: busqueda, $options: "i" } },
          { apellidoPaterno: { $regex: busqueda, $options: "i" } },
          { apellidoMaterno: { $regex: busqueda, $options: "i" } },
          { ofertaAcademica: { $regex: busqueda, $options: "i" } }
        ];
      }
    }

    // Orden alfabético
    let query = Alumno.find(filtro).sort({ apellidoPaterno: 1, apellidoMaterno: 1, nombre: 1 });

    if (limite > 0) {
      const skip = (pagina - 1) * limite;
      query = query.skip(skip).limit(limite);
    }

    const alumnos = await query;
    const total = await Alumno.countDocuments(filtro);

    res.json({
      alumnos,
      total,
      paginaActual: pagina,
      totalPaginas: limite > 0 ? Math.ceil(total / limite) : 1
    });
  } catch (error) {
    logger.error("Error al obtener lista de alumnos combinada", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

//Controlador que busca un alumno por su número de matrícula
exports.getAlumnoByMatricula = async (req, res) => {
  try {
    const alumno = await Alumno.findOne({
      matricula: Number(req.params.matricula),
    });
    if (!alumno) {
      return res
        .status(404)
        .json({ message: "Alumno no encontrado con esa matrícula" });
    }
    res.json(alumno);
  } catch (error) {
    logger.error("Error al buscar alumno por matrícula", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

//Controlador que crea un nuevo alumno Y su cuenta de usuario en un solo paso.
// Si la creación del Usuario falla, elimina el Alumno (rollback manual).
exports.createAlumno = async (req, res) => {
  const { googleEmail, ...alumnoData } = req.body;

  if (!googleEmail) {
    return res.status(400).json({ message: "El correo de Gmail es requerido" });
  }

  let nuevoAlumno = null;
  try {
    // 1. Crear el Alumno
    const alumno = new Alumno({ ...alumnoData, correo: googleEmail });
    nuevoAlumno = await alumno.save();
    logger.info("Alumno creado: " + nuevoAlumno.nombre);

    // 2. Crear el Usuario vinculado
    await Usuario.create({
      googleEmail: googleEmail.toLowerCase(),
      nombre: `${alumnoData.nombre} ${alumnoData.apellidoPaterno}`,
      rol: "alumno",
      alumno: nuevoAlumno._id,
    });

    res.status(201).json(nuevoAlumno);
  } catch (error) {
    // Rollback: si el alumno se creó pero el usuario falló, eliminar el alumno
    if (nuevoAlumno) {
      await Alumno.findByIdAndDelete(nuevoAlumno._id).catch(() => {});
    }
    logger.error("Error al crear alumno/usuario", error);
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
