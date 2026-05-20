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
      tr.innerHTML = `
        <td>${a.matricula}</td>
        <td>${a.nombre}</td>
        <td>${a.apellidos}</td>
        <td>${a.grupo || '—'}</td>
        <td>${a.email || '—'}</td>
        <td>
          <button class="btn-edit" onclick="editarAlumno(${a.id},'${a.matricula}','${a.nombre}','${a.apellidos}','${a.email||''}','${a.telefono||''}',${a.grupo_id||null})">Editar</button>
          <button class="btn-delete" onclick="eliminarAlumno(${a.id})">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="6">Error al cargar alumnos</td></tr>';
  }
}

async function guardarAlumno() {
  const id        = document.getElementById('edit-id').value;
  const nombre    = document.getElementById('f-nombre').value.trim();
  const apellidos = document.getElementById('f-apellidos').value.trim();
  const email     = document.getElementById('f-email').value.trim();
  const telefono  = document.getElementById('f-telefono').value.trim();
  const grupo_id  = document.getElementById('f-grupo').value || null;
  const errorEl   = document.getElementById('form-error');
  errorEl.textContent = '';

  if (!nombre || !apellidos) { errorEl.textContent = 'Nombre y apellidos son requeridos'; return; }

  try {
    const datos = { nombre, apellidos, email, telefono, grupo_id };

    const res = id
      ? await apiEditarAlumno(id, datos)
      : await apiCrearAlumno(datos);

    if (res.message && !res.id) { errorEl.textContent = res.message; return; }

    // Mostrar credenciales si es nuevo registro
    if (!id && res.usuario) {
      alert(
        `Alumno registrado exitosamente.\n\n` +
        `Matrícula: ${res.matricula}\n` +
        `Usuario para login: ${res.matricula}\n` +
        `NIP: ${res.nip}\n` +
        `Correo institucional: ${res.correo_institucional}\n\n` +
        `El alumno puede iniciar sesión con su matrícula y NIP.\n` +
        `Guarda estos datos antes de cerrar.`
      );
    }

    limpiarForm();
    await cargarAlumnos();
  } catch {
    errorEl.textContent = 'Error al guardar';
  }
}

function editarAlumno(id, matricula, nombre, apellidos, email, telefono, grupo_id) {
  document.getElementById('edit-id').value      = id;
  document.getElementById('f-matricula').value  = matricula;
  document.getElementById('f-nombre').value     = nombre;
  document.getElementById('f-apellidos').value  = apellidos;
  document.getElementById('f-email').value      = email;
  document.getElementById('f-telefono').value   = telefono;
  document.getElementById('f-grupo').value      = grupo_id || '';
  document.getElementById('f-matricula').disabled = true;
  document.getElementById('form-titulo').textContent = 'Editar Alumno';
}

async function eliminarAlumno(id) {
  if (!confirm('¿Desactivar este alumno?')) return;
  await apiEliminarAlumno(id);
  await cargarAlumnos();
}

function limpiarForm() {
  ['edit-id','f-matricula','f-nombre','f-apellidos','f-email','f-telefono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-grupo').value = '';
  document.getElementById('f-matricula').disabled = false;
  document.getElementById('form-titulo').textContent = 'Nuevo Alumno';
  document.getElementById('form-error').textContent  = '';
}