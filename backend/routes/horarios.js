const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

router.put('/materia-grupo/:mg_id', autorizar(['admin']), async (req, res) => {
  const { dia_semana, hora_inicio, hora_fin, aula_id } = req.body;
  const mg_id = req.params.mg_id;

  if (!dia_semana || !hora_inicio || !hora_fin)
    return res.status(400).json({ message: 'dia_semana, hora_inicio y hora_fin son requeridos' });

  try {
    const mgRes = await pool.query(
      'SELECT id, docente_id, grupo_id FROM materia_grupo WHERE id = $1 AND activo = TRUE',
      [mg_id]
    );
    if (!mgRes.rows[0]) return res.status(404).json({ message: 'Materia-grupo no encontrada' });

    const { docente_id, grupo_id } = mgRes.rows[0];

    if (docente_id) {
      const cd = await pool.query(
        `SELECT mg.id, m.nombre AS materia, g.nombre AS grupo
         FROM materia_grupo mg
         JOIN materias m ON mg.materia_id = m.id
         JOIN grupos   g ON mg.grupo_id   = g.id
         WHERE mg.docente_id = $1 AND mg.dia_semana = $2 AND mg.id <> $3
           AND mg.activo = TRUE AND mg.hora_inicio IS NOT NULL
           AND NOT (mg.hora_fin <= $4 OR mg.hora_inicio >= $5)`,
        [docente_id, dia_semana, mg_id, hora_inicio, hora_fin]
      );
      if (cd.rows.length > 0) {
        const c = cd.rows[0];
        return res.status(409).json({ message: `Conflicto: el docente ya imparte "${c.materia}" (Grupo ${c.grupo}) en ese horario` });
      }
    }

    if (aula_id) {
      const ca = await pool.query(
        `SELECT mg.id, m.nombre AS materia, g.nombre AS grupo
         FROM materia_grupo mg
         JOIN materias m ON mg.materia_id = m.id
         JOIN grupos   g ON mg.grupo_id   = g.id
         WHERE mg.aula_id = $1 AND mg.dia_semana = $2 AND mg.id <> $3
           AND mg.activo = TRUE AND mg.hora_inicio IS NOT NULL
           AND NOT (mg.hora_fin <= $4 OR mg.hora_inicio >= $5)`,
        [aula_id, dia_semana, mg_id, hora_inicio, hora_fin]
      );
      if (ca.rows.length > 0) {
        const c = ca.rows[0];
        return res.status(409).json({ message: `Conflicto: el aula ya está ocupada por "${c.materia}" (Grupo ${c.grupo}) en ese horario` });
      }
    }

    const cg = await pool.query(
      `SELECT mg.id, m.nombre AS materia
       FROM materia_grupo mg
       JOIN materias m ON mg.materia_id = m.id
       WHERE mg.grupo_id = $1 AND mg.dia_semana = $2 AND mg.id <> $3
         AND mg.activo = TRUE AND mg.hora_inicio IS NOT NULL
         AND NOT (mg.hora_fin <= $4 OR mg.hora_inicio >= $5)`,
      [grupo_id, dia_semana, mg_id, hora_inicio, hora_fin]
    );
    if (cg.rows.length > 0) {
      const c = cg.rows[0];
      return res.status(409).json({ message: `Conflicto: el grupo ya tiene "${c.materia}" en ese horario` });
    }

    const result = await pool.query(
      `UPDATE materia_grupo SET dia_semana=$1, hora_inicio=$2, hora_fin=$3, aula_id=$4
       WHERE id=$5 RETURNING id, dia_semana, hora_inicio, hora_fin, aula_id`,
      [dia_semana, hora_inicio, hora_fin, aula_id || null, mg_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/grupo/:grupo_id', autorizar(['admin', 'docente', 'alumno']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id AS mg_id, m.clave, m.nombre AS materia,
              mg.dia_semana, mg.hora_inicio, mg.hora_fin,
              a.nombre AS aula, a.capacidad,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM materia_grupo mg
       JOIN materias m ON mg.materia_id = m.id
       LEFT JOIN docentes d ON mg.docente_id = d.id
       LEFT JOIN aulas    a ON mg.aula_id    = a.id
       WHERE mg.grupo_id = $1 AND mg.activo = TRUE
       ORDER BY mg.dia_semana, mg.hora_inicio`,
      [req.params.grupo_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/docente/:usuario_id', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id AS mg_id, m.clave, m.nombre AS materia,
              g.nombre AS grupo, g.grado, g.turno,
              mg.dia_semana, mg.hora_inicio, mg.hora_fin,
              a.nombre AS aula
       FROM materia_grupo mg
       JOIN materias  m  ON mg.materia_id = m.id
       JOIN grupos    g  ON mg.grupo_id   = g.id
       JOIN docentes  d  ON mg.docente_id = d.id
       LEFT JOIN aulas a ON mg.aula_id    = a.id
       WHERE d.usuario_id = $1 AND mg.activo = TRUE
       ORDER BY mg.dia_semana, mg.hora_inicio`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
