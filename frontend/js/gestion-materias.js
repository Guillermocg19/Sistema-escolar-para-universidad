let materiaSeleccionada = null;

window.onload = async () => {
  renderNavbar('Gestión de Materias');
  await cargarMaterias();
  await cargarSelectores();
};

async function cargarSelectores() {
  const [grupos, docentes] = await Promise.all([apiGetGrupos(), apiGetDocentes()]);

  const selGrupo   = document.getElementById('f-grupo-asignar');
  const selDocente = document.getElementById('f-docente-asignar');

  grupos.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = `${g.nombre} (${g.turno})`;
    selGrupo.appendChild(opt);
  });

  docentes.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `${d.nombre} ${d.apellidos}`;
    selDocente.appendChild(opt);
  });
}

async function cargarMaterias() {
  const tbody = document.getElementById('tabla-materias');
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    const materias = await apiGetMaterias();
    tbody.innerHTML = '';
    materias.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.clave}</td>
        <td>${m.nombre}</td>
        <td>${m.creditos}</td>
        <td>${m.activo ? 'Activa' : 'Inactiva'}</td>
        <td>
          <button class="btn-edit"   onclick="editarMateria(${m.id},'${m.clave}','${m.nombre}',${m.creditos},'${m.descripcion||''}')">Editar</button>
          <button class="btn-delete" onclick="eliminarMateria(${m.id})">Desactivar</button>
          <button class="btn-secondary" style="font-size:12px;padding:5px 10px;" onclick="abrirAsignacion(${m.id},'${m.nombre}')">Grupos</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Error al cargar materias</td></tr>';
  }
}

async function guardarMateria() {
  const id          = document.getElementById('edit-id').value;
  const clave       = document.getElementById('f-clave').value.trim();
  const nombre      = document.getElementById('f-nombre').value.trim();
  const creditos    = document.getElementById('f-creditos').value;
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const errorEl     = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre) { errorEl.textContent = 'El nombre es requerido'; return; }
  if (!id && !clave) { errorEl.textContent = 'La clave es requerida'; return; }

  try {
    const datos = { nombre, creditos: parseInt(creditos) || 0, descripcion };
    if (!id) datos.clave = clave;

    const res = id
      ? await apiEditarMateria(id, datos)
      : await apiCrearMateria(datos);

    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    limpiarForm();
    await cargarMaterias();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarMateria(id, clave, nombre, creditos, descripcion) {
  document.getElementById('edit-id').value       = id;
  document.getElementById('f-clave').value       = clave;
  document.getElementById('f-nombre').value      = nombre;
  document.getElementById('f-creditos').value    = creditos;
  document.getElementById('f-descripcion').value = descripcion;
  document.getElementById('f-clave').disabled    = true;
  document.getElementById('form-titulo').textContent = 'Editar Materia';
}

async function eliminarMateria(id) {
  if (!confirm('¿Desactivar esta materia?')) return;
  await apiEliminarMateria(id);
  await cargarMaterias();
}

async function abrirAsignacion(id, nombre) {
  materiaSeleccionada = id;
  document.getElementById('asignacion-titulo').textContent = `Grupos asignados — ${nombre}`;
  document.getElementById('card-asignacion').style.display = 'block';
  await cargarAsignaciones();
  document.getElementById('card-asignacion').scrollIntoView({ behavior: 'smooth' });
}

async function cargarAsignaciones() {
  const tbody = document.getElementById('tabla-asignaciones');
  tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
  try {
    const grupos = await apiGetGruposMateria(materiaSeleccionada);
    tbody.innerHTML = '';
    if (grupos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Sin grupos asignados</td></tr>';
      return;
    }
    grupos.forEach(g => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${g.grupo}</td>
        <td>${g.grado}</td>
        <td>${g.turno}</td>
        <td>${g.docente_nombre ? g.docente_nombre + ' ' + g.docente_apellidos : '—'}</td>
        <td><button class="btn-delete" onclick="quitarAsignacion(${g.id})">Quitar</button></td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Error al cargar</td></tr>';
  }
}

async function asignarGrupo() {
  const grupo_id   = document.getElementById('f-grupo-asignar').value;
  const docente_id = document.getElementById('f-docente-asignar').value || null;
  const errorEl    = document.getElementById('asignacion-error');
  errorEl.textContent = '';

  if (!grupo_id) { errorEl.textContent = 'Selecciona un grupo'; return; }

  try {
    const res = await apiAsignarGrupo(materiaSeleccionada, { grupo_id, docente_id });
    if (res.message && !res.id) { errorEl.textContent = res.message; return; }
    await cargarAsignaciones();
  } catch {
    errorEl.textContent = 'Error al asignar';
  }
}

async function quitarAsignacion(mg_id) {
  if (!confirm('¿Quitar esta asignación?')) return;
  await fetch(`${API_URL}/materias/${materiaSeleccionada}/grupos/${mg_id}`, {
    method: 'DELETE', headers: authHeaders()
  });
  await cargarAsignaciones();
}

function cerrarAsignacion() {
  materiaSeleccionada = null;
  document.getElementById('card-asignacion').style.display = 'none';
}

function limpiarForm() {
  ['edit-id','f-clave','f-nombre','f-creditos','f-descripcion'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-clave').disabled = false;
  document.getElementById('form-titulo').textContent = 'Nueva Materia';
  document.getElementById('form-error').textContent  = '';
}

async function editarClave(id, claveActual) {
  const nueva = prompt(`Clave actual: ${claveActual}\nEscribe la nueva clave:`);
  if (!nueva || nueva.trim() === '') return;
  const res = await apiEditarClaveMateria(id, nueva.trim().toUpperCase());
  if (res.message && !res.id) {
    alert('Error: ' + res.message);
    return;
  }
  alert(`Clave actualizada a: ${res.clave}`);
  await cargarMaterias();
}