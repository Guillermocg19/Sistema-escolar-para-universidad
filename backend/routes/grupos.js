const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

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

router.get('/:id/materias', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id, mg.docente_id, m.id AS materia_id, m.clave, m.nombre, m.creditos,
              d.id AS doc_id, d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
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

router.get('/:id/horarios', autorizar(['admin', 'docente', 'alumno']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.id, h.materia_grupo_id, h.dia_semana,
              TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
              TO_CHAR(h.hora_fin,    'HH24:MI') AS hora_fin,
              m.clave, m.nombre AS materia
       FROM horarios h
       JOIN materia_grupo mg ON h.materia_grupo_id = mg.id
       JOIN materias m ON mg.materia_id = m.id
       WHERE mg.grupo_id = $1 AND mg.activo = TRUE
       ORDER BY m.nombre, h.dia_semana, h.hora_inicio`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { nombre, grado, turno } = req.body;
  if (!nombre || !grado) return res.status(400).json({ error: 'nombre y grado son requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO grupos (nombre, grado, turno)
       VALUES ($1,$2,$3)
       ON CONFLICT (nombre) DO UPDATE
         SET activo=TRUE, grado=EXCLUDED.grado, turno=EXCLUDED.turno
       RETURNING *`,
      [nombre, parseInt(grado), turno || 'matutino']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, grado, turno, activo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE grupos SET nombre=$1, grado=$2, turno=$3, activo=$4 WHERE id=$5 RETURNING *',
      [nombre, grado, turno, activo ?? true, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    await pool.query('UPDATE grupos SET activo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/materias', autorizar(['admin']), async (req, res) => {
  const { materia_id, docente_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO materia_grupo (grupo_id, materia_id, docente_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (materia_id, grupo_id) DO UPDATE SET activo=TRUE, docente_id=EXCLUDED.docente_id
       RETURNING *`,
      [req.params.id, materia_id, docente_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/materias/:mg_id', autorizar(['admin']), async (req, res) => {
  const { docente_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE materia_grupo SET docente_id=$1 WHERE id=$2 AND grupo_id=$3 RETURNING *',
      [docente_id || null, req.params.mg_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/materias/:mg_id', autorizar(['admin']), async (req, res) => {
  try {
    await pool.query(
      'UPDATE materia_grupo SET activo=FALSE WHERE id=$1 AND grupo_id=$2',
      [req.params.mg_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/materias/:mg_id/horarios', autorizar(['admin']), async (req, res) => {
  const { dia_semana, hora_inicio, hora_fin } = req.body;
  if (!dia_semana || !hora_inicio || !hora_fin)
    return res.status(400).json({ error: 'dia_semana, hora_inicio y hora_fin son requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO horarios (materia_grupo_id, dia_semana, hora_inicio, hora_fin)
       VALUES ($1, $2, $3, $4) RETURNING id, materia_grupo_id, dia_semana,
       TO_CHAR(hora_inicio,'HH24:MI') AS hora_inicio, TO_CHAR(hora_fin,'HH24:MI') AS hora_fin`,
      [req.params.mg_id, dia_semana, hora_inicio, hora_fin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe ese horario para esta materia' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/materias/:mg_id/horarios/:h_id', autorizar(['admin']), async (req, res) => {
  try {
    await pool.query('DELETE FROM horarios WHERE id=$1 AND materia_grupo_id=$2', [req.params.h_id, req.params.mg_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
