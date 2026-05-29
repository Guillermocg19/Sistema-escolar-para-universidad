const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');


router.post('/registro', async (req, res) => {
  const { nombre, apellido_pat, apellido_mat, curp, correo,
          telefono, carrera_interes, contrasena } = req.body;

  if (!nombre || !apellido_pat || !curp || !correo || !contrasena)
    return res.status(400).json({ message: 'Faltan campos requeridos' });

  if (curp.length !== 18)
    return res.status(400).json({ message: 'CURP debe tener 18 caracteres' });

  if (contrasena.length < 6)
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

  
    const usuario = (nombre[0] + apellido_pat).toLowerCase().replace(/\s/g, '') +
                    Date.now().toString().slice(-4);

    const rolRes = await client.query("SELECT id FROM roles WHERE nombre = 'aspirante'");
    const rol_id = rolRes.rows[0]?.id || null;

    const usuRes = await client.query(
      `INSERT INTO usuarios (usuario, contrasena, nombre, rol, rol_id)
       VALUES ($1, $2, $3, 'aspirante', $4) RETURNING id, usuario`,
      [usuario, contrasena, `${nombre} ${apellido_pat}`, rol_id]
    );
    const usuario_id = usuRes.rows[0].id;

  
    const carreraRes = await client.query(
      'SELECT id FROM carreras WHERE LOWER(nombre) LIKE $1 AND activo = TRUE LIMIT 1',
      [`%${(carrera_interes || '').toLowerCase()}%`]
    );
    const carrera_id = carreraRes.rows[0]?.id || null;

    // 3. Crear aspirante
    const aspRes = await client.query(
      `INSERT INTO aspirantes
         (usuario_id, nombre, apellido_pat, apellido_mat, curp, correo,
          telefono, carrera_interes, carrera_id, estatus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'registrado')
       RETURNING id, nombre, apellido_pat, curp, estatus`,
      [usuario_id, nombre, apellido_pat, apellido_mat || null,
       curp.toUpperCase(), correo, telefono || null,
       carrera_interes || null, carrera_id]
    );

    
    await client.query(
      `INSERT INTO mensajes_aspirante (aspirante_id, autor_id, mensaje, tipo)
       VALUES ($1, NULL, $2, 'info')`,
      [aspRes.rows[0].id,
       'Bienvenido al proceso de admision. Por favor sube tus documentos para continuar.']
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...aspRes.rows[0],
      usuario: usuRes.rows[0].usuario,
      mensaje: 'Registro exitoso. Inicia sesion con tu usuario y contrasena.'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      if (err.detail?.includes('curp'))
        return res.status(409).json({ message: 'La CURP ya esta registrada' });
      if (err.detail?.includes('correo'))
        return res.status(409).json({ message: 'El correo ya esta registrado' });
      return res.status(409).json({ message: 'El aspirante ya existe' });
    }
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});


