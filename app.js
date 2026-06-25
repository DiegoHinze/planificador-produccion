// ============================================================
// ESTADO GLOBAL
// ============================================================
let obras = JSON.parse(localStorage.getItem('obras') || '[]');
let cantidadesGlobal = JSON.parse(localStorage.getItem('cantidades-global') || '{}');
let fechasLimite = JSON.parse(localStorage.getItem('fechas-limite') || '{}');
let opNames = JSON.parse(localStorage.getItem('opNames') || '["Operario 1","Operario 2","Operario 3","Operario 4"]');
let corteNombre = localStorage.getItem('corteNombre') || 'Cortador';
let prepNombres = JSON.parse(localStorage.getItem('prepNombres') || '["Preparador 1"]');
let filaAberturaIdx = 0;

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
    { tipo:'TN1', medida:'2400×2100', desc:'Corrediza 1H Móvil + Fijo',       cat:'corrediza', total:80 },
    { tipo:'TN2', medida:'1800×2100', desc:'Corrediza 1H Móvil + Fijo',       cat:'corrediza', total:60 },
    { tipo:'TN3', medida:'1200×1500', desc:'Oscilobatiente + Marco Fijo',     cat:'oscilo',    total:40 },
    { tipo:'TN4', medida:'3000×2100', desc:'Corrediza Doble 2H Móvil + Fijo', cat:'corrediza', total:24 },
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
  renderPlanGlobal();
  setFechaDefault();
});

function saveObras()      { localStorage.setItem('obras', JSON.stringify(obras)); }
function saveCantidades() { localStorage.setItem('cantidades-global', JSON.stringify(cantidadesGlobal)); }
function saveFechas()     { localStorage.setItem('fechas-limite', JSON.stringify(fechasLimite)); }
function saveConfig()     {
  localStorage.setItem('opNames', JSON.stringify(opNames));
  localStorage.setItem('corteNombre', corteNombre);
  localStorage.setItem('prepNombres', JSON.stringify(prepNombres));
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
  ['obras','planificar','config'].forEach(s => {
    document.getElementById('sec-'+s).classList.toggle('hidden', s!==name);
  });
  document.querySelectorAll('.nav-btn').forEach((b,i) => {
    b.classList.toggle('active', ['obras','planificar','config'][i]===name);
  });
  if (name==='planificar') renderPlanGlobal();
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
  obras = obras.filter(o=>o.id!==id);
  delete cantidadesGlobal[id]; delete fechasLimite[id];
  saveObras(); saveCantidades(); saveFechas();
  renderObras(); renderPlanGlobal();
}

// ============================================================
// MODAL NUEVA OBRA
// ============================================================
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  filaAberturaIdx=0;
  document.getElementById('abertura-rows').innerHTML='';
  agregarFilaAbertura();
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
  const nombre  = document.getElementById('obra-nombre').value.trim();
  const ppto    = document.getElementById('obra-ppto').value.trim();
  const cliente = document.getElementById('obra-cliente').value.trim();
  const sistema = document.getElementById('obra-sistema').value.trim();
  if (!nombre||!ppto) { alert('Nombre y número de presupuesto son obligatorios.'); return; }
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
  saveObras(); renderObras(); renderPlanGlobal(); hideModal('modal-obra');
}

