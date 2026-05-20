const express = require('express');
const router  = express.Router();
const pool    = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.usuario, u.correo_institucional
       FROM docentes d
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.activo = TRUE ORDER BY d.apellidos`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.usuario, u.correo_institucional
       FROM docentes d LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mis-materias/:usuario_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mg.id AS mg_id, m.clave, m.nombre, m.creditos,
              g.nombre AS grupo, g.grado, g.turno
       FROM docentes d
       JOIN materia_grupo mg ON mg.docente_id = d.id AND mg.activo = TRUE
       JOIN materias m ON m.id = mg.materia_id
       JOIN grupos g ON g.id = mg.grupo_id
       WHERE d.usuario_id = $1 AND d.activo = TRUE
       ORDER BY m.nombre`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/por-usuario/:usuario_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, apellidos, numero_empleado FROM docentes WHERE usuario_id=$1 AND activo=TRUE LIMIT 1',
      [req.params.usuario_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Docente no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, apellidos, email, telefono, especialidad } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const num_emp = await client.query('SELECT generar_numero_empleado() AS num');
    const numero_empleado = num_emp.rows[0].num;
    const nip = Math.floor(100000 + Math.random() * 900000).toString();
    const usuario = numero_empleado;
    const correo = `${numero_empleado}@universidad.edu.mx`;
    const usuarioRes = await client.query(
      `INSERT INTO usuarios (usuario, contrasena, nombre, rol, nip, correo_institucional)
       VALUES ($1,$2,$3,'docente',$4,$5) RETURNING id`,
      [usuario, nip, `${nombre} ${apellidos}`, nip, correo]
    );
    const usuario_id = usuarioRes.rows[0].id;
    const docenteRes = await client.query(
      `INSERT INTO docentes (numero_empleado, nombre, apellidos, email, telefono, especialidad, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [numero_empleado, nombre, apellidos, email, telefono, especialidad, usuario_id]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...docenteRes.rows[0], usuario, nip, correo_institucional: correo });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, apellidos, email, telefono, especialidad, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE docentes SET nombre=$1, apellidos=$2, email=$3,
       telefono=$4, especialidad=$5, activo=$6 WHERE id=$7 RETURNING *`,
      [nombre, apellidos, email, telefono, especialidad, activo, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE docentes SET activo=FALSE WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
