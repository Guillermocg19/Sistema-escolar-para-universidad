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

    // 5. Generar NIP de 4 dígitos
    const nip = String(Math.floor(1000 + Math.random() * 9000));

    // Generar correo institucional
    const primerNombre   = nombre.split(' ')[0].toLowerCase();
    const primerApellido = apellidos.split(' ')[0].toLowerCase();
    const correo_institucional = `${primerNombre}.${primerApellido}@tec.com`;

    // 6. Guardar NIP y correo en el usuario
    await client.query(
    'UPDATE usuarios SET nip = $1, correo_institucional = $2 WHERE id = $3',
    [nip, correo_institucional, usuario_id]
);

    // 7. Crear alumno
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
      nip,
      correo_institucional,
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

// Materias del alumno por su usuario_id
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

// GET /alumnos/horario/:usuario_id — horario del alumno
router.get('/horario/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia, g.nombre AS grupo, g.turno,
              mg.dia_semana, mg.hora_inicio, mg.hora_fin,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM alumnos a
       JOIN grupos        g  ON a.grupo_id   = g.id
       JOIN materia_grupo mg ON mg.grupo_id  = g.id AND mg.activo = TRUE
       JOIN materias      m  ON mg.materia_id = m.id
       LEFT JOIN docentes d  ON mg.docente_id = d.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE
       ORDER BY mg.dia_semana, mg.hora_inicio`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /alumnos/boleta/:usuario_id — boleta de calificaciones
router.get('/boleta/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia, m.creditos,
              c.parcial1, c.parcial2, c.parcial3, c.promedio, c.periodo,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM alumnos a
       JOIN grupos        g  ON a.grupo_id    = g.id
       JOIN materia_grupo mg ON mg.grupo_id   = g.id AND mg.activo = TRUE
       JOIN materias      m  ON mg.materia_id = m.id
       LEFT JOIN docentes d  ON mg.docente_id = d.id
       LEFT JOIN calificaciones c
         ON c.alumno_id = a.id AND c.materia_id = m.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE
       ORDER BY m.nombre`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /alumnos/horario/:usuario_id
router.get('/horario/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.clave, m.nombre AS materia,
              g.nombre AS grupo, g.turno,
              mg.dia_semana, mg.hora_inicio, mg.hora_fin,
              d.nombre AS docente_nombre, d.apellidos AS docente_apellidos
       FROM alumnos a
       JOIN grupos        g  ON a.grupo_id    = g.id
       JOIN materia_grupo mg ON mg.grupo_id   = g.id AND mg.activo = TRUE
       JOIN materias      m  ON mg.materia_id = m.id
       LEFT JOIN docentes d  ON mg.docente_id = d.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE
       ORDER BY mg.dia_semana, mg.hora_inicio`,
      [req.params.usuario_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /alumnos/boleta/:usuario_id
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
      `SELECT * FROM vista_calificaciones WHERE alumno_id = $1 ORDER BY materia`,
      [alumno_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;