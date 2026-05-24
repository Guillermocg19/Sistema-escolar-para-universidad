const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/inscripcion/:inscripcion_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM calificaciones WHERE inscripcion_id=$1 ORDER BY parcial',
      [req.params.inscripcion_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usuario/:usuario_id', async (req, res) => {
  const { periodo } = req.query;
  try {
    const alumnoRes = await pool.query(
      'SELECT id FROM alumnos WHERE usuario_id=$1 AND activo=TRUE LIMIT 1',
      [req.params.usuario_id]
    );
    if (alumnoRes.rows.length === 0)
      return res.status(404).json({ error: 'Alumno no encontrado' });
    const alumno_id = alumnoRes.rows[0].id;
    const result = await pool.query(
      `SELECT * FROM vista_calificaciones
       WHERE alumno_id=$1 ${periodo ? 'AND periodo=$2' : ''}
       ORDER BY materia`,
      periodo ? [alumno_id, periodo] : [alumno_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/alumno/:alumno_id', async (req, res) => {
  const { periodo } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM vista_calificaciones
       WHERE alumno_id=$1 ${periodo ? 'AND periodo=$2' : ''}
       ORDER BY materia`,
      periodo ? [req.params.alumno_id, periodo] : [req.params.alumno_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/materia-grupo/:mg_id', async (req, res) => {
  const { periodo } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM vista_calificaciones
       WHERE materia_grupo_id=$1 ${periodo ? 'AND periodo=$2' : ''}
       ORDER BY alumno`,
      periodo ? [req.params.mg_id, periodo] : [req.params.mg_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { inscripcion_id, parcial, calificacion, observaciones, registrado_por } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cal = await client.query(
      `INSERT INTO calificaciones (inscripcion_id, parcial, calificacion, observaciones, registrado_por)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (inscripcion_id, parcial) DO UPDATE
         SET calificacion=$3, observaciones=$4, registrado_por=$5, creado_en=NOW()
       RETURNING *`,
      [inscripcion_id, parcial, calificacion, observaciones, registrado_por]
    );

    const countRes = await client.query(
      'SELECT COUNT(*) FROM calificaciones WHERE inscripcion_id=$1',
      [inscripcion_id]
    );
    if (parseInt(countRes.rows[0].count) === 3) {
      const sumRes = await client.query(
        'SELECT SUM(calificacion) FROM calificaciones WHERE inscripcion_id=$1',
        [inscripcion_id]
      );
      const promedio = parseFloat(sumRes.rows[0].sum) / 3;
      const nuevoEstado = promedio >= 60 ? 'aprobado' : 'reprobado';
      await client.query(
        'UPDATE inscripciones SET estado=$1 WHERE id=$2',
        [nuevoEstado, inscripcion_id]
      );
    }

    await client.query('COMMIT');

    const resumen = await pool.query(
      'SELECT * FROM vista_calificaciones WHERE inscripcion_id=$1',
      [inscripcion_id]
    );
    res.status(201).json({ calificacion: cal.rows[0], resumen: resumen.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
