async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl  = document.getElementById('error');
  errorEl.innerText = '';

  if (!username || !password) {
    errorEl.innerText = 'Ingresa tu usuario y contraseña';
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
      localStorage.setItem('token', data.token);
      localStorage.setItem('user',  JSON.stringify(data.user));

      switch (data.user.rol) {
        case 'admin':   window.location.href = 'dashboard-administrativo.html'; break;
        case 'docente': window.location.href = 'dashboard-docente.html';        break;
        case 'alumno':  window.location.href = 'dashboard-alumno.html';         break;
        default:        window.location.href = 'dashboard.html';
      }
    } else {
      errorEl.innerText = data.message || 'Credenciales incorrectas';
    }
  } catch (error) {
    errorEl.innerText = 'No se pudo conectar con el servidor';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}