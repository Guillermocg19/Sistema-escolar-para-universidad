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
  const r = await fetch(`${API_URL}/usuarios`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEditarUsuario(id, datos) {
  const r = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEliminarUsuario(id) {
  const r = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return r.json();
}

// ── ROLES ──
async function apiGetRoles() {
  const r = await fetch(`${API_URL}/roles`, { headers: authHeaders() });
  return r.json();
}

async function apiCrearRol(datos) {
  const r = await fetch(`${API_URL}/roles`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEditarRol(id, datos) {
  const r = await fetch(`${API_URL}/roles/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEliminarRol(id) {
  const r = await fetch(`${API_URL}/roles/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return r.json();
}
// ── Grupos → materias ────────────────────────────────────────────────────
async function apiGetMateriasGrupo(grupo_id) {
  const r = await fetch(`${API_BASE}/grupos/${grupo_id}/materias`);
  if (!r.ok) throw new Error('Error al obtener materias del grupo');
  return r.json();
}

// ── Inscripciones ────────────────────────────────────────────────────────
async function apiGetInscripciones(periodo) {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_BASE}/inscripciones${q}`);
  if (!r.ok) throw new Error('Error al obtener inscripciones');
  return r.json();
}

async function apiGetInscripcionesAlumno(alumno_id, periodo) {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_BASE}/inscripciones/alumno/${alumno_id}${q}`);
  if (!r.ok) throw new Error('Error');
  return r.json();
}

async function apiGetInscripcionesMateriaGrupo(mg_id, periodo) {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_BASE}/inscripciones/materia-grupo/${mg_id}${q}`);
  if (!r.ok) throw new Error('Error');
  return r.json();
}

async function apiCrearInscripcion(datos) {
  const r = await fetch(`${API_BASE}/inscripciones`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Error'); }
  return r.json();
}

async function apiInscribirGrupo(datos) {
  const r = await fetch(`${API_BASE}/inscripciones/grupo`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Error'); }
  return r.json();
}

async function apiEliminarInscripcion(id) {
  const r = await fetch(`${API_BASE}/inscripciones/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Error al dar de baja');
  return r.json();
}

// ── Calificaciones ───────────────────────────────────────────────────────
async function apiGetCalificacionesAlumno(alumno_id, periodo) {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_BASE}/calificaciones/alumno/${alumno_id}${q}`);
  if (!r.ok) throw new Error('Error');
  return r.json();
}

async function apiGetCalificacionesMateriaGrupo(mg_id, periodo) {
  const q = periodo ? `?periodo=${encodeURIComponent(periodo)}` : '';
  const r = await fetch(`${API_BASE}/calificaciones/materia-grupo/${mg_id}${q}`);
  if (!r.ok) throw new Error('Error');
  return r.json();
}

async function apiRegistrarCalificacion(datos) {
  const r = await fetch(`${API_BASE}/calificaciones`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Error'); }
  return r.json();
}
