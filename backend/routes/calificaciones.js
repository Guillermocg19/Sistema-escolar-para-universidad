const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

// GET /calificaciones/grupo/:grupo_id/materia/:materia_id
// Lista alumnos del grupo con sus calificaciones en esa materia
router.get('/grupo/:grupo_id/materia/:materia_id', autorizar(['docente', 'admin']), async (req, res) => {
  const { grupo_id, materia_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.id AS alumno_id, a.matricula, a.nombre, a.apellidos,
              c.id AS cal_id, c.parcial1, c.parcial2, c.parcial3, c.promedio, c.periodo
       FROM alumnos a
       LEFT JOIN calificaciones c
         ON c.alumno_id = a.id AND c.materia_id = $2
       WHERE a.grupo_id = $1 AND a.activo = TRUE
       ORDER BY a.apellidos, a.nombre`,
      [grupo_id, materia_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /calificaciones — crear o actualizar calificación
router.post('/', autorizar(['docente', 'admin']), async (req, res) => {
  const { alumno_id, materia_id, parcial1, parcial2, parcial3, periodo } = req.body;
  if (!alumno_id || !materia_id)
    return res.status(400).json({ message: 'alumno_id y materia_id son requeridos' });

  // Calcular promedio automáticamente
  const notas  = [parcial1, parcial2, parcial3].filter(n => n !== null && n !== undefined && n !== '');
  const promedio = notas.length > 0
    ? (notas.reduce((s, n) => s + parseFloat(n), 0) / notas.length).toFixed(2)
    : null;

  try {
    const result = await pool.query(
      `INSERT INTO calificaciones (alumno_id, materia_id, parcial1, parcial2, parcial3, promedio, periodo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (alumno_id, materia_id, periodo)
       DO UPDATE SET
         parcial1  = EXCLUDED.parcial1,
         parcial2  = EXCLUDED.parcial2,
         parcial3  = EXCLUDED.parcial3,
         promedio  = EXCLUDED.promedio
       RETURNING *`,
      [alumno_id, materia_id, parcial1 || null, parcial2 || null, parcial3 || null, promedio, periodo || '2025-1']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /calificaciones/docente/:usuario_id/horario
// Horario del docente con días y horas
router.get('/docente/:usuario_id/horario', autorizar(['docente', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia, g.nombre AS grupo, g.grado, g.turno,
              mg.dia_semana, mg.hora_inicio, mg.hora_fin
       FROM materia_grupo mg
       JOIN materias m ON mg.materia_id = m.id
       JOIN grupos   g ON mg.grupo_id   = g.id
       JOIN docentes d ON mg.docente_id = d.id
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