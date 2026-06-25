// ============================================================
// ESTADO GLOBAL
// ============================================================
let obras = JSON.parse(localStorage.getItem('obras') || '[]');
let lotes = JSON.parse(localStorage.getItem('lotes') || '[]');
let opNames = JSON.parse(localStorage.getItem('opNames') || '["Operario 1","Operario 2","Operario 3","Operario 4"]');
let corteNombre = localStorage.getItem('corteNombre') || 'Cortador';
let prepNombres = JSON.parse(localStorage.getItem('prepNombres') || '["Preparador 1"]');
let parejaArmado = JSON.parse(localStorage.getItem('parejaArmado') || 'false');
let filaAberturaIdx = 0;
let obraLoteActual = null;

const OBRA_DEMO = {
  id: 'demo-501792', nombre: 'Colonia Quartier', ppto: '501792', cliente: 'CRIBA',
  sistema: 'Nordical 90° Corrediza + Fijo y HA 62',
  aberturas: [
    { tipo:'CA1',  medida:'3250×2350', desc:'Corrediza 1H Móvil + Fijo',         cat:'corrediza', total:159 },
    { tipo:'CA2a', medida:'2490×2350', desc:'Corrediza 1H Móvil + Fijo',         cat:'corrediza', total:106 },
    { tipo:'CA2b', medida:'2690×2350', desc:'Corrediza 1H Móvil + Fijo',         cat:'corrediza', total:106 },
    { tipo:'CA3',  medida:'2500×2350', desc:'Corrediza 1H Móvil + Fijo',         cat:'corrediza', total:44  },
    { tipo:'CA4',  medida:'3360×2350', desc:'Corrediza Doble Reforzada + Tubo',  cat:'corrediza', total:44  },
    { tipo:'CA5',  medida:'3210×2350', desc:'Corrediza Doble Reforzada + Tubo',  cat:'corrediza', total:44  },
    { tipo:'CA6',  medida:'4930×2350', desc:'2 Corredizas conectadas',           cat:'corrediza', total:22  },
    { tipo:'CA7',  medida:'700×1620',  desc:'Oscilobatiente + Marco Fijo HA 62', cat:'oscilo',    total:11  },
  ]
};

const OBRA_DEMO2 = {
  id: 'demo-501800', nombre: 'Torre Náutica', ppto: '501800',
  cliente: 'Constructora del Sur', sistema: 'Nordical 90° Corrediza + Oscilobatiente',
  aberturas: [
    { tipo:'TN1', medida:'2400×2100', desc:'Corrediza 1H Móvil + Fijo',        cat:'corrediza', total:80 },
    { tipo:'TN2', medida:'1800×2100', desc:'Corrediza 1H Móvil + Fijo',        cat:'corrediza', total:60 },
    { tipo:'TN3', medida:'1200×1500', desc:'Oscilobatiente + Marco Fijo',      cat:'oscilo',    total:40 },
    { tipo:'TN4', medida:'3000×2100', desc:'Corrediza Doble 2H Móvil + Fijo',  cat:'corrediza', total:24 },
  ]
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!obras.find(o => o.id === OBRA_DEMO.id))  obras.unshift(OBRA_DEMO);
  if (!obras.find(o => o.id === OBRA_DEMO2.id)) obras.push(OBRA_DEMO2);
  saveObras();
  renderObras();
  renderOperariosConfig();
  renderLotes();
  setFechaDefault();
  // Restaurar estado pareja
  const chk = document.getElementById('pareja-armado');
  if (chk) chk.checked = parejaArmado;
});

function saveObras()  { localStorage.setItem('obras', JSON.stringify(obras)); }
function saveLotes()  { localStorage.setItem('lotes', JSON.stringify(lotes)); }
function saveConfig() {
  localStorage.setItem('opNames', JSON.stringify(opNames));
  localStorage.setItem('corteNombre', corteNombre);
  localStorage.setItem('prepNombres', JSON.stringify(prepNombres));
  localStorage.setItem('parejaArmado', JSON.stringify(parejaArmado));
}

function setFechaDefault() {
  const fi = document.getElementById('fecha-inicio');
  if (!fi) return;
  const saved = localStorage.getItem('fecha-inicio');
  if (saved) { fi.value = saved; return; }
  const hoy = new Date(); const dow = hoy.getDay();
  const diff = dow===1?0:(8-dow)%7||7;
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate()+diff);
  fi.value = lunes.toISOString().split('T')[0];
}

// ============================================================
// NAVEGACION
// ============================================================
function showSection(name) {
  ['obras','planificar','stock','config'].forEach(s => {
    document.getElementById('sec-'+s).classList.toggle('hidden', s!==name);
  });
  document.querySelectorAll('.nav-btn').forEach((b,i) => {
    b.classList.toggle('active', ['obras','planificar','stock','config'][i]===name);
  });
  if (name==='planificar') renderLotes();
  if (name==='stock') renderStock();
}

// ============================================================
// OBRAS
// ============================================================
function renderObras() {
  const empty = document.getElementById('obras-empty');
  const grid  = document.getElementById('obras-grid');
  if (!obras.length) { empty.classList.remove('hidden'); grid.classList.add('hidden'); return; }
  empty.classList.add('hidden'); grid.classList.remove('hidden');
  grid.innerHTML = obras.map(o => `
    <div class="obra-card">
      <div class="obra-badge">Ppto. ${o.ppto}</div>
      <div class="obra-nombre">${o.nombre}</div>
      <div class="obra-sub">${o.cliente} · ${o.sistema}</div>
      <div class="obra-stats">
        <div class="obra-stat"><strong>${o.aberturas.length}</strong> tipos</div>
        <div class="obra-stat"><strong>${o.aberturas.reduce((s,a)=>s+a.total,0)}</strong> aberturas</div>
      </div>
      <div class="obra-actions">
        <button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="showSection('planificar')">Planificar</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="eliminarObra('${o.id}')">Eliminar</button>
      </div>
    </div>`).join('');
}

function eliminarObra(id) {
  if (id===OBRA_DEMO.id||id===OBRA_DEMO2.id) { alert('Las obras de demo no se pueden eliminar.'); return; }
  if (!confirm('¿Eliminar esta obra?')) return;
  obras=obras.filter(o=>o.id!==id);
  lotes=lotes.filter(l=>l.obraId!==id);
  saveObras(); saveLotes(); renderObras(); renderLotes();
}

// ============================================================
// MODAL NUEVA OBRA
// ============================================================
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  if (id==='modal-obra') { filaAberturaIdx=0; document.getElementById('abertura-rows').innerHTML=''; agregarFilaAbertura(); }
}
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

