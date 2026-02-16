const Semestre = require("../models/Semestre");

exports.crearSemestre = async (req, res) => {
  try {
    const semestre = await Semestre.create(req.body);
    res.status(201).json(semestre);
  } catch (error) {
    logger.error("Error al crear un nuevo semestre", error);
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerSemestres = async (req, res) => {
  try {
    const semestres = await Semestre.find({
      alumnoID: req.params.alumnoID,
    });

    res.json(semestres);
  } catch (error) {
    logger.error("Error al obtener la lista de semestres", error);
    res.status(500).json({ error: error.message });
  }
};
