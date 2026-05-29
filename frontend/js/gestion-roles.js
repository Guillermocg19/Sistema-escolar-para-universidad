window.onload = async () => {
  renderNavbar('Gestión de Roles');
  await cargarRoles();
};

async function cargarRoles() {
  const tbody = document.getElementById('tabla-roles');
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    const roles = await apiGetRoles();
    tbody.innerHTML = '';
    roles.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.nombre}</td>
        <td>${r.descripcion || '—'}</td>
        <td>${r.activo ? '✅ Activo' : '❌ Inactivo'}</td>
        <td>
          <button class="btn-edit"   onclick="editarRol(${r.id}, '${r.nombre}', '${r.descripcion}')">Editar</button>
          <button class="btn-delete" onclick="eliminarRol(${r.id})">Desactivar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Error al cargar roles</td></tr>';
  }
}

async function guardarRol() {
  const id          = document.getElementById('edit-id').value;
  const nombre      = document.getElementById('f-nombre').value.trim();
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const errorEl     = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre) { errorEl.textContent = 'El nombre es requerido'; return; }

  try {
    const res = id
      ? await apiEditarRol(id, { nombre, descripcion })
      : await apiCrearRol({ nombre, descripcion });

    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    limpiarFormRol();
    await cargarRoles();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarRol(id, nombre, descripcion) {
  document.getElementById('edit-id').value        = id;
  document.getElementById('f-nombre').value       = nombre;
  document.getElementById('f-descripcion').value  = descripcion;
  document.getElementById('form-titulo').textContent = 'Editar Rol';
}

async function eliminarRol(id) {
  if (!confirm('¿Desactivar este rol?')) return;
  await apiEliminarRol(id);
  await cargarRoles();
}

function limpiarFormRol() {
  ['edit-id','f-nombre','f-descripcion'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('form-titulo').textContent = 'Nuevo Rol';
  document.getElementById('form-error').textContent  = '';
}