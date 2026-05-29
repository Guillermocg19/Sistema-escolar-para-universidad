let _carreraId   = null;
let _carreraNombre = '';
let _materias    = [];
let _mapaActual  = {};
let _prereqs     = [];
let _tabActiva   = 'mapa';

window.onload = async () => {
  const sesion = checkSesion();
  if (!sesion || sesion.rol !== 'admin') { window.location.href = 'login.html'; return; }
  renderNavbar('Mapa Curricular');
  await Promise.all([cargarCarreras(), cargarMaterias()]);
};

async function cargarCarreras() {
  const lista = document.getElementById('lista-carreras');
  try {
    const carreras = await apiGetCarreras();
    lista.innerHTML = '';
    if (!carreras.length) {
      lista.innerHTML = '<p style="color:var(--text-sub);font-size:13px;">Sin carreras registradas.</p>';
      return;
    }
    carreras.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'carrera-btn' + (_carreraId === c.id ? ' active' : '');
      btn.innerHTML = `<span>${c.clave} — ${c.nombre}</span>`;
      btn.onclick = () => seleccionarCarrera(c.id, c.nombre);
      lista.appendChild(btn);
    });
  } catch { lista.innerHTML = '<p style="color:var(--danger);font-size:13px;">Error al cargar</p>'; }
}

async function cargarMaterias() {
  _materias = await apiGetMaterias();
}

async function seleccionarCarrera(id, nombre) {
  _carreraId    = id;
  _carreraNombre = nombre;
  await cargarCarreras();
  await renderPanel();
}

async function renderPanel() {
  const panel = document.getElementById('panel-derecho');
  panel.innerHTML = `
    <h3>${_carreraNombre}</h3>
    <div class="tabs">
      <button class="tab-btn ${_tabActiva === 'mapa' ? 'active' : ''}" onclick="cambiarTab('mapa')">📚 Mapa Curricular</button>
      <button class="tab-btn ${_tabActiva === 'prereq' ? 'active' : ''}" onclick="cambiarTab('prereq')">🔗 Prerrequisitos</button>
    </div>
    <div class="tab-content ${_tabActiva === 'mapa' ? 'active' : ''}" id="tab-mapa"></div>
    <div class="tab-content ${_tabActiva === 'prereq' ? 'active' : ''}" id="tab-prereq"></div>`;

  await Promise.all([renderTabMapa(), renderTabPrereq()]);
}

function cambiarTab(tab) {
  _tabActiva = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + tab)?.classList.add('active');
  const btns = document.querySelectorAll('.tab-btn');
  if (tab === 'mapa' && btns[0]) btns[0].classList.add('active');
  if (tab === 'prereq' && btns[1]) btns[1].classList.add('active');
}

