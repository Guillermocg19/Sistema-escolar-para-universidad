const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

// Admin y docente pueden ver usuarios
router.get('/',     autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.usuario, u.nombre, u.rol, u.activo, r.descripcion AS rol_descripcion
       FROM usuarios u LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.activo = TRUE ORDER BY u.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    res.status(500).json({ message:error.message });
  }
});

router.get('/:id',  autorizar(['admin', 'docente']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, usuario, nombre, rol, activo FROM usuarios WHERE id = $1', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Solo admin puede crear, editar y eliminar
router.post('/',    autorizar(['admin']), async (req, res) => {
  const { usuario, contrasena, nombre, rol } = req.body;
  if (!usuario || !contrasena) return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
  try {
    const rolResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rol || 'alumno']);
    const rol_id = rolResult.rows[0]?.id || null;
    const result = await pool.query(
      'INSERT INTO usuarios (usuario, contrasena, nombre, rol, rol_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, usuario, nombre, rol',
      [usuario, contrasena, nombre || '', rol || 'alumno', rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'El usuario ya existe' });
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.put('/:id',  autorizar(['admin']), async (req, res) => {
  const { id } = req.params;
  const { nombre, rol, activo } = req.body;
  try {
    const rolResult = await pool.query('SELECT id FROM roles WHERE nombre = $1', [rol]);
    const rol_id = rolResult.rows[0]?.id || null;
    const result = await pool.query(
      'UPDATE usuarios SET nombre=$1, rol=$2, rol_id=$3, activo=$4 WHERE id=$5 RETURNING id, usuario, nombre, rol, activo',
      [nombre, rol, rol_id, activo ?? true, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id, usuario', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: `Usuario '${result.rows[0].usuario}' desactivado` });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// PUT /usuarios/:id/cambiar-nip
router.put('/:id/cambiar-nip', autorizar(['admin', 'docente', 'alumno']), async (req, res) => {
  const { nip_actual, nip_nuevo } = req.body;

  if (!nip_actual || !nip_nuevo)
    return res.status(400).json({ message: 'nip_actual y nip_nuevo son requeridos' });

  if (!/^\d{4}$/.test(nip_nuevo))
    return res.status(400).json({ message: 'El NIP debe ser exactamente 4 dígitos' });

  try {
    // Verificar NIP actual (puede ser contrasena o nip)
    const check = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1 AND (contrasena = $2 OR nip = $2)',
      [req.params.id, nip_actual]
    );

    if (check.rows.length === 0)
      return res.status(401).json({ message: 'NIP actual incorrecto' });

    await pool.query(
      'UPDATE usuarios SET nip = $1 WHERE id = $2',
      [nip_nuevo, req.params.id]
    );

    res.json({ message: 'NIP actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;