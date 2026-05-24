const API_URL = 'http://localhost:3000';

function getToken()   { return localStorage.getItem('token'); }
function getUsuario() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

// ── USUARIOS ──
async function apiGetUsuarios() {
  const r = await fetch(`${API_URL}/usuarios`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearUsuario(datos) {
  const r = await fetch(`${API_URL}/usuarios`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarUsuario(id, datos) {
  const r = await fetch(`${API_URL}/usuarios/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarUsuario(id) {
  const r = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── ROLES ──
async function apiGetRoles() {
  const r = await fetch(`${API_URL}/roles`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearRol(datos) {
  const r = await fetch(`${API_URL}/roles`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarRol(id, datos) {
  const r = await fetch(`${API_URL}/roles/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarRol(id) {
  const r = await fetch(`${API_URL}/roles/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── ALUMNOS ──
async function apiGetAlumnos() {
  const r = await fetch(`${API_URL}/alumnos`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearAlumno(datos) {
  const r = await fetch(`${API_URL}/alumnos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarAlumno(id, datos) {
  const r = await fetch(`${API_URL}/alumnos/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarAlumno(id) {
  const r = await fetch(`${API_URL}/alumnos/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── DOCENTES ──
async function apiGetDocentes() {
  const r = await fetch(`${API_URL}/docentes`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearDocente(datos) {
  const r = await fetch(`${API_URL}/docentes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarDocente(id, datos) {
  const r = await fetch(`${API_URL}/docentes/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarDocente(id) {
  const r = await fetch(`${API_URL}/docentes/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── GRUPOS ──
async function apiGetGrupos() {
  const r = await fetch(`${API_URL}/grupos`, { headers: authHeaders() });
  return r.json();
}
async function apiGetMateriasGrupo(grupo_id) {
  const r = await fetch(`${API_URL}/grupos/${grupo_id}/materias`, { headers: authHeaders() });
  return r.json();
}

// ── MATERIAS ──
async function apiGetMaterias() {
  const r = await fetch(`${API_URL}/materias`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearMateria(datos) {
  const r = await fetch(`${API_URL}/materias`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarMateria(id, datos) {
  const r = await fetch(`${API_URL}/materias/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarMateria(id) {
  const r = await fetch(`${API_URL}/materias/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}
async function apiAsignarGrupo(materia_id, datos) {
  const r = await fetch(`${API_URL}/materias/${materia_id}/grupos`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiGetGruposMateria(materia_id) {
  const r = await fetch(`${API_URL}/materias/${materia_id}/grupos`, { headers: authHeaders() });
  return r.json();
}
async function apiEditarClaveMateria(id, clave) {
  const r = await fetch(`${API_URL}/materias/${id}/clave`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ clave }) });
  return r.json();
}

// ── PORTAL DOCENTE ──
async function apiGetMisMateriasDocente(usuario_id) {
  const r = await fetch(`${API_URL}/docentes/mis-materias/${usuario_id}`, { headers: authHeaders() });
  return r.json();
}

// ── PORTAL ALUMNO ──
async function apiGetMisMateriasAlumno(usuario_id) {
  const r = await fetch(`${API_URL}/alumnos/mis-materias/${usuario_id}`, { headers: authHeaders() });
  return r.json();
}

// ── AULAS ──
async function apiGetAulas() {
  const r = await fetch(`${API_URL}/aulas`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearAula(datos) {
  const r = await fetch(`${API_URL}/aulas`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarAula(id, datos) {
  const r = await fetch(`${API_URL}/aulas/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarAula(id) {
  const r = await fetch(`${API_URL}/aulas/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── CARRERAS ──
async function apiGetCarreras() {
  const r = await fetch(`${API_URL}/carreras`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearCarrera(datos) {
  const r = await fetch(`${API_URL}/carreras`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEditarCarrera(id, datos) {
  const r = await fetch(`${API_URL}/carreras/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarCarrera(id) {
  const r = await fetch(`${API_URL}/carreras/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── CALIFICACIONES (legacy) ──
async function apiGetAlumnosConCalificaciones(grupo_id, materia_id) {
  const r = await fetch(`${API_URL}/calificaciones/grupo/${grupo_id}/materia/${materia_id}`, { headers: authHeaders() });
  return r.json();
}
async function apiGuardarCalificacion(datos) {
  const r = await fetch(`${API_URL}/calificaciones`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiGetHorarioDocente(usuario_id) {
  const r = await fetch(`${API_URL}/calificaciones/docente/${usuario_id}/horario`, { headers: authHeaders() });
  return r.json();
}

// ── INSCRIPCIONES ──
async function apiGetInscripciones(periodo = '') {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_URL}/inscripciones${q}`, { headers: authHeaders() });
  return r.json();
}
async function apiGetInscripcionesAlumno(alumno_id, periodo = '') {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_URL}/inscripciones/alumno/${alumno_id}${q}`, { headers: authHeaders() });
  return r.json();
}
async function apiGetInscripcionesMateriaGrupo(mg_id, periodo = '') {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_URL}/inscripciones/materia-grupo/${mg_id}${q}`, { headers: authHeaders() });
  return r.json();
}
async function apiCrearInscripcion(datos) {
  const r = await fetch(`${API_URL}/inscripciones`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiInscribirGrupo(datos) {
  const r = await fetch(`${API_URL}/inscripciones/grupo`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(datos) });
  return r.json();
}
async function apiEliminarInscripcion(id) {
  const r = await fetch(`${API_URL}/inscripciones/${id}`, { method: 'DELETE', headers: authHeaders() });
  return r.json();
}

// ── CALIFICACIONES (nuevo módulo) ──
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
// ── PORTAL ALUMNO ACADÉMICO ──
async function apiGetHorarioAlumno(usuario_id) {
  const r = await fetch(`${API_URL}/alumnos/horario/${usuario_id}`, { headers: authHeaders() });
  return r.json();
}

async function apiGetBoletaAlumno(usuario_id) {
  const r = await fetch(`${API_URL}/alumnos/boleta/${usuario_id}`, { headers: authHeaders() });
  return r.json();
}