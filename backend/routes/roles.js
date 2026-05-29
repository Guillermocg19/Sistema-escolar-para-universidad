const express    = require('express');
const router     = express.Router();
const pool       = require('../db');
const autorizar  = require('../middleware/autorizar');

// Solo admin puede gestionar roles
router.get('/',     autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, descripcion, activo FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.get('/:id', autorizar(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, nombre, descripcion, activo FROM roles WHERE id = $1', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Rol no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.post('/',    autorizar(['admin']), async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ message: 'El nombre es requerido' });
  try {
    const result = await pool.query(
      'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion, activo',
      [nombre, descripcion || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'El rol ya existe' });
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.put('/:id',  autorizar(['admin']), async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, activo } = req.body;
  if (!nombre) return res.status(400).json({ message: 'El nombre es requerido' });
  try {
    const result = await pool.query(
      'UPDATE roles SET nombre=$1, descripcion=$2, activo=$3 WHERE id=$4 RETURNING id, nombre, descripcion, activo',
      [nombre, descripcion || '', activo ?? true, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Rol no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE roles SET activo = FALSE WHERE id = $1 RETURNING id, nombre', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Rol no encontrado' });
    res.json({ message: `Rol '${result.rows[0].nombre}' desactivado` });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;