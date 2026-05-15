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
  const { nombre, apellidos, email, telefono, grupo_id } = req.body;

  if (!nombre || !apellidos)
    return res.status(400).json({ message: 'nombre y apellidos son requeridos' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Generar matrícula automática
    const matResult = await client.query('SELECT generar_matricula() AS matricula');
    const matricula = matResult.rows[0].matricula;

    // 2. Crear usuario automático: primera letra del nombre + apellido + matricula
    const usuario    = (nombre[0] + apellidos.split(' ')[0]).toLowerCase().replace(/\s/g,'') + matricula;
    const contrasena = matricula; // contraseña inicial = matrícula

    // 3. Crear usuario en tabla usuarios
    const usuResult = await client.query(
      `INSERT INTO usuarios (usuario, contrasena, nombre, rol)
       VALUES ($1, $2, $3, 'alumno')
       RETURNING id`,
      [usuario, contrasena, `${nombre} ${apellidos}`]
    );
    const usuario_id = usuResult.rows[0].id;

    // 4. Actualizar rol_id
    const rolResult = await client.query("SELECT id FROM roles WHERE nombre = 'alumno'");
    if (rolResult.rows.length > 0) {
      await client.query('UPDATE usuarios SET rol_id = $1 WHERE id = $2', [rolResult.rows[0].id, usuario_id]);
    }

    // 5. Crear alumno
    const alumResult = await client.query(
      `INSERT INTO alumnos (matricula, nombre, apellidos, email, telefono, grupo_id, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, matricula, nombre, apellidos`,
      [matricula, nombre, apellidos, email || null, telefono || null, grupo_id || null, usuario_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...alumResult.rows[0],
      usuario,
      contrasena_inicial: contrasena,
      mensaje: 'Alumno registrado. Guardar estas credenciales.'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ message: 'El alumno o usuario ya existe' });
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, grupo_id, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE alumnos SET nombre=$1, apellidos=$2, email=$3, telefono=$4,
       grupo_id=$5, activo=$6 WHERE id=$7
       RETURNING id, matricula, nombre, apellidos, activo`,
      [nombre, apellidos, email || null, telefono || null, grupo_id || null, activo ?? true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
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