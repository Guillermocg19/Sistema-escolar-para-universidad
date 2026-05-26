const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');

const SELECT_ALUMNO = `
  SELECT a.id, a.matricula, a.nombre, a.apellidos, a.telefono,
         a.activo, a.creado_en,
         g.id AS grupo_id, g.nombre AS grupo,
         u.id AS usuario_id, u.usuario, u.correo_institucional
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

router.get('/mis-materias/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.clave, m.nombre, m.creditos,
              g.nombre AS grupo, g.grado, g.turno,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM alumnos a
       JOIN grupos        g  ON a.grupo_id      = g.id
       JOIN materia_grupo mg ON mg.grupo_id      = g.id AND mg.activo = TRUE
       JOIN materias      m  ON mg.materia_id    = m.id
       LEFT JOIN docentes d  ON mg.docente_id    = d.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE
       ORDER BY m.nombre`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/horario/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia, g.nombre AS grupo, g.turno,
              h.dia_semana,
              TO_CHAR(h.hora_inicio,'HH24:MI') AS hora_inicio,
              TO_CHAR(h.hora_fin,   'HH24:MI') AS hora_fin,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM alumnos a
       JOIN grupos        g  ON a.grupo_id    = g.id
       JOIN materia_grupo mg ON mg.grupo_id   = g.id AND mg.activo = TRUE
       JOIN materias      m  ON mg.materia_id = m.id
       LEFT JOIN docentes d  ON mg.docente_id = d.id
       LEFT JOIN horarios h  ON h.materia_grupo_id = mg.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE
       ORDER BY h.dia_semana, h.hora_inicio`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/boleta/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const alumnoRes = await pool.query(
      'SELECT id FROM alumnos WHERE usuario_id = $1 AND activo = TRUE LIMIT 1',
      [req.params.usuario_id]
    );
    if (alumnoRes.rows.length === 0)
      return res.status(404).json({ message: 'Alumno no encontrado' });
    const alumno_id = alumnoRes.rows[0].id;
    const result = await pool.query(
      'SELECT * FROM vista_calificaciones WHERE alumno_id = $1 ORDER BY materia',
      [alumno_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/reticular/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const alumnoRes = await pool.query(
      'SELECT id FROM alumnos WHERE usuario_id = $1 AND activo = TRUE LIMIT 1',
      [req.params.usuario_id]
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ message: 'Alumno no encontrado' });
    const alumno_id = alumnoRes.rows[0].id;

    const inscritasRes = await pool.query(
      `SELECT materia_id, clave, materia, creditos, inscripcion_id,
              periodo, estado, parcial1, parcial2, parcial3,
              promedio_final, parciales_registrados
       FROM vista_calificaciones WHERE alumno_id = $1 ORDER BY materia`,
      [alumno_id]
    );
    const inscritas = inscritasRes.rows;

    const ids = inscritas.map(r => r.materia_id);
    let pendientes = [];
    if (ids.length > 0) {
      const params = ids.map((_, i) => `$${i + 1}`).join(',');
      const p = await pool.query(
        `SELECT id AS materia_id, clave, nombre AS materia, creditos
         FROM materias WHERE id NOT IN (${params}) AND activo = TRUE ORDER BY nombre`,
        ids
      );
      pendientes = p.rows;
    } else {
      const p = await pool.query(
        'SELECT id AS materia_id, clave, nombre AS materia, creditos FROM materias WHERE activo = TRUE ORDER BY nombre'
      );
      pendientes = p.rows;
    }

    const aprobadas = inscritas.filter(r =>
      r.estado === 'aprobado' ||
      (r.parciales_registrados >= 3 && parseFloat(r.promedio_final) >= 60)
    );
    const reprobadas = inscritas.filter(r =>
      r.estado === 'reprobado' ||
      (r.parciales_registrados >= 3 && parseFloat(r.promedio_final) < 60 &&
       !aprobadas.find(a => a.inscripcion_id === r.inscripcion_id))
    );
    const en_curso = inscritas.filter(r =>
      r.estado === 'inscrito' && r.parciales_registrados < 3 &&
      !aprobadas.find(a => a.inscripcion_id === r.inscripcion_id) &&
      !reprobadas.find(a => a.inscripcion_id === r.inscripcion_id)
    );
    const bajas = inscritas.filter(r => r.estado === 'baja');

    const creditosAprobados = aprobadas.reduce((s, r) => s + (parseInt(r.creditos) || 0), 0);
    const creditosTotales   = [...inscritas, ...pendientes].reduce((s, r) => s + (parseInt(r.creditos) || 0), 0);

    res.json({
      alumno_id,
      resumen: {
        aprobadas:  aprobadas.length,
        en_curso:   en_curso.length,
        reprobadas: reprobadas.length,
        bajas:      bajas.length,
        pendientes: pendientes.length,
        creditos_aprobados: creditosAprobados,
        creditos_totales:   creditosTotales,
        avance_pct: creditosTotales > 0 ? Math.round((creditosAprobados / creditosTotales) * 100) : 0
      },
      aprobadas,
      en_curso,
      reprobadas,
      bajas,
      pendientes: pendientes.map(p => ({ ...p, estado: 'pendiente' }))
    });
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
    const matResult = await client.query('SELECT generar_matricula() AS matricula');
    const matricula = matResult.rows[0].matricula;
    const usuario    = (nombre[0] + apellidos.split(' ')[0]).toLowerCase().replace(/\s/g,'') + matricula;
    const contrasena = matricula;
    const usuResult = await client.query(
      `INSERT INTO usuarios (usuario, contrasena, nombre, rol) VALUES ($1,$2,$3,'alumno') RETURNING id`,
      [usuario, contrasena, `${nombre} ${apellidos}`]
    );
    const usuario_id = usuResult.rows[0].id;
    const rolResult = await client.query("SELECT id FROM roles WHERE nombre = 'alumno'");
    if (rolResult.rows.length > 0)
      await client.query('UPDATE usuarios SET rol_id=$1 WHERE id=$2', [rolResult.rows[0].id, usuario_id]);
    const nip = String(Math.floor(1000 + Math.random() * 9000));
    const correo_institucional = `${nombre.split(' ')[0].toLowerCase()}.${apellidos.split(' ')[0].toLowerCase()}@tec.com`;
    await client.query('UPDATE usuarios SET nip=$1, correo_institucional=$2 WHERE id=$3', [nip, correo_institucional, usuario_id]);
    const alumResult = await client.query(
      `INSERT INTO alumnos (matricula,nombre,apellidos,email,telefono,grupo_id,usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,matricula,nombre,apellidos`,
      [matricula, nombre, apellidos, email||null, telefono||null, grupo_id||null, usuario_id]
    );
    await client.query('COMMIT');
    res.status(201).json({ ...alumResult.rows[0], usuario, contrasena_inicial: contrasena, nip, correo_institucional, mensaje: 'Alumno registrado. Guardar estas credenciales.' });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ message: 'El alumno o usuario ya existe' });
    res.status(500).json({ message: err.message });
  } finally { client.release(); }
});

router.put('/:id', autorizar(['admin']), async (req, res) => {
  const { nombre, apellidos, email, telefono, grupo_id, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE alumnos SET nombre=$1,apellidos=$2,email=$3,telefono=$4,grupo_id=$5,activo=$6
       WHERE id=$7 RETURNING id,matricula,nombre,apellidos,activo`,
      [nombre, apellidos, email||null, telefono||null, grupo_id||null, activo??true, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE alumnos SET activo=FALSE WHERE id=$1 RETURNING id,matricula,nombre', [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alumno no encontrado' });
    const a = result.rows[0];
    res.json({ message: `Alumno '${a.nombre}' (${a.matricula}) desactivado` });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
