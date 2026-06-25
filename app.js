// ============================================================
// ESTADO GLOBAL
// ============================================================
let obras = JSON.parse(localStorage.getItem('obras') || '[]');
let lotes = JSON.parse(localStorage.getItem('lotes') || '[]');
let opNames = JSON.parse(localStorage.getItem('opNames') || '["Operario 1","Operario 2","Operario 3","Operario 4"]');
let corteNombre = localStorage.getItem('corteNombre') || 'Cortador';
let prepNombres = JSON.parse(localStorage.getItem('prepNombres') || '["Preparador 1"]');
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

document.addEventListener('DOMContentLoaded', () => {
  if (!obras.find(o => o.id === OBRA_DEMO.id))  obras.unshift(OBRA_DEMO);
  if (!obras.find(o => o.id === OBRA_DEMO2.id)) obras.push(OBRA_DEMO2);
  saveObras();
  renderObras();
  renderOperariosConfig();
  renderLotes();
  setFechaDefault();
});

function saveObras()  { localStorage.setItem('obras', JSON.stringify(obras)); }
function saveLotes()  { localStorage.setItem('lotes', JSON.stringify(lotes)); }
function saveConfig() {
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

function showSection(name) {
  ['obras','planificar','config'].forEach(s => {
    document.getElementById('sec-'+s).classList.toggle('hidden', s!==name);
  });
  document.querySelectorAll('.nav-btn').forEach((b,i) => {
    b.classList.toggle('active', ['obras','planificar','config'][i]===name);
  });
  if (name==='planificar') renderLotes();
}

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

function saldoPorTipo(obraId) {
  const planificado={};
  lotes.filter(l=>l.obraId===obraId).forEach(l=>{
    Object.entries(l.cantidades).forEach(([tipo,v])=>{
      planificado[tipo]=(planificado[tipo]||0)+v.qty;
    });
  });
  return planificado;
}

function abrirModalLote(obraId) {
  obraLoteActual=obras.find(o=>o.id===obraId);
  if(!obraLoteActual) return;
  document.getElementById('lote-obra-nombre').textContent=obraLoteActual.nombre;
  document.getElementById('lote-fecha').value='';
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
  const fecha=document.getElementById('lote-fecha').value;
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
    cantidades, fechaLimite:fecha,
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

function renderLotes() {
  const container=document.getElementById('lotes-container');
  if(!container) return;
  if(!lotes.length){
    container.innerHTML=`<div class="empty-state" style="padding:40px 24px">
      <div class="empty-icon">📦</div>
      <p>No hay lotes cargados. Agregá el primer lote de producción.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px">
        ${obras.map(o=>'<button class="btn-primary" onclick="abrirModalLote(\''+o.id+'\')">+ Lote para '+o.nombre+'</button>').join('')}
      </div>
    </div>`;
    return;
  }
  const porObra={};
  lotes.forEach(l=>{ if(!porObra[l.obraId])porObra[l.obraId]=[]; porObra[l.obraId].push(l); });
  let html=Object.entries(porObra).map(([obraId,lotesObra])=>{
    const obra=obras.find(o=>o.id===obraId);
    if(!obra) return '';
    return '<div class="obra-plan-card" style="margin-bottom:16px"><div class="obra-plan-header"><div><div class="obra-plan-nombre">'+obra.nombre+'</div><div style="font-size:12px;color:#6b6b68">Ppto. '+obra.ppto+' · '+obra.cliente+'</div></div><button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="abrirModalLote(\''+obraId+'\')">+ Agregar lote</button></div><div style="padding:12px 16px">'+
      lotesObra.map((l,i)=>{
        const total=Object.values(l.cantidades).reduce((s,v)=>s+v.qty,0);
        const fl=l.fechaLimite?new Date(l.fechaLimite+'T12:00:00').toLocaleDateString('es-UY',{day:'numeric',month:'short',year:'numeric'}):'Sin fecha';
        const detalle=Object.entries(l.cantidades).map(([t,v])=>t+'×'+v.qty).join(', ');
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:0.5px solid #e5e5e2;flex-wrap:wrap;gap:8px"><div><span style="font-size:12px;font-weight:600">Lote '+(i+1)+'</span><span style="font-size:12px;color:#6b6b68;margin-left:8px">'+total+' aberturas</span><span style="font-size:11px;color:#9b9b98;margin-left:6px">· '+detalle+'</span></div><div style="display:flex;align-items:center;gap:10px"><span style="font-size:12px;color:#6b6b68">📅 '+fl+'</span><button class="del-row-btn" onclick="eliminarLote(\''+l.id+'\')">✕</button></div></div>';
      }).join('')+
    '</div></div>';
  }).join('');
  const obrasSinLote=obras.filter(o=>!lotes.find(l=>l.obraId===o.id));
  if(obrasSinLote.length){
    html+='<div style="margin-top:8px"><div style="font-size:12px;color:#6b6b68;margin-bottom:8px">Obras sin lotes:</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+
      obrasSinLote.map(o=>'<button class="btn-secondary" style="font-size:12px" onclick="abrirModalLote(\''+o.id+'\')">+ Lote para '+o.nombre+'</button>').join('')+
    '</div></div>';
  }
  container.innerHTML=html;
}

function cfg(){
  return{
    corteLJ:parseFloat(document.getElementById('c-corte-lj').value)||27,
    corteV:parseFloat(document.getElementById('c-corte-v').value)||24,
    prepLJ:parseFloat(document.getElementById('c-prep-lj').value)||10,
    prepV:parseFloat(document.getElementById('c-prep-v').value)||10,
    cortePrepLJ:parseFloat(document.getElementById('c-corte-prep').value)||5,
    cortePrepV:parseFloat(document.getElementById('c-corte-prep-v').value)||5,
    armPrepLJ:parseFloat(document.getElementById('c-arm-prep').value)||10,
    armPrepV:parseFloat(document.getElementById('c-arm-prep-v').value)||10,
    armCorr:parseFloat(document.getElementById('c-arm-corr').value)||5,
    armOscilo:parseFloat(document.getElementById('c-arm-oscilo').value)||1.5,
    colchon:parseFloat(document.getElementById('c-colchon').value)||2,
  };
}

function renderOperariosConfig(){
  document.getElementById('operarios-config').innerHTML=
    '<div style="margin-bottom:16px"><div class="config-section-label">Corte</div><div class="operario-row"><div class="operario-badge chip-corte">Corte</div><input type="text" class="operario-input" id="op-name-corte" value="'+corteNombre+'"></div></div>'+
    '<div style="margin-bottom:16px"><div class="config-section-label">Preparación <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarPreparador()">+ Agregar</button></div><div id="prep-operarios">'+
      prepNombres.map((n,i)=>'<div class="operario-row"><div class="operario-badge" style="background:#e6f1fb;color:#0c447c">Prep. '+(i+1)+'</div><input type="text" class="operario-input" id="op-prep-'+i+'" value="'+n+'">'+
        (i>0?'<button class="del-row-btn" onclick="eliminarPreparador('+i+')">✕</button>':'')+
      '</div>').join('')+
    '</div></div>'+
    '<div><div class="config-section-label">Armado <button class="btn-secondary" style="font-size:11px;padding:2px 8px;margin-left:8px" onclick="agregarArmador()">+ Agregar</button></div><div id="arm-operarios">'+
      opNames.map((n,i)=>'<div class="operario-row"><div class="operario-badge chip-op'+Math.min(i+1,4)+'">Arm. '+(i+1)+'</div><input type="text" class="operario-input" id="op-name-'+i+'" value="'+n+'">'+
        (i>0?'<button class="del-row-btn" onclick="eliminarArmador('+i+')">✕</button>':'')+
      '</div>').join('')+
    '</div></div>';
}

function agregarArmador(){opNames.push('Operario '+(opNames.length+1));renderOperariosConfig();}
function eliminarArmador(i){if(opNames.length<=1){alert('Mínimo 1 armador.');return;}opNames.splice(i,1);renderOperariosConfig();}
function agregarPreparador(){prepNombres.push('Preparador '+(prepNombres.length+1));renderOperariosConfig();}
function eliminarPreparador(i){if(prepNombres.length<=1){alert('Mínimo 1 preparador.');return;}prepNombres.splice(i,1);renderOperariosConfig();}

function guardarConfig(){
  corteNombre=document.getElementById('op-name-corte').value||'Cortador';
  opNames=opNames.map((_,i)=>document.getElementById('op-name-'+i)?.value||'Operario '+(i+1));
  prepNombres=prepNombres.map((_,i)=>document.getElementById('op-prep-'+i)?.value||'Preparador '+(i+1));
  saveConfig();
  const ok=document.getElementById('cfg-ok');
  ok.classList.remove('hidden'); setTimeout(()=>ok.classList.add('hidden'),2000);
}

function addDays(d,n){const r=new Date(d);r.setDate(r.getDate()+n);return r;}
function fmtF(d){return d.toLocaleDateString('es-UY',{day:'numeric',month:'short'});}
function fmtD(d){return d.toLocaleDateString('es-UY',{weekday:'short',day:'numeric'});}
function fmtFull(d){return d.toLocaleDateString('es-UY',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
const OBRA_COLORS=['#0c447c','#27500a','#633806','#3c3489','#72243e','#5a3e00'];
function obraColor(obraId){const idx=obras.findIndex(o=>o.id===obraId);return OBRA_COLORS[Math.max(0,idx)%OBRA_COLORS.length];}

function generarPlan(){
  const c=cfg();
  const fi=document.getElementById('fecha-inicio').value;
  if(!fi){alert('Seleccioná una fecha de inicio.');return;}
  if(!lotes.length){alert('Agregá al menos un lote.');return;}
  localStorage.setItem('fecha-inicio',fi);
  const nArm=opNames.length, nPrep=prepNombres.length;

  let pedidoGlobal=[];
  lotes.forEach(lote=>{
    Object.entries(lote.cantidades).forEach(([tipo,v])=>{
      const obraRef=obras.find(o=>o.id===lote.obraId);
      const abRef=obraRef?.aberturas.find(a=>a.tipo===tipo);
      pedidoGlobal.push({loteId:lote.id,obraId:lote.obraId,obraNombre:lote.obraNombre,tipo,cat:v.cat||abRef?.cat||'corrediza',qty:v.qty,restante:v.qty,fechaLimite:lote.fechaLimite});
    });
  });

  const totalGlobal=pedidoGlobal.reduce((s,a)=>s+a.qty,0);
  const capBaseSem=(4*c.prepLJ+c.prepV)*nPrep;
  let pendiente=pedidoGlobal.map(a=>({...a}));
  let bufferPrep=[],stockCortado=0;
  let fecha=new Date(fi+'T00:00:00');
  let semIdx=0,semanas=[],completadoEn={},hayPendiente=true;

  while(hayPendiente&&semIdx<52){
    const lunes=new Date(fecha);
    let diasData=[],prepSemTotal=0;
    for(let di=0;di<5;di++){
      const esV=di===4,fechaDia=addDays(lunes,di);
      const pendTotal=pendiente.reduce((s,a)=>s+a.restante,0);
      const bufTotal=bufferPrep.reduce((s,b)=>s+b.qty,0);
      const hayTrabajo=pendTotal>0.01||bufTotal>0.01;
      const cortadoHoy=pendTotal>0.01?(esV?c.corteV:c.corteLJ):0;
      stockCortado+=cortadoHoy;
      const prepCapBase=(esV?c.prepV:c.prepLJ)*nPrep;
      const capArmTotal=nArm*c.armCorr;
      const armLibres=bufTotal<capArmTotal*0.3&&hayTrabajo?Math.min(nArm,Math.ceil((capArmTotal*0.3-bufTotal)/c.armPrepLJ)):0;
      const prepExtra=armLibres*(esV?c.armPrepV:c.armPrepLJ);
      const capPrepTotal=prepCapBase+prepExtra;
      const dispPrep=Math.min(capPrepTotal,pendTotal,stockCortado);
      let prepHoy=[];
      if(dispPrep>0.01&&pendTotal>0.01){
        const obrasPend={};
        pendiente.forEach(a=>{if(a.restante>0.01){if(!obrasPend[a.obraId])obrasPend[a.obraId]=0;obrasPend[a.obraId]+=a.restante;}});
        const totalPend=Object.values(obrasPend).reduce((s,v)=>s+v,0);
        let restPrep=dispPrep;
        Object.entries(obrasPend).forEach(([obraId,total])=>{
          let cuota=Math.min(restPrep*(total/totalPend),total);
          pendiente.filter(a=>a.obraId===obraId&&a.restante>0.01).forEach(a=>{
            if(cuota<=0.01) return;
            const q=Math.min(a.restante,cuota);
            if(q>0.01){prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre,loteId:a.loteId});cuota-=q;restPrep-=q;}
          });
        });
        let sob=dispPrep-prepHoy.reduce((s,p)=>s+p.qty,0);
        if(sob>0.01){
          pendiente.filter(a=>a.restante>0.01).forEach(a=>{
            if(sob<=0.01) return;
            const ex=prepHoy.find(p=>p.tipo===a.tipo&&p.obraId===a.obraId);
            const ya=ex?ex.qty:0,q=Math.min(a.restante-ya,sob);
            if(q>0.01){if(ex)ex.qty+=q;else prepHoy.push({tipo:a.tipo,cat:a.cat,qty:q,obraId:a.obraId,obraNombre:a.obraNombre,loteId:a.loteId});sob-=q;}
          });
        }
      }
      prepHoy.forEach(p=>{
        const idx=pendiente.findIndex(a=>a.tipo===p.tipo&&a.obraId===p.obraId&&a.loteId===p.loteId);
        if(idx>=0) pendiente[idx].restante=Math.max(0,pendiente[idx].restante-p.qty);
        const bx=bufferPrep.find(b=>b.tipo===p.tipo&&b.obraId===p.obraId);
        if(bx) bx.qty+=p.qty; else bufferPrep.push({...p});
      });
      stockCortado=Math.max(0,stockCortado-dispPrep);
      const opCargaFrac=Array(nArm).fill(0);
      let armHoy=[];
      bufferPrep.filter(b=>b.qty>0.01).forEach(b=>{
        let rest=b.qty;
        while(rest>0.01){
          const capOp=b.cat==='oscilo'?c.armOscilo:c.armCorr;
          const mi=opCargaFrac.reduce((mi,v,i,arr)=>v<arr[mi]?i:mi,0);
          const fracLibre=Math.max(0,1-opCargaFrac[mi]);
          if(fracLibre<0.001) break;
          const asig=Math.min(rest,fracLibre*capOp);
          if(asig<0.01) break;
          armHoy.push({opIdx:mi,tipo:b.tipo,qty:asig,cat:b.cat,obraId:b.obraId,obraNombre:b.obraNombre});
          opCargaFrac[mi]+=asig/capOp; rest-=asig;
        }
      });
      armHoy.forEach(a=>{const bx=bufferPrep.find(b=>b.tipo===a.tipo&&b.obraId===a.obraId);if(bx)bx.qty=Math.max(0,bx.qty-a.qty);});
      bufferPrep=bufferPrep.filter(b=>b.qty>0.01);
      const opEstado=opNames.map((nombre,i)=>{
        const tareas=armHoy.filter(a=>a.opIdx===i);
        const pct=Math.round(opCargaFrac[i]*100);
        if(!hayTrabajo) return{nombre,estado:'libre',tareas:[],pct:0};
        if(opCargaFrac[i]<0.05&&armLibres>0) return{nombre,estado:'prep',tareas:[],pct:0};
        if(!tareas.length) return{nombre,estado:'libre',tareas:[],pct:0};
        return{nombre,estado:'armando',tareas,pct};
      });
      const pendAhora={},bufAhora={};
      pendiente.forEach(a=>{if(!pendAhora[a.obraId])pendAhora[a.obraId]=0;pendAhora[a.obraId]+=a.restante;});
      bufferPrep.forEach(b=>{if(!bufAhora[b.obraId])bufAhora[b.obraId]=0;bufAhora[b.obraId]+=b.qty;});
      pedidoGlobal.forEach(a=>{
        if(!completadoEn[a.obraId]&&(pendAhora[a.obraId]||0)<0.01&&(bufAhora[a.obraId]||0)<0.01)
          completadoEn[a.obraId]=new Date(fechaDia);
      });
      prepSemTotal+=dispPrep;
      diasData.push({di,fecha:fechaDia,cortadoHoy:Math.round(cortadoHoy),stockCortado:Math.round(stockCortado),prepHoy,armHoy,opEstado,dispPrep:Math.round(dispPrep),capPrepTotal:Math.round(capPrepTotal),bufferAlFinal:Math.round(bufferPrep.reduce((s,b)=>s+b.qty,0)),hayTrabajo});
    }
    const pendAlFinal=pendiente.reduce((s,a)=>s+a.restante,0)+bufferPrep.reduce((s,b)=>s+b.qty,0);
    const pct=capBaseSem>0?Math.min(100,Math.round((prepSemTotal/capBaseSem)*100)):0;
    const libre=Math.max(0,Math.round(capBaseSem-prepSemTotal));
    semanas.push({lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,capBaseSem});
    hayPendiente=pendAlFinal>0.01;
    fecha=addDays(lunes,7); semIdx++;
  }

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
        alertas+='<div class="alert alert-danger" style="margin-bottom:8px"><strong>⚠ '+obraRef.nombre+':</strong> No se puede cumplir la fecha del '+fmtF(fechaLim)+'. Terminaría el <strong>'+fmtFull(termina)+'</strong> ('+dias+' día(s) de atraso).<div style="margin-top:4px;font-size:12px">Considerá agregar un preparador en Configuración.</div></div>';
      } else {
        const dias=Math.ceil((fechaLim-termina)/(1000*60*60*24));
        alertas+='<div class="alert alert-ok" style="margin-bottom:8px"><strong>✓ '+obraRef.nombre+':</strong> Se completa el <strong>'+fmtFull(termina)+'</strong>, '+dias+' día(s) antes del límite.</div>';
      }
    } else {
      alertas+='<div class="alert alert-info" style="margin-bottom:8px"><strong>'+obraRef.nombre+':</strong> Se completa el <strong>'+fmtFull(termina)+'</strong>.</div>';
    }
  });

  document.getElementById('plan-metrics').innerHTML=
    obraIds.map(id=>{
      const o=obras.find(x=>x.id===id); if(!o) return '';
      const total=lotes.filter(l=>l.obraId===id).reduce((s,l)=>s+Object.values(l.cantidades).reduce((ss,v)=>ss+v.qty,0),0);
      const termina=completadoEn[id];
      const fl=lotes.filter(l=>l.obraId===id&&l.fechaLimite).sort((a,b)=>a.fechaLimite.localeCompare(b.fechaLimite))[0]?.fechaLimite;
      const ok=fl&&termina?new Date(fl+'T23:59:59')>=termina:true;
      return '<div class="metric"><div class="metric-label">'+o.nombre+'</div><div class="metric-value">'+total+'</div><div class="metric-sub" style="color:'+(ok?'#27500a':'#791f1f')+'">'+(termina?fmtF(termina):'—')+' '+(fl?(ok?'✓':'⚠'):'')+' </div></div>';
    }).join('')+
    '<div class="metric"><div class="metric-label">Total global</div><div class="metric-value">'+totalGlobal+'</div><div class="metric-sub">'+lotes.length+' lotes</div></div>'+
    '<div class="metric"><div class="metric-label">Semanas necesarias</div><div class="metric-value">'+semanas.length+'</div><div class="metric-sub">plan completo</div></div>'+
    '<div class="metric"><div class="metric-label">Dotación</div><div class="metric-value">'+(opNames.length+prepNombres.length+1)+'</div><div class="metric-sub">'+opNames.length+' arm · '+prepNombres.length+' prep · 1 corte</div></div>';

  document.getElementById('plan-alertas').innerHTML=alertas;
  document.getElementById('op-legend').innerHTML=[{cls:'#534ab7',name:corteNombre},...prepNombres.map(n=>({cls:'#0c447c',name:n})),...opNames.map((n,i)=>({cls:['#378add','#639922','#ba7517','#d4537e','#534ab7','#27500a'][i%6],name:n}))].map(o=>'<div class="op-leg-item"><div class="op-dot" style="background:'+o.cls+'"></div>'+o.name+'</div>').join('');
  document.getElementById('plan-weeks').innerHTML=semanas.map(renderSemana).join('');
  document.getElementById('plan-resultado').classList.remove('hidden');
  if(!document.getElementById('btn-imprimir')){
    const btnRow=document.createElement('div');
    btnRow.style.cssText='display:flex;justify-content:flex-end;margin-bottom:12px;gap:8px';
    btnRow.innerHTML='<button id="btn-imprimir" class="btn-secondary" onclick="window.print()">🖨️ Imprimir plan</button>';
    document.getElementById('plan-alertas').parentNode.insertBefore(btnRow,document.getElementById('plan-alertas'));
  }
  document.getElementById('plan-resultado').scrollIntoView({behavior:'smooth',block:'start'});
}

