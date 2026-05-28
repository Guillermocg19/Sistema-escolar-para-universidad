async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl  = document.getElementById('error');
  const portal   = new URLSearchParams(window.location.search).get('portal');

  errorEl.innerText = '';

  if (!username || !password) {
    errorEl.innerText = 'Ingresa tu usuario y contrasena';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (portal && data.user.rol !== portal) {
        const nombres = { alumno: 'alumnos', docente: 'docentes', admin: 'administradores' };
        errorEl.innerText = `Este portal es exclusivo para ${nombres[portal] || portal}`;
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));

      switch (data.user.rol) {
        case 'admin':     window.location.href = 'dashboard-administrativo.html'; break;
        case 'docente':   window.location.href = 'dashboard-docente.html';        break;
        case 'alumno':    window.location.href = 'dashboard-alumno.html';         break;
        case 'aspirante': window.location.href = 'dashboard-aspirante.html';      break;
        default:          window.location.href = 'dashboard.html';
      }
    } else {
      errorEl.innerText = data.message || 'Credenciales incorrectas';
    }
  } catch {
    errorEl.innerText = 'No se pudo conectar con el servidor';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
