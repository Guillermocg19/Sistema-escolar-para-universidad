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