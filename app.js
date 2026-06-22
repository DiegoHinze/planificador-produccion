// ============================================================
// ESTADO GLOBAL
// ============================================================
let obras = JSON.parse(localStorage.getItem('obras') || '[]');
let obraActiva = null;
let cantidades = {};
let rotacionesAprobadas = {};
let opNames = JSON.parse(localStorage.getItem('opNames') || '["Operario 1","Operario 2","Operario 3","Operario 4"]');
let corteNombre = localStorage.getItem('corteNombre') || 'Cortador';
let filaAberturaIdx = 0;

// Obra demo precargada (Colonia Quartier)
const OBRA_DEMO = {
  id: 'demo-501792',
  nombre: 'Colonia Quartier',
  ppto: '501792',
  cliente: 'CRIBA',
  sistema: 'Nordical 90° Corrediza + Fijo y HA 62',
  aberturas: [
    { tipo:'CA1',  medida:'3250×2350', desc:'Corrediza Nordical 90° Reforzada 1H Móvil + Fijo', cat:'corrediza', total:159 },
    { tipo:'CA2a', medida:'2490×2350', desc:'Corrediza Nordical 90° Reforzada 1H Móvil + Fijo', cat:'corrediza', total:106 },
    { tipo:'CA2b', medida:'2690×2350', desc:'Corrediza Nordical 90° Reforzada 1H Móvil + Fijo', cat:'corrediza', total:106 },
    { tipo:'CA3',  medida:'2500×2350', desc:'Corrediza Nordical 90° Reforzada 1H Móvil + Fijo', cat:'corrediza', total:44  },
    { tipo:'CA4',  medida:'3360×2350', desc:'Corrediza Doble Reforzada + Tubo 100×30',           cat:'corrediza', total:44  },
    { tipo:'CA5',  medida:'3210×2350', desc:'Corrediza Doble Reforzada + Tubo 100×30',           cat:'corrediza', total:44  },
    { tipo:'CA6',  medida:'4930×2350', desc:'2 Corredizas Nordical 90° Reforzadas conectadas',   cat:'corrediza', total:22  },
    { tipo:'CA7',  medida:'700×1620',  desc:'Oscilobatiente + Marco Fijo HA 62',                 cat:'oscilo',    total:11  },
  ]
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!obras.find(o => o.id === OBRA_DEMO.id)) {
    obras.unshift(OBRA_DEMO);
    saveObras();
  }
  renderObras();
  renderOperariosConfig();
  setFechaDefault();
});

function saveObras() { localStorage.setItem('obras', JSON.stringify(obras)); }
function saveConfig() {
  localStorage.setItem('opNames', JSON.stringify(opNames));
  localStorage.setItem('corteNombre', corteNombre);
}

function setFechaDefault() {
  const hoy = new Date();
  const dow = hoy.getDay();
  const diff = dow === 1 ? 0 : (8 - dow) % 7 || 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  const fi = document.getElementById('fecha-inicio');
  if (fi) fi.value = lunes.toISOString().split('T')[0];
}

// ============================================================
// NAVEGACION
// ============================================================
function showSection(name) {
  ['obras','planificar','config'].forEach(s => {
    document.getElementById('sec-'+s).classList.toggle('hidden', s !== name);
  });
  document.querySelectorAll('.nav-btn').forEach((b, i) => {
    b.classList.toggle('active', ['obras','planificar','config'][i] === name);
  });
}

// ============================================================
// OBRAS
// ============================================================
function renderObras() {
  const empty = document.getElementById('obras-empty');
  const grid = document.getElementById('obras-grid');
  if (!obras.length) { empty.classList.remove('hidden'); grid.classList.add('hidden'); return; }
  empty.classList.add('hidden'); grid.classList.remove('hidden');
  grid.innerHTML = obras.map(o => `
    <div class="obra-card ${obraActiva?.id === o.id ? 'selected' : ''}" onclick="seleccionarObra('${o.id}')">
      <div class="obra-badge">Ppto. ${o.ppto}</div>
      <div class="obra-nombre">${o.nombre}</div>
      <div class="obra-sub">${o.cliente} · ${o.sistema}</div>
      <div class="obra-stats">
        <div class="obra-stat"><strong>${o.aberturas.length}</strong> tipos</div>
        <div class="obra-stat"><strong>${o.aberturas.reduce((s,a)=>s+a.total,0)}</strong> aberturas totales</div>
      </div>
      <div class="obra-actions">
        <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="event.stopPropagation();planificarObra('${o.id}')">Planificar</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="event.stopPropagation();eliminarObra('${o.id}')">Eliminar</button>
      </div>
    </div>`).join('');
}

