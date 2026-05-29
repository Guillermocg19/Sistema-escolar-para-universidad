const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const autorizar = require('../middleware/autorizar');

router.get('/', autorizar(['admin', 'docente']), async (req, res) => {
  const { periodo } = req.query;
  try {
    const result = await pool.query(
      `SELECT i.id, i.alumno_id, i.materia_grupo_id, i.periodo, i.estado,
              a.matricula, a.nombre || ' ' || a.apellidos AS alumno,
              m.clave, m.nombre AS materia, g.nombre AS grupo
       FROM inscripciones i
       JOIN alumnos a ON i.alumno_id = a.id
       JOIN materia_grupo mg ON i.materia_grupo_id = mg.id
       JOIN materias m ON mg.materia_id = m.id
       JOIN grupos g ON mg.grupo_id = g.id
       WHERE i.activo = TRUE ${periodo ? 'AND i.periodo = $1' : ''}
       ORDER BY a.apellidos, m.nombre`,
      periodo ? [periodo] : []
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alumno/:alumno_id', autorizar(['admin', 'docente', 'alumno']), async (req, res) => {
  const { periodo } = req.query;
  try {
    const result = await pool.query(
      `SELECT i.id, i.materia_grupo_id, i.periodo, i.estado,
              m.clave, m.nombre AS materia, m.creditos,
              g.nombre AS grupo,
              d.nombre || ' ' || d.apellidos AS docente_nombre
       FROM inscripciones i
       JOIN materia_grupo mg ON i.materia_grupo_id = mg.id
       JOIN materias m ON mg.materia_id = m.id
       JOIN grupos g ON mg.grupo_id = g.id
       LEFT JOIN docentes d ON mg.docente_id = d.id
       WHERE i.alumno_id = $1 AND i.activo = TRUE ${periodo ? 'AND i.periodo = $2' : ''}
       ORDER BY m.nombre`,
      periodo ? [req.params.alumno_id, periodo] : [req.params.alumno_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/materia-grupo/:mg_id', autorizar(['admin', 'docente']), async (req, res) => {
  const { periodo } = req.query;
  try {
    const result = await pool.query(
      `SELECT i.id, i.alumno_id, i.periodo, i.estado,
              a.matricula, a.nombre || ' ' || a.apellidos AS alumno
       FROM inscripciones i
       JOIN alumnos a ON i.alumno_id = a.id
       WHERE i.materia_grupo_id = $1 AND i.activo = TRUE ${periodo ? 'AND i.periodo = $2' : ''}
       ORDER BY a.apellidos`,
      periodo ? [req.params.mg_id, periodo] : [req.params.mg_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { alumno_id, materia_grupo_id, periodo } = req.body;
  const per = periodo || '2026-1';
  try {
    const reactivado = await pool.query(
      `UPDATE inscripciones SET activo=TRUE, estado='inscrito'
       WHERE alumno_id=$1 AND materia_grupo_id=$2 AND periodo=$3 AND activo=FALSE
       RETURNING *`,
      [alumno_id, materia_grupo_id, per]
    );
    if (reactivado.rows.length > 0) return res.status(201).json(reactivado.rows[0]);
    const result = await pool.query(
      `INSERT INTO inscripciones (alumno_id, materia_grupo_id, periodo)
       VALUES ($1, $2, $3) RETURNING *`,
      [alumno_id, materia_grupo_id, per]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El alumno ya está inscrito en esa materia/grupo/periodo' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/grupo', autorizar(['admin']), async (req, res) => {
  const { grupo_id, materia_grupo_ids, periodo } = req.body;
  const per = periodo || '2026-1';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const alumnos = await client.query(
      'SELECT id FROM alumnos WHERE grupo_id = $1 AND activo = TRUE', [grupo_id]
    );
    let nuevas = 0, omitidas = 0;
    for (const alumno of alumnos.rows) {
      for (const mg_id of materia_grupo_ids) {
        const reactivado = await client.query(
          `UPDATE inscripciones SET activo=TRUE, estado='inscrito'
           WHERE alumno_id=$1 AND materia_grupo_id=$2 AND periodo=$3 AND activo=FALSE
           RETURNING id`,
          [alumno.id, mg_id, per]
        );
        if (reactivado.rows.length > 0) { nuevas++; continue; }
        try {
          await client.query('SAVEPOINT sp_ins');
          await client.query(
            `INSERT INTO inscripciones (alumno_id, materia_grupo_id, periodo) VALUES ($1, $2, $3)`,
            [alumno.id, mg_id, per]
          );
          await client.query('RELEASE SAVEPOINT sp_ins');
          nuevas++;
        } catch (e) {
          await client.query('ROLLBACK TO SAVEPOINT sp_ins');
          if (e.code === '23505') omitidas++;
          else throw e;
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, nuevas, omitidas, alumnos: alumnos.rows.length });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE inscripciones SET estado=$1 WHERE id=$2 RETURNING *',
      [estado, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    await pool.query(
      "UPDATE inscripciones SET activo=FALSE, estado='baja' WHERE id=$1",
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