function agregarFilaAbertura() {
  const idx=filaAberturaIdx++;
  const row=document.createElement('div');
  row.className='abertura-nueva-row'; row.id='ab-row-'+idx;
  row.innerHTML=`
    <input type="text" placeholder="CA1" id="ab-tipo-${idx}">
    <input type="text" placeholder="3250×2350" id="ab-medida-${idx}">
    <input type="text" placeholder="Descripción" id="ab-desc-${idx}">
    <select id="ab-cat-${idx}"><option value="corrediza">Corrediza</option><option value="oscilo">Oscilo</option></select>
    <input type="number" placeholder="0" min="0" id="ab-total-${idx}">
    <button class="del-row-btn" onclick="eliminarFila(${idx})">✕</button>`;
  document.getElementById('abertura-rows').appendChild(row);
}
function eliminarFila(idx) { const el=document.getElementById('ab-row-'+idx); if(el) el.remove(); }

function guardarObra() {
  const nombre=document.getElementById('obra-nombre').value.trim();
  const ppto=document.getElementById('obra-ppto').value.trim();
  const cliente=document.getElementById('obra-cliente').value.trim();
  const sistema=document.getElementById('obra-sistema').value.trim();
  if(!nombre||!ppto){alert('Nombre y presupuesto son obligatorios.');return;}
  const aberturas=[];
  document.querySelectorAll('.abertura-nueva-row').forEach(row=>{
    const idx=row.id.replace('ab-row-','');
    const tipo=document.getElementById('ab-tipo-'+idx)?.value.trim();
    const medida=document.getElementById('ab-medida-'+idx)?.value.trim();
    const desc=document.getElementById('ab-desc-'+idx)?.value.trim();
    const cat=document.getElementById('ab-cat-'+idx)?.value;
    const total=parseInt(document.getElementById('ab-total-'+idx)?.value)||0;
    if(tipo&&total>0) aberturas.push({tipo,medida,desc,cat,total});
  });
  if(!aberturas.length){alert('Agregá al menos una abertura.');return;}
  obras.push({id:'obra-'+Date.now(),nombre,ppto,cliente,sistema,aberturas});
  saveObras(); renderObras(); renderLotes(); hideModal('modal-obra');
}

// ============================================================
// LOTES
// ============================================================
function saldoPorTipo(obraId) {
  const planificado={};
  lotes.filter(l=>l.obraId===obraId).forEach(l=>{
    Object.entries(l.cantidades).forEach(([tipo,v])=>{
      planificado[tipo]=(planificado[tipo]||0)+v.qty;
    });
  });
  return planificado;
}

function abrirModalLote(obraId, urgente=false) {
  obraLoteActual=obras.find(o=>o.id===obraId);
  if(!obraLoteActual) return;
  document.getElementById('lote-obra-nombre').textContent=obraLoteActual.nombre+(urgente?' — URGENTE':'');
  document.getElementById('lote-fecha').value='';
  document.getElementById('lote-fecha-fin').value='';
  document.getElementById('lote-urgente').value=urgente?'1':'0';
  const divInicio=document.getElementById('div-fecha-inicio-lote');
  const divTipo=document.getElementById('div-tipo-lote');
  if(divInicio) divInicio.style.display=urgente?'block':'none';
  if(divTipo) divTipo.style.display='block';

  const planificado=saldoPorTipo(obraId);
  document.getElementById('lote-aberturas').innerHTML=obraLoteActual.aberturas.map(a=>{
    const yaPlani=planificado[a.tipo]||0;
    const saldo=Math.max(0,a.total-yaPlani);
    const completa=saldo===0;
    return `<div class="abertura-row" style="${completa?'opacity:0.4':''}">
      <span><span class="badge ${a.cat==='oscilo'?'badge-oscilo':'badge-corr'}">${a.tipo}</span></span>
      <span style="color:#6b6b68;font-size:12px">${a.desc}</span>
      <span style="color:#9b9b98;font-size:12px">${a.medida}</span>
      <div style="text-align:center">
        <div style="font-weight:600;font-size:13px">${saldo}</div>
        <div style="font-size:10px;color:#9b9b98">${yaPlani>0?'('+yaPlani+' ya en lotes)':''}</div>
      </div>
      ${completa
        ?'<span style="font-size:11px;color:#27500a;font-weight:500">✓ Completa</span>'
        :'<input type="number" min="0" max="'+saldo+'" value="0" class="qty-input" id="lote-qty-'+a.tipo+'">'}
    </div>`;
  }).join('');
  showModal('modal-lote');
}

function guardarLote() {
  if(!obraLoteActual) return;
  const fechaFin=document.getElementById('lote-fecha-fin').value;
  const fechaInicio=document.getElementById('lote-fecha').value;
  const urgente=document.getElementById('lote-urgente').value==='1';
  const tipoLote=document.getElementById('tipo-lote')?.value||'completo';
  const planificado=saldoPorTipo(obraLoteActual.id);
  const cantidades={};
  obraLoteActual.aberturas.forEach(a=>{
    const saldo=Math.max(0,a.total-(planificado[a.tipo]||0));
    if(saldo===0) return;
    const el=document.getElementById('lote-qty-'+a.tipo);
    if(!el) return;
    const v=Math.min(parseInt(el.value)||0,saldo);
    if(v>0) cantidades[a.tipo]={qty:v,cat:a.cat,desc:a.desc};
  });
  if(!Object.keys(cantidades).length){alert('Ingresá al menos una cantidad.');return;}
  lotes.push({
    id:'lote-'+Date.now(),
    obraId:obraLoteActual.id,
    obraNombre:obraLoteActual.nombre,
    cantidades,
    fechaLimite:fechaFin,
    fechaInicio:urgente?fechaInicio:'',
    urgente,
    tipoLote, // 'completo', 'marcos', 'hojas'
    agregadoEl:new Date().toISOString()
  });
  saveLotes(); renderLotes(); hideModal('modal-lote');
}

function eliminarLote(id) {
  if(!confirm('¿Eliminar este lote?')) return;
  lotes=lotes.filter(l=>l.id!==id);
  saveLotes(); renderLotes();
  document.getElementById('plan-resultado').classList.add('hidden');
}

function limpiarPlanGlobal() {
  if(!confirm('¿Eliminar todos los lotes y limpiar el plan?')) return;
  lotes=[];
  saveLotes(); renderLotes();
  document.getElementById('plan-resultado').classList.add('hidden');
}

