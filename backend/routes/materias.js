const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

// ── MATERIAS ──

router.get('/', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, clave, nombre, creditos, descripcion, activo FROM materias ORDER BY clave'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, clave, nombre, creditos, descripcion, activo FROM materias WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Materia no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { clave, nombre, creditos, descripcion } = req.body;
  if (!clave || !nombre) return res.status(400).json({ message: 'Clave y nombre son requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO materias (clave, nombre, creditos, descripcion)
       VALUES ($1, $2, $3, $4)
       RETURNING id, clave, nombre, creditos, descripcion`,
      [clave, nombre, creditos || 0, descripcion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'La clave ya existe' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, creditos, descripcion, activo } = req.body;
  if (!nombre) return res.status(400).json({ message: 'El nombre es requerido' });
  try {
    const result = await pool.query(
      `UPDATE materias SET nombre=$1, creditos=$2, descripcion=$3, activo=$4
       WHERE id=$5 RETURNING id, clave, nombre, creditos, activo`,
      [nombre, creditos || 0, descripcion || null, activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Materia no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE materias SET activo = FALSE WHERE id = $1 RETURNING id, clave, nombre',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Materia no encontrada' });
    const m = result.rows[0];
    res.json({ message: `Materia '${m.nombre}' (${m.clave}) desactivada` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── MATERIA_GRUPO (tabla pivot) ──

router.get('/:id/grupos', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id, g.id AS grupo_id, g.nombre AS grupo, g.grado, g.turno,
              d.id AS docente_id, d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM materia_grupo mg
       JOIN grupos   g ON mg.grupo_id   = g.id
       LEFT JOIN docentes d ON mg.docente_id = d.id
       WHERE mg.materia_id = $1 AND mg.activo = TRUE`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/grupos', autorizar(['admin']), async (req, res) => {
  const { grupo_id, docente_id } = req.body;
  if (!grupo_id) return res.status(400).json({ message: 'grupo_id es requerido' });
  try {
    const result = await pool.query(
      `INSERT INTO materia_grupo (materia_id, grupo_id, docente_id)
       VALUES ($1, $2, $3)
       RETURNING id, materia_id, grupo_id, docente_id`,
      [req.params.id, grupo_id, docente_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Esta materia ya está asignada a ese grupo' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id/grupos/:mg_id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE materia_grupo SET activo = FALSE WHERE id = $1 RETURNING id',
      [req.params.mg_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.json({ message: 'Asignación eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;