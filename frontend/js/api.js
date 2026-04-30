const API_URL = 'http://localhost:3000';

// ─── USUARIOS DE PRUEBA (eliminar cuando el backend esté listo) ───
const MOCK_USUARIOS = [
  { id: 1, usuario: 'alumno01',  password: '1234', rol: 'alumno' },
  { id: 2, usuario: 'profe01',   password: '1234', rol: 'docente' },
  { id: 3, usuario: 'admin01',   password: '1234', rol: 'administrativo' }
];

async function loginRequest(username, password) {
  // Cuando el backend esté listo, comenta el bloque mock
  // y descomenta el fetch de abajo

  // ── MOCK ──
  const encontrado = MOCK_USUARIOS.find(
    u => u.usuario === username && u.password === password
  );
  if (encontrado) {
    return { success: true, id: encontrado.id, usuario: encontrado.usuario, rol: encontrado.rol };
  } else {
    return { success: false };
  }
  // ── FIN MOCK ──

  // ── REAL (descomentar cuando backend esté listo) ──
  // const response = await fetch(`${API_URL}/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ username, password })
  // });
  // return await response.json();
}

async function getUsuarios() {
  // ── MOCK ──
  return MOCK_USUARIOS.map(u => ({ id: u.id, usuario: u.usuario, rol: u.rol }));

  // ── REAL ──
  // const response = await fetch(`${API_URL}/usuarios`);
  // return await response.json();
}