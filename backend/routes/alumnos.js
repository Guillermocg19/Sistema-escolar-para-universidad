const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

const SELECT_ALUMNO = `
  SELECT a.id, a.matricula, a.nombre, a.apellidos, a.email, a.telefono,
         a.activo, a.creado_en,
         g.id AS grupo_id, g.nombre AS grupo,
         u.id AS usuario_id, u.usuario
  FROM alumnos a
  LEFT JOIN grupos   g ON a.grupo_id   = g.id
  LEFT JOIN usuarios u ON a.usuario_id = u.id
`;

router.get('/', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_ALUMNO + ' WHERE a.activo = TRUE ORDER BY a.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_ALUMNO + ' WHERE a.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { matricula, nombre, apellidos, email, telefono, grupo_id, usuario_id } = req.body;

  if (!matricula || !nombre || !apellidos)
    return res.status(400).json({ message: 'matricula, nombre y apellidos son requeridos' });

  if (!/^2[1-9]\d{6}$/.test(matricula))
    return res.status(400).json({ message: 'La matrícula debe tener formato YYNNNNNN (ej. 22440419)' });

  try {
    const result = await pool.query(
      `INSERT INTO alumnos (matricula, nombre, apellidos, email, telefono, grupo_id, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, matricula, nombre, apellidos, email`,
      [matricula, nombre, apellidos, email || null, telefono || null, grupo_id || null, usuario_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'La matrícula o email ya existe' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, grupo_id, usuario_id, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE alumnos SET nombre=$1, apellidos=$2, email=$3, telefono=$4,
       grupo_id=$5, usuario_id=$6, activo=$7 WHERE id=$8
       RETURNING id, matricula, nombre, apellidos, activo`,
      [nombre, apellidos, email || null, telefono || null, grupo_id || null, usuario_id || null, activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'El email ya está en uso' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE alumnos SET activo = FALSE WHERE id = $1 RETURNING id, matricula, nombre',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    const a = result.rows[0];
    res.json({ message: `Alumno '${a.nombre}' (${a.matricula}) desactivado` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
