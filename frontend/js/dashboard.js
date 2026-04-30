function checkSesion() {
  const rol     = sessionStorage.getItem('rol');
  const usuario = sessionStorage.getItem('usuario');

  if (!rol || !usuario) {
    window.location.href = 'login.html';
    return null;
  }
  return { rol, usuario };
}

function renderNavbar(titulo, rol) {
  const usuario = sessionStorage.getItem('usuario');
  document.getElementById('navbar-titulo').textContent  = titulo;
  document.getElementById('navbar-usuario').textContent = '👤 ' + usuario;

  const badge = document.getElementById('navbar-rol');
  badge.textContent = rol;
  badge.className   = 'rol-badge rol-' + rol;
}

function logout() {
  sessionStorage.clear();
  window.location.href = 'login.html';
}