// ============================================================
// PLAN GLOBAL - RENDER FORMULARIO
// ============================================================
function renderPlanGlobal() {
  const container = document.getElementById('plan-global-obras');
  if (!container) return;
  container.innerHTML = obras.map(o => {
    const cant = cantidadesGlobal[o.id]||{};
    const totalSel = Object.values(cant).reduce((s,v)=>s+v,0);
    const fl = fechasLimite[o.id]||'';
    return `<div class="obra-plan-card" id="obra-plan-${o.id}">
      <div class="obra-plan-header">
        <div>
          <div class="obra-plan-nombre">${o.nombre}</div>
          <div style="font-size:12px;color:#6b6b68">Ppto. ${o.ppto} · ${o.cliente}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-size:11px;color:#6b6b68;margin-bottom:3px">Fecha límite del lote</div>
            <input type="date" value="${fl}" class="date-input"
              onchange="fechasLimite['${o.id}']=this.value;saveFechas()">
          </div>
          <div id="total-sel-${o.id}" style="font-size:13px;font-weight:600;color:${totalSel>0?'#27500a':'#9b9b98'}">
            ${totalSel>0?totalSel+' seleccionadas':'Sin selección'}
          </div>
        </div>
      </div>
      <div class="obra-plan-aberturas">
        <div class="aberturas-table-header">
          <span>Tipo</span><span>Descripción</span><span>Medida</span><span>Total obra</span><span>A fabricar</span>
        </div>
        ${o.aberturas.map(a=>`
          <div class="abertura-row">
            <span><span class="badge ${a.cat==='oscilo'?'badge-oscilo':'badge-corr'}">${a.tipo}</span></span>
            <span style="color:#6b6b68;font-size:12px">${a.desc}</span>
            <span style="color:#9b9b98;font-size:12px">${a.medida}</span>
            <span style="font-weight:600;text-align:center">${a.total}</span>
            <input type="number" min="0" max="${a.total}" value="${cant[a.tipo]||0}" class="qty-input"
              onchange="setCantidad('${o.id}','${a.tipo}',parseInt(this.value)||0,${a.total})">
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function setCantidad(obraId, tipo, val, max) {
  val = Math.max(0, Math.min(val, max));
  if (!cantidadesGlobal[obraId]) cantidadesGlobal[obraId]={};
  cantidadesGlobal[obraId][tipo]=val;
  saveCantidades();
  const totalSel=Object.values(cantidadesGlobal[obraId]).reduce((s,v)=>s+v,0);
  const el=document.getElementById('total-sel-'+obraId);
  if(el){ el.textContent=totalSel>0?totalSel+' seleccionadas':'Sin selección'; el.style.color=totalSel>0?'#27500a':'#9b9b98'; }
}

function limpiarPlanGlobal() {
  cantidadesGlobal={}; fechasLimite={};
  saveCantidades(); saveFechas();
  renderPlanGlobal();
  document.getElementById('plan-resultado').classList.add('hidden');
}

// ============================================================
// CONFIG
// ============================================================
function cfg() {
  return {
    corteLJ:     parseFloat(document.getElementById('c-corte-lj').value)    ||27,
    corteV:      parseFloat(document.getElementById('c-corte-v').value)     ||24,
    prepLJ:      parseFloat(document.getElementById('c-prep-lj').value)     ||10,
    prepV:       parseFloat(document.getElementById('c-prep-v').value)      ||10,
    cortePrepLJ: parseFloat(document.getElementById('c-corte-prep').value)  ||5,
    cortePrepV:  parseFloat(document.getElementById('c-corte-prep-v').value)||5,
    armPrepLJ:   parseFloat(document.getElementById('c-arm-prep').value)    ||10,
    armPrepV:    parseFloat(document.getElementById('c-arm-prep-v').value)  ||10,
    armCorr:     parseFloat(document.getElementById('c-arm-corr').value)    ||5,
    armOscilo:   parseFloat(document.getElementById('c-arm-oscilo').value)  ||1.5,
    colchon:     parseFloat(document.getElementById('c-colchon').value)     ||2,
    nArmadores:  opNames.length,
    nPreparadores: prepNombres.length,
  };
}

function renderOperariosConfig() {
  // Corte
  let html = `<div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:500;color:#6b6b68;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">Corte</div>
    <div class="operario-row">
      <div class="operario-badge chip-corte" style="font-size:11px">Corte</div>
      <input type="text" class="operario-input" id="op-name-corte" value="${corteNombre}">
    </div>
  </div>`;

  // Preparación
  html += `<div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:500;color:#6b6b68;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">
      Preparación <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarPreparador()">+ Agregar</button>
    </div>
    <div id="prep-operarios">
      ${prepNombres.map((n,i)=>`
        <div class="operario-row" id="prep-row-${i}">
          <div class="operario-badge" style="font-size:11px;background:#e6f1fb;color:#0c447c">Prep. ${i+1}</div>
          <input type="text" class="operario-input" id="op-prep-${i}" value="${n}">
          ${i>0?`<button class="del-row-btn" onclick="eliminarPreparador(${i})">✕</button>`:''}
        </div>`).join('')}
    </div>
  </div>`;

  // Armado
  html += `<div>
    <div style="font-size:12px;font-weight:500;color:#6b6b68;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em">
      Armado <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarArmador()">+ Agregar</button>
    </div>
    <div id="arm-operarios">
      ${opNames.map((n,i)=>`
        <div class="operario-row" id="arm-row-${i}">
          <div class="operario-badge chip-op${Math.min(i+1,4)}" style="font-size:11px">Arm. ${i+1}</div>
          <input type="text" class="operario-input" id="op-name-${i}" value="${n}">
          ${i>0?`<button class="del-row-btn" onclick="eliminarArmador(${i})">✕</button>`:''}
        </div>`).join('')}
    </div>
  </div>`;

  document.getElementById('operarios-config').innerHTML = html;
}

function agregarArmador() {
  opNames.push('Operario '+(opNames.length+1));
  renderOperariosConfig();
}
function eliminarArmador(idx) {
  if(opNames.length<=1){alert('Debe haber al menos 1 armador.');return;}
  opNames.splice(idx,1);
  renderOperariosConfig();
}
function agregarPreparador() {
  prepNombres.push('Preparador '+(prepNombres.length+1));
  renderOperariosConfig();
}
function eliminarPreparador(idx) {
  if(prepNombres.length<=1){alert('Debe haber al menos 1 preparador.');return;}
  prepNombres.splice(idx,1);
  renderOperariosConfig();
}

function guardarConfig() {
  corteNombre = document.getElementById('op-name-corte').value||'Cortador';
  opNames = opNames.map((_,i)=>document.getElementById('op-name-'+i)?.value||'Operario '+(i+1));
  prepNombres = prepNombres.map((_,i)=>document.getElementById('op-prep-'+i)?.value||'Preparador '+(i+1));
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

// ============================================================
// LOGICA PRINCIPAL
// ============================================================
function simularPlan(pedidoInput, fechaInicio, c) {
  const nArm = opNames.length;
  const nPrep = prepNombres.length;

  let pendiente = pedidoInput.map(a=>({...a}));
  // Buffer de material preparado esperando ser armado
  let bufferPrep = []; // {tipo, cat, qty, obraId, obraNombre}
  let stockCortado = 0;
  let fecha = new Date(fechaInicio);
  let semIdx = 0;
  let semanas = [];
  let completadoEn = {};

  while(pendiente.some(a=>a.restante>0) || bufferPrep.some(b=>b.qty>0.01)) {
    if(semIdx>=52) break;
    const lunes = new Date(fecha);
    let diasData = [];
    let prepSemTotal = 0;

    for(let di=0;di<5;di++){
      const esV = di===4;
      const fechaDia = addDays(lunes,di);

      // ---- CAPACIDADES DEL DÍA ----
      const corteCap = esV ? c.corteV : c.corteLJ;
      const prepCapBase = (esV ? c.prepV : c.prepLJ) * nPrep;
      const armCorrCap = c.armCorr; // por operario
      const armOsiloCap = c.armOscilo; // por operario

      // ---- CORTE ----
      const pendTotal = pendiente.reduce((s,a)=>s+a.restante,0);
      const cortadoHoy = pendTotal > 0 ? corteCap : 0;
      stockCortado += cortadoHoy;

      // ---- PREPARACIÓN ----
      // Capacidad de preparación = preparadores base
      // Si hay armadores libres (sin buffer para armar), rotan automáticamente a prep
      // Calculamos cuántos armadores estarán libres basándonos en el buffer actual
      const bufferTotal = bufferPrep.reduce((s,b)=>s+b.qty,0);
      const capArmTotal = nArm * (armCorrCap); // aprox con corrediza
      // Si el buffer es menor que lo que pueden armar los armadores en un día, hay armadores libres
      const armLibres = bufferTotal < capArmTotal * 0.5 ? Math.max(0, Math.floor(nArm * (1 - bufferTotal/Math.max(capArmTotal,1)))) : 0;
      const prepCapExtra = armLibres * (esV ? c.armPrepV : c.armPrepLJ);
      const prepCapTotal = Math.min(prepCapBase + prepCapExtra, stockCortado + 0.001 > 0 ? Infinity : 0);

      // Cuánto se puede preparar hoy
      const pendTotalAhora = pendiente.reduce((s,a)=>s+a.restante,0);
      const dispPrep = Math.min(prepCapBase + prepCapExtra, pendTotalAhora, stockCortado);

      // Distribuir preparación proporcionalmente entre obras
      let prepHoy = [];
      let restPrep = dispPrep;
      const obrasPend = {};
      pendiente.forEach(a=>{ if(a.restante>0){if(!obrasPend[a.obraId])obrasPend[a.obraId]=0; obrasPend[a.obraId]+=a.restante;} });
      const obrasIds = Object.keys(obrasPend);
      const totalPend = Object.values(obrasPend).reduce((s,v)=>s+v,0);

      if(totalPend>0 && restPrep>0){
        obrasIds.forEach(obraId=>{
          let cuota = Math.min(restPrep * (obrasPend[obraId]/totalPend), obrasPend[obraId]);
          pendiente.filter(a=>a.obraId===obraId&&a.restante>0).forEach(a=>{
            if(cuota<=0.01) return;
            const q=Math.min(a.restante,cuota);
            if(q>0.01){prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre});cuota-=q;}
          });
        });
        // Distribuir sobrante
        let sobrante=dispPrep-prepHoy.reduce((s,p)=>s+p.qty,0);
        if(sobrante>0.01){
          pendiente.filter(a=>a.restante>0).forEach(a=>{
            if(sobrante<=0.01) return;
            const ex=prepHoy.find(p=>p.tipo===a.tipo&&p.obraId===a.obraId);
            const yaAsig=ex?ex.qty:0;
            const q=Math.min(a.restante-yaAsig,sobrante);
            if(q>0.01){if(ex)ex.qty+=q;else prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre});sobrante-=q;}
          });
        }
      }

      // Descontar del pendiente y agregar al buffer
      prepHoy.forEach(p=>{
        const idx=pendiente.findIndex(a=>a.tipo===p.tipo&&a.obraId===p.obraId);
        if(idx>=0) pendiente[idx].restante-=p.qty;
        const bx=bufferPrep.find(b=>b.tipo===p.tipo&&b.obraId===p.obraId);
        if(bx) bx.qty+=p.qty; else bufferPrep.push({tipo:p.tipo,cat:p.cat,qty:p.qty,obraId:p.obraId,obraNombre:p.obraNombre});
      });
      stockCortado = Math.max(0, stockCortado - dispPrep);

      // ---- ARMADO ----
      // Cada armador arma hasta su capacidad diaria
      // Si no hay nada en buffer, el armador rota a preparación automáticamente
      let armHoy = [];
      let armRotadosHoy = 0;
      const opCargaFrac = Array(nArm).fill(0);

      // Distribuir buffer entre armadores
      const bufferDisp = bufferPrep.filter(b=>b.qty>0.01);
      const bufferTotalHoy = bufferDisp.reduce((s,b)=>s+b.qty,0);

      bufferDisp.forEach(b=>{
        let restArm = b.qty;
        while(restArm>0.01){
          const capOp = b.cat==='oscilo' ? armOsiloCap : armCorrCap;
          const mi = opCargaFrac.reduce((mi,v,i,arr)=>v<arr[mi]?i:mi,0);
          const fracLibre = Math.max(0,1-opCargaFrac[mi]);
          if(fracLibre<0.001) break;
          const capLibre = fracLibre * capOp;
          const asig = Math.min(restArm, capLibre);
          if(asig<0.01) break;
          armHoy.push({opIdx:mi,tipo:b.tipo,qty:asig,cat:b.cat,obraId:b.obraId,obraNombre:b.obraNombre});
          opCargaFrac[mi]+=asig/capOp;
          restArm-=asig;
        }
        // Descontar del buffer
        b.qty -= (b.qty - restArm);
      });
      // Limpiar buffer
      bufferPrep.forEach(b=>{
        const armado = armHoy.filter(a=>a.tipo===b.tipo&&a.obraId===b.obraId).reduce((s,a)=>s+a.qty,0);
        b.qty = Math.max(0, b.qty - armado);
      });
      bufferPrep = bufferPrep.filter(b=>b.qty>0.01);

      // Armadores libres rotan a prep automáticamente
      armRotadosHoy = opCargaFrac.filter(f=>f<0.1).length;

      // Verificar obras completadas hoy
      const pendAhora={};
      pendiente.forEach(a=>{if(!pendAhora[a.obraId])pendAhora[a.obraId]=0;pendAhora[a.obraId]+=a.restante;});
      const bufAhora={};
      bufferPrep.forEach(b=>{if(!bufAhora[b.obraId])bufAhora[b.obraId]=0;bufAhora[b.obraId]+=b.qty;});
      pedidoInput.forEach(a=>{
        if(!completadoEn[a.obraId]){
          const pendR=(pendAhora[a.obraId]||0);
          const bufR=(bufAhora[a.obraId]||0);
          if(pendR<0.01&&bufR<0.01) completadoEn[a.obraId]=new Date(fechaDia);
        }
      });

      prepSemTotal+=dispPrep;
      diasData.push({
        di, fecha:fechaDia,
        cortadoHoy:Math.round(cortadoHoy),
        stockCortado:Math.round(stockCortado),
        prepHoy,
        armHoy,
        dispPrep:Math.round(dispPrep),
        capPrep:Math.round(prepCapBase+prepCapExtra),
        armRotadosHoy,
        opCargaFrac:[...opCargaFrac],
        bufferAlFinal:Math.round(bufferPrep.reduce((s,b)=>s+b.qty,0))
      });
    }

    const pendAlFinal=pendiente.reduce((s,a)=>s+a.restante,0)+bufferPrep.reduce((s,b)=>s+b.qty,0);
    const capBaseSem=(4*c.prepLJ+c.prepV)*nPrep;
    const libre=Math.max(0,Math.round(capBaseSem-prepSemTotal));
    const pct=Math.min(100,Math.round((prepSemTotal/capBaseSem)*100));
    semanas.push({lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,capBaseSem});
    fecha=addDays(lunes,7); semIdx++;
  }

  return{semanas,completadoEn};
}

