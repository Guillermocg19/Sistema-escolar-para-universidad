window.onload = async () => {
  renderNavbar('Gestión de Aulas');
  await cargarAulas();
};

async function cargarAulas() {
  const tbody = document.getElementById('tabla-aulas');
  tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
  try {
    const aulas = await apiGetAulas();
    tbody.innerHTML = '';
    aulas.forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${a.numero}</td>
        <td>${a.capacidad}</td>
        <td>${a.edificio || '—'}</td>
        <td>${a.tipo}</td>
        <td>${a.activo ? 'Activa' : 'Inactiva'}</td>
        <td>
          <button class="btn-edit" onclick="editarAula(${a.id},'${a.numero}',${a.capacidad},'${a.edificio||''}','${a.tipo}')">Editar</button>
          <button class="btn-delete" onclick="eliminarAula(${a.id})">Desactivar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="6">Error al cargar aulas</td></tr>';
  }
}

async function guardarAula() {
  const id        = document.getElementById('edit-id').value;
  const numero    = document.getElementById('f-numero').value.trim();
  const capacidad = document.getElementById('f-capacidad').value;
  const edificio  = document.getElementById('f-edificio').value.trim();
  const tipo      = document.getElementById('f-tipo').value;
  const errorEl   = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!numero) { errorEl.textContent = 'El número de aula es requerido'; return; }

  try {
    const datos = { numero, capacidad: parseInt(capacidad) || 30, edificio, tipo };
    const res = id ? await apiEditarAula(id, datos) : await apiCrearAula(datos);
    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    limpiarForm();
    await cargarAulas();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarAula(id, numero, capacidad, edificio, tipo) {
  document.getElementById('edit-id').value    = id;
  document.getElementById('f-numero').value   = numero;
  document.getElementById('f-capacidad').value = capacidad;
  document.getElementById('f-edificio').value = edificio;
  document.getElementById('f-tipo').value     = tipo;
  document.getElementById('form-titulo').textContent = 'Editar Aula';
}

async function eliminarAula(id) {
  if (!confirm('¿Desactivar esta aula?')) return;
  await apiEliminarAula(id);
  await cargarAulas();
}

function limpiarForm() {
  ['edit-id','f-numero','f-capacidad','f-edificio'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-tipo').value = 'salon';
  document.getElementById('form-titulo').textContent = 'Nueva Aula';
  document.getElementById('form-error').textContent  = '';
}