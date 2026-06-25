// ============================================================
// ESTADO GLOBAL
// ============================================================
let obras = JSON.parse(localStorage.getItem('obras') || '[]');
let cantidadesGlobal = JSON.parse(localStorage.getItem('cantidades-global') || '{}');
let fechasLimite = JSON.parse(localStorage.getItem('fechas-limite') || '{}');
let rotacionesAprobadas = JSON.parse(localStorage.getItem('rotaciones') || '{}');
let opNames = JSON.parse(localStorage.getItem('opNames') || '["Operario 1","Operario 2","Operario 3","Operario 4"]');
let corteNombre = localStorage.getItem('corteNombre') || 'Cortador';
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
  renderPlanGlobal();
  setFechaDefault();
});

function saveObras()      { localStorage.setItem('obras', JSON.stringify(obras)); }
function saveCantidades() { localStorage.setItem('cantidades-global', JSON.stringify(cantidadesGlobal)); }
function saveFechas()     { localStorage.setItem('fechas-limite', JSON.stringify(fechasLimite)); }
function saveRotaciones() { localStorage.setItem('rotaciones', JSON.stringify(rotacionesAprobadas)); }
function saveConfig()     { localStorage.setItem('opNames', JSON.stringify(opNames)); localStorage.setItem('corteNombre', corteNombre); }

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
  const nombre   = document.getElementById('obra-nombre').value.trim();
  const ppto     = document.getElementById('obra-ppto').value.trim();
  const cliente  = document.getElementById('obra-cliente').value.trim();
  const sistema  = document.getElementById('obra-sistema').value.trim();
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
  container.innerHTML = obras.map((o,idx) => {
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
          <div style="font-size:13px;font-weight:600;color:${totalSel>0?'#27500a':'#9b9b98'}">
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
              onchange="setCantidad('${o.id}','${a.tipo}',parseInt(this.value)||0,'${a.total}')">
          </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function setCantidad(obraId, tipo, val, max) {
  val = Math.max(0, Math.min(val, parseInt(max)));
  if (!cantidadesGlobal[obraId]) cantidadesGlobal[obraId]={};
  cantidadesGlobal[obraId][tipo]=val;
  saveCantidades();
  const totalSel=Object.values(cantidadesGlobal[obraId]).reduce((s,v)=>s+v,0);
  const el=document.querySelector(`#obra-plan-${obraId} .obra-plan-header div:last-child`);
  if(el) el.innerHTML=`<span style="font-size:13px;font-weight:600;color:${totalSel>0?'#27500a':'#9b9b98'}">${totalSel>0?totalSel+' seleccionadas':'Sin selección'}</span>`;
}

function limpiarPlanGlobal() {
  cantidadesGlobal={}; rotacionesAprobadas={}; fechasLimite={};
  saveCantidades(); saveRotaciones(); saveFechas();
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
  };
}

function renderOperariosConfig() {
  document.getElementById('operarios-config').innerHTML=[
    {cls:'chip-corte',nombre:corteNombre,key:'corte',label:'Corte'},
    {cls:'chip-op1',nombre:opNames[0],key:'0',label:'Arm. 1'},
    {cls:'chip-op2',nombre:opNames[1],key:'1',label:'Arm. 2'},
    {cls:'chip-op3',nombre:opNames[2],key:'2',label:'Arm. 3'},
    {cls:'chip-op4',nombre:opNames[3],key:'3',label:'Arm. 4'},
  ].map(op=>`<div class="operario-row">
    <div class="operario-badge ${op.cls}" style="font-size:11px">${op.label}</div>
    <input type="text" class="operario-input" id="op-name-${op.key}" value="${op.nombre}">
  </div>`).join('');
}

function guardarConfig() {
  corteNombre=document.getElementById('op-name-corte').value||'Cortador';
  opNames=[0,1,2,3].map(i=>document.getElementById('op-name-'+i).value||'Operario '+(i+1));
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
function isWeekend(d){return d.getDay()===0||d.getDay()===6;}

// Días hábiles a partir de una fecha
function diasHabilesHasta(desde, hasta) {
  let count=0; let d=new Date(desde);
  while(d<=hasta){ if(!isWeekend(d)) count++; d=addDays(d,1); }
  return count;
}

// ============================================================
// LOGICA PRINCIPAL
// ============================================================
function calcDiaOptimo(c,stock){
  let s=stock;
  for(let di=0;di<5;di++){
    s+=di===4?c.corteV:c.corteLJ;
    const prep=di===4?c.prepV:c.prepLJ;
    if(s>=prep*(c.colchon+1)) return{dia:di,stock:Math.round(s)};
  }
  return null;
}

// Simula el plan completo y devuelve el día en que cada obra termina
function simularPlan(pedidoInput, fechaInicio, c, rotaciones) {
  let pendiente = pedidoInput.map(a=>({...a}));
  let stock=0;
  let fecha=new Date(fechaInicio);
  let semIdx=0;
  let completadoEn={}; // obraId -> fecha de finalización
  let semanas=[];

  while(pendiente.some(a=>a.restante>0) && semIdx<52) {
    const lunes=new Date(fecha);
    const rot=rotaciones[semIdx]||{corteAPrep:false,desdeDia:-1,armsAPrep:0};
    const optCorte=calcDiaOptimo(c,stock);
    let ganCorte=0,ganArm=0,ganAmbos=0;
    if(optCorte){const dias=5-(optCorte.dia+1);ganCorte=dias*c.cortePrepLJ;}
    ganArm=4*c.armPrepLJ+c.armPrepV; ganAmbos=ganCorte+ganArm;

    let diasData=[]; let prepSemTotal=0;

    for(let di=0;di<5;di++){
      const esV=di===4;
      const corteActivo=!(rot.corteAPrep&&di>=rot.desdeDia);
      const nArms=rot.armsAPrep||0;
      const armDisp=4-nArms;
      const fechaDia=addDays(lunes,di);

      let capPrep=esV?c.prepV:c.prepLJ;
      if(rot.corteAPrep&&di>=rot.desdeDia) capPrep+=esV?c.cortePrepV:c.cortePrepLJ;
      if(nArms>0) capPrep+=nArms*(esV?c.armPrepV:c.armPrepLJ);

      const cortadoHoy=corteActivo?(esV?c.corteV:c.corteLJ):0;
      stock+=cortadoHoy;

      // Calcular cuánto se puede preparar de cada obra hoy
      // Distribución: proporcional a lo que falta de cada obra
      const totalPend=pendiente.reduce((s,a)=>s+a.restante,0);
      const dispPrep=Math.min(capPrep,totalPend,stock);

      // Distribuir entre obras proporcionalmente a su pendiente
      let prepHoy=[]; let restPrep=dispPrep;

      // Agrupar pendiente por obra con su total restante
      const obrasPend={};
      pendiente.forEach(a=>{
        if(!obrasPend[a.obraId]) obrasPend[a.obraId]=0;
        obrasPend[a.obraId]+=a.restante;
      });

      // Para cada obra, calcular su cuota proporcional del día
      const obrasIds=Object.keys(obrasPend);
      obrasIds.forEach(obraId=>{
        const proporcion=obrasPend[obraId]/totalPend;
        let cuota=Math.min(Math.floor(dispPrep*proporcion), obrasPend[obraId]);
        // Asignar cuota a las aberturas de esta obra en orden
        pendiente.filter(a=>a.obraId===obraId&&a.restante>0).forEach(a=>{
          if(cuota<=0) return;
          const q=Math.min(a.restante,cuota);
          if(q>0){prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre});cuota-=q;}
        });
      });

      // Distribuir sobrante si quedó capacidad sin usar
      let sobrante=dispPrep-prepHoy.reduce((s,p)=>s+p.qty,0);
      if(sobrante>0){
        pendiente.filter(a=>a.restante>0).forEach(a=>{
          if(sobrante<=0) return;
          const yaAsig=prepHoy.filter(p=>p.tipo===a.tipo&&p.obraId===a.obraId).reduce((s,p)=>s+p.qty,0);
          const q=Math.min(a.restante-yaAsig,sobrante);
          if(q>0){
            const ex=prepHoy.find(p=>p.tipo===a.tipo&&p.obraId===a.obraId);
            if(ex) ex.qty+=q; else prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre});
            sobrante-=q;
          }
        });
      }

      // Descontar del pendiente
      prepHoy.forEach(p=>{
        const idx=pendiente.findIndex(a=>a.tipo===p.tipo&&a.obraId===p.obraId);
        if(idx>=0) pendiente[idx].restante-=p.qty;
      });

      // Verificar obras completadas hoy
      const obrasPendActual={};
      pendiente.forEach(a=>{ if(!obrasPendActual[a.obraId]) obrasPendActual[a.obraId]=0; obrasPendActual[a.obraId]+=a.restante; });
      pedidoInput.forEach(a=>{
        if(!completadoEn[a.obraId] && (obrasPendActual[a.obraId]===0||obrasPendActual[a.obraId]===undefined)){
          // Verificar que realmente tenía pendiente antes
          if(pedidoInput.some(p=>p.obraId===a.obraId)) completadoEn[a.obraId]=new Date(fechaDia);
        }
      });

      stock=Math.max(0,stock-dispPrep);

      // ARMADO - lógica corregida
      // Cada operario tiene capacidad DIARIA fija. Se reparte entre lo preparado hoy.
      let armHoy=[];
      // Capacidad total de armado disponible hoy por tipo
      // Primero calcular cuántas unidades hay de cada tipo preparadas
      const prepPorTipo={};
      prepHoy.forEach(p=>{ const k=p.cat; prepPorTipo[k]=(prepPorTipo[k]||0)+p.qty; });

      // Distribuir armadores: cada uno tiene su cap diaria
      // Asignamos operarios a aberturas respetando su cap máxima diaria
      const opCargaFrac=Array(armDisp).fill(0); // fracción del día usado (0 a 1)

      prepHoy.forEach(p=>{
        let restArm=p.qty;
        while(restArm>0.01){
          const capOp=p.cat==='oscilo'?c.armOscilo:c.armCorr;
          // Buscar operario con más capacidad libre
          const mi=opCargaFrac.reduce((mi,v,i,arr)=>v<arr[mi]?i:mi,0);
          const fracLibre=Math.max(0,1-opCargaFrac[mi]);
          if(fracLibre<0.001) break; // todos llenos
          const capLibreUnits=fracLibre*capOp; // unidades que puede hacer aún
          const asig=Math.min(restArm,capLibreUnits);
          if(asig<0.01) break;
          armHoy.push({opIdx:mi,tipo:p.tipo,qty:asig,cat:p.cat,obraId:p.obraId,obraNombre:p.obraNombre});
          opCargaFrac[mi]+=asig/capOp;
          restArm-=asig;
        }
      });

      prepSemTotal+=dispPrep;
      diasData.push({di,fecha:fechaDia,corteActivo,cortadoHoy,prepHoy,armHoy,dispPrep,capPrep,nArms,stock:Math.round(stock),opCargaFrac:[...opCargaFrac]});
    }

    const pendAlFinal=pendiente.reduce((s,a)=>s+a.restante,0);
    const capBaseSem=4*c.prepLJ+c.prepV;
    const libre=Math.round(capBaseSem-prepSemTotal);
    const pct=Math.min(100,Math.round((prepSemTotal/capBaseSem)*100));
    const rotActiva=rot.corteAPrep||rot.armsAPrep>0;
    semanas.push({lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,optCorte,ganCorte,ganArm,ganAmbos,rot,rotActiva,capBaseSem});
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

  // Armar pedido global
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
  const capBaseSem=4*c.prepLJ+c.prepV;

  // Simular plan
  const{semanas,completadoEn}=simularPlan(pedidoGlobal,fechaInicio,c,rotacionesAprobadas);

  // Verificar fechas límite
  let alertasFechas='';
  obrasConPedido.forEach(o=>{
    const fl=fechasLimite[o.id];
    const termina=completadoEn[o.id];
    if(!termina) return;
    if(fl){
      const fechaLim=new Date(fl+'T23:59:59');
      if(termina>fechaLim){
        const diasAtraso=Math.ceil((termina-fechaLim)/(1000*60*60*24));
        // Calcular con rotación máxima
        const rotMax={0:{corteAPrep:true,desdeDia:1,armsAPrep:1}};
        const{completadoEn:ce2}=simularPlan(pedidoGlobal.map(a=>({...a,restante:a.original})),fechaInicio,c,rotMax);
        const terminaCon=ce2[o.id];
        const mejora=terminaCon&&terminaCon<termina?`Con rotación máxima: <strong>${fmtFull(terminaCon)}</strong>`:'Incluso con rotación máxima no se adelanta significativamente.';
        alertasFechas+=`<div class="alert alert-danger" style="margin-bottom:8px">
          <strong>⚠ ${o.nombre}:</strong> No se puede cumplir la fecha del ${fmtF(fechaLim)}. 
          La obra terminaría el <strong>${fmtFull(termina)}</strong> (${diasAtraso} días de atraso).
          <div style="margin-top:6px">${mejora}</div>
          <div style="margin-top:6px;font-size:12px">Para adelantar, aplicá una rotación de operarios en las primeras semanas usando las sugerencias del plan.</div>
        </div>`;
      } else {
        const diasAntes=Math.ceil((fechaLim-termina)/(1000*60*60*24));
        alertasFechas+=`<div class="alert alert-ok" style="margin-bottom:8px">
          <strong>✓ ${o.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>, ${diasAntes} días antes del límite.
        </div>`;
      }
    } else {
      alertasFechas+=`<div class="alert alert-info" style="margin-bottom:8px">
        <strong>${o.nombre}:</strong> Se completa el <strong>${fmtFull(termina)}</strong>. (Sin fecha límite definida)
      </div>`;
    }
  });

  // Métricas
  const resumenObras=obrasConPedido.map(o=>{
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
  }).join('');

  document.getElementById('plan-metrics').innerHTML=`
    ${resumenObras}
    <div class="metric"><div class="metric-label">Total global</div><div class="metric-value">${totalGlobal}</div><div class="metric-sub">aberturas</div></div>
    <div class="metric"><div class="metric-label">Semanas necesarias</div><div class="metric-value">${semanas.length}</div><div class="metric-sub">para completar todo</div></div>`;

  document.getElementById('plan-alertas').innerHTML=alertasFechas;

  document.getElementById('op-legend').innerHTML=[
    {cls:'#534ab7',name:corteNombre},
    {cls:'#378add',name:opNames[0]},
    {cls:'#639922',name:opNames[1]},
    {cls:'#ba7517',name:opNames[2]},
    {cls:'#d4537e',name:opNames[3]},
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
  const{lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,optCorte,ganCorte,ganArm,ganAmbos,rot,rotActiva,capBaseSem}=sem;
  const semFin=addDays(lunes,4);
  const estadoClass=pct>=95?'wb-ok':libre>0?'wb-free':'wb-warn';
  const estadoTxt=pct>=95?'Semana completa':libre>0?`${libre} unid. libres`:'Al límite';
  const barColor=pct>=95?'#639922':pct>=70?'#ba7517':'#e24b4a';

  let suggHtml='';
  if(!rotActiva&&pendAlFinal>0){
    const diaNames=['Lunes','Martes','Miércoles','Jueves','Viernes'];
    const opts=[];
    if(optCorte){
      opts.push({
        titulo:`Rotar ${corteNombre} a preparación desde el ${diaNames[Math.min(optCorte.dia+1,4)]}`,
        detalle:`Después de ${optCorte.dia+1} día(s) de corte habrá ${optCorte.stock} uds. en stock. Ganancia estimada: +${Math.round(ganCorte)} unidades esta semana.`,
        accion:`aplicarRot(${semIdx},{corteAPrep:true,desdeDia:${optCorte.dia+1},armsAPrep:0})`
      });
    } else {
      opts.push({titulo:`${corteNombre} permanece en corte toda la semana`,detalle:`Stock insuficiente para rotar con seguridad esta semana.`,accion:null});
    }
    opts.push({
      titulo:`Rotar 1 armador a preparación`,
      detalle:`Ganancia estimada: +${Math.round(ganArm)} unidades. Armado queda con 3 operarios.`,
      accion:`aplicarRot(${semIdx},{corteAPrep:false,desdeDia:0,armsAPrep:1})`
    });
    if(optCorte) opts.push({
      titulo:`Rotar ambos: ${corteNombre} + 1 armador`,
      detalle:`Máxima ganancia: +${Math.round(ganAmbos)} unidades. Armado queda con 3 operarios.`,
      accion:`aplicarRot(${semIdx},{corteAPrep:true,desdeDia:${optCorte.dia+1},armsAPrep:1})`
    });
    suggHtml=`<div class="sugg-card">
      <div class="sugg-title">💡 Sugerencias de rotación — semana ${semIdx+1}</div>
      ${opts.map(o=>`<div class="sugg-opt">
        <div class="sugg-opt-title">${o.titulo}</div>
        <div class="sugg-opt-sub">${o.detalle}</div>
        ${o.accion?`<button class="btn-primary" style="font-size:12px;padding:5px 12px" onclick="${o.accion}">Aplicar</button>`:''}
      </div>`).join('')}
    </div>`;
  } else if(rotActiva){
    const desc=[];
    if(rot.corteAPrep) desc.push(`${corteNombre} en prep. desde ${['Lunes','Martes','Miércoles','Jueves','Viernes'][rot.desdeDia]||'inicio'}`);
    if(rot.armsAPrep)  desc.push(`${rot.armsAPrep} armador(es) en prep.`);
    suggHtml=`<div class="rot-active-info"><span>↻ Rotación activa: ${desc.join(' · ')}</span>
      <button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="quitarRot(${semIdx})">Quitar</button></div>`;
  }

  const diasHtml=diasData.map(d=>{
    const prepChips=d.prepHoy.length
      ?d.prepHoy.map(p=>`<span class="chip" style="border-color:${obraColor(p.obraId)};color:${obraColor(p.obraId)}">${p.obraNombre.split(' ')[0]} ${p.tipo}×${Math.round(p.qty)}</span>`).join('')
      :`<span style="font-size:11px;color:#9b9b98">—</span>`;

    const corteChip=d.corteActivo
      ?`<span class="chip chip-corte">${corteNombre}: ${Math.round(d.cortadoHoy)}</span>`
      :`<span class="chip chip-corte">${corteNombre} en prep.</span>`;

    // Armado: mostrar con cap real usada
    const armChips=[0,1,2,3].filter(i=>i<4-d.nArms).map(oi=>{
      const tareas=d.armHoy.filter(a=>a.opIdx===oi);
      const capUsada=d.opCargaFrac&&d.opCargaFrac[oi]?Math.round(d.opCargaFrac[oi]*100):0;
      if(!tareas.length) return`<div style="font-size:11px;color:#9b9b98">${opNames[oi]}: libre</div>`;
      return`<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:2px">
        <span style="font-size:10px;color:#9b9b98;min-width:72px">${opNames[oi]} (${capUsada}%)</span>
        ${tareas.map(t=>`<span class="chip chip-op${oi+1}" title="${t.obraNombre}">${t.obraNombre.split(' ')[0]} ${t.tipo}×${Math.round(t.qty)}</span>`).join('')}
      </div>`;
    }).join('');

    return`<div class="day-block">
      <div class="day-name">${fmtD(d.fecha)}</div>
      <div class="stations">
        <div><div class="st-label">Corte</div><div class="chips">${corteChip}</div><div class="stock-info">Stock: ${d.stock} uds.</div></div>
        <div><div class="st-label">Preparación (${Math.round(d.dispPrep)}/${Math.round(d.capPrep)})</div><div class="chips">${prepChips}</div></div>
        <div><div class="st-label">Armado</div>${armChips}${d.nArms>0?`<div style="font-size:10px;color:#633806;margin-top:2px">${d.nArms} op. en prep.</div>`:''}</div>
      </div>
    </div>`;
  }).join('');

  const libreHtml=libre>0&&pendAlFinal===0?`
    <div class="free-slot">
      <div class="free-slot-title">✓ Todas las obras completadas — ${libre} espacios libres</div>
      <div class="free-slot-sub">Podés usar esta capacidad para adelantar otra obra.</div>
    </div>`:'';

  return`<div class="week-block">
    <div class="week-header">
      <span class="week-title">Semana ${semIdx+1} — ${fmtF(lunes)} al ${fmtF(semFin)}</span>
      <div class="week-right">
        ${rotActiva?'<span class="wbadge" style="background:#eeedfe;color:#3c3489">Rotación activa</span>':''}
        <span class="week-count">${Math.round(prepSemTotal)}/${capBaseSem} preparadas</span>
        <span class="wbadge ${estadoClass}">${estadoTxt}</span>
      </div>
    </div>
    <div class="capbar"><div class="capbar-fill" style="width:${pct}%;background:${barColor}"></div></div>
    <div class="week-body">${suggHtml}${diasHtml}${libreHtml}</div>
  </div>`;
}

function aplicarRot(semIdx,rot){rotacionesAprobadas[semIdx]=rot;saveRotaciones();generarPlan();}
function quitarRot(semIdx){delete rotacionesAprobadas[semIdx];saveRotaciones();generarPlan();}