function seleccionarObra(id) {
  obraActiva = obras.find(o => o.id === id);
  renderObras();
}

function planificarObra(id) {
  obraActiva = obras.find(o => o.id === id);
  cantidades = {};
  rotacionesAprobadas = {};
  renderObras();
  showSection('planificar');
  renderPlanificador();
}

function eliminarObra(id) {
  if (!confirm('¿Eliminar esta obra?')) return;
  obras = obras.filter(o => o.id !== id);
  saveObras();
  if (obraActiva?.id === id) { obraActiva = null; }
  renderObras();
}

// ============================================================
// MODAL NUEVA OBRA
// ============================================================
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  filaAberturaIdx = 0;
  document.getElementById('abertura-rows').innerHTML = '';
  agregarFilaAbertura();
}
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

function agregarFilaAbertura() {
  const idx = filaAberturaIdx++;
  const row = document.createElement('div');
  row.className = 'abertura-nueva-row';
  row.id = 'ab-row-' + idx;
  row.innerHTML = `
    <input type="text" placeholder="CA1" id="ab-tipo-${idx}">
    <input type="text" placeholder="3250×2350" id="ab-medida-${idx}">
    <input type="text" placeholder="Descripción" id="ab-desc-${idx}">
    <select id="ab-cat-${idx}">
      <option value="corrediza">Corrediza</option>
      <option value="oscilo">Oscilo</option>
    </select>
    <input type="number" placeholder="0" min="0" id="ab-total-${idx}">
    <button class="del-row-btn" onclick="eliminarFila(${idx})">✕</button>`;
  document.getElementById('abertura-rows').appendChild(row);
}

function eliminarFila(idx) {
  const el = document.getElementById('ab-row-' + idx);
  if (el) el.remove();
}

function guardarObra() {
  const nombre = document.getElementById('obra-nombre').value.trim();
  const ppto = document.getElementById('obra-ppto').value.trim();
  const cliente = document.getElementById('obra-cliente').value.trim();
  const sistema = document.getElementById('obra-sistema').value.trim();
  if (!nombre || !ppto) { alert('Nombre y número de presupuesto son obligatorios.'); return; }

  const aberturas = [];
  document.querySelectorAll('.abertura-nueva-row').forEach((row, i) => {
    const idx = row.id.replace('ab-row-', '');
    const tipo = document.getElementById('ab-tipo-'+idx)?.value.trim();
    const medida = document.getElementById('ab-medida-'+idx)?.value.trim();
    const desc = document.getElementById('ab-desc-'+idx)?.value.trim();
    const cat = document.getElementById('ab-cat-'+idx)?.value;
    const total = parseInt(document.getElementById('ab-total-'+idx)?.value) || 0;
    if (tipo && total > 0) aberturas.push({ tipo, medida, desc, cat, total });
  });

  if (!aberturas.length) { alert('Agregá al menos una abertura con cantidad.'); return; }

  const obra = { id: 'obra-' + Date.now(), nombre, ppto, cliente, sistema, aberturas };
  obras.push(obra);
  saveObras();
  renderObras();
  hideModal('modal-obra');
}