router.get('/mi-perfil/:usuario_id', autorizar(['aspirante', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.nombre AS carrera_nombre,
              u.usuario, u.correo_institucional
       FROM aspirantes a
       LEFT JOIN carreras c ON a.carrera_id = c.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE`,
      [req.params.usuario_id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Aspirante no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/documentos/:aspirante_id', autorizar(['aspirante', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, tipo_documento, nombre_archivo, mime_type,
              estatus, observaciones, creado_en, actualizado_en
       FROM documentos_aspirante
       WHERE aspirante_id = $1
       ORDER BY tipo_documento`,
      [req.params.aspirante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/documentos', autorizar(['aspirante', 'admin']), async (req, res) => {
  const { aspirante_id, tipo_documento, nombre_archivo,
          contenido_b64, mime_type } = req.body;

  if (!aspirante_id || !tipo_documento || !contenido_b64)
    return res.status(400).json({ message: 'Faltan datos del documento' });

 
  if (contenido_b64.length > 7_000_000)
    return res.status(413).json({ message: 'Archivo demasiado grande (max 5MB)' });

  try {
    const result = await pool.query(
      `INSERT INTO documentos_aspirante
         (aspirante_id, tipo_documento, nombre_archivo, contenido_b64, mime_type)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING
       RETURNING id, tipo_documento, estatus, creado_en`,
      [aspirante_id, tipo_documento, nombre_archivo || tipo_documento,
       contenido_b64, mime_type || 'application/octet-stream']
    );

  
    await pool.query(
      `UPDATE aspirantes SET estatus = 'documentos_pendientes'
       WHERE id = $1 AND estatus = 'registrado'`,
      [aspirante_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/documentos/:id/descargar', autorizar(['aspirante', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre_archivo, contenido_b64, mime_type FROM documentos_aspirante WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Documento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/mensajes/:aspirante_id', autorizar(['aspirante', 'admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.nombre AS autor_nombre
       FROM mensajes_aspirante m
       LEFT JOIN usuarios u ON m.autor_id = u.id
       WHERE m.aspirante_id = $1
       ORDER BY m.creado_en DESC`,
      [req.params.aspirante_id]
    );
    // Marcar como leídos
    await pool.query(
      'UPDATE mensajes_aspirante SET leido = TRUE WHERE aspirante_id = $1 AND leido = FALSE',
      [req.params.aspirante_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.nombre, a.apellido_pat, a.apellido_mat,
              a.curp, a.correo, a.telefono, a.carrera_interes,
              a.estatus, a.fecha_registro, a.observaciones_admin,
              c.nombre AS carrera_nombre,
              u.usuario,
              (SELECT COUNT(*) FROM documentos_aspirante d
               WHERE d.aspirante_id = a.id) AS total_docs,
              (SELECT COUNT(*) FROM documentos_aspirante d
               WHERE d.aspirante_id = a.id AND d.estatus = 'aprobado') AS docs_aprobados,
              (SELECT COUNT(*) FROM mensajes_aspirante m
               WHERE m.aspirante_id = a.id AND m.leido = FALSE) AS mensajes_no_leidos
       FROM aspirantes a
       LEFT JOIN carreras c ON a.carrera_id = c.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.activo = TRUE
       ORDER BY a.fecha_registro DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.nombre AS carrera_nombre, u.usuario
       FROM aspirantes a
       LEFT JOIN carreras c ON a.carrera_id = c.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Aspirante no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.patch('/:id/estatus', autorizar(['admin']), async (req, res) => {
  const { estatus, observaciones_admin } = req.body;
  try {
    const result = await pool.query(
      `UPDATE aspirantes SET estatus = $1, observaciones_admin = $2
       WHERE id = $3
       RETURNING id, nombre, apellido_pat, estatus`,
      [estatus, observaciones_admin || null, req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Aspirante no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.patch('/documentos/:doc_id/revisar', autorizar(['admin']), async (req, res) => {
  const { estatus, observaciones } = req.body;
  try {
    const result = await pool.query(
      `UPDATE documentos_aspirante
       SET estatus = $1, observaciones = $2,
           revisado_por = $3, actualizado_en = NOW()
       WHERE id = $4
       RETURNING id, tipo_documento, estatus`,
      [estatus, observaciones || null, req.usuario.id, req.params.doc_id]
    );
    if (!result.rows.length)
      return res.status(404).json({ message: 'Documento no encontrado' });

   
    const docRes = await result.rows[0];
    const aspRes = await pool.query(
      'SELECT aspirante_id FROM documentos_aspirante WHERE id = $1',
      [req.params.doc_id]
    );
    if (aspRes.rows.length) {
      const asp_id = aspRes.rows[0].aspirante_id;
      const countRes = await pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(CASE WHEN estatus = 'aprobado' THEN 1 END) AS aprobados
         FROM documentos_aspirante WHERE aspirante_id = $1`,
        [asp_id]
      );
      const { total, aprobados } = countRes.rows[0];
      if (parseInt(total) > 0 && parseInt(total) === parseInt(aprobados)) {
        await pool.query(
          "UPDATE aspirantes SET estatus = 'en_revision' WHERE id = $1 AND estatus = 'documentos_pendientes'",
          [asp_id]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/:id/mensaje', autorizar(['admin']), async (req, res) => {
  const { mensaje, tipo } = req.body;
  if (!mensaje) return res.status(400).json({ message: 'El mensaje es requerido' });
  try {
    const result = await pool.query(
      `INSERT INTO mensajes_aspirante (aspirante_id, autor_id, mensaje, tipo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.usuario.id, mensaje, tipo || 'info']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/:id/convertir-alumno', autorizar(['admin']), async (req, res) => {
  const { grupo_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    
    const aspRes = await client.query(
      `SELECT a.*, u.id AS uid, u.usuario
       FROM aspirantes a JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.id = $1 AND a.estatus != 'aceptado'`,
      [req.params.id]
    );
    if (!aspRes.rows.length)
      return res.status(404).json({ message: 'Aspirante no encontrado o ya aceptado' });

    const asp = aspRes.rows[0];

    
    const matRes = await client.query('SELECT generar_matricula() AS matricula');
    const matricula = matRes.rows[0].matricula;

    
    const correo_inst = `${asp.nombre.split(' ')[0].toLowerCase()}.${asp.apellido_pat.toLowerCase()}@tec.com`;

    
    const nip = String(Math.floor(1000 + Math.random() * 9000));

    
    const rolRes = await client.query("SELECT id FROM roles WHERE nombre = 'alumno'");
    await client.query(
      `UPDATE usuarios SET rol = 'alumno', rol_id = $1,
              nip = $2, correo_institucional = $3
       WHERE id = $4`,
      [rolRes.rows[0]?.id || null, nip, correo_inst, asp.uid]
    );

   
    const alumRes = await client.query(
      `INSERT INTO alumnos
         (matricula, nombre, apellidos, email, telefono, grupo_id, usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, matricula`,
      [matricula, asp.nombre,
       `${asp.apellido_pat} ${asp.apellido_mat || ''}`.trim(),
       asp.correo, asp.telefono || null,
       grupo_id || null, asp.uid]
    );

    
    await client.query(
      `UPDATE aspirantes SET estatus = 'aceptado', alumnos_id = $1
       WHERE id = $2`,
      [alumRes.rows[0].id, req.params.id]
    );

    
    await client.query(
      `INSERT INTO mensajes_aspirante (aspirante_id, autor_id, mensaje, tipo)
       VALUES ($1, $2, '¡Felicidades! Has sido aceptado. Tu matricula es: ' || $3, 'exito')`,
      [req.params.id, req.usuario.id, matricula]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Aspirante convertido a alumno exitosamente',
      matricula,
      nip,
      correo_institucional: correo_inst,
      usuario: asp.usuario
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;