async function renderTabMapa() {
  const tab = document.getElementById('tab-mapa');
  if (!tab) return;
  tab.innerHTML = '<p style="color:var(--text-sub);font-size:13px;">Cargando...</p>';

  try {
    const res  = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/materias`, { headers: authHeaders() });
    const data = await res.json();

    _mapaActual = {};
    data.forEach(cm => {
      if (!_mapaActual[cm.semestre]) _mapaActual[cm.semestre] = [];
      _mapaActual[cm.semestre].push(cm);
    });

    const semestres = Object.keys(_mapaActual).map(Number).sort((a, b) => a - b);

    let html = `
      <div class="form-inline" id="form-asignar-mat">
        <select id="sel-nueva-mat" style="min-width:220px;">
          <option value="">— Materia —</option>
          ${_materias.map(m => `<option value="${m.id}">${m.clave} – ${m.nombre}</option>`).join('')}
        </select>
        <select id="sel-nuevo-sem" style="width:120px;">
          ${Array.from({length: 12}, (_, i) => `<option value="${i+1}">Semestre ${i+1}</option>`).join('')}
        </select>
        <input type="number" id="inp-nuevos-creditos" placeholder="Créditos" min="0" max="20" style="width:90px;" value="5">
        <button class="btn-primary" onclick="asignarMateriaCarrera()">+ Agregar</button>
      </div>`;

    if (!semestres.length) {
      html += '<div class="empty-state">Sin materias en el mapa. Usa el formulario para agregar.</div>';
    } else {
      semestres.forEach(sem => {
        html += `<div class="semestre-section">
          <div class="semestre-header-adm"><span>Semestre ${sem}</span><span>${_mapaActual[sem].length} materias</span></div>`;
        _mapaActual[sem].forEach(cm => {
          html += `<div class="mat-row">
            <div class="mat-info-ret">
              <div class="clave">${cm.clave}</div>
              <div class="nombre">${cm.nombre}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span style="font-size:12px;color:var(--text-sub);">${cm.creditos} cr.</span>
              <button class="btn-delete" onclick="quitarMateriaCarrera(${cm.id})">Quitar</button>
            </div>
          </div>`;
        });
        html += '</div>';
      });
    }
    tab.innerHTML = html;
  } catch {
    tab.innerHTML = '<p style="color:var(--danger);">Error al cargar mapa.</p>';
  }
}

async function renderTabPrereq() {
  const tab = document.getElementById('tab-prereq');
  if (!tab) return;
  tab.innerHTML = '<p style="color:var(--text-sub);font-size:13px;">Cargando...</p>';

  try {
    const res  = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/prerequisitos`, { headers: authHeaders() });
    _prereqs   = await res.json();

    const resMap = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/materias`, { headers: authHeaders() });
    const matsMapa = await resMap.json();

    let html = `
      <div class="form-inline" id="form-agregar-prereq">
        <select id="sel-prereq-materia" style="min-width:200px;">
          <option value="">— Materia que requiere prereq —</option>
          ${matsMapa.map(m => `<option value="${m.materia_id}">${m.clave} – ${m.nombre}</option>`).join('')}
        </select>
        <span class="arrow-label">necesita →</span>
        <select id="sel-prereq-prereq" style="min-width:200px;">
          <option value="">— Prerrequisito —</option>
          ${matsMapa.map(m => `<option value="${m.materia_id}">${m.clave} – ${m.nombre}</option>`).join('')}
        </select>
        <button class="btn-primary" onclick="agregarPrereq()">+ Agregar</button>
      </div>`;

    if (!_prereqs.length) {
      html += '<div class="empty-state">Sin prerrequisitos configurados para esta carrera.</div>';
    } else {
      _prereqs.forEach(p => {
        html += `<div class="prereq-row">
          <div style="display:flex;align-items:center;gap:10px;font-size:13px;">
            <strong>${p.clave}</strong> <span style="color:var(--text-sub)">${p.nombre}</span>
            <span class="arrow-label">requiere →</span>
            <strong>${p.prereq_clave}</strong> <span style="color:var(--text-sub)">${p.prereq_nombre}</span>
          </div>
          <button class="btn-delete" onclick="eliminarPrereq(${p.id})">Eliminar</button>
        </div>`;
      });
    }
    tab.innerHTML = html;
  } catch {
    tab.innerHTML = '<p style="color:var(--danger);">Error al cargar prerrequisitos.</p>';
  }
}

async function asignarMateriaCarrera() {
  const materia_id = document.getElementById('sel-nueva-mat').value;
  const semestre   = document.getElementById('sel-nuevo-sem').value;
  const creditos   = document.getElementById('inp-nuevos-creditos').value;
  if (!materia_id) { toast('Selecciona una materia', 'err'); return; }
  try {
    const r = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/materias`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ materia_id: parseInt(materia_id), semestre: parseInt(semestre), creditos: parseInt(creditos) || 0 })
    });
    const data = await r.json();
    if (!r.ok) { toast(data.message || 'Error', 'err'); return; }
    toast('Materia agregada al mapa', 'ok');
    await renderTabMapa();
  } catch { toast('Error de conexión', 'err'); }
}

async function quitarMateriaCarrera(cm_id) {
  if (!confirm('¿Quitar esta materia del mapa curricular?')) return;
  try {
    const r = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/materias/${cm_id}`, {
      method: 'DELETE', headers: authHeaders()
    });
    if (!r.ok) { const d = await r.json(); toast(d.message || 'Error', 'err'); return; }
    toast('Materia quitada del mapa', 'ok');
    await renderTabMapa();
  } catch { toast('Error de conexión', 'err'); }
}

async function agregarPrereq() {
  const materia_id     = document.getElementById('sel-prereq-materia').value;
  const prerequisito_id = document.getElementById('sel-prereq-prereq').value;
  if (!materia_id || !prerequisito_id) { toast('Selecciona ambas materias', 'err'); return; }
  if (materia_id === prerequisito_id)  { toast('Una materia no puede ser prerrequisito de sí misma', 'err'); return; }
  try {
    const r = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/prerequisitos`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ materia_id: parseInt(materia_id), prerequisito_id: parseInt(prerequisito_id) })
    });
    const data = await r.json();
    if (!r.ok) { toast(data.message || 'Error', 'err'); return; }
    toast('Prerrequisito agregado', 'ok');
    await renderTabPrereq();
  } catch { toast('Error de conexión', 'err'); }
}

async function eliminarPrereq(id) {
  if (!confirm('¿Eliminar este prerrequisito?')) return;
  try {
    const r = await fetch(`${API_URL}/reticular/carrera/${_carreraId}/prerequisitos/${id}`, {
      method: 'DELETE', headers: authHeaders()
    });
    if (!r.ok) { const d = await r.json(); toast(d.message || 'Error', 'err'); return; }
    toast('Prerrequisito eliminado', 'ok');
    await renderTabPrereq();
  } catch { toast('Error de conexión', 'err'); }
}

let _tt;
function toast(msg, tipo) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast ' + tipo;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2800);
}