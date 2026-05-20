const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM grupos WHERE activo = TRUE ORDER BY grado, nombre'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM grupos WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grupo no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/materias', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id, m.clave, m.nombre, m.creditos,
              d.nombre || ' ' || d.apellidos AS docente_nombre
       FROM materia_grupo mg
       JOIN materias m ON mg.materia_id = m.id
       LEFT JOIN docentes d ON mg.docente_id = d.id
       WHERE mg.grupo_id = $1 AND mg.activo = TRUE
       ORDER BY m.nombre`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, grado, turno } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO grupos (nombre, grado, turno) VALUES ($1,$2,$3) RETURNING *',
      [nombre, grado, turno]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, grado, turno, activo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE grupos SET nombre=$1, grado=$2, turno=$3, activo=$4 WHERE id=$5 RETURNING *',
      [nombre, grado, turno, activo, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE grupos SET activo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
