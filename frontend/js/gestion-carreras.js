window.onload = async () => {
  renderNavbar('Gestión de Carreras');
  await cargarCarreras();
};

async function cargarCarreras() {
  const tbody = document.getElementById('tabla-carreras');
  tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
  try {
    const carreras = await apiGetCarreras();
    tbody.innerHTML = '';
    carreras.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.clave}</td>
        <td>${c.nombre}</td>
        <td>${c.activo ? 'Activa' : 'Inactiva'}</td>
        <td>
          <button class="btn-edit" onclick="editarCarrera(${c.id},'${c.clave}','${c.nombre}')">Editar</button>
          <button class="btn-delete" onclick="eliminarCarrera(${c.id})">Desactivar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="4">Error al cargar carreras</td></tr>';
  }
}

async function guardarCarrera() {
  const id     = document.getElementById('edit-id').value;
  const clave  = document.getElementById('f-clave').value.trim();
  const nombre = document.getElementById('f-nombre').value.trim();
  const errorEl = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!clave || !nombre) { errorEl.textContent = 'Clave y nombre son requeridos'; return; }

  try {
    const res = id
      ? await apiEditarCarrera(id, { clave, nombre })
      : await apiCrearCarrera({ clave, nombre });
    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    limpiarForm();
    await cargarCarreras();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarCarrera(id, clave, nombre) {
  document.getElementById('edit-id').value   = id;
  document.getElementById('f-clave').value   = clave;
  document.getElementById('f-nombre').value  = nombre;
  document.getElementById('form-titulo').textContent = 'Editar Carrera';
}

async function eliminarCarrera(id) {
  if (!confirm('¿Desactivar esta carrera?')) return;
  await apiEliminarCarrera(id);
  await cargarCarreras();
}

function limpiarForm() {
  ['edit-id','f-clave','f-nombre'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('form-titulo').textContent = 'Nueva Carrera';
  document.getElementById('form-error').textContent  = '';
}