// ============================================================
// GENERAR PLAN
// ============================================================
function generarPlan() {
  const c=cfg();
  const fi=document.getElementById('fecha-inicio').value;
  if(!fi){alert('Seleccioná una fecha de inicio.');return;}
  localStorage.setItem('fecha-inicio',fi);
  const fechaInicio=new Date(fi+'T00:00:00');

  const obrasConPedido=obras.filter(o=>{
    const cant=cantidadesGlobal[o.id]||{};
    return Object.values(cant).some(v=>v>0);
  });
  if(!obrasConPedido.length){alert('Ingresá cantidades en al menos una obra.');return;}

  let pedidoGlobal=[];
  obrasConPedido.forEach(o=>{
    const cant=cantidadesGlobal[o.id]||{};
    o.aberturas.forEach(a=>{
      const qty=cant[a.tipo]||0;
      if(qty>0) pedidoGlobal.push({...a,obraId:o.id,obraNombre:o.nombre,restante:qty,original:qty});
    });
  });

  const totalGlobal=pedidoGlobal.reduce((s,a)=>s+a.restante,0);
  const{semanas,completadoEn}=simularPlan(pedidoGlobal,fechaInicio,c);

  // Alertas de fechas
  let alertasFechas='';
  obrasConPedido.forEach(o=>{
    const fl=fechasLimite[o.id];
    const termina=completadoEn[o.id];
    if(!termina) return;
    if(fl){
      const fechaLim=new Date(fl+'T23:59:59');
      if(termina>fechaLim){
        const diasAtraso=Math.ceil((termina-fechaLim)/(1000*60*60*24));
        alertasFechas+=`<div class="alert alert-danger" style="margin-bottom:8px">
          <strong>⚠ ${o.nombre}:</strong> No se puede cumplir la fecha del ${fmtF(fechaLim)}.
          Terminaría el <strong>${fmtFull(termina)}</strong> (${diasAtraso} días de atraso).
          <div style="margin-top:4px;font-size:12px">Para adelantar, considerá agregar un operario en Preparación desde Configuración.</div>
        </div>`;
      } else {
        const diasAntes=Math.ceil((fechaLim-termina)/(1000*60*60*24));
        alertasFechas+=`<div class="alert alert-ok" style="margin-bottom:8px">
          <strong>✓ ${o.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>, ${diasAntes} día(s) antes del límite.
        </div>`;
      }
    } else {
      alertasFechas+=`<div class="alert alert-info" style="margin-bottom:8px">
        <strong>${o.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>. (Sin fecha límite definida)
      </div>`;
    }
  });

  // Métricas
  const capBaseSem=(4*c.prepLJ+c.prepV)*prepNombres.length;
  document.getElementById('plan-metrics').innerHTML=`
    ${obrasConPedido.map(o=>{
      const cant=cantidadesGlobal[o.id]||{};
      const total=Object.values(cant).reduce((s,v)=>s+v,0);
      const fl=fechasLimite[o.id];
      const termina=completadoEn[o.id];
      const ok=fl&&termina?new Date(fl+'T23:59:59')>=termina:true;
      return `<div class="metric">
        <div class="metric-label">${o.nombre}</div>
        <div class="metric-value">${total}</div>
        <div class="metric-sub" style="color:${ok?'#27500a':'#791f1f'}">${termina?fmtF(termina):'—'} ${fl?(ok?'✓':'⚠'):''}</div>
      </div>`;
    }).join('')}
    <div class="metric"><div class="metric-label">Total global</div><div class="metric-value">${totalGlobal}</div><div class="metric-sub">aberturas</div></div>
    <div class="metric"><div class="metric-label">Semanas necesarias</div><div class="metric-value">${semanas.length}</div><div class="metric-sub">para completar todo</div></div>
    <div class="metric"><div class="metric-label">Armadores</div><div class="metric-value">${opNames.length}</div><div class="metric-sub">Preparadores: ${prepNombres.length}</div></div>`;

  document.getElementById('plan-alertas').innerHTML=alertasFechas;

  document.getElementById('op-legend').innerHTML=[
    {cls:'#534ab7',name:corteNombre},
    ...prepNombres.map((n,i)=>({cls:'#0c447c',name:n})),
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
}

// ============================================================
// COLORES POR OBRA
// ============================================================
const OBRA_COLORS=['#0c447c','#27500a','#633806','#3c3489','#72243e','#5a3e00'];
function obraColor(obraId){
  const idx=obras.findIndex(o=>o.id===obraId);
  return OBRA_COLORS[Math.max(0,idx)%OBRA_COLORS.length];
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
      ?d.prepHoy.map(p=>`<span class="chip" style="border-color:${obraColor(p.obraId)};color:${obraColor(p.obraId)}">${p.obraNombre.split(' ')[0]} ${p.tipo}×${Math.round(p.qty)}</span>`).join('')
      :`<span style="font-size:11px;color:#9b9b98">Sin pendiente</span>`;

    const corteChip=d.cortadoHoy>0
      ?`<span class="chip chip-corte">${corteNombre}: ${d.cortadoHoy} uds.</span>`
      :`<span style="font-size:11px;color:#9b9b98">Sin pendiente de corte</span>`;

    const armChips=opNames.map((nombre,oi)=>{
      const tareas=d.armHoy.filter(a=>a.opIdx===oi);
      const pct=Math.round((d.opCargaFrac[oi]||0)*100);
      if(!tareas.length){
        // Armador rotó a prep automáticamente
        return`<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px">
          <span style="font-size:10px;color:#9b9b98;min-width:72px">${nombre}</span>
          <span class="chip" style="background:#eeedfe;color:#3c3489;border-color:#afa9ec">→ Preparación (auto)</span>
        </div>`;
      }
      return`<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:2px">
        <span style="font-size:10px;color:#9b9b98;min-width:72px">${nombre} (${pct}%)</span>
        ${tareas.map(t=>`<span class="chip chip-op${Math.min(oi+1,4)}" title="${t.obraNombre}">${t.obraNombre.split(' ')[0]} ${t.tipo}×${Math.round(t.qty)}</span>`).join('')}
      </div>`;
    }).join('');

    const bufInfo=d.bufferAlFinal>0?`<div class="stock-info">Buffer prep: ${d.bufferAlFinal} uds.</div>`:'';

    return`<div class="day-block">
      <div class="day-name">${fmtD(d.fecha)}</div>
      <div class="stations">
        <div>
          <div class="st-label">Corte</div>
          <div class="chips">${corteChip}</div>
          <div class="stock-info">Stock cortado: ${d.stockCortado} uds.</div>
        </div>
        <div>
          <div class="st-label">Preparación (${d.dispPrep}/${d.capPrep})</div>
          <div class="chips">${prepChips}</div>
          ${bufInfo}
        </div>
        <div>
          <div class="st-label">Armado</div>
          ${armChips}
        </div>
      </div>
    </div>`;
  }).join('');

  const libreHtml=libre>0&&pendAlFinal<0.1?`
    <div class="free-slot">
      <div class="free-slot-title">✓ Todas las obras completadas — ${libre} espacios libres</div>
      <div class="free-slot-sub">Podés usar esta capacidad para adelantar otra obra.</div>
    </div>`:'';

  return`<div class="week-block">
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
