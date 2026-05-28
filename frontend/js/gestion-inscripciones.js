function mostrarTab(tab) {
  document.getElementById('panel-individual').style.display = tab === 'individual' ? '' : 'none';
  document.getElementById('panel-grupo').style.display     = tab === 'grupo'      ? '' : 'none';
  document.getElementById('tab-individual').style.background = tab === 'individual' ? '#1a73e8' : 'white';
  document.getElementById('tab-individual').style.color      = tab === 'individual' ? 'white' : '#1a73e8';
  document.getElementById('tab-individual').style.border     = tab === 'individual' ? 'none' : '2px solid #1a73e8';
  document.getElementById('tab-grupo').style.background = tab === 'grupo' ? '#1a73e8' : 'white';
  document.getElementById('tab-grupo').style.color      = tab === 'grupo' ? 'white' : '#1a73e8';
  document.getElementById('tab-grupo').style.border     = tab === 'grupo' ? 'none' : '2px solid #1a73e8';
}

async function init() {
  const [alumnos, grupos] = await Promise.all([
    fetch(`${API_URL}/alumnos`, { headers: authHeaders() }).then(r => r.json()),
    fetch(`${API_URL}/grupos`, { headers: authHeaders() }).then(r => r.json())
  ]);

  const selAlumno = document.getElementById('sel-alumno');
  alumnos.forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.textContent = `${a.matricula} – ${a.nombre} ${a.apellidos}`;
    selAlumno.appendChild(o);
  });

  ['sel-grupo-ind', 'sel-grupo-masa'].forEach(id => {
    const sel = document.getElementById(id);
    grupos.forEach(g => {
      const o = document.createElement('option');
      o.value = g.id;
      o.textContent = `${g.nombre} (${g.grado}° – ${g.turno})`;
      sel.appendChild(o);
    });
  });

  cargarInscripciones();
}

async function cargarMateriasGrupoInd() {
  const grupo_id = document.getElementById('sel-grupo-ind').value;
  const sel = document.getElementById('sel-mg');
  sel.innerHTML = '<option value="">Cargando...</option>';
  if (!grupo_id) { sel.innerHTML = '<option value="">Primero elige grupo...</option>'; return; }
  const materias = await apiGetMateriasGrupo(grupo_id);
  sel.innerHTML = '<option value="">Seleccionar materia...</option>';
  materias.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id;
    o.textContent = `${m.clave} – ${m.nombre}`;
    sel.appendChild(o);
  });
}

async function cargarMateriasGrupoMasa() {
  const grupo_id = document.getElementById('sel-grupo-masa').value;
  const contenedor = document.getElementById('lista-materias-masa');
  if (!grupo_id) { contenedor.innerHTML = ''; return; }
  const materias = await apiGetMateriasGrupo(grupo_id);
  contenedor.innerHTML = '<p style="font-size:13px; font-weight:600; margin-bottom:8px;">Materias a inscribir (selecciona las que quieres):</p>' +
    materias.map(m => `
      <label style="display:block; margin-bottom:6px; font-size:13px;">
        <input type="checkbox" value="${m.id}" checked style="margin-right:6px;">
        ${m.clave} – ${m.nombre}
      </label>`).join('');
}

async function inscribirAlumno() {
  const alumno_id       = document.getElementById('sel-alumno').value;
  const materia_grupo_id = document.getElementById('sel-mg').value;
  const periodo         = document.getElementById('inp-periodo-ind').value.trim();
  const msg = document.getElementById('msg-ind');
  if (!alumno_id || !materia_grupo_id || !periodo) {
    msg.textContent = 'Completa todos los campos.'; msg.style.color = '#e53935'; return;
  }
  try {
    await apiCrearInscripcion({ alumno_id, materia_grupo_id, periodo });
    msg.textContent = '¡Inscripción exitosa!'; msg.style.color = '#388e3c';
    cargarInscripciones();
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#e53935';
  }
  setTimeout(() => msg.textContent = '', 3000);
}

async function inscribirGrupo() {
  const grupo_id = document.getElementById('sel-grupo-masa').value;
  const periodo  = document.getElementById('inp-periodo-masa').value.trim();
  const msg = document.getElementById('msg-masa');
  if (!grupo_id || !periodo) {
    msg.textContent = 'Elige grupo y periodo.'; msg.style.color = '#e53935'; return;
  }
  const checks = document.querySelectorAll('#lista-materias-masa input[type=checkbox]:checked');
  const materia_grupo_ids = Array.from(checks).map(c => parseInt(c.value));
  if (materia_grupo_ids.length === 0) {
    msg.textContent = 'Selecciona al menos una materia.'; msg.style.color = '#e53935'; return;
  }
  try {
    const r = await apiInscribirGrupo({ grupo_id, materia_grupo_ids, periodo });
    msg.textContent = `Listo: ${r.nuevas} nuevas, ${r.omitidas} ya existían.`;
    msg.style.color = '#388e3c';
    cargarInscripciones();
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#e53935';
  }
  setTimeout(() => msg.textContent = '', 4000);
}

async function cargarInscripciones() {
  const periodo = document.getElementById('filtro-periodo').value.trim();
  const tbody = document.getElementById('tbody-inscripciones');
  tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
  try {
    const data = await apiGetInscripciones(periodo || null);
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;">Sin inscripciones</td></tr>';
      return;
    }
    const colores = { inscrito:'#1a73e8', aprobado:'#388e3c', reprobado:'#e53935', baja:'#757575' };
    tbody.innerHTML = '';
    data.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.matricula}</td>
        <td>${i.alumno}</td>
        <td>${i.clave} – ${i.materia}</td>
        <td>${i.grupo}</td>
        <td>${i.periodo}</td>
        <td><span style="background:${colores[i.estado]||'#9e9e9e'};color:white;padding:2px 10px;border-radius:12px;font-size:12px;">${i.estado}</span></td>
        <td>${i.estado === 'inscrito'
          ? `<button onclick="darBaja(${i.id})" style="padding:4px 12px;background:#e53935;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">Dar Baja</button>`
          : '—'}</td>`;
      tbody.appendChild(tr);
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="7">Error al cargar</td></tr>';
  }
}

async function darBaja(id) {
  if (!confirm('¿Dar de baja esta inscripción?')) return;
  await apiEliminarInscripcion(id);
  cargarInscripciones();
}
