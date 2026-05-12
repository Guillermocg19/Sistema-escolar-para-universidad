const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

const SELECT_DOCENTE = `
  SELECT d.id, d.numero_empleado, d.nombre, d.apellidos, d.email,
         d.telefono, d.especialidad, d.activo, d.creado_en,
         u.id AS usuario_id, u.usuario
  FROM docentes d
  LEFT JOIN usuarios u ON d.usuario_id = u.id
`;

router.get('/', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_DOCENTE + ' WHERE d.activo = TRUE ORDER BY d.id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_DOCENTE + ' WHERE d.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { numero_empleado, nombre, apellidos, email, telefono, especialidad, usuario_id } = req.body;

  if (!numero_empleado || !nombre || !apellidos)
    return res.status(400).json({ message: 'numero_empleado, nombre y apellidos son requeridos' });

  try {
    const result = await pool.query(
      `INSERT INTO docentes (numero_empleado, nombre, apellidos, email, telefono, especialidad, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, numero_empleado, nombre, apellidos, email`,
      [numero_empleado, nombre, apellidos, email || null, telefono || null, especialidad || null, usuario_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'El número de empleado o email ya existe' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, especialidad, usuario_id, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE docentes SET nombre=$1, apellidos=$2, email=$3, telefono=$4,
       especialidad=$5, usuario_id=$6, activo=$7 WHERE id=$8
       RETURNING id, numero_empleado, nombre, apellidos, activo`,
      [nombre, apellidos, email || null, telefono || null, especialidad || null, usuario_id || null, activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'El email ya está en uso' });
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE docentes SET activo = FALSE WHERE id = $1 RETURNING id, numero_empleado, nombre',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    const d = result.rows[0];
    res.json({ message: `Docente '${d.nombre}' (${d.numero_empleado}) desactivado` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