// ============================================================
// PLANIFICADOR
// ============================================================
function renderPlanificador() {
  const noObra = document.getElementById('plan-no-obra');
  const contenido = document.getElementById('plan-contenido');
  const resultado = document.getElementById('plan-resultado');

  if (!obraActiva) { noObra.classList.remove('hidden'); contenido.classList.add('hidden'); return; }
  noObra.classList.add('hidden'); contenido.classList.remove('hidden');
  resultado.classList.add('hidden');

  document.getElementById('plan-obra-info').innerHTML = `
    <div style="font-size:11px;background:#e6f1fb;color:#0c447c;padding:2px 8px;border-radius:4px;font-weight:500;display:inline-block;margin-bottom:6px">Ppto. ${obraActiva.ppto}</div>
    <div style="font-size:15px;font-weight:600">${obraActiva.nombre}</div>
    <div style="font-size:12px;color:#6b6b68">${obraActiva.cliente} · ${obraActiva.sistema}</div>`;

  document.getElementById('aberturas-list').innerHTML = obraActiva.aberturas.map(a => `
    <div class="abertura-row">
      <span><span class="badge ${a.cat === 'oscilo' ? 'badge-oscilo' : 'badge-corr'}">${a.tipo}</span></span>
      <span style="color:#6b6b68;font-size:12px">${a.desc}</span>
      <span style="color:#9b9b98;font-size:12px">${a.medida}</span>
      <span style="font-weight:600;text-align:center">${a.total}</span>
      <input type="number" min="0" max="${a.total}" value="${cantidades[a.tipo]||0}" class="qty-input"
        onchange="cantidades['${a.tipo}']=parseInt(this.value)||0">
    </div>`).join('');
}

function limpiarCantidades() { cantidades = {}; rotacionesAprobadas = {}; renderPlanificador(); }

// ============================================================
// CONFIG
// ============================================================
function cfg() {
  return {
    corteLJ: parseFloat(document.getElementById('c-corte-lj').value) || 27,
    corteV:  parseFloat(document.getElementById('c-corte-v').value)  || 24,
    prepLJ:  parseFloat(document.getElementById('c-prep-lj').value)  || 10,
    prepV:   parseFloat(document.getElementById('c-prep-v').value)   || 10,
    cortePrepLJ: parseFloat(document.getElementById('c-corte-prep').value)   || 5,
    cortePrepV:  parseFloat(document.getElementById('c-corte-prep-v').value) || 5,
    armPrepLJ: parseFloat(document.getElementById('c-arm-prep').value)   || 10,
    armPrepV:  parseFloat(document.getElementById('c-arm-prep-v').value) || 10,
    armCorr:   parseFloat(document.getElementById('c-arm-corr').value)   || 5,
    armOscilo: parseFloat(document.getElementById('c-arm-oscilo').value) || 1.5,
    colchon:   parseFloat(document.getElementById('c-colchon').value)    || 2,
  };
}

function renderOperariosConfig() {
  document.getElementById('operarios-config').innerHTML = [
    { cls:'chip-corte', nombre: corteNombre, key:'corte' },
    { cls:'chip-op1', nombre: opNames[0], key:'0' },
    { cls:'chip-op2', nombre: opNames[1], key:'1' },
    { cls:'chip-op3', nombre: opNames[2], key:'2' },
    { cls:'chip-op4', nombre: opNames[3], key:'3' },
  ].map(op => `
    <div class="operario-row">
      <div class="operario-badge ${op.cls}" style="font-size:11px">${op.key==='corte'?'Corte':'Arm. '+(parseInt(op.key)+1)}</div>
      <input type="text" class="operario-input" id="op-name-${op.key}" value="${op.nombre}">
    </div>`).join('');
}

function guardarConfig() {
  corteNombre = document.getElementById('op-name-corte').value || 'Cortador';
  opNames = [0,1,2,3].map(i => document.getElementById('op-name-'+i).value || 'Operario '+(i+1));
  saveConfig();
  const ok = document.getElementById('cfg-ok');
  ok.classList.remove('hidden');
  setTimeout(() => ok.classList.add('hidden'), 2000);
}

// ============================================================
// LOGICA DE PLANIFICACION
// ============================================================
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtF(d) { return d.toLocaleDateString('es-UY', { day:'numeric', month:'short' }); }
function fmtD(d) { return d.toLocaleDateString('es-UY', { weekday:'short', day:'numeric' }); }

function calcDiaOptimo(c, stock) {
  let s = stock;
  for (let di = 0; di < 5; di++) {
    const corte = di === 4 ? c.corteV : c.corteLJ;
    const prep  = di === 4 ? c.prepV  : c.prepLJ;
    s += corte;
    if (s >= prep * (c.colchon + 1)) return { dia: di, stock: Math.round(s) };
  }
  return null;
}

