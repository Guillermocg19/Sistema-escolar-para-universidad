async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl  = document.getElementById('error');

  errorEl.textContent = '';

  if (!username || !password) {
    errorEl.textContent = 'Por favor ingresa usuario y contraseña.';
    return;
  }

  try {
    const data = await loginRequest(username, password);

    if (data.success) {
      sessionStorage.setItem('usuario', data.usuario);
      sessionStorage.setItem('rol',     data.rol);
      sessionStorage.setItem('id',      data.id);

      switch (data.rol) {
        case 'alumno':
          window.location.href = 'dashboard-alumno.html';
          break;
        case 'administrativo':
          window.location.href = 'dashboard-administrativo.html';
          break;
        case 'docente':
          window.location.href = 'dashboard-docente.html';
          break;
        default:
          errorEl.textContent = 'Rol no reconocido. Contacta al administrador.';
      }
    } else {
      errorEl.textContent = 'Usuario o contraseña incorrectos.';
    }

  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Error de conexión con el servidor.';
  }
}