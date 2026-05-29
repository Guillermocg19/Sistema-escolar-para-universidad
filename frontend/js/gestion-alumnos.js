let _guardando = false;

window.onload = async () => {
  renderNavbar('Gestión de Alumnos');
  await cargarGruposSelect();
  await cargarAlumnos();
};

async function cargarGruposSelect() {
  const select = document.getElementById('f-grupo');
  const grupos = await apiGetGrupos();
  grupos.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.nombre} (${g.turno})`;
    select.appendChild(opt);
  });
}

async function cargarAlumnos() {
  const tbody = document.getElementById('tabla-alumnos');
  tbody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
  try {
    const alumnos = await apiGetAlumnos();
    tbody.innerHTML = '';
    alumnos.forEach(a => {
      const tr = document.createElement('tr');
      tr.dataset.id        = a.id;
      tr.dataset.nombre    = a.nombre;
      tr.dataset.apellidos = a.apellidos;
      tr.dataset.telefono  = a.telefono || '';
      tr.dataset.grupo_id  = a.grupo_id || '';
      tr.innerHTML = `
        <td>${a.matricula}</td><td>${a.nombre}</td><td>${a.apellidos}</td>
        <td>${a.grupo || '—'}</td><td>${a.correo_institucional || '—'}</td>
        <td>
          <button class="btn-edit" onclick="editarAlumno(${a.id})">Editar</button>
          <button class="btn-delete" onclick="eliminarAlumno(${a.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch { tbody.innerHTML = '<tr><td colspan="6">Error al cargar alumnos</td></tr>'; }
}

async function guardarAlumno() {
  if (_guardando) return;
  _guardando = true;
  const btn = document.querySelector('[onclick="guardarAlumno()"]');
  const textoOriginal = btn ? btn.textContent : 'Guardar';
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

  const id        = document.getElementById('edit-id').value;
  const nombre    = document.getElementById('f-nombre').value.trim();
  const apellidos = document.getElementById('f-apellidos').value.trim();
  const telefono  = document.getElementById('f-telefono').value.trim();
  const grupo_id  = document.getElementById('f-grupo').value || null;
  const errorEl   = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre || !apellidos) {
    errorEl.textContent = 'Nombre y apellidos son requeridos';
    _guardando = false;
    if (btn) { btn.disabled = false; btn.textContent = textoOriginal; }
    return;
  }

  try {
    const datos = { nombre, apellidos, telefono, grupo_id };
    const res = id ? await apiEditarAlumno(id, datos) : await apiCrearAlumno(datos);
    if (res.message && !res.id && !res.matricula) { errorEl.textContent = res.message; return; }
    if (!id && res.matricula) {
      alert(
        `Alumno registrado exitosamente.\n\n` +
        `Matrícula: ${res.matricula}\n` +
        `Usuario para login: ${res.matricula}\n` +
        `NIP: ${res.nip}\n` +
        `Correo institucional: ${res.correo_institucional}\n\n` +
        `Guarda estos datos antes de cerrar.`
      );
    }
    limpiarForm();
    await cargarAlumnos();
  } catch { errorEl.textContent = 'Error al guardar'; }
  finally {
    _guardando = false;
    if (btn) { btn.disabled = false; btn.textContent = textoOriginal; }
  }
}

function editarAlumno(id) {
  const tr = document.querySelector(`tr[data-id="${id}"]`);
  document.getElementById('edit-id').value      = id;
  document.getElementById('f-nombre').value     = tr.dataset.nombre;
  document.getElementById('f-apellidos').value  = tr.dataset.apellidos;
  document.getElementById('f-telefono').value   = tr.dataset.telefono;
  document.getElementById('f-grupo').value      = tr.dataset.grupo_id;
  document.getElementById('form-titulo').textContent = 'Editar Alumno';
}

async function eliminarAlumno(id) {
  if (!confirm('¿Desactivar este alumno?')) return;
  await apiEliminarAlumno(id);
  await cargarAlumnos();
}

function limpiarForm() {
  ['edit-id','f-nombre','f-apellidos','f-telefono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-grupo').value = '';
  document.getElementById('form-titulo').textContent = 'Nuevo Alumno';
  document.getElementById('form-error').textContent  = '';
}
