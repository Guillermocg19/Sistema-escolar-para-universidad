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

// ── ALUMNOS ──
async function apiGetAlumnos() {
  const r = await fetch(`${API_URL}/alumnos`, { headers: authHeaders() });
  return r.json();
}

async function apiCrearAlumno(datos) {
  const r = await fetch(`${API_URL}/alumnos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEditarAlumno(id, datos) {
  const r = await fetch(`${API_URL}/alumnos/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEliminarAlumno(id) {
  const r = await fetch(`${API_URL}/alumnos/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return r.json();
}

// ── DOCENTES ──
async function apiGetDocentes() {
  const r = await fetch(`${API_URL}/docentes`, { headers: authHeaders() });
  return r.json();
}

async function apiCrearDocente(datos) {
  const r = await fetch(`${API_URL}/docentes`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEditarDocente(id, datos) {
  const r = await fetch(`${API_URL}/docentes/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEliminarDocente(id) {
  const r = await fetch(`${API_URL}/docentes/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return r.json();
}

// ── GRUPOS ──
async function apiGetGrupos() {
  const r = await fetch(`${API_URL}/grupos`, { headers: authHeaders() });
  return r.json();
}

// ── MATERIAS ──
async function apiGetMaterias() {
  const r = await fetch(`${API_URL}/materias`, { headers: authHeaders() });
  return r.json();
}

async function apiCrearMateria(datos) {
  const r = await fetch(`${API_URL}/materias`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEditarMateria(id, datos) {
  const r = await fetch(`${API_URL}/materias/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiEliminarMateria(id) {
  const r = await fetch(`${API_URL}/materias/${id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  return r.json();
}

async function apiAsignarGrupo(materia_id, datos) {
  const r = await fetch(`${API_URL}/materias/${materia_id}/grupos`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(datos)
  });
  return r.json();
}

async function apiGetGruposMateria(materia_id) {
  const r = await fetch(`${API_URL}/materias/${materia_id}/grupos`, { headers: authHeaders() });
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