function renderSemana(sem){
  const{lunes,diasData,prepSemTotal,pendAlFinal,libre,pct,semIdx,capBaseSem}=sem;
  const semFin=addDays(lunes,4);
  const estadoClass=pct>=95?'wb-ok':libre>0?'wb-free':'wb-warn';
  const estadoTxt=pct>=95?'Semana completa':libre>0?(libre+' unid. libres'):'Al límite';
  const barColor=pct>=95?'#639922':pct>=70?'#ba7517':'#e24b4a';
  const diasHtml=diasData.map(d=>{
    const prepChips=d.prepHoy.length?d.prepHoy.map(p=>'<span class="chip" style="border-color:'+obraColor(p.obraId)+';color:'+obraColor(p.obraId)+'">'+p.obraNombre.split(' ')[0]+' '+p.tipo+'×'+Math.round(p.qty)+'</span>').join(''):d.hayTrabajo?'<span style="font-size:11px;color:#9b9b98">Buffer suficiente</span>':'<span style="font-size:11px;color:#9b9b98">Sin pendiente</span>';
    const corteChip=d.cortadoHoy>0?'<span class="chip chip-corte">'+corteNombre+': '+d.cortadoHoy+' uds.</span>':'<span style="font-size:11px;color:#9b9b98">'+corteNombre+': libre</span>';
    const armChips=d.opEstado.map((op,i)=>{
      if(op.estado==='libre') return '<div style="font-size:11px;color:#9b9b98;margin-bottom:2px">'+op.nombre+': libre</div>';
      if(op.estado==='prep') return '<div style="display:flex;align-items:center;gap:3px;margin-bottom:2px"><span style="font-size:10px;color:#9b9b98;min-width:72px">'+op.nombre+'</span><span class="chip" style="background:#eeedfe;color:#3c3489;border-color:#afa9ec">→ Preparación (auto)</span></div>';
      return '<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:2px"><span style="font-size:10px;color:#9b9b98;min-width:72px">'+op.nombre+' ('+op.pct+'%)</span>'+op.tareas.map(t=>'<span class="chip chip-op'+Math.min(i+1,4)+'">'+t.obraNombre.split(' ')[0]+' '+t.tipo+'×'+Math.round(t.qty)+'</span>').join('')+'</div>';
    }).join('');
    return '<div class="day-block"><div class="day-name">'+fmtD(d.fecha)+'</div><div class="stations"><div><div class="st-label">Corte</div><div class="chips">'+corteChip+'</div><div class="stock-info">Stock cortado: '+d.stockCortado+' uds.</div></div><div><div class="st-label">Preparación ('+d.dispPrep+'/'+d.capPrepTotal+')</div><div class="chips">'+prepChips+'</div>'+(d.bufferAlFinal>0?'<div class="stock-info">Buffer listo: '+d.bufferAlFinal+' uds.</div>':'')+'</div><div><div class="st-label">Armado</div>'+armChips+'</div></div></div>';
  }).join('');
  const libreHtml=pendAlFinal<0.1?'<div class="free-slot"><div class="free-slot-title">✓ Todos los lotes completados</div><div class="free-slot-sub">Podés agregar nuevos lotes para continuar el plan.</div></div>':'';
  return '<div class="week-block"><div class="week-header"><span class="week-title">Semana '+(semIdx+1)+' — '+fmtF(lunes)+' al '+fmtF(semFin)+'</span><div class="week-right"><span class="week-count">'+Math.round(prepSemTotal)+'/'+capBaseSem+' preparadas</span><span class="wbadge '+estadoClass+'">'+estadoTxt+'</span></div></div><div class="capbar"><div class="capbar-fill" style="width:'+pct+'%;background:'+barColor+'"></div></div><div class="week-body">'+diasHtml+libreHtml+'</div></div>';
}
