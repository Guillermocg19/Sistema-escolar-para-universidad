const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

router.get('/', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, clave, nombre, activo FROM carreras ORDER BY clave'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { clave, nombre } = req.body;
  if (!clave || !nombre) return res.status(400).json({ message: 'Clave y nombre son requeridos' });
  try {
    const result = await pool.query(
      'INSERT INTO carreras (clave, nombre) VALUES ($1, $2) RETURNING id, clave, nombre',
      [clave, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'La clave ya existe' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { clave, nombre, activo } = req.body;
  if (!clave || !nombre) return res.status(400).json({ message: 'Clave y nombre son requeridos' });
  try {
    const result = await pool.query(
      `UPDATE carreras SET clave=$1, nombre=$2, activo=$3
       WHERE id=$4 RETURNING id, clave, nombre, activo`,
      [clave, nombre, activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Carrera no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE carreras SET activo = FALSE WHERE id = $1 RETURNING id, clave, nombre',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Carrera no encontrada' });
    res.json({ message: `Carrera '${result.rows[0].nombre}' desactivada` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;