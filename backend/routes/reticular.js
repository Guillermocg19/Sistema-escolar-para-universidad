const express   = require('express');
const router    = express.Router();
const pool      = require('../db');
const autorizar = require('../middleware/autorizar');


router.get('/carrera/:carrera_id', autorizar(['admin', 'alumno', 'docente']), async (req, res) => {
  try {
    const { carrera_id } = req.params;

    const result = await pool.query(
      `SELECT
         cm.id AS cm_id,
         cm.semestre,
         cm.creditos,
         cm.activo,
         m.id   AS materia_id,
         m.clave,
         m.nombre,
         m.descripcion
       FROM carrera_materia cm
       JOIN materias m ON cm.materia_id = m.id
       WHERE cm.carrera_id = $1 AND cm.activo = TRUE AND m.activo = TRUE
       ORDER BY cm.semestre, m.nombre`,
      [carrera_id]
    );

    const semestres = {};
    result.rows.forEach(r => {
      if (!semestres[r.semestre]) semestres[r.semestre] = [];
      semestres[r.semestre].push(r);
    });

    res.json({ carrera_id: parseInt(carrera_id), semestres });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/carrera/:carrera_id/materias', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cm.id, cm.semestre, cm.creditos, cm.activo,
              m.id AS materia_id, m.clave, m.nombre
       FROM carrera_materia cm
       JOIN materias m ON cm.materia_id = m.id
       WHERE cm.carrera_id = $1
       ORDER BY cm.semestre, m.nombre`,
      [req.params.carrera_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/carrera/:carrera_id/materias', autorizar(['admin']), async (req, res) => {
  const { materia_id, semestre, creditos } = req.body;
  if (!materia_id || !semestre)
    return res.status(400).json({ message: 'materia_id y semestre son requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO carrera_materia (carrera_id, materia_id, semestre, creditos)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (carrera_id, materia_id)
         DO UPDATE SET semestre = EXCLUDED.semestre,
                       creditos = EXCLUDED.creditos,
                       activo   = TRUE
       RETURNING *`,
      [req.params.carrera_id, materia_id, semestre, creditos || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/carrera/:carrera_id/materias/:cm_id', autorizar(['admin']), async (req, res) => {
  const { semestre, creditos, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE carrera_materia
       SET semestre = $1, creditos = $2, activo = $3
       WHERE id = $4 AND carrera_id = $5
       RETURNING *`,
      [semestre, creditos ?? 0, activo ?? true, req.params.cm_id, req.params.carrera_id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/carrera/:carrera_id/materias/:cm_id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE carrera_materia SET activo = FALSE
       WHERE id = $1 AND carrera_id = $2
       RETURNING id, materia_id`,
      [req.params.cm_id, req.params.carrera_id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.json({ message: 'Materia quitada del mapa curricular' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/carrera/:carrera_id/prerequisitos', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mp.id,
              m.id   AS materia_id,   m.clave   AS clave,   m.nombre   AS nombre,
              p.id   AS prereq_id,    p.clave   AS prereq_clave, p.nombre AS prereq_nombre
       FROM materia_prerequisito mp
       JOIN materias m ON mp.materia_id     = m.id
       JOIN materias p ON mp.prerequisito_id = p.id
       WHERE mp.carrera_id = $1
       ORDER BY m.nombre, p.nombre`,
      [req.params.carrera_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/carrera/:carrera_id/prerequisitos', autorizar(['admin']), async (req, res) => {
  const { materia_id, prerequisito_id } = req.body;
  if (!materia_id || !prerequisito_id)
    return res.status(400).json({ message: 'materia_id y prerequisito_id son requeridos' });
  if (parseInt(materia_id) === parseInt(prerequisito_id))
    return res.status(400).json({ message: 'Una materia no puede ser prerrequisito de sí misma' });
  try {
    const result = await pool.query(
      `INSERT INTO materia_prerequisito (carrera_id, materia_id, prerequisito_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [req.params.carrera_id, materia_id, prerequisito_id]
    );
    if (!result.rows.length)
      return res.status(409).json({ message: 'El prerrequisito ya existe' });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/carrera/:carrera_id/prerequisitos/:prereq_id', autorizar(['admin']), async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM materia_prerequisito
       WHERE id = $1 AND carrera_id = $2
       RETURNING id`,
      [req.params.prereq_id, req.params.carrera_id]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Prerrequisito no encontrado' });
    res.json({ message: 'Prerrequisito eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/alumno/:usuario_id', autorizar(['alumno', 'admin']), async (req, res) => {
  try {
    // 1. Obtener alumno y su carrera
    const alumnoRes = await pool.query(
      `SELECT a.id, a.matricula, a.nombre, a.apellidos, a.carrera_id,
              c.nombre AS carrera_nombre, c.clave AS carrera_clave
       FROM alumnos a
       LEFT JOIN carreras c ON a.carrera_id = c.id
       WHERE a.usuario_id = $1 AND a.activo = TRUE LIMIT 1`,
      [req.params.usuario_id]
    );
    if (!alumnoRes.rows.length)
      return res.status(404).json({ message: 'Alumno no encontrado' });

    const alumno = alumnoRes.rows[0];

    if (!alumno.carrera_id)
      return res.json({
        alumno,
        sin_carrera: true,
        message: 'El alumno no tiene carrera asignada',
        semestres: {},
        resumen: { acreditadas: 0, en_curso: 0, disponibles: 0, bloqueadas: 0, creditos_aprobados: 0, creditos_totales: 0, avance_pct: 0 }
      });

    
    const mapaRes = await pool.query(
      `SELECT cm.id AS cm_id, cm.semestre, cm.creditos, cm.materia_id,
              m.clave, m.nombre
       FROM carrera_materia cm
       JOIN materias m ON cm.materia_id = m.id
       WHERE cm.carrera_id = $1 AND cm.activo = TRUE AND m.activo = TRUE
       ORDER BY cm.semestre, m.nombre`,
      [alumno.carrera_id]
    );

    
    const historialRes = await pool.query(
      `SELECT
         i.id               AS inscripcion_id,
         mg.materia_id,
         i.periodo,
         i.estado           AS inscripcion_estado,
         MAX(CASE WHEN c.parcial = 1 THEN c.calificacion END) AS p1,
         MAX(CASE WHEN c.parcial = 2 THEN c.calificacion END) AS p2,
         MAX(CASE WHEN c.parcial = 3 THEN c.calificacion END) AS p3,
         COUNT(c.id)                                           AS parciales_registrados,
         CASE WHEN COUNT(c.id) = 3
              THEN ROUND(SUM(c.calificacion) / 3.0, 2)
              ELSE ROUND(AVG(c.calificacion), 2)
         END AS promedio
       FROM inscripciones i
       JOIN materia_grupo mg ON i.materia_grupo_id = mg.id
       LEFT JOIN calificaciones c ON c.inscripcion_id = i.id
       WHERE i.alumno_id = $1 AND i.activo = TRUE
       GROUP BY i.id, mg.materia_id, i.periodo, i.estado
       ORDER BY i.periodo, mg.materia_id`,
      [alumno.id]
    );

    const historial = historialRes.rows;

    
    const prereqRes = await pool.query(
      `SELECT materia_id, prerequisito_id
       FROM materia_prerequisito
       WHERE carrera_id = $1`,
      [alumno.carrera_id]
    );
   
    const prereqMap = {};
    prereqRes.rows.forEach(p => {
      if (!prereqMap[p.materia_id]) prereqMap[p.materia_id] = [];
      prereqMap[p.materia_id].push(p.prerequisito_id);
    });

    const acreditadas = new Set();
    
    const intentosPorMateria = {};

    historial.forEach(h => {
      if (!intentosPorMateria[h.materia_id]) intentosPorMateria[h.materia_id] = [];
      intentosPorMateria[h.materia_id].push(h);

      const aprobada =
        h.inscripcion_estado === 'aprobado' ||
        (parseInt(h.parciales_registrados) === 3 && parseFloat(h.promedio) >= 60);
      if (aprobada) acreditadas.add(h.materia_id);
    });

    const determinarEstado = (materia_id) => {
      const intentos = intentosPorMateria[materia_id] || [];

      
      const acreditado = acreditadas.has(materia_id);
      if (acreditado) {
        const mejor = intentos.reduce((best, i) => {
          const p = parseFloat(i.promedio) || 0;
          return p > (parseFloat(best?.promedio) || 0) ? i : best;
        }, null);
        return { estado: 'acreditada', detalle: mejor };
      }

      
      const cursando = intentos.find(i =>
        i.inscripcion_estado === 'inscrito' && parseInt(i.parciales_registrados) < 3
      );

      if (cursando) {
        
        const yaReprobo = intentos.some(i =>
          i !== cursando &&
          (i.inscripcion_estado === 'reprobado' ||
           (parseInt(i.parciales_registrados) === 3 && parseFloat(i.promedio) < 60))
        );
        return {
          estado: yaReprobo ? 'en_repeticion' : 'cursando',
          detalle: cursando
        };
      }

      
      const reprobado = intentos.find(i =>
        parseInt(i.parciales_registrados) === 3 && parseFloat(i.promedio) < 60
      );
      if (reprobado)
        return { estado: 'sin_acreditar', detalle: reprobado };

      
      const prereqs = prereqMap[materia_id] || [];
      if (prereqs.length === 0)
        return { estado: 'disponible', detalle: null };

      const prereqsOk = prereqs.every(pid => acreditadas.has(pid));
      return {
        estado: prereqsOk ? 'disponible' : 'bloqueada',
        prereqs_faltantes: prereqs.filter(pid => !acreditadas.has(pid)),
        detalle: null
      };
    };

  
    const semestres = {};
    let creditosAprobados  = 0;
    let creditosTotales    = 0;
    let totalAcreditadas   = 0;
    let totalEnCurso       = 0;
    let totalDisponibles   = 0;
    let totalBloqueadas    = 0;

    mapaRes.rows.forEach(cm => {
      if (!semestres[cm.semestre]) semestres[cm.semestre] = [];

      const { estado, detalle, prereqs_faltantes } = determinarEstado(cm.materia_id);
      const creditos = parseInt(cm.creditos) || 0;
      creditosTotales += creditos;
      if (estado === 'acreditada') { creditosAprobados += creditos; totalAcreditadas++; }
      if (estado === 'cursando' || estado === 'en_repeticion') totalEnCurso++;
      if (estado === 'disponible') totalDisponibles++;
      if (estado === 'bloqueada') totalBloqueadas++;

      semestres[cm.semestre].push({
        cm_id:       cm.cm_id,
        materia_id:  cm.materia_id,
        clave:       cm.clave,
        nombre:      cm.nombre,
        semestre:    cm.semestre,
        creditos,
        estado,
        prereqs_faltantes: prereqs_faltantes || [],
        promedio:    detalle ? parseFloat(detalle.promedio) : null,
        periodo:     detalle ? detalle.periodo : null,
        parciales_registrados: detalle ? parseInt(detalle.parciales_registrados) : 0
      });
    });

    const avance_pct = creditosTotales > 0
      ? Math.round((creditosAprobados / creditosTotales) * 100)
      : 0;

    res.json({
      alumno: {
        id:              alumno.id,
        matricula:       alumno.matricula,
        nombre:          alumno.nombre,
        apellidos:       alumno.apellidos,
        carrera_id:      alumno.carrera_id,
        carrera_nombre:  alumno.carrera_nombre,
        carrera_clave:   alumno.carrera_clave
      },
      resumen: {
        acreditadas:         totalAcreditadas,
        en_curso:            totalEnCurso,
        disponibles:         totalDisponibles,
        bloqueadas:          totalBloqueadas,
        creditos_aprobados:  creditosAprobados,
        creditos_totales:    creditosTotales,
        avance_pct,
        total_materias:      mapaRes.rows.length
      },
      semestres
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;