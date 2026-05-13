window.onload = async () => {
  renderNavbar('Gestión de Docentes');
  await cargarDocentes();
};

async function cargarDocentes() {
  const tbody = document.getElementById('tabla-docentes');
  tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
  try {
    const docentes = await apiGetDocentes();
    tbody.innerHTML = '';
    docentes.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.numero_empleado}</td>
        <td>${d.nombre}</td>
        <td>${d.apellidos}</td>
        <td>${d.especialidad || '—'}</td>
        <td>${d.email || '—'}</td>
        <td>
          <button class="btn-edit" onclick="editarDocente(${d.id},'${d.nombre}','${d.apellidos}','${d.email||''}','${d.telefono||''}','${d.especialidad||''}')">Editar</button>
          <button class="btn-delete" onclick="eliminarDocente(${d.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="6">Error al cargar docentes</td></tr>';
  }
}

async function guardarDocente() {
  const id           = document.getElementById('edit-id').value;
  const numero       = document.getElementById('f-numero').value.trim();
  const nombre       = document.getElementById('f-nombre').value.trim();
  const apellidos    = document.getElementById('f-apellidos').value.trim();
  const email        = document.getElementById('f-email').value.trim();
  const telefono     = document.getElementById('f-telefono').value.trim();
  const especialidad = document.getElementById('f-especialidad').value.trim();
  const errorEl      = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre || !apellidos) { errorEl.textContent = 'Nombre y apellidos son requeridos'; return; }
  if (!id && !numero)        { errorEl.textContent = 'El número de empleado es requerido'; return; }

  try {
    const datos = { nombre, apellidos, email, telefono, especialidad };
    if (!id) datos.numero_empleado = numero;

    const res = id
      ? await apiEditarDocente(id, datos)
      : await apiCrearDocente(datos);

    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    limpiarForm();
    await cargarDocentes();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarDocente(id, nombre, apellidos, email, telefono, especialidad) {
  document.getElementById('edit-id').value       = id;
  document.getElementById('f-nombre').value      = nombre;
  document.getElementById('f-apellidos').value   = apellidos;
  document.getElementById('f-email').value       = email;
  document.getElementById('f-telefono').value    = telefono;
  document.getElementById('f-especialidad').value = especialidad;
  document.getElementById('f-numero').disabled   = true;
  document.getElementById('form-titulo').textContent = 'Editar Docente';
}

async function eliminarDocente(id) {
  if (!confirm('¿Desactivar este docente?')) return;
  await apiEliminarDocente(id);
  await cargarDocentes();
}

function limpiarForm() {
  ['edit-id','f-numero','f-nombre','f-apellidos','f-email','f-telefono','f-especialidad'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-numero').disabled = false;
  document.getElementById('form-titulo').textContent = 'Nuevo Docente';
  document.getElementById('form-error').textContent  = '';
}