let sesion = null;
let docenteId = null;

window.onload = async () => {
  sesion = checkSesion();
  if (!sesion || (sesion.rol !== 'docente' && sesion.rol !== 'admin')) {
    window.location.href = 'login.html';
    return;
  }
  renderNavbar('Captura de Calificaciones');
  await cargarMisMateriasGrupo();
};

async function cargarMisMateriasGrupo() {
  const sel = document.getElementById('sel-materia-grupo');
  sel.innerHTML = '<option value="">-- Cargando... --</option>';
  try {
    const token = localStorage.getItem('token');
    if (sesion.rol === 'docente') {
      const rd = await fetch(`${API_URL}/docentes/por-usuario/${sesion.id}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (rd.ok) { const doc = await rd.json(); docenteId = doc.id; }
    }
    const materias = await apiGetMisMateriasDocente(sesion.id);
    sel.innerHTML = '<option value="">-- Seleccionar materia --</option>';
    if (!materias.length) {
      sel.innerHTML = '<option value="">No tienes materias asignadas</option>';
      return;
    }
    materias.forEach(m => {
      const op = document.createElement('option');
      op.value = m.mg_id;
      op.textContent = `${m.clave} — ${m.nombre} | Grupo: ${m.grupo}`;
      sel.appendChild(op);
    });
  } catch (e) {
    sel.innerHTML = '<option value="">Error al cargar materias</option>';
    console.error(e);
  }
}

function onMateriaChange() {
  document.getElementById('card-calificaciones').style.display = 'none';
}

async function cargarAlumnos() {
  const mg_id   = document.getElementById('sel-materia-grupo').value;
  const periodo = document.getElementById('sel-periodo').value.trim();
  const card    = document.getElementById('card-calificaciones');
  const tbody   = document.getElementById('tbody-calificaciones');

  if (!mg_id || !periodo) {
    alert('Selecciona una materia y escribe el periodo.');
    return;
  }

  card.style.display = 'none';
  tbody.innerHTML = '<tr><td colspan="8">Cargando...</td></tr>';

  try {
    const datos = await apiGetCalificacionesMateriaGrupo(mg_id, periodo);
    const titulo = document.getElementById('titulo-tabla-cal');
    titulo.textContent = datos.length
      ? `Calificaciones — ${datos[0].materia} | Grupo ${datos[0].grupo} | Periodo ${periodo}`
      : 'Sin alumnos inscritos en este periodo';
    card.style.display = 'block';
    tbody.innerHTML = '';
    if (!datos.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#999">
        No hay alumnos inscritos para el periodo <strong>${periodo}</strong>.
        Ve a <a href="gestion-inscripciones.html">Gestión de Inscripciones</a>.
      </td></tr>`;
      return;
    }
    datos.forEach(d => {
      const p1 = d.parcial1 !== null ? d.parcial1 : '';
      const p2 = d.parcial2 !== null ? d.parcial2 : '';
      const p3 = d.parcial3 !== null ? d.parcial3 : '';
      const promClase = d.promedio_final !== null ? (d.promedio_final >= 60 ? 'aprobado' : 'reprobado') : '';
      const numParciales = d.parciales_registrados || 0;
      const promTxt = d.promedio_final !== null
        ? `${d.promedio_final} <small style="color:#999">(${numParciales}/3)</small>`
        : `— <small style="color:#999">(${numParciales}/3)</small>`;
      const tr = document.createElement('tr');
      tr.id = `fila-${d.inscripcion_id}`;
      tr.innerHTML = `
        <td>${d.matricula}</td>
        <td>${d.alumno}</td>
        <td><input class="input-cal" id="p1-${d.inscripcion_id}" type="number" min="0" max="100" step="0.01" value="${p1}" placeholder="0-100"></td>
        <td><input class="input-cal" id="p2-${d.inscripcion_id}" type="number" min="0" max="100" step="0.01" value="${p2}" placeholder="0-100"></td>
        <td><input class="input-cal" id="p3-${d.inscripcion_id}" type="number" min="0" max="100" step="0.01" value="${p3}" placeholder="0-100"></td>
        <td><span class="promedio-chip ${promClase}" id="prom-${d.inscripcion_id}">${promTxt}</span></td>
        <td><span class="badge badge-${d.estado}" id="estado-${d.inscripcion_id}">${d.estado}</span></td>
        <td><button class="btn-primary" style="padding:5px 12px;font-size:12px;" onclick="guardarCalificaciones(${d.inscripcion_id})">Guardar</button></td>`;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8">Error al cargar datos.</td></tr>';
    console.error(e);
  }
}

async function guardarCalificaciones(inscripcion_id) {
  const campos = [
    { parcial: 1, input: document.getElementById(`p1-${inscripcion_id}`) },
    { parcial: 2, input: document.getElementById(`p2-${inscripcion_id}`) },
    { parcial: 3, input: document.getElementById(`p3-${inscripcion_id}`) }
  ];
  let ultimo = null;
  for (const { parcial, input } of campos) {
    const val = input.value.trim();
    if (val === '') continue;
    const cal = parseFloat(val);
    if (isNaN(cal) || cal < 0 || cal > 100) {
      alert(`Parcial ${parcial}: debe ser un numero entre 0 y 100.`);
      return;
    }
    ultimo = await apiRegistrarCalificacion({
      inscripcion_id, parcial, calificacion: cal, registrado_por: docenteId
    });
  }
  if (ultimo && ultimo.resumen) {
    const r = ultimo.resumen;
    const numParciales = r.parciales_registrados || 0;
    const promClase = r.promedio_final !== null ? (r.promedio_final >= 60 ? 'aprobado' : 'reprobado') : '';
    const promTxt = r.promedio_final !== null
      ? `${r.promedio_final} <small style="color:#999">(${numParciales}/3)</small>`
      : `— <small style="color:#999">(${numParciales}/3)</small>`;
    const chipEl   = document.getElementById(`prom-${inscripcion_id}`);
    const estadoEl = document.getElementById(`estado-${inscripcion_id}`);
    if (chipEl)   { chipEl.className = `promedio-chip ${promClase}`; chipEl.innerHTML = promTxt; }
    if (estadoEl) { estadoEl.className = `badge badge-${r.estado}`; estadoEl.textContent = r.estado; }
  }
}