function generarPlan() {
  if (!obraActiva) return;
  const c = cfg();
  const pedido = obraActiva.aberturas
    .filter(a => (cantidades[a.tipo] || 0) > 0)
    .map(a => ({ ...a, restante: cantidades[a.tipo] || 0 }));
  if (!pedido.length) { alert('Ingresá al menos una cantidad.'); return; }

  const totalPedido = pedido.reduce((s, a) => s + a.restante, 0);
  const capBaseSem  = 4 * c.prepLJ + c.prepV;

  document.getElementById('plan-metrics').innerHTML = `
    <div class="metric"><div class="metric-label">Total a fabricar</div><div class="metric-value">${totalPedido}</div><div class="metric-sub">aberturas</div></div>
    <div class="metric"><div class="metric-label">Cap. prep. base/sem.</div><div class="metric-value">${capBaseSem}</div><div class="metric-sub">sin rotaciones</div></div>
    <div class="metric"><div class="metric-label">Semanas mínimas</div><div class="metric-value">${Math.ceil(totalPedido/capBaseSem)}</div><div class="metric-sub">estimado</div></div>
    <div class="metric"><div class="metric-label">Colchón seguridad</div><div class="metric-value">${c.colchon}</div><div class="metric-sub">días stock</div></div>`;

  document.getElementById('op-legend').innerHTML = [
    { cls:'#534ab7', name: corteNombre },
    { cls:'#378add', name: opNames[0] },
    { cls:'#639922', name: opNames[1] },
    { cls:'#ba7517', name: opNames[2] },
    { cls:'#d4537e', name: opNames[3] },
  ].map(o => `<div class="op-leg-item"><div class="op-dot" style="background:${o.cls}"></div>${o.name}</div>`).join('');

  let pendiente = pedido.map(a => ({ ...a }));
  let stock = 0;
  const fi = document.getElementById('fecha-inicio').value;
  let fecha = fi ? new Date(fi + 'T00:00:00') : new Date();
  let semanas = [];
  let semIdx = 0;

  while (pendiente.some(a => a.restante > 0) && semIdx < 26) {
    const lunes = new Date(fecha);
    const rot = rotacionesAprobadas[semIdx] || { corteAPrep: false, desdeDia: -1, armsAPrep: 0 };
    const optCorte = calcDiaOptimo(c, stock);

    // Ganancia estimada de cada opción
    let ganCorte = 0, ganArm = 0, ganAmbos = 0;
    if (optCorte) {
      const dias = 5 - (optCorte.dia + 1);
      ganCorte = dias * c.cortePrepLJ;
    }
    ganArm   = 4 * c.armPrepLJ + c.armPrepV;
    ganAmbos = ganCorte + ganArm;

    let diasData = [], prepSemTotal = 0;

    for (let di = 0; di < 5; di++) {
      const esV = di === 4;
      const corteActivo = !(rot.corteAPrep && di >= rot.desdeDia);
      const nArms = rot.armsAPrep || 0;
      const armDisp = 4 - nArms;

      let capPrep = esV ? c.prepV : c.prepLJ;
      if (rot.corteAPrep && di >= rot.desdeDia) capPrep += esV ? c.cortePrepV : c.cortePrepLJ;
      if (nArms > 0) capPrep += nArms * (esV ? c.armPrepV : c.armPrepLJ);

      const cortadoHoy = corteActivo ? (esV ? c.corteV : c.corteLJ) : 0;
      stock += cortadoHoy;

      const pendTotal = pendiente.reduce((s, a) => s + a.restante, 0);
      const dispPrep = Math.min(capPrep, pendTotal, stock);
      stock = Math.max(0, stock - dispPrep);

      let prepHoy = [], restPrep = dispPrep;
      for (let a of pendiente) {
        if (restPrep <= 0) break;
        const q = Math.min(a.restante, restPrep);
        if (q > 0) { prepHoy.push({ tipo: a.tipo, cat: a.cat, qty: q }); restPrep -= q; }
      }
      for (let p of prepHoy) {
        const idx = pendiente.findIndex(a => a.tipo === p.tipo);
        if (idx >= 0) pendiente[idx].restante -= p.qty;
      }

      let armHoy = [], opCarga = Array(armDisp).fill(0);
      for (let p of prepHoy) {
        let rest = p.qty;
        while (rest > 0) {
          const capOp = p.cat === 'oscilo' ? c.armOscilo : c.armCorr;
          const mi = opCarga.reduce((mi, v, i, arr) => v < arr[mi] ? i : mi, 0);
          const dispo = Math.max(0, capOp - opCarga[mi]);
          if (dispo <= 0) break;
          const asig = Math.min(rest, dispo);
          armHoy.push({ opIdx: mi, tipo: p.tipo, qty: asig, cat: p.cat });
          opCarga[mi] += asig / capOp;
          rest -= asig;
        }
      }

      prepSemTotal += dispPrep;
      diasData.push({ di, fecha: addDays(lunes, di), corteActivo, cortadoHoy, prepHoy, armHoy, dispPrep, capPrep, nArms, stock: Math.round(stock) });
    }

    const pendAlFinal = pendiente.reduce((s, a) => s + a.restante, 0);
    const libre = Math.round(capBaseSem - prepSemTotal);
    const pct   = Math.min(100, Math.round((prepSemTotal / capBaseSem) * 100));
    const rotActiva = rot.corteAPrep || rot.armsAPrep > 0;

    semanas.push({ lunes, diasData, prepSemTotal, pendAlFinal, libre, pct, semIdx, optCorte, ganCorte, ganArm, ganAmbos, rot, rotActiva, capBaseSem });
    fecha = addDays(lunes, 7);
    semIdx++;
  }

  document.getElementById('plan-weeks').innerHTML = semanas.map(renderSemana).join('');
  document.getElementById('plan-resultado').classList.remove('hidden');
  document.getElementById('plan-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderSemana(sem) {
  const { lunes, diasData, prepSemTotal, pendAlFinal, libre, pct, semIdx, optCorte, ganCorte, ganArm, ganAmbos, rot, rotActiva, capBaseSem } = sem;
  const semFin = addDays(lunes, 4);
  const estadoClass = pct >= 95 ? 'wb-ok' : libre > 0 ? 'wb-free' : 'wb-warn';
  const estadoTxt   = pct >= 95 ? 'Semana completa' : libre > 0 ? `${libre} unid. libres` : 'Al límite';
  const barColor    = pct >= 95 ? '#639922' : pct >= 70 ? '#ba7517' : '#e24b4a';

  // Sugerencias
  let suggHtml = '';
  if (!rotActiva && pendAlFinal > 0) {
    const opts = [];
    if (optCorte) {
      opts.push({
        titulo: `Rotar ${corteNombre} a preparación desde el ${['Lunes','Martes','Miércoles','Jueves','Viernes'][optCorte.dia+1] || 'Viernes'}`,
        detalle: `Después de ${optCorte.dia + 1} día(s) de corte habrá ${optCorte.stock} uds. en stock. Ganancia estimada esta semana: +${Math.round(ganCorte)} unidades.`,
        accion: `aplicarRot(${semIdx},{corteAPrep:true,desdeDia:${optCorte.dia + 1},armsAPrep:0})`
      });
    } else {
      opts.push({ titulo: `${corteNombre} permanece en corte toda la semana`, detalle: `El stock no es suficiente para rotar con seguridad. Se recomienda mantenerlo en corte.`, accion: null });
    }
    opts.push({
      titulo: `Rotar 1 armador a preparación`,
      detalle: `Un operario pasa a preparación toda la semana. Ganancia estimada: +${Math.round(ganArm)} unidades. Armado queda con 3 operarios.`,
      accion: `aplicarRot(${semIdx},{corteAPrep:false,desdeDia:0,armsAPrep:1})`
    });
    if (optCorte) {
      opts.push({
        titulo: `Rotar ambos: ${corteNombre} + 1 armador`,
        detalle: `Máxima ganancia. Ganancia total estimada: +${Math.round(ganAmbos)} unidades. Armado queda con 3 operarios.`,
        accion: `aplicarRot(${semIdx},{corteAPrep:true,desdeDia:${optCorte.dia + 1},armsAPrep:1})`
      });
    }
    suggHtml = `<div class="sugg-card">
      <div class="sugg-title">💡 Sugerencias de rotación — semana ${semIdx + 1}</div>
      ${opts.map(o => `<div class="sugg-opt">
        <div class="sugg-opt-title">${o.titulo}</div>
        <div class="sugg-opt-sub">${o.detalle}</div>
        ${o.accion ? `<button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="${o.accion}">Aplicar al plan</button>` : ''}
      </div>`).join('')}
    </div>`;
  } else if (rotActiva) {
    const desc = [];
    if (rot.corteAPrep) desc.push(`${corteNombre} en prep. desde ${['Lunes','Martes','Miércoles','Jueves','Viernes'][rot.desdeDia] || 'inicio'}`);
    if (rot.armsAPrep) desc.push(`${rot.armsAPrep} armador(es) en prep.`);
    suggHtml = `<div class="rot-active-info">
      <span>↻ Rotación activa: ${desc.join(' · ')}</span>
      <button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="quitarRot(${semIdx})">Quitar</button>
    </div>`;
  }

  // Días
  const diasHtml = diasData.map(d => {
    const prepChips = d.prepHoy.length
      ? d.prepHoy.map(p => `<span class="chip">${p.tipo}×${Math.round(p.qty)}</span>`).join('')
      : `<span style="font-size:11px;color:#9b9b98">—</span>`;

    const corteChip = d.corteActivo
      ? `<span class="chip chip-corte">${corteNombre}: ${Math.round(d.cortadoHoy)}</span>`
      : `<span class="chip chip-corte">${corteNombre} en prep.</span>`;

    const armChips = [0,1,2,3].filter(i => i < 4 - d.nArms).map(oi => {
      const tareas = d.armHoy.filter(a => a.opIdx === oi);
      if (!tareas.length) return `<div style="font-size:11px;color:#9b9b98">${opNames[oi]}: libre</div>`;
      return `<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:2px">
        <span style="font-size:10px;color:#9b9b98;min-width:72px">${opNames[oi]}</span>
        ${tareas.map(t => `<span class="chip chip-op${oi+1}">${t.tipo}×${Math.round(t.qty)}</span>`).join('')}
      </div>`;
    }).join('');

    const armRotInfo = d.nArms > 0 ? `<div style="font-size:10px;color:#633806;margin-top:2px">${d.nArms} op. rotó a prep.</div>` : '';

    return `<div class="day-block">
      <div class="day-name">${fmtD(d.fecha)}</div>
      <div class="stations">
        <div><div class="st-label">Corte</div><div class="chips">${corteChip}</div><div class="stock-info">Stock: ${d.stock} uds.</div></div>
        <div><div class="st-label">Preparación (${Math.round(d.dispPrep)}/${Math.round(d.capPrep)})</div><div class="chips">${prepChips}</div></div>
        <div><div class="st-label">Armado</div>${armChips}${armRotInfo}</div>
      </div>
    </div>`;
  }).join('');

  const libreHtml = libre > 0 && pendAlFinal === 0 ? `
    <div class="free-slot">
      <div class="free-slot-title">✓ Pedido completado — ${libre} espacios disponibles</div>
      <div class="free-slot-sub">Podés usar esta capacidad para adelantar otra obra.</div>
    </div>` : '';

  return `<div class="week-block">
    <div class="week-header">
      <span class="week-title">Semana ${semIdx + 1} — ${fmtF(lunes)} al ${fmtF(semFin)}</span>
      <div class="week-right">
        ${rotActiva ? '<span class="wbadge" style="background:#eeedfe;color:#3c3489">Rotación activa</span>' : ''}
        <span class="week-count">${Math.round(prepSemTotal)}/${capBaseSem} preparadas</span>
        <span class="wbadge ${estadoClass}">${estadoTxt}</span>
      </div>
    </div>
    <div class="capbar"><div class="capbar-fill" style="width:${pct}%;background:${barColor}"></div></div>
    <div class="week-body">${suggHtml}${diasHtml}${libreHtml}</div>
  </div>`;
}

function aplicarRot(semIdx, rot) {
  rotacionesAprobadas[semIdx] = rot;
  generarPlan();
}
function quitarRot(semIdx) {
  delete rotacionesAprobadas[semIdx];
  generarPlan();
}
