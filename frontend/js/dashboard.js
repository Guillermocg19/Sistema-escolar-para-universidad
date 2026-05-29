function checkSesion() {
  const token = localStorage.getItem('token');
  const user  = localStorage.getItem('user');
  if (!token || !user) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(user);
}
function renderNavbar(titulo) {
  const user = checkSesion();
  if (!user) return;
  document.getElementById('navbar-titulo').textContent  = titulo;
  document.getElementById('navbar-usuario').textContent = '👤 ' + (user.nombre || user.usuario);
  const badge = document.getElementById('navbar-rol');
  badge.textContent = user.rol;
  badge.className   = 'rol-badge rol-' + user.rol;
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