// ============================================================
// RENDER LOTES
// ============================================================
function renderLotes() {
  const container=document.getElementById('lotes-container');
  if(!container) return;
  if(!lotes.length){
    container.innerHTML=`<div class="empty-state" style="padding:40px 24px">
      <div class="empty-icon">📦</div>
      <p>No hay lotes cargados. Agregá el primer lote de producción.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px">
        ${obras.map(o=>`<button class="btn-primary" onclick="abrirModalLote('${o.id}')">+ Lote para ${o.nombre}</button>`).join('')}
      </div>
    </div>`;
    return;
  }
  const porObra={};
  lotes.forEach(l=>{ if(!porObra[l.obraId])porObra[l.obraId]=[]; porObra[l.obraId].push(l); });
  let html=Object.entries(porObra).map(([obraId,lotesObra])=>{
    const obra=obras.find(o=>o.id===obraId);
    if(!obra) return '';
    return `<div class="obra-plan-card" style="margin-bottom:16px">
      <div class="obra-plan-header">
        <div>
          <div class="obra-plan-nombre">${obra.nombre}</div>
          <div style="font-size:12px;color:#6b6b68">Ppto. ${obra.ppto} · ${obra.cliente}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="abrirModalLote('${obraId}')">+ Lote normal</button>
          <button class="btn-urgente" style="font-size:12px;padding:5px 12px" onclick="abrirModalLote('${obraId}',true)">⚡ Lote urgente</button>
        </div>
      </div>
      <div style="padding:12px 16px">
        ${lotesObra.map((l,i)=>{
          const total=Object.values(l.cantidades).reduce((s,v)=>s+v.qty,0);
          const fl=l.fechaLimite?new Date(l.fechaLimite+'T12:00:00').toLocaleDateString('es-UY',{day:'numeric',month:'short',year:'numeric'}):'Sin fecha';
          const fi=l.fechaInicio?new Date(l.fechaInicio+'T12:00:00').toLocaleDateString('es-UY',{day:'numeric',month:'short'}):'';
          const detalle=Object.entries(l.cantidades).map(([t,v])=>`${t}×${v.qty}`).join(', ');
          const tipoLabel={completo:'Ventana completa',marcos:'Solo marcos',hojas:'Solo hojas'}[l.tipoLote||'completo'];
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid #e5e5e2;flex-wrap:wrap;gap:8px">
            <div>
              ${l.urgente?'<span class="urgente-tag">⚡ URGENTE</span>':''}<span style="font-size:12px;font-weight:600">Lote ${i+1}</span>
              <span class="tipo-lote-tag ${l.tipoLote||'completo'}">${tipoLabel}</span>
              <span style="font-size:12px;color:#6b6b68;margin-left:8px">${total} und.</span>
              <span style="font-size:11px;color:#9b9b98;margin-left:6px">· ${detalle}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              ${fi?`<span style="font-size:11px;color:#633806">Inicio: ${fi}</span>`:''}
              <span style="font-size:12px;color:#6b6b68">📅 ${fl}</span>
              <button class="del-row-btn" onclick="eliminarLote('${l.id}')">✕</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
  const obrasSinLote=obras.filter(o=>!lotes.find(l=>l.obraId===o.id));
  if(obrasSinLote.length){
    html+=`<div style="margin-top:8px"><div style="font-size:12px;color:#6b6b68;margin-bottom:8px">Obras sin lotes:</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${obrasSinLote.map(o=>`<button class="btn-secondary" style="font-size:12px" onclick="abrirModalLote('${o.id}')">+ Lote para ${o.nombre}</button>`).join('')}
      </div></div>`;
  }
  container.innerHTML=html;
}

// ============================================================
// CONFIG
// ============================================================
function cfg() {
  return {
    // Corte
    corteMarcoLJ: parseFloat(document.getElementById('c-corte-marco-lj').value)||26,
    corteMarcoV:  parseFloat(document.getElementById('c-corte-marco-v').value) ||26,
    corteHojaLJ:  parseFloat(document.getElementById('c-corte-hoja-lj').value) ||26,
    corteHojaV:   parseFloat(document.getElementById('c-corte-hoja-v').value)  ||26,
    // Preparación
    prepMarcoLJ:  parseFloat(document.getElementById('c-prep-marco-lj').value) ||10,
    prepMarcoV:   parseFloat(document.getElementById('c-prep-marco-v').value)  ||10,
    prepHojaLJ:   parseFloat(document.getElementById('c-prep-hoja-lj').value)  ||12,
    prepHojaV:    parseFloat(document.getElementById('c-prep-hoja-v').value)   ||12,
    // Armado
    armMarcoLJ:   parseFloat(document.getElementById('c-arm-marco-lj').value)  ||10,
    armMarcoV:    parseFloat(document.getElementById('c-arm-marco-v').value)   ||10,
    armHojaLJ:    parseFloat(document.getElementById('c-arm-hoja-lj').value)   ||8,
    armHojaV:     parseFloat(document.getElementById('c-arm-hoja-v').value)    ||8,
    // Rotación
    cortePrepLJ:  parseFloat(document.getElementById('c-corte-prep-lj').value) ||5,
    cortePrepV:   parseFloat(document.getElementById('c-corte-prep-v').value)  ||5,
    armPrepLJ:    parseFloat(document.getElementById('c-arm-prep-lj').value)   ||10,
    armPrepV:     parseFloat(document.getElementById('c-arm-prep-v').value)    ||10,
    colchon:      parseFloat(document.getElementById('c-colchon').value)       ||2,
  };
}

function renderOperariosConfig() {
  document.getElementById('operarios-config').innerHTML=`
    <div style="margin-bottom:16px">
      <div class="config-section-label">Corte</div>
      <div class="operario-row">
        <div class="operario-badge chip-corte">Corte</div>
        <input type="text" class="operario-input" id="op-name-corte" value="${corteNombre}">
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div class="config-section-label">Preparación
        <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarPreparador()">+ Agregar</button>
      </div>
      <div id="prep-operarios">
        ${prepNombres.map((n,i)=>`<div class="operario-row">
          <div class="operario-badge" style="background:#e6f1fb;color:#0c447c">Prep. ${i+1}</div>
          <input type="text" class="operario-input" id="op-prep-${i}" value="${n}">
          ${i>0?`<button class="del-row-btn" onclick="eliminarPreparador(${i})">✕</button>`:''}
        </div>`).join('')}
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div class="config-section-label">Armado
        <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarArmador()">+ Agregar</button>
      </div>
      <div id="arm-operarios">
        ${opNames.map((n,i)=>`<div class="operario-row">
          <div class="operario-badge chip-op${Math.min(i+1,4)}">Arm. ${i+1}</div>
          <input type="text" class="operario-input" id="op-name-${i}" value="${n}">
          ${i>0?`<button class="del-row-btn" onclick="eliminarArmador(${i})">✕</button>`:''}
        </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="config-section-label">Modo de armado</div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:8px 0">
        <input type="checkbox" id="pareja-armado" ${parejaArmado?'checked':''} onchange="togglePareja(this.checked)" style="width:16px;height:16px">
        <span>Dos armadores trabajan en pareja (duplica velocidad de armado)</span>
      </label>
      <div style="font-size:12px;color:#9b9b98;margin-top:2px">Cuando está activo, se asignan 2 operarios por ventana y se produce el doble por día.</div>
    </div>`;
}

function togglePareja(val) {
  parejaArmado=val;
  localStorage.setItem('parejaArmado', JSON.stringify(val));
}

function agregarArmador(){opNames.push('Operario '+(opNames.length+1));renderOperariosConfig();}
function eliminarArmador(i){if(opNames.length<=1){alert('Mínimo 1 armador.');return;}opNames.splice(i,1);renderOperariosConfig();}
function agregarPreparador(){prepNombres.push('Preparador '+(prepNombres.length+1));renderOperariosConfig();}
function eliminarPreparador(i){if(prepNombres.length<=1){alert('Mínimo 1 preparador.');return;}prepNombres.splice(i,1);renderOperariosConfig();}

function guardarConfig() {
  corteNombre=document.getElementById('op-name-corte').value||'Cortador';
  opNames=opNames.map((_,i)=>document.getElementById('op-name-'+i)?.value||'Operario '+(i+1));
  prepNombres=prepNombres.map((_,i)=>document.getElementById('op-prep-'+i)?.value||'Preparador '+(i+1));
  saveConfig();
  const ok=document.getElementById('cfg-ok');
  ok.classList.remove('hidden'); setTimeout(()=>ok.classList.add('hidden'),2000);
}

// ============================================================
// HELPERS
// ============================================================
function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function fmtF(d){return d.toLocaleDateString('es-UY',{day:'numeric',month:'short'});}
function fmtD(d){return d.toLocaleDateString('es-UY',{weekday:'short',day:'numeric'});}
function fmtFull(d){return d.toLocaleDateString('es-UY',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
const OBRA_COLORS=['#0c447c','#27500a','#633806','#3c3489','#72243e','#5a3e00'];
function obraColor(obraId){const idx=obras.findIndex(o=>o.id===obraId);return OBRA_COLORS[Math.max(0,idx)%OBRA_COLORS.length];}

// Capacidad de armado por día según tipo de lote y modo pareja
function capArmadoDia(tipoLote, esV, c) {
  const mult = parejaArmado ? 2 : 1;
  const nEfectivo = parejaArmado ? Math.floor(opNames.length/2) : opNames.length;
  if(tipoLote==='marcos') return {cap:(esV?c.armMarcoV:c.armMarcoLJ)*mult, nEfectivo};
  if(tipoLote==='hojas')  return {cap:(esV?c.armHojaV:c.armHojaLJ)*mult,  nEfectivo};
  // completo: promedio marco+hoja
  const capM=esV?c.armMarcoV:c.armMarcoLJ;
  const capH=esV?c.armHojaV:c.armHojaLJ;
  return {cap:Math.min(capM,capH)*mult, nEfectivo};
}

function capCorteDia(tipoLote, esV, c) {
  if(tipoLote==='marcos') return esV?c.corteMarcoV:c.corteMarcoLJ;
  if(tipoLote==='hojas')  return esV?c.corteHojaV:c.corteHojaLJ;
  return Math.min(esV?c.corteMarcoV:c.corteMarcoLJ, esV?c.corteHojaV:c.corteHojaLJ);
}

function capPrepDia(tipoLote, esV, c, nPrep) {
  if(tipoLote==='marcos') return (esV?c.prepMarcoV:c.prepMarcoLJ)*nPrep;
  if(tipoLote==='hojas')  return (esV?c.prepHojaV:c.prepHojaLJ)*nPrep;
  return Math.min(esV?c.prepMarcoV:c.prepMarcoLJ, esV?c.prepHojaV:c.prepHojaLJ)*nPrep;
}

// ============================================================
// PLANIFICACION
// ============================================================
function generarPlan() {
  const c=cfg();
  const fi=document.getElementById('fecha-inicio').value;
  if(!fi){alert('Seleccioná una fecha de inicio.');return;}
  if(!lotes.length){alert('Agregá al menos un lote.');return;}
  localStorage.setItem('fecha-inicio',fi);

  const nPrep=prepNombres.length;
  const nArm=opNames.length;
  const nArmEfectivo=parejaArmado?Math.floor(nArm/2):nArm;

  // Separar lotes urgentes de normales
  const lotesUrgentes=lotes.filter(l=>l.urgente).sort((a,b)=>(a.fechaInicio||'').localeCompare(b.fechaInicio||''));
  const lotesNormales=lotes.filter(l=>!l.urgente);

  // Construir pedido global: urgentes primero (con su fecha de inicio), luego normales
  let pedidoGlobal=[];
  [...lotesUrgentes,...lotesNormales].forEach(lote=>{
    Object.entries(lote.cantidades).forEach(([tipo,v])=>{
      const obraRef=obras.find(o=>o.id===lote.obraId);
      const abRef=obraRef?.aberturas.find(a=>a.tipo===tipo);
      pedidoGlobal.push({
        loteId:lote.id, obraId:lote.obraId, obraNombre:lote.obraNombre,
        tipo, cat:v.cat||abRef?.cat||'corrediza',
        qty:v.qty, restante:v.qty,
        fechaLimite:lote.fechaLimite,
        fechaInicioLote:lote.fechaInicio||fi,
        urgente:lote.urgente||false,
        tipoLote:lote.tipoLote||'completo'
      });
    });
  });

  const totalGlobal=pedidoGlobal.reduce((s,a)=>s+a.qty,0);
  // Cap base semana: usar promedio (completo)
  const capBaseSemPrep=(4*Math.min(c.prepMarcoLJ,c.prepHojaLJ)+Math.min(c.prepMarcoV,c.prepHojaV))*nPrep;

  let pendiente=pedidoGlobal.map(a=>({...a}));
  let bufferPrep=[];
  let stockCortado=0;
  let fecha=new Date(fi+'T00:00:00');
  let semIdx=0,semanas=[],completadoEn={},hayPendiente=true;

  while(hayPendiente&&semIdx<52){
    const lunes=new Date(fecha);
    let diasData=[],prepSemTotal=0;

    for(let di=0;di<5;di++){
      const esV=di===4;
      const fechaDia=addDays(lunes,di);
      const fechaDiaStr=fechaDia.toISOString().split('T')[0];

      // Solo incluir pedidos cuya fecha de inicio ya llegó
      const pendActivos=pendiente.filter(a=>a.restante>0.01&&fechaDiaStr>=a.fechaInicioLote);
      const pendTotal=pendActivos.reduce((s,a)=>s+a.restante,0);
      const bufTotal=bufferPrep.reduce((s,b)=>s+b.qty,0);
      const hayTrabajo=pendTotal>0.01||bufTotal>0.01;

      // CORTE: por tipo de lote mixto, usar el más restrictivo del día
      const tiposActivos=[...new Set(pendActivos.map(a=>a.tipoLote))];
      const tipoCorte=tiposActivos.length===1?tiposActivos[0]:'completo';
      const corteCap=pendTotal>0.01?capCorteDia(tipoCorte,esV,c):0;
      const cortadoHoy=corteCap;
      stockCortado+=cortadoHoy;

      // PREPARACION
      const prepCapBase=capPrepDia(tipoCorte,esV,c,nPrep);
      // Rotación automática: armadores libres van a prep
      const capArmHoy=capArmadoDia(tipoCorte,esV,c);
      const armLibres=bufTotal<capArmHoy.cap*capArmHoy.nEfectivo*0.3&&hayTrabajo
        ?Math.min(nArmEfectivo,1):0;
      const prepExtra=armLibres*(esV?c.armPrepV:c.armPrepLJ);
      const capPrepTotal=prepCapBase+prepExtra;
      const dispPrep=Math.min(capPrepTotal,pendTotal,stockCortado);

      // Distribuir prep: urgentes primero, luego proporcional
      let prepHoy=[],restPrep=dispPrep;

      // Primero urgentes activos
      pendActivos.filter(a=>a.urgente&&a.restante>0.01).forEach(a=>{
        if(restPrep<=0.01) return;
        const q=Math.min(a.restante,restPrep);
        if(q>0.01){prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre,loteId:a.loteId,tipoLote:a.tipoLote,urgente:true});restPrep-=q;}
      });

      // Luego normales proporcional
      const normales=pendActivos.filter(a=>!a.urgente&&a.restante>0.01);
      if(normales.length&&restPrep>0.01){
        const obrasPend={};
        normales.forEach(a=>{if(!obrasPend[a.obraId])obrasPend[a.obraId]=0;obrasPend[a.obraId]+=a.restante;});
        const totalPend=Object.values(obrasPend).reduce((s,v)=>s+v,0);
        Object.entries(obrasPend).forEach(([obraId,total])=>{
          let cuota=Math.min(restPrep*(total/totalPend),total);
          normales.filter(a=>a.obraId===obraId).forEach(a=>{
            if(cuota<=0.01) return;
            const q=Math.min(a.restante,cuota);
            if(q>0.01){prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre,loteId:a.loteId,tipoLote:a.tipoLote,urgente:false});cuota-=q;restPrep-=q;}
          });
        });
      }

      // Descontar pendiente y agregar a buffer
      prepHoy.forEach(p=>{
        const idx=pendiente.findIndex(a=>a.tipo===p.tipo&&a.obraId===p.obraId&&a.loteId===p.loteId);
        if(idx>=0) pendiente[idx].restante=Math.max(0,pendiente[idx].restante-p.qty);
        const bx=bufferPrep.find(b=>b.tipo===p.tipo&&b.obraId===p.obraId&&b.tipoLote===p.tipoLote);
        if(bx) bx.qty+=p.qty; else bufferPrep.push({...p});
      });
      stockCortado=Math.max(0,stockCortado-dispPrep);

      // ARMADO con pareja si está activa
      const opCargaFrac=Array(nArmEfectivo).fill(0);
      let armHoy=[];
      bufferPrep.filter(b=>b.qty>0.01).forEach(b=>{
        let rest=b.qty;
        const capD=capArmadoDia(b.tipoLote||'completo',esV,c);
        while(rest>0.01){
          const mi=opCargaFrac.reduce((mi,v,i,arr)=>v<arr[mi]?i:mi,0);
          const fracLibre=Math.max(0,1-opCargaFrac[mi]);
          if(fracLibre<0.001) break;
          const asig=Math.min(rest,fracLibre*capD.cap);
          if(asig<0.01) break;
          armHoy.push({opIdx:mi,tipo:b.tipo,qty:asig,cat:b.cat,obraId:b.obraId,obraNombre:b.obraNombre,tipoLote:b.tipoLote||'completo',enPareja:parejaArmado});
          opCargaFrac[mi]+=asig/capD.cap;
          rest-=asig;
        }
      });
      armHoy.forEach(a=>{
        const bx=bufferPrep.find(b=>b.tipo===a.tipo&&b.obraId===a.obraId&&b.tipoLote===a.tipoLote);
        if(bx) bx.qty=Math.max(0,bx.qty-a.qty);
      });
      bufferPrep=bufferPrep.filter(b=>b.qty>0.01);

      // Estado operarios
      const opEstado=opNames.map((nombre,i)=>{
        const opIdx=parejaArmado?Math.floor(i/2):i;
        const tareas=armHoy.filter(a=>a.opIdx===opIdx);
        const pct=Math.round((opCargaFrac[opIdx]||0)*100);
        const parNombre=parejaArmado&&i%2===1?opNames[i-1]:null;
        if(!hayTrabajo) return{nombre,estado:'libre',tareas:[],pct:0,parNombre};
        if(opCargaFrac[opIdx]<0.05&&armLibres>0) return{nombre,estado:'prep',tareas:[],pct:0,parNombre};
        if(!tareas.length&&opCargaFrac[opIdx]<0.05) return{nombre,estado:'libre',tareas:[],pct:0,parNombre};
        return{nombre,estado:'armando',tareas,pct,parNombre};
      });

      // Resumen diario
      const resumenDia={marcos:{},hojas:{},completos:{}};
      armHoy.forEach(a=>{
        const key=a.obraId+'_'+a.tipo;
        const tl=a.tipoLote||'completo';
        if(tl==='marcos'){if(!resumenDia.marcos[key])resumenDia.marcos[key]={obraNombre:a.obraNombre,tipo:a.tipo,qty:0};resumenDia.marcos[key].qty+=a.qty;}
        else if(tl==='hojas'){if(!resumenDia.hojas[key])resumenDia.hojas[key]={obraNombre:a.obraNombre,tipo:a.tipo,qty:0};resumenDia.hojas[key].qty+=a.qty;}
        else{if(!resumenDia.completos[key])resumenDia.completos[key]={obraNombre:a.obraNombre,tipo:a.tipo,qty:0};resumenDia.completos[key].qty+=a.qty;}
      });

      // Verificar obras completadas
      const pendAhora={},bufAhora={};
      pendiente.forEach(a=>{if(!pendAhora[a.obraId])pendAhora[a.obraId]=0;pendAhora[a.obraId]+=a.restante;});
      bufferPrep.forEach(b=>{if(!bufAhora[b.obraId])bufAhora[b.obraId]=0;bufAhora[b.obraId]+=b.qty;});
      pedidoGlobal.forEach(a=>{
        if(!completadoEn[a.obraId]&&(pendAhora[a.obraId]||0)<0.01&&(bufAhora[a.obraId]||0)<0.01)
          completadoEn[a.obraId]=new Date(fechaDia);
      });

      prepSemTotal+=dispPrep;
      diasData.push({
        di,fecha:fechaDia,
        cortadoHoy:Math.round(cortadoHoy),
        stockCortado:Math.round(stockCortado),
        prepHoy,armHoy,opEstado,
        dispPrep:Math.round(dispPrep),
        capPrepTotal:Math.round(capPrepTotal),
        bufferAlFinal:Math.round(bufferPrep.reduce((s,b)=>s+b.qty,0)),
        hayTrabajo,armLibres,resumenDia
      });
    }

    const pendAlFinal=pendiente.reduce((s,a)=>s+a.restante,0)+bufferPrep.reduce((s,b)=>s+b.qty,0);
    const pct=capBaseSemPrep>0?Math.min(100,Math.round((prepSemTotal/capBaseSemPrep)*100)):0;
    const libre=Math.max(0,Math.round(capBaseSemPrep-prepSemTotal));
    semanas.push({lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,capBaseSem:capBaseSemPrep});
    hayPendiente=pendAlFinal>0.01;
    fecha=addDays(lunes,7); semIdx++;
  }

  // Alertas
  let alertas='';
  const obraIds=[...new Set(lotes.map(l=>l.obraId))];
  obraIds.forEach(obraId=>{
    const obraRef=obras.find(o=>o.id===obraId);
    const termina=completadoEn[obraId];
    if(!termina||!obraRef) return;
    const fl=lotes.filter(l=>l.obraId===obraId&&l.fechaLimite).sort((a,b)=>a.fechaLimite.localeCompare(b.fechaLimite))[0]?.fechaLimite;
    if(fl){
      const fechaLim=new Date(fl+'T23:59:59');
      if(termina>fechaLim){
        const dias=Math.ceil((termina-fechaLim)/(1000*60*60*24));
        alertas+=`<div class="alert alert-danger" style="margin-bottom:8px"><strong>⚠ ${obraRef.nombre}:</strong> No se puede cumplir la fecha del ${fmtF(fechaLim)}. Terminaría el <strong>${fmtFull(termina)}</strong> (${dias} día(s) de atraso).</div>`;
      } else {
        const dias=Math.ceil((fechaLim-termina)/(1000*60*60*24));
        alertas+=`<div class="alert alert-ok" style="margin-bottom:8px"><strong>✓ ${obraRef.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>, ${dias} día(s) antes del límite.</div>`;
      }
    } else {
      alertas+=`<div class="alert alert-info" style="margin-bottom:8px"><strong>${obraRef.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>.</div>`;
    }
  });

  // Métricas
  document.getElementById('plan-metrics').innerHTML=
    obraIds.map(id=>{
      const o=obras.find(x=>x.id===id); if(!o) return '';
      const total=lotes.filter(l=>l.obraId===id).reduce((s,l)=>s+Object.values(l.cantidades).reduce((ss,v)=>ss+v.qty,0),0);
      const termina=completadoEn[id];
      const fl=lotes.filter(l=>l.obraId===id&&l.fechaLimite).sort((a,b)=>a.fechaLimite.localeCompare(b.fechaLimite))[0]?.fechaLimite;
      const ok=fl&&termina?new Date(fl+'T23:59:59')>=termina:true;
      return `<div class="metric"><div class="metric-label">${o.nombre}</div><div class="metric-value">${total}</div><div class="metric-sub" style="color:${ok?'#27500a':'#791f1f'}">${termina?fmtF(termina):'—'} ${fl?(ok?'✓':'⚠'):''}</div></div>`;
    }).join('')+
    `<div class="metric"><div class="metric-label">Total global</div><div class="metric-value">${totalGlobal}</div><div class="metric-sub">${lotes.length} lotes</div></div>`+
    `<div class="metric"><div class="metric-label">Semanas necesarias</div><div class="metric-value">${semanas.length}</div><div class="metric-sub">plan completo</div></div>`+
    `<div class="metric"><div class="metric-label">Dotación</div><div class="metric-value">${opNames.length+prepNombres.length+1}</div><div class="metric-sub">${parejaArmado?'Armado en pareja':'Armado individual'}</div></div>`;

  document.getElementById('plan-alertas').innerHTML=alertas;
  document.getElementById('op-legend').innerHTML=[
    {cls:'#534ab7',name:corteNombre},
    ...prepNombres.map(n=>({cls:'#0c447c',name:n})),
    ...opNames.map((n,i)=>({cls:['#378add','#639922','#ba7517','#d4537e','#534ab7','#27500a'][i%6],name:n})),
  ].map(o=>`<div class="op-leg-item"><div class="op-dot" style="background:${o.cls}"></div>${o.name}</div>`).join('');

  document.getElementById('plan-weeks').innerHTML=semanas.map(renderSemana).join('');
  document.getElementById('plan-resultado').classList.remove('hidden');

  if(!document.getElementById('btn-imprimir')){
    const btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;justify-content:flex-end;margin-bottom:12px;gap:8px';
    btnRow.innerHTML=`<button id="btn-imprimir" class="btn-secondary" onclick="window.print()">🖨️ Imprimir plan</button>`;
    document.getElementById('plan-alertas').parentNode.insertBefore(btnRow,document.getElementById('plan-alertas'));
  }
  document.getElementById('plan-resultado').scrollIntoView({behavior:'smooth',block:'start'});

  // Acumular stock desde todos los días del plan
  const todosDias=semanas.flatMap(s=>s.diasData);
  const keysDelPlan=new Set();
  todosDias.forEach(d=>{
    const rd=d.resumenDia;
    [['completos','completo'],['marcos','marcos'],['hojas','hojas']].forEach(([grupo,tl])=>{
      Object.values(rd[grupo]).forEach(item=>{keysDelPlan.add(item.obraId+'_'+item.tipo+'_'+tl);});
    });
  });
  keysDelPlan.forEach(k=>{if(stockTerminado[k])stockTerminado[k].qty=0;});
  acumularStockDesdeResumen(todosDias);
  despachos.forEach(d=>{d.items.forEach(item=>{const key=item.obraId+'_'+item.tipo+'_'+item.tipoLote;if(stockTerminado[key])stockTerminado[key].qty=Math.max(0,stockTerminado[key].qty-item.qty);});});
  saveStock();
  renderStock();
}

// ============================================================
// RENDER SEMANA
// ============================================================
function renderSemana(sem){
  const{lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,capBaseSem}=sem;
  const semFin=addDays(lunes,4);
  const estadoClass=pct>=95?'wb-ok':libre>0?'wb-free':'wb-warn';
  const estadoTxt=pct>=95?'Semana completa':libre>0?`${libre} unid. libres`:'Al límite';
  const barColor=pct>=95?'#639922':pct>=70?'#ba7517':'#e24b4a';

  const diasHtml=diasData.map(d=>{
    const prepChips=d.prepHoy.length
      ?d.prepHoy.map(p=>{
        const label={completo:'🪟',marcos:'🔲',hojas:'📋'}[p.tipoLote||'completo'];
        return `<span class="chip ${p.urgente?'chip-urgente':''}" style="border-color:${obraColor(p.obraId)};color:${obraColor(p.obraId)}">${label} ${p.obraNombre.split(' ')[0]} ${p.tipo}×${Math.round(p.qty)}</span>`;
      }).join('')
      :d.hayTrabajo?`<span style="font-size:11px;color:#9b9b98">Buffer suficiente</span>`:`<span style="font-size:11px;color:#9b9b98">Sin pendiente</span>`;

    const corteChip=d.cortadoHoy>0
      ?`<span class="chip chip-corte">${corteNombre}: ${d.cortadoHoy} uds.</span>`
      :`<span style="font-size:11px;color:#9b9b98">${corteNombre}: libre</span>`;

    const armChips=d.opEstado.map((op,i)=>{
      if(op.estado==='libre') return `<div style="font-size:11px;color:#9b9b98;margin-bottom:2px">${op.nombre}: libre</div>`;
      if(op.estado==='prep') return `<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px">
        <span style="font-size:10px;color:#9b9b98;min-width:72px">${op.nombre}</span>
        <span class="chip" style="background:#eeedfe;color:#3c3489;border-color:#afa9ec">→ Prep (auto)</span>
      </div>`;
      const parejaLabel=op.parNombre?` + ${op.parNombre}`:'';
      return `<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:2px">
        <span style="font-size:10px;color:#9b9b98;min-width:72px">${op.nombre}${parejaLabel} (${op.pct}%)</span>
        ${op.tareas.map(t=>{
          const label={completo:'🪟',marcos:'🔲',hojas:'📋'}[t.tipoLote||'completo'];
          return `<span class="chip chip-op${Math.min(i+1,4)}">${label} ${t.obraNombre.split(' ')[0]} ${t.tipo}×${Math.round(t.qty)}</span>`;
        }).join('')}
      </div>`;
    }).filter((_,i)=>!parejaArmado||i%2===0).join(''); // En pareja mostrar solo 1 por par

    // Resumen del día
    const rd=d.resumenDia;
    const tieneResumen=Object.keys(rd.completos).length||Object.keys(rd.marcos).length||Object.keys(rd.hojas).length;
    let resumenHtml='';
    if(tieneResumen){
      resumenHtml=`<div class="resumen-dia">
        <div class="resumen-titulo">📊 Resumen al cierre del día</div>`;
      if(Object.keys(rd.completos).length){
        resumenHtml+=`<div class="resumen-grupo"><span class="resumen-label">🪟 Ventanas completas:</span> ${Object.values(rd.completos).map(r=>`${r.obraNombre.split(' ')[0]} ${r.tipo}×${Math.round(r.qty)}`).join(', ')}</div>`;
      }
      if(Object.keys(rd.marcos).length){
        resumenHtml+=`<div class="resumen-grupo"><span class="resumen-label">🔲 Marcos armados:</span> ${Object.values(rd.marcos).map(r=>`${r.obraNombre.split(' ')[0]} ${r.tipo}×${Math.round(r.qty)}`).join(', ')}</div>`;
      }
      if(Object.keys(rd.hojas).length){
        resumenHtml+=`<div class="resumen-grupo"><span class="resumen-label">📋 Hojas armadas:</span> ${Object.values(rd.hojas).map(r=>`${r.obraNombre.split(' ')[0]} ${r.tipo}×${Math.round(r.qty)}`).join(', ')}</div>`;
      }
      resumenHtml+=`</div>`;
    }

    return `<div class="day-block">
      <div class="day-name">${fmtD(d.fecha)}</div>
      <div class="stations">
        <div>
          <div class="st-label">Corte</div>
          <div class="chips">${corteChip}</div>
          <div class="stock-info">Stock cortado: ${d.stockCortado} uds.</div>
        </div>
        <div>
          <div class="st-label">Preparación (${d.dispPrep}/${d.capPrepTotal})</div>
          <div class="chips">${prepChips}</div>
          ${d.bufferAlFinal>0?`<div class="stock-info">Buffer listo: ${d.bufferAlFinal} uds.</div>`:''}
          ${d.armLibres>0?`<div class="stock-info" style="color:#3c3489">${d.armLibres} armador(es) → prep (auto)</div>`:''}
        </div>
        <div>
          <div class="st-label">Armado${parejaArmado?' (en pareja)':''}</div>
          ${armChips}
        </div>
      </div>
      ${resumenHtml}
    </div>`;
  }).join('');

  const libreHtml=pendAlFinal<0.1?`
    <div class="free-slot">
      <div class="free-slot-title">✓ Todos los lotes completados</div>
      <div class="free-slot-sub">Podés agregar nuevos lotes para continuar el plan.</div>
    </div>`:'';

  return `<div class="week-block">
    <div class="week-header">
      <span class="week-title">Semana ${semIdx+1} — ${fmtF(lunes)} al ${fmtF(semFin)}</span>
      <div class="week-right">
        <span class="week-count">${Math.round(prepSemTotal)}/${capBaseSem} preparadas</span>
        <span class="wbadge ${estadoClass}">${estadoTxt}</span>
      </div>
    </div>
    <div class="capbar"><div class="capbar-fill" style="width:${pct}%;background:${barColor}"></div></div>
    <div class="week-body">${diasHtml}${libreHtml}</div>
  </div>`;
}

// ============================================================
// STOCK DE PRODUCCION TERMINADA
// ============================================================
// stockTerminado: { obraId_tipo_tipoLote: { obraId, obraNombre, tipo, tipoLote, qty } }
// despachos: [{ id, fecha, items:[{obraId,obraNombre,tipo,tipoLote,qty}], nota }]

let stockTerminado = JSON.parse(localStorage.getItem('stock-terminado') || '{}');
let despachos = JSON.parse(localStorage.getItem('despachos') || '[]');

function saveStock() { localStorage.setItem('stock-terminado', JSON.stringify(stockTerminado)); }
function saveDespachos() { localStorage.setItem('despachos', JSON.stringify(despachos)); }

// Llamar esta función cuando se genera el plan para acumular el stock
function acumularStockDesdeResumen(diasData) {
  // Reconstruir stock acumulado desde los resúmenes de todos los días del plan
  // NO se resetea; se suma lo producido que no fue despachado
  diasData.forEach(d => {
    const rd = d.resumenDia;
    const agregarAlStock = (grupo, tipoLote) => {
      Object.values(grupo).forEach(item => {
        const key = item.obraId + '_' + item.tipo + '_' + tipoLote;
        if (!stockTerminado[key]) {
          stockTerminado[key] = { obraId: item.obraId, obraNombre: item.obraNombre, tipo: item.tipo, tipoLote, qty: 0 };
        }
        stockTerminado[key].qty += item.qty;
      });
    };
    agregarAlStock(rd.completos, 'completo');
    agregarAlStock(rd.marcos, 'marcos');
    agregarAlStock(rd.hojas, 'hojas');
  });
}

function renderStock() {
  const container = document.getElementById('stock-container');
  if (!container) return;

  const items = Object.values(stockTerminado).filter(s => s.qty > 0.01);
  
  // Agrupar por tipo de producto
  const completos = items.filter(s => s.tipoLote === 'completo');
  const marcos    = items.filter(s => s.tipoLote === 'marcos');
  const hojas     = items.filter(s => s.tipoLote === 'hojas');

  const totalComp = completos.reduce((s,i) => s + i.qty, 0);
  const totalMar  = marcos.reduce((s,i) => s + i.qty, 0);
  const totalHoj  = hojas.reduce((s,i) => s + i.qty, 0);

  let stockHtml = '';

  if (!items.length) {
    stockHtml = `<div class="empty-state" style="padding:40px 24px">
      <div class="empty-icon">📦</div>
      <p>No hay stock de producción terminada aún.</p>
      <div style="font-size:13px;color:#9b9b98;margin-top:8px">Generá un plan de producción para ver el stock acumulado.</div>
    </div>`;
  } else {
    // Métricas resumen
    stockHtml += `<div class="metrics-grid" style="margin-bottom:20px">
      <div class="metric"><div class="metric-label">🪟 Ventanas completas</div><div class="metric-value">${Math.round(totalComp)}</div><div class="metric-sub">en stock</div></div>
      <div class="metric"><div class="metric-label">🔲 Marcos</div><div class="metric-value">${Math.round(totalMar)}</div><div class="metric-sub">en stock</div></div>
      <div class="metric"><div class="metric-label">📋 Hojas</div><div class="metric-value">${Math.round(totalHoj)}</div><div class="metric-sub">en stock</div></div>
      <div class="metric"><div class="metric-label">Total en depósito</div><div class="metric-value">${Math.round(totalComp+totalMar+totalHoj)}</div><div class="metric-sub">unidades</div></div>
    </div>`;

    // Tabla de stock
    const renderGrupo = (lista, titulo, icono) => {
      if (!lista.length) return '';
      return `<div class="stock-grupo">
        <div class="stock-grupo-titulo">${icono} ${titulo}</div>
        <table class="stock-table">
          <tr><th>Obra</th><th>Tipo</th><th>En stock</th><th>Despachar</th></tr>
          ${lista.map(s => {
            const key = s.obraId + '_' + s.tipo + '_' + s.tipoLote;
            return `<tr>
              <td>${s.obraNombre}</td>
              <td><span class="badge badge-corr">${s.tipo}</span></td>
              <td style="font-weight:600;text-align:center">${Math.round(s.qty)}</td>
              <td><input type="number" min="0" max="${Math.round(s.qty)}" value="0" class="qty-input" id="desp-${key}" style="width:70px"></td>
            </tr>`;
          }).join('')}
        </table>
      </div>`;
    };

    stockHtml += renderGrupo(completos, 'Ventanas completas', '🪟');
    stockHtml += renderGrupo(marcos, 'Marcos', '🔲');
    stockHtml += renderGrupo(hojas, 'Hojas', '📋');

    stockHtml += `<div class="despacho-form">
      <div style="font-size:14px;font-weight:600;margin-bottom:12px">Registrar despacho a obra</div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <div>
          <label style="font-size:12px;color:#6b6b68;display:block;margin-bottom:4px">Fecha de despacho</label>
          <input type="date" id="despacho-fecha" class="form-input" style="width:180px" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div style="flex:1">
          <label style="font-size:12px;color:#6b6b68;display:block;margin-bottom:4px">Nota (opcional)</label>
          <input type="text" id="despacho-nota" class="form-input" placeholder="Ej: Camión 1, piso 3">
        </div>
      </div>
      <button class="btn-primary" onclick="registrarDespacho()">Registrar despacho ↗</button>
    </div>`;
  }

  // Historial de despachos
  let historialHtml = '';
  if (despachos.length) {
    historialHtml = `<div style="margin-top:24px">
      <h2 style="font-size:15px;font-weight:600;margin-bottom:12px">Historial de despachos</h2>
      ${despachos.slice().reverse().map(d => {
        const fecha = new Date(d.fecha+'T12:00:00').toLocaleDateString('es-UY',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
        const totalDesp = d.items.reduce((s,i) => s+i.qty, 0);
        return `<div class="despacho-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:13px;font-weight:600">📦 Despacho del ${fecha}</div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:12px;color:#6b6b68">${totalDesp} unidades</span>
              <button class="del-row-btn" onclick="eliminarDespacho('${d.id}')" title="Eliminar despacho">✕</button>
            </div>
          </div>
          ${d.nota?`<div style="font-size:12px;color:#6b6b68;margin-bottom:6px">📝 ${d.nota}</div>`:''}
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${d.items.map(i => {
              const icono={completo:'🪟',marcos:'🔲',hojas:'📋'}[i.tipoLote]||'🪟';
              return `<span class="chip">${icono} ${i.obraNombre.split(' ')[0]} ${i.tipo}×${Math.round(i.qty)}</span>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  container.innerHTML = stockHtml + historialHtml;
}

function registrarDespacho() {
  const fecha = document.getElementById('despacho-fecha')?.value;
  const nota  = document.getElementById('despacho-nota')?.value || '';
  if (!fecha) { alert('Seleccioná una fecha de despacho.'); return; }

  const items = [];
  Object.entries(stockTerminado).forEach(([key, s]) => {
    const el = document.getElementById('desp-'+key);
    if (!el) return;
    const qty = Math.min(parseFloat(el.value)||0, s.qty);
    if (qty > 0.01) items.push({ obraId:s.obraId, obraNombre:s.obraNombre, tipo:s.tipo, tipoLote:s.tipoLote, qty });
  });

  if (!items.length) { alert('Ingresá al menos una unidad a despachar.'); return; }

  // Descontar del stock
  items.forEach(item => {
    const key = item.obraId + '_' + item.tipo + '_' + item.tipoLote;
    if (stockTerminado[key]) {
      stockTerminado[key].qty = Math.max(0, stockTerminado[key].qty - item.qty);
      if (stockTerminado[key].qty < 0.01) delete stockTerminado[key];
    }
  });

  despachos.push({ id:'desp-'+Date.now(), fecha, nota, items });
  saveStock(); saveDespachos();
  renderStock();
  alert(`✓ Despacho registrado: ${items.reduce((s,i)=>s+i.qty,0)} unidades enviadas a obra.`);
}

function eliminarDespacho(id) {
  if (!confirm('¿Eliminar este despacho? Las unidades volverán al stock.')) return;
  const d = despachos.find(x => x.id === id);
  if (d) {
    // Devolver al stock
    d.items.forEach(item => {
      const key = item.obraId + '_' + item.tipo + '_' + item.tipoLote;
      if (!stockTerminado[key]) stockTerminado[key] = { obraId:item.obraId, obraNombre:item.obraNombre, tipo:item.tipo, tipoLote:item.tipoLote, qty:0 };
      stockTerminado[key].qty += item.qty;
    });
  }
  despachos = despachos.filter(x => x.id !== id);
  saveStock(); saveDespachos(); renderStock();
}

function limpiarStock() {
  if (!confirm('¿Limpiar todo el stock de terminados? Esta acción no se puede deshacer.')) return;
  stockTerminado = {};
  saveStock(); renderStock();
}
