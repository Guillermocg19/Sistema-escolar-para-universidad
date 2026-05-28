const API_URL = 'http://localhost:3000';

function getToken()   { return localStorage.getItem('token'); }
function getUsuario() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}

async function apiGetUsuarios() { const r = await fetch(`${API_URL}/usuarios`, { headers: authHeaders() }); return r.json(); }
async function apiCrearUsuario(d) { const r = await fetch(`${API_URL}/usuarios`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarUsuario(id, d) { const r = await fetch(`${API_URL}/usuarios/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarUsuario(id) { const r = await fetch(`${API_URL}/usuarios/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetRoles() { const r = await fetch(`${API_URL}/roles`, { headers: authHeaders() }); return r.json(); }
async function apiCrearRol(d) { const r = await fetch(`${API_URL}/roles`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarRol(id, d) { const r = await fetch(`${API_URL}/roles/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarRol(id) { const r = await fetch(`${API_URL}/roles/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetAlumnos() { const r = await fetch(`${API_URL}/alumnos`, { headers: authHeaders() }); return r.json(); }
async function apiCrearAlumno(d) { const r = await fetch(`${API_URL}/alumnos`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarAlumno(id, d) { const r = await fetch(`${API_URL}/alumnos/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarAlumno(id) { const r = await fetch(`${API_URL}/alumnos/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetDocentes() { const r = await fetch(`${API_URL}/docentes`, { headers: authHeaders() }); return r.json(); }
async function apiCrearDocente(d) { const r = await fetch(`${API_URL}/docentes`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarDocente(id, d) { const r = await fetch(`${API_URL}/docentes/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarDocente(id) { const r = await fetch(`${API_URL}/docentes/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetGrupos() { const r = await fetch(`${API_URL}/grupos`, { headers: authHeaders() }); return r.json(); }
async function apiCrearGrupo(d) { const r = await fetch(`${API_URL}/grupos`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarGrupo(id, d) { const r = await fetch(`${API_URL}/grupos/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarGrupo(id) { const r = await fetch(`${API_URL}/grupos/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }
async function apiGetMateriasGrupo(gid) { const r = await fetch(`${API_URL}/grupos/${gid}/materias`, { headers: authHeaders() }); return r.json(); }
async function apiGetHorariosGrupo(gid) { const r = await fetch(`${API_URL}/grupos/${gid}/horarios`, { headers: authHeaders() }); return r.json(); }
async function apiAsignarMateriaGrupo(gid, d) { const r = await fetch(`${API_URL}/grupos/${gid}/materias`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiActualizarDocenteGrupo(gid, mgid, docente_id) { const r = await fetch(`${API_URL}/grupos/${gid}/materias/${mgid}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify({ docente_id }) }); return r.json(); }
async function apiQuitarMateriaGrupo(gid, mgid) { const r = await fetch(`${API_URL}/grupos/${gid}/materias/${mgid}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }
async function apiAgregarHorario(gid, mgid, d) { const r = await fetch(`${API_URL}/grupos/${gid}/materias/${mgid}/horarios`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarHorario(gid, mgid, hid) { const r = await fetch(`${API_URL}/grupos/${gid}/materias/${mgid}/horarios/${hid}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetMaterias() { const r = await fetch(`${API_URL}/materias`, { headers: authHeaders() }); return r.json(); }
async function apiCrearMateria(d) { const r = await fetch(`${API_URL}/materias`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarMateria(id, d) { const r = await fetch(`${API_URL}/materias/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarMateria(id) { const r = await fetch(`${API_URL}/materias/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }
async function apiAsignarGrupo(mid, d) { const r = await fetch(`${API_URL}/materias/${mid}/grupos`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiGetGruposMateria(mid) { const r = await fetch(`${API_URL}/materias/${mid}/grupos`, { headers: authHeaders() }); return r.json(); }
async function apiEditarClaveMateria(id, clave) { const r = await fetch(`${API_URL}/materias/${id}/clave`, { method:'PATCH', headers: authHeaders(), body: JSON.stringify({ clave }) }); return r.json(); }

async function apiGetMisMateriasDocente(uid) { const r = await fetch(`${API_URL}/docentes/mis-materias/${uid}`, { headers: authHeaders() }); return r.json(); }
async function apiGetHorarioDocente(uid) { const r = await fetch(`${API_URL}/docentes/horario/${uid}`, { headers: authHeaders() }); return r.json(); }

async function apiGetMisMateriasAlumno(uid) { const r = await fetch(`${API_URL}/alumnos/mis-materias/${uid}`, { headers: authHeaders() }); return r.json(); }
async function apiGetHorarioAlumno(uid) { const r = await fetch(`${API_URL}/alumnos/horario/${uid}`, { headers: authHeaders() }); return r.json(); }
async function apiGetBoletaAlumno(uid) { const r = await fetch(`${API_URL}/alumnos/boleta/${uid}`, { headers: authHeaders() }); return r.json(); }
async function apiGetReticulaAlumno(uid) { const r = await fetch(`${API_URL}/alumnos/reticular/${uid}`, { headers: authHeaders() }); return r.json(); }
async function apiGetReticular(uid) { return apiGetReticulaAlumno(uid); }

async function apiGetAulas() { const r = await fetch(`${API_URL}/aulas`, { headers: authHeaders() }); return r.json(); }
async function apiCrearAula(d) { const r = await fetch(`${API_URL}/aulas`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarAula(id, d) { const r = await fetch(`${API_URL}/aulas/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarAula(id) { const r = await fetch(`${API_URL}/aulas/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetCarreras() { const r = await fetch(`${API_URL}/carreras`, { headers: authHeaders() }); return r.json(); }
async function apiCrearCarrera(d) { const r = await fetch(`${API_URL}/carreras`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEditarCarrera(id, d) { const r = await fetch(`${API_URL}/carreras/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarCarrera(id) { const r = await fetch(`${API_URL}/carreras/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetAlumnosConCalificaciones(gid, mid) { const r = await fetch(`${API_URL}/calificaciones/grupo/${gid}/materia/${mid}`, { headers: authHeaders() }); return r.json(); }
async function apiGuardarCalificacion(d) { const r = await fetch(`${API_URL}/calificaciones`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }

async function apiGetInscripciones(periodo='') { const q=periodo?`?periodo=${encodeURIComponent(periodo)}`:''; const r = await fetch(`${API_URL}/inscripciones${q}`, { headers: authHeaders() }); return r.json(); }
async function apiGetInscripcionesAlumno(aid, periodo='') { const q=periodo?`?periodo=${encodeURIComponent(periodo)}`:''; const r = await fetch(`${API_URL}/inscripciones/alumno/${aid}${q}`, { headers: authHeaders() }); return r.json(); }
async function apiGetInscripcionesMateriaGrupo(mgid, periodo='') { const q=periodo?`?periodo=${encodeURIComponent(periodo)}`:''; const r = await fetch(`${API_URL}/inscripciones/materia-grupo/${mgid}${q}`, { headers: authHeaders() }); return r.json(); }
async function apiCrearInscripcion(d) { const r = await fetch(`${API_URL}/inscripciones`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiInscribirGrupo(d) { const r = await fetch(`${API_URL}/inscripciones/grupo`, { method:'POST', headers: authHeaders(), body: JSON.stringify(d) }); return r.json(); }
async function apiEliminarInscripcion(id) { const r = await fetch(`${API_URL}/inscripciones/${id}`, { method:'DELETE', headers: authHeaders() }); return r.json(); }

async function apiGetCalificacionesAlumno(alumno_id, periodo = '') {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_URL}/calificaciones/alumno/${alumno_id}${q}`, { headers: authHeaders() });
  return r.json();
}
async function apiGetCalificacionesMateriaGrupo(mg_id, periodo = '') {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_URL}/calificaciones/materia-grupo/${mg_id}${q}`, { headers: authHeaders() });
  return r.json();
}
async function apiRegistrarCalificacion(datos) {
  const r = await fetch(`${API_URL}/calificaciones`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}

async function apiGetTodosHorarios() {
  const r = await fetch(`${API_URL}/materias/horarios/todos`, { headers: authHeaders() });
  return r.json();
}
async function apiAsignarHorario(mg_id, datos) {
  const r = await fetch(`${API_URL}/materias/${datos.materia_id}/grupos/${mg_id}/horario`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiRegistrarAspirante(datos) {
  const r = await fetch(`${API_URL}/aspirantes/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
  });
  return r.json();
}
async function apiGetMiPerfilAspirante(usuario_id) { const r = await fetch(`${API_URL}/aspirantes/mi-perfil/${usuario_id}`, { headers: authHeaders() }); return r.json(); }
async function apiGetDocumentosAspirante(aspirante_id) { const r = await fetch(`${API_URL}/aspirantes/documentos/${aspirante_id}`, { headers: authHeaders() }); return r.json(); }
async function apiSubirDocumento(datos) { const r = await fetch(`${API_URL}/aspirantes/documentos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) }); return r.json(); }
async function apiGetMensajesAspirante(aspirante_id) { const r = await fetch(`${API_URL}/aspirantes/mensajes/${aspirante_id}`, { headers: authHeaders() }); return r.json(); }
async function apiGetAspirantes() { const r = await fetch(`${API_URL}/aspirantes`, { headers: authHeaders() }); return r.json(); }
async function apiGetAspirante(id) { const r = await fetch(`${API_URL}/aspirantes/${id}`, { headers: authHeaders() }); return r.json(); }
async function apiCambiarEstatusAspirante(id, datos) { const r = await fetch(`${API_URL}/aspirantes/${id}/estatus`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(datos) }); return r.json(); }
async function apiRevisarDocumento(doc_id, datos) { const r = await fetch(`${API_URL}/aspirantes/documentos/${doc_id}/revisar`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(datos) }); return r.json(); }
async function apiEnviarMensajeAspirante(id, datos) { const r = await fetch(`${API_URL}/aspirantes/${id}/mensaje`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) }); return r.json(); }
async function apiConvertirAlumno(id, datos) { const r = await fetch(`${API_URL}/aspirantes/${id}/convertir-alumno`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) }); return r.json(); }
