const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

router.get('/', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, numero, capacidad, edificio, tipo, activo FROM aulas ORDER BY numero'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { numero, capacidad, edificio, tipo } = req.body;
  if (!numero) return res.status(400).json({ message: 'El número de aula es requerido' });
  try {
    const result = await pool.query(
      `INSERT INTO aulas (numero, capacidad, edificio, tipo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, numero, capacidad, edificio, tipo`,
      [numero, capacidad || 30, edificio || null, tipo || 'salon']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'El número de aula ya existe' });
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { numero, capacidad, edificio, tipo, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE aulas SET numero=$1, capacidad=$2, edificio=$3, tipo=$4, activo=$5
       WHERE id=$6 RETURNING id, numero, capacidad, edificio, tipo, activo`,
      [numero, capacidad || 30, edificio || null, tipo || 'salon', activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Aula no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE aulas SET activo = FALSE WHERE id = $1 RETURNING id, numero',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Aula no encontrada' });
    res.json({ message: `Aula '${result.rows[0].numero}' desactivada` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;