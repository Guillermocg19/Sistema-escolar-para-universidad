const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

const SELECT_DOCENTE = `
  SELECT d.id, d.numero_empleado, d.nombre, d.apellidos,
         d.telefono, d.especialidad, d.activo, d.creado_en,
         u.id AS usuario_id, u.usuario, u.correo_institucional
  FROM docentes d
  LEFT JOIN usuarios u ON d.usuario_id = u.id
`;

router.get('/', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_DOCENTE + ' WHERE d.activo = TRUE ORDER BY d.id');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/mis-materias/:usuario_id', autorizar(['docente', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.clave, m.nombre, m.creditos,
              mg.id AS mg_id,
              g.id AS grupo_id, g.nombre AS grupo, g.grado, g.turno
       FROM materia_grupo mg
       JOIN materias m ON mg.materia_id = m.id
       JOIN grupos   g ON mg.grupo_id   = g.id
       JOIN docentes d ON mg.docente_id = d.id
       WHERE d.usuario_id = $1 AND mg.activo = TRUE
       ORDER BY m.nombre`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/horario/:usuario_id', autorizar(['docente', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia,
              g.id AS grupo_id, g.nombre AS grupo, g.grado, g.turno,
              h.id AS horario_id, h.dia_semana,
              TO_CHAR(h.hora_inicio,'HH24:MI') AS hora_inicio,
              TO_CHAR(h.hora_fin,   'HH24:MI') AS hora_fin,
              mg.id AS mg_id
       FROM docentes doc
       JOIN materia_grupo mg ON mg.docente_id = doc.id AND mg.activo = TRUE
       JOIN materias m ON mg.materia_id = m.id
       JOIN grupos   g ON mg.grupo_id   = g.id
       LEFT JOIN horarios h ON h.materia_grupo_id = mg.id
       WHERE doc.usuario_id = $1
       ORDER BY h.dia_semana, h.hora_inicio, g.nombre`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', autorizar(['admin', 'docente']), async (req, res) => {
  try {
    const result = await pool.query(SELECT_DOCENTE + ' WHERE d.id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, especialidad } = req.body;
  if (!nombre || !apellidos)
    return res.status(400).json({ message: 'nombre y apellidos son requeridos' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empResult = await client.query(
      `SELECT COALESCE(MAX(CAST(numero_empleado AS BIGINT)), 11000000) + 1 AS numero FROM docentes`
    );
    const numero_empleado = String(empResult.rows[0].numero);
    const usuario    = (nombre[0] + apellidos.split(' ')[0]).toLowerCase().replace(/\s/g,'') + numero_empleado;
    const contrasena = numero_empleado;
    const usuResult = await client.query(
      `INSERT INTO usuarios (usuario,contrasena,nombre,rol) VALUES ($1,$2,$3,'docente') RETURNING id`,
      [usuario, contrasena, `${nombre} ${apellidos}`]
    );
    const usuario_id = usuResult.rows[0].id;
    const rolResult = await client.query("SELECT id FROM roles WHERE nombre='docente'");
    if (rolResult.rows.length > 0)
      await client.query('UPDATE usuarios SET rol_id=$1 WHERE id=$2', [rolResult.rows[0].id, usuario_id]);
    const nip = String(Math.floor(1000 + Math.random() * 9000));
    const correo_institucional = `${nombre.split(' ')[0].toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@tec.com`;
    await client.query('UPDATE usuarios SET nip=$1,correo_institucional=$2 WHERE id=$3', [nip, correo_institucional, usuario_id]);
    const docResult = await client.query(
      `INSERT INTO docentes (numero_empleado,nombre,apellidos,email,telefono,especialidad,usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,numero_empleado,nombre,apellidos`,
      [numero_empleado, nombre, apellidos, email||null, telefono||null, especialidad||null, usuario_id]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...docResult.rows[0], usuario, contrasena_inicial: contrasena, nip, correo_institucional, mensaje: 'Docente registrado. Guardar estas credenciales.' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ message: 'El docente o usuario ya existe' });
    res.status(500).json({ message: err.message });
  } finally { client.release(); }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, especialidad, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE docentes SET nombre=$1,apellidos=$2,email=$3,telefono=$4,especialidad=$5,activo=$6
       WHERE id=$7 RETURNING id,numero_empleado,nombre,apellidos,activo`,
      [nombre, apellidos, email||null, telefono||null, especialidad||null, activo??true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE docentes SET activo=FALSE WHERE id=$1 RETURNING id,numero_empleado,nombre', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Docente no encontrado' });
    const d = result.rows[0];
    res.json({ message: `Docente '${d.nombre}' (${d.numero_empleado}) desactivado` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
