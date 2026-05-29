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
      tr.dataset.id           = d.id;
      tr.dataset.nombre       = d.nombre;
      tr.dataset.apellidos    = d.apellidos;
      tr.dataset.telefono     = d.telefono || '';
      tr.dataset.especialidad = d.especialidad || '';
      tr.innerHTML = `
        <td>${d.numero_empleado}</td>
        <td>${d.nombre}</td>
        <td>${d.apellidos}</td>
        <td>${d.especialidad || '—'}</td>
        <td>${d.correo_institucional || '—'}</td>
        <td>
          <button class="btn-edit" onclick="editarDocente(${d.id})">Editar</button>
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
  const nombre       = document.getElementById('f-nombre').value.trim();
  const apellidos    = document.getElementById('f-apellidos').value.trim();
  const telefono     = document.getElementById('f-telefono').value.trim();
  const especialidad = document.getElementById('f-especialidad').value.trim();
  const errorEl      = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre || !apellidos) { errorEl.textContent = 'Nombre y apellidos son requeridos'; return; }

  try {
    const datos = { nombre, apellidos, telefono, especialidad };

    const res = id
      ? await apiEditarDocente(id, datos)
      : await apiCrearDocente(datos);

    if (res.message && !res.id) { errorEl.textContent = res.message; return; }

    if (!id && res.usuario) {
      alert(
        `Docente registrado exitosamente.\n\n` +
        `No. Empleado: ${res.numero_empleado}\n` +
        `Usuario para login: ${res.numero_empleado}\n` +
        `NIP: ${res.nip}\n` +
        `Correo institucional: ${res.correo_institucional}\n\n` +
        `El docente puede iniciar sesión con su número de empleado y NIP.\n` +
        `Guarda estos datos antes de cerrar.`
      );
    }

    limpiarForm();
    await cargarDocentes();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarDocente(id) {
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  document.getElementById('edit-id').value        = id;
  document.getElementById('f-nombre').value       = tr.dataset.nombre;
  document.getElementById('f-apellidos').value    = tr.dataset.apellidos;
  document.getElementById('f-telefono').value     = tr.dataset.telefono;
  document.getElementById('f-especialidad').value = tr.dataset.especialidad;
  document.getElementById('form-titulo').textContent = 'Editar Docente';
}

async function eliminarDocente(id) {
  if (!confirm('¿Desactivar este docente?')) return;
  await apiEliminarDocente(id);
  await cargarDocentes();
}

function limpiarForm() {
  ['edit-id','f-nombre','f-apellidos','f-telefono','f-especialidad'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('form-titulo').textContent = 'Nuevo Docente';
  document.getElementById('form-error').textContent  = '';
}