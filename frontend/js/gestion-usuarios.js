window.onload = async () => {
  renderNavbar('Gestión de Usuarios');
  await cargarUsuarios();
};

async function cargarUsuarios() {
  const tbody = document.getElementById('tabla-usuarios');
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    const usuarios = await apiGetUsuarios();
    tbody.innerHTML = '';
    usuarios.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.nombre || '—'}</td>
        <td><span class="rol-badge rol-${u.rol}">${u.rol}</span></td>
        <td>
          <button class="btn-edit"   onclick="editarUsuario(${u.id}, '${u.usuario}', '${u.nombre}', '${u.rol}')">Editar</button>
          <button class="btn-delete" onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Error al cargar usuarios</td></tr>';
  }
}

async function guardarUsuario() {
  const id         = document.getElementById('edit-id').value;
  const usuario    = document.getElementById('f-usuario').value.trim();
  const contrasena = document.getElementById('f-contrasena').value.trim();
  const nombre     = document.getElementById('f-nombre').value.trim();
  const rol        = document.getElementById('f-rol').value;
  const errorEl    = document.getElementById('form-error');

  errorEl.textContent = '';

  if (!usuario) { errorEl.textContent = 'El usuario es requerido'; return; }
  if (!id && !contrasena) { errorEl.textContent = 'La contraseña es requerida'; return; }

  try {
    const datos = { usuario, nombre, rol };
    if (contrasena) datos.contrasena = contrasena;

    const res = id
      ? await apiEditarUsuario(id, datos)
      : await apiCrearUsuario(datos);

    if (res.message && !res.id) {
      errorEl.textContent = res.message;
      return;
    }
    limpiarFormUsuario();
    await cargarUsuarios();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarUsuario(id, usuario, nombre, rol) {
  document.getElementById('edit-id').value    = id;
  document.getElementById('f-usuario').value  = usuario;
  document.getElementById('f-nombre').value   = nombre;
  document.getElementById('f-rol').value      = rol;
  document.getElementById('form-titulo').textContent = 'Editar Usuario';
  document.getElementById('f-contrasena').placeholder = 'Nueva contraseña (opcional)';
}

async function eliminarUsuario(id) {
  if (!confirm('¿Desactivar este usuario?')) return;
  await apiEliminarUsuario(id);
  await cargarUsuarios();
}

function limpiarFormUsuario() {
  ['edit-id','f-usuario','f-contrasena','f-nombre'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-rol').value = 'alumno';
  document.getElementById('form-titulo').textContent = 'Nuevo Usuario';
  document.getElementById('form-error').textContent  = '';
}