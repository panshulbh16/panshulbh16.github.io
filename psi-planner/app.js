/* PSI Planning Grid UI: state, rendering and events. Depends on solver.js. */
const KEY='psi-grid-v2';
function blankItem(k){return{code:'NEW-'+pad2(k).padStart(3,'0'),desc:'New item',uom:'EA',boh:0,p:Object.assign(defaults(),{autoPlan:false}),
  wk:plan(S.items[0]?.wk?.start||'2026-10-19',12,z12(),z12(),z12(),z12(),z12()),mo:plan(S.items[0]?.mo?.start||'2026-10',12,z12(),z12(),z12(),z12(),z12())}}

let S=null;
try{const raw=localStorage.getItem(KEY);if(raw)S=JSON.parse(raw)}catch(e){}
if(!S||!Array.isArray(S.items)||!S.items.length)S=sample();
function normalize(){
  if(!VK[S.view])S.view='weekly';
  S.active=clamp(num(S.active),0,S.items.length-1);
  for(const it of S.items){
    it.p=Object.assign(defaults(),it.p||{});
    for(const v of ['weekly','monthly']){
      const k=VK[v];const D=it[k]=it[k]||plan(v==='weekly'?'2026-10-19':'2026-10',12,z12(),z12(),z12(),z12(),z12());
      D.n=clamp(num(D.n)||12,...LIM[v]);
      if(v==='weekly'&&!/^\d{4}-\d{2}-\d{2}$/.test(D.start||''))D.start='2026-10-19';
      if(v==='monthly'&&!/^\d{4}-\d{2}$/.test(D.start||''))D.start='2026-10';
      for(const a of ['fc','so','firm','ss','cap']){if(!Array.isArray(D[a]))D[a]=[];
        while(D[a].length<D.n)D[a].push((a==='ss'||a==='cap')&&D[a].length?num(D[a][D[a].length-1]):0);D[a].length=D.n}
    }
  }
}
normalize();
let saveT;function save(){if(window.PSICloud&&PSICloud.user){PSICloud.schedule();return}clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},250)}
function loadLocal(){let d=null;try{const raw=localStorage.getItem(KEY);if(raw)d=JSON.parse(raw)}catch(e){}return d&&Array.isArray(d.items)&&d.items.length?d:sample()}
const cur=()=>S.items[S.active];
const data=(it=cur())=>it[VK[S.view]];

/* ---------- rendering ---------- */
const $=id=>document.getElementById(id);
function rowsFor(it){const P=it.p;return[
  {k:'boh',name:'Beginning on hand',op:'',hint:'Prior period ending on hand'},
  {k:'fc',name:'Forecast',op:'',hint:'Statistical or consensus forecast',input:true,tot:true},
  {k:'so',name:'Sales orders',op:'',hint:'Booked customer orders',input:true,tot:true},
  {k:'dem',name:'Total demand',op:'−',hid:'demHint',tot:true,sep:true},
  {k:'firm',name:'Firm supply',op:'+',hid:'firmHint',input:true,tot:true},
  {k:'plan',name:'Planned receipts',op:'+',hid:'planHint',tot:true},
  {k:'eoh',name:'Ending on hand',op:'=',hint:'BOH + firm + planned − demand',key:true},
  P.ssMethod==='USER'?{k:'ss',name:'Safety stock',op:'',hint:'User-defined quantity',input:true}:{k:'ssv',name:'Safety stock',op:'',hid:'ssHint'},
  {k:'gap',name:'Surplus / (shortage)',op:'',hint:'Ending on hand vs safety stock'},
  {k:'rel',name:'Planned order release',op:'',hid:'relHint',tot:true,sep:true},
  ...(P.constrained?[{k:'cap',name:'Capacity',op:'',hint:'Max firm + planned supply',input:true},{k:'util',name:'Capacity used',op:'',hint:'(Firm + planned) ÷ capacity'}]:[]),
  {k:'doc',name:'Days of cover',op:'',hint:'Next 4 periods average daily demand'},
  {k:'st',name:'Status',op:'',hint:''}]}
let INPUT_KEYS=[];

function renderTabs(){
  $('tabs').innerHTML=S.items.map((it,i)=>{const w=worst(solve(it,S.view).st);
    return `<button class="tab" role="tab" type="button" data-tab="${i}" aria-selected="${i===S.active}"><i class="dot ${w}" title="${STLBL[w]}"></i><span class="code">${esc(it.code)||'—'}</span></button>`}).join('')
    +`<button class="tab add" type="button" id="addItem">+ New item</button>`;
}
function applyShow(){const p=cur().p;document.querySelectorAll('[data-show]').forEach(el=>{const [k,vals]=el.dataset.show.split(':');el.hidden=!vals.split('|').includes(String(p[k]))})}
function renderParams(){
  const it=cur();
  document.querySelectorAll('[data-f]').forEach(el=>{const k=el.dataset.f;el.value=k==='boh'?fmt(num(it.boh)):it[k]??''});
  document.querySelectorAll('[data-p]').forEach(el=>{const v=it.p[el.dataset.p];
    if(el.type==='checkbox')el.checked=!!v;else if(el.tagName==='SELECT')el.value=v;else el.value=fmt(num(v))});
  $('delItem').disabled=S.items.length<2;applyShow();
}
function renderView(){
  const w=S.view==='weekly',D=data();
  $('vWeekly').setAttribute('aria-pressed',w);$('vMonthly').setAttribute('aria-pressed',!w);
  $('hStartW').hidden=!w;$('hStartM').hidden=w;
  if(w)$('hStartW').value=D.start;else $('hStartM').value=D.start;
  $('hStartLbl').setAttribute('for',w?'hStartW':'hStartM');
  $('pdCount').textContent=D.n;$('gridTitle').textContent=(w?'Weekly':'Monthly')+' projection';
}
function renderGrid(){
  const it=cur(),D=data(),r=solve(it,S.view),B=r.B,rows=rowsFor(it);
  INPUT_KEYS=rows.filter(x=>x.input).map(x=>x.k);
  const fz=i=>i<r.ptfB?' fz':'';
  let h='<thead><tr><th class="m" scope="col">Measure</th>'+B.map((b,i)=>{
    const tags=(i<r.dtfB?'<i class="tag dtf">DTF</i>':'')+(i<r.ptfB?'<i class="tag ptf">PTF</i>':'')+(i<r.rtfB?'<i class="tag rtf">RTF</i>':'');
    return `<th scope="col" class="${fz(i)}"><span class="wk">${b.lab}</span><span class="dt">${b.sub}</span><span class="tags">${tags}</span></th>`}).join('')
    +'<th scope="col"><span class="wk">Total</span><span class="dt">&nbsp;</span><span class="tags"></span></th></tr></thead><tbody>';
  for(const row of rows){
    const hint=row.hid?`<span class="m-hint" id="${row.hid}"></span>`:row.hint?`<span class="m-hint">${row.hint}</span>`:'';
    h+=`<tr class="${row.key?'key':row.sep?'sep':''}"><th class="m" scope="row"><div class="m-in"><span class="op">${row.op}</span><span><span class="m-name">${row.name}</span>${hint}</span>${row.input?`<button class="btn sm fill" type="button" data-fill="${row.k}" title="Copy ${B[0].lab} value to every period">Fill →</button>`:''}</div></th>`;
    for(let i=0;i<D.n;i++){
      if(row.input)h+=`<td class="in"><input id="c-${row.k}-${i}" data-k="${row.k}" data-i="${i}" inputmode="decimal" autocomplete="off" aria-label="${row.name} ${B[i].lab}" value="${fmt(num(D[row.k][i]))}"></td>`;
      else h+=`<td class="c" id="v-${row.k}-${i}"></td>`;
    }
    h+=`<td class="c tot" id="t-${row.k}"></td></tr>`;
  }
  $('psi').innerHTML=h+'</tbody>';
}

function refresh(){
  const it=cur(),P=it.p,D=data(),r=solve(it,S.view),B=r.B,n=r.n,u=esc(it.uom||'');
  const set=(id,html,cls)=>{const el=$(id);if(!el)return;el.innerHTML=html;if(cls!==undefined)el.className=cls};
  const neg=v=>v<0?`<span class="neg">${fmt(v)}</span>`:fmt(v);
  const lateIdx=new Set(r.orders.filter(o=>o.late).map(o=>o.rel));
  for(let i=0;i<n;i++){
    set('v-boh-'+i,neg(r.boh[i]));
    set('v-dem-'+i,fmt(r.dem[i]));
    set('v-plan-'+i,P.autoPlan||r.plan[i]?(r.plan[i]?fmt(r.plan[i]):'<span class="dim">0</span>'):'<span class="dim">–</span>');
    const st=r.st[i];set('v-eoh-'+i,fmt(r.eoh[i]),'c'+(st!=='ok'?' st-'+st:''));
    set('v-ssv-'+i,fmt(r.ss[i]));
    set('v-gap-'+i,r.gap[i]<0?`<span class="neg">(${fmt(-r.gap[i])})</span>`:fmt(r.gap[i]));
    set('v-rel-'+i,r.rel[i]?`<span class="${lateIdx.has(i)?'late':''}">${fmt(r.rel[i])}${lateIdx.has(i)?' !':''}</span>`:'<span class="dim">0</span>');
    if(r.util){const ut=r.util[i];set('v-util-'+i,ut===Infinity?'<span class="neg">∞</span>':`<span class="${ut>1+1e-9?'neg':''}">${Math.round(ut*100)}%</span>`)}
    const dc=r.doc[i];set('v-doc-'+i,dc===Infinity?'∞':dc<0?`<span class="neg">${fmt(Math.round(dc))}</span>`:fmt(Math.round(dc)));
    set('v-st-'+i,`<span class="chip ${st}">${STLBL[st]}</span>`);
  }
  const sum=a=>a.reduce((x,v)=>x+num(v),0);
  set('t-fc',fmt(sum(r.fc)));set('t-so',fmt(sum(r.so)));set('t-dem',fmt(sum(r.dem)));set('t-firm',fmt(sum(D.firm)));
  set('t-plan',fmt(sum(r.plan)));set('t-rel',fmt(sum(r.rel)));
  if(r.cap){set('t-cap',fmt(sum(r.cap)));const tc=sum(r.cap);set('t-util',tc?Math.round((sum(r.firm)+sum(r.plan))/tc*100)+'%':'')}
  for(const k of ['boh','eoh','ss','ssv','gap','doc','st'])set('t-'+k,'');

  const unit=S.view==='weekly'?'week':'month',units=c=>`${c} ${unit}${c===1?'':'s'}`;
  const shr=num(P.shrink)?` · +${fmt(num(P.shrink))}% shrink`:'';
  set('demHint',r.dtfB?`Orders in first ${units(r.dtfB)}, then ${CONLBL[P.consume]}${shr}`:`${CONLBL[P.consume]}${shr}`);
  set('firmHint',P.includeFirm?'POs, work orders, transfers':'Excluded from plan');
  set('planHint',P.autoPlan?`${LOTLBL[P.lotRule]}${r.ptfB?` · none in first ${units(r.ptfB)}`:''}`:'Planned orders off');
  if(P.ssMethod!=='USER')set('ssHint',P.ssMethod==='DOC'?`${fmt(num(P.ssDays))} days of cover`:`${fmt(num(P.svc))}% service, z ${r.z.toFixed(2)}`);
  set('relHint',`Start qty, offset ${fmt(r.LT)} days${r.yld<1?` · ÷ ${fmt(r.yld*100)}% yield`:''}`);

  const ltB=Math.ceil(r.LT/(S.view==='weekly'?7:30.4)-1e-9);
  set('ltReadout',`${fmt(r.LT)} days ≈ ${units(ltB)}`);
  set('ssReadout',P.ssMethod==='DOC'?'Avg daily demand × days':P.ssMethod==='STAT'?`z ${r.z.toFixed(2)} × σ ${fmt(Math.round(r.sigma))}`:'');
  $('solverSummary').textContent=`${LOTLBL[P.lotRule]} · LT ${fmt(r.LT)}d · SS ${SSLBL[P.ssMethod]} · DTF ${fmt(num(P.dtf))}d / PTF ${fmt(num(P.ptf))}d / RTF ${fmt(num(P.rtf))}d${P.constrained?' · Capacity constrained':''}${P.autoPlan?'':' · Planned orders off'}`;

  const first=B[0],last=B[n-1];
  $('horizonText').textContent=`${n} ${S.view} buckets · ${first.lab} ${first.yr}${S.view==='weekly'?` (${first.sub})`:''} to ${last.lab} ${last.yr}${S.view==='weekly'?` (${last.sub})`:''}`;

  const outN=r.st.filter(s=>s==='out').length,lowN=r.eoh.filter((e,i)=>e<r.ss[i]-1e-9).length;
  const fr=r.eoh.findIndex((e,i)=>e<r.ss[i]-1e-9);
  const fin=r.doc.filter(isFinite),avgD=fin.length?fin.reduce((a,v)=>a+v,0)/fin.length:0;
  const relNow=r.orders.filter(o=>o.late||o.rel<r.rtfB).length;
  const k=(lab,val,cls='')=>`<div class="kpi ${cls}"><div class="k">${lab}</div><div class="v">${val}</div></div>`;
  let kp=k(`Ending on hand · ${last.lab}`,`${fmt(r.eoh[n-1])}<small>${u}</small>`,r.eoh[n-1]<0?'bad':r.eoh[n-1]<r.ss[n-1]?'warn':'')+
    k('Stockout periods',outN,outN?'bad':'good')+
    k('Below safety stock',lowN,lowN?'warn':'good')+
    k('First risk period',fr<0?'None':`${B[fr].lab}<small>${B[fr].sub}</small>`,fr<0?'good':(r.eoh[fr]<0?'bad':'warn'))+
    k('Planned receipts',`${fmt(sum(r.plan))}<small>${r.orders.reduce((a,o)=>a+o.count,0)} orders</small>`)+
    k('Release now / past due',relNow,relNow?'warn':'')+
    k('Avg days of cover',fmt(Math.round(avgD)));
  if(r.util){const pk=Math.max(...r.util.filter(isFinite),0);kp+=k('Peak capacity used',Math.round(pk*100)+'%',pk>1+1e-9?'bad':pk>.9?'warn':'')}
  $('kpis').innerHTML=kp;

  renderChart(r);
  const ex=messages(it,r);
  $('exCount').textContent=ex.length?ex.length+' open':'';
  $('exceptions').innerHTML=ex.length?`<ul class="ex-list">${ex.map(m=>`<li class="ex-${m.c}"><span class="ex-w">${B[m.i].lab}</span><span class="ex-t">${m.t}</span></li>`).join('')}</ul>`:'<p class="ex-none">No exceptions. Inventory stays between safety stock and the excess limit across the horizon.</p>';
  $('lgCap').hidden=!r.cap;
  renderTabs();save();
}

function niceTicks(min,max,count){const span=(max-min)||1;const s0=span/count;const mag=10**Math.floor(Math.log10(s0));const e=s0/mag;const step=(e>=7.5?10:e>=3.5?5:e>=1.5?2:1)*mag;const lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step;const t=[];for(let v=lo;v<=hi+step*1e-6;v+=step)t.push(Math.round(v/step)*step);return t}
function renderChart(r){
  const n=r.n,B=r.B,L=62,Rm=14,T=22,Bm=42,cw=64,W=L+Rm+cw*n,H=300,ph=H-T-Bm;
  const vals=[0];for(let i=0;i<n;i++){vals.push(r.dem[i],r.firm[i]+r.plan[i],r.eoh[i],r.ss[i]);if(r.cap)vals.push(r.cap[i])}
  const ticks=niceTicks(Math.min(...vals),Math.max(...vals),5),y0=ticks[0],y1=ticks[ticks.length-1];
  const y=v=>T+ph-(v-y0)/((y1-y0)||1)*ph;
  let s=`<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.max(480,n*46)}px" role="img" aria-label="Demand, supply, ending on hand, safety stock${r.cap?' and capacity':''} by period">`;
  if(r.ptfB)s+=`<rect class="fzr" x="${L}" y="${T}" width="${cw*r.ptfB}" height="${ph}"/><text class="fzt" x="${L+4}" y="${T-6}">PTF</text>`;
  if(r.dtfB&&r.dtfB<n)s+=`<line class="fzl" x1="${L+cw*r.dtfB}" x2="${L+cw*r.dtfB}" y1="${T}" y2="${T+ph}"/><text class="fzt" x="${L+cw*r.dtfB+4}" y="${T-6}">DTF</text>`;
  for(const t of ticks)s+=`<line class="${t===0?'zl':'gl'}" x1="${L}" x2="${W-Rm}" y1="${y(t)}" y2="${y(t)}"/><text class="ax" x="${L-8}" y="${y(t)+4}" text-anchor="end">${fmt(t)}</text>`;
  const bw=Math.min(15,cw*.24);
  for(let i=0;i<n;i++){
    const cx=L+cw*(i+.5),z=y(0),d=r.dem[i],f=r.firm[i],p=r.plan[i];
    if(d>0)s+=`<rect class="b-dem" x="${cx-bw-2}" y="${y(d)}" width="${bw}" height="${z-y(d)}" rx="1.5"><title>${B[i].lab} demand ${fmt(d)}</title></rect>`;
    if(f>0)s+=`<rect class="b-firm" x="${cx+2}" y="${y(f)}" width="${bw}" height="${z-y(f)}" rx="1.5"><title>${B[i].lab} firm supply ${fmt(f)}</title></rect>`;
    if(p>0)s+=`<rect class="b-plan" x="${cx+2}" y="${y(f+p)}" width="${bw}" height="${y(f)-y(f+p)}" rx="1.5"><title>${B[i].lab} planned receipts ${fmt(p)}</title></rect>`;
    s+=`<text class="axw" x="${cx}" y="${H-Bm+18}" text-anchor="middle">${B[i].lab}</text><text class="ax" x="${cx}" y="${H-Bm+32}" text-anchor="middle">${B[i].sub}</text>`;
  }
  const step=a=>a.map((v,i)=>`${i?'L':'M'}${L+cw*i} ${y(v)}L${L+cw*(i+1)} ${y(v)}`).join('');
  s+=`<path class="l-ss" d="${step(r.ss)}"/>`;
  if(r.cap)s+=`<path class="l-cap" d="${step(r.cap)}"/>`;
  s+=`<polyline class="l-eoh" points="${r.eoh.map((e,i)=>`${L+cw*(i+.5)},${y(e)}`).join(' ')}"/>`;
  for(let i=0;i<n;i++)s+=`<circle class="p-${r.st[i]} p-ring" cx="${L+cw*(i+.5)}" cy="${y(r.eoh[i])}" r="4.5"><title>${B[i].lab} ending on hand ${fmt(r.eoh[i])} · ${STLBL[r.st[i]]}</title></circle>`;
  $('chart').innerHTML=s+'</svg>';
}
function renderAll(){renderParams();renderView();renderGrid();refresh()}

/* ---------- events ---------- */
const psi=$('psi');
psi.addEventListener('input',e=>{const t=e.target;if(!t.dataset.k)return;data()[t.dataset.k][+t.dataset.i]=num(t.value);refresh()});
psi.addEventListener('focusin',e=>{const t=e.target;if(t.dataset&&t.dataset.k){t.value=String(num(t.value));t.select()}});
psi.addEventListener('focusout',e=>{const t=e.target;if(t.dataset&&t.dataset.k)t.value=fmt(num(data()[t.dataset.k][+t.dataset.i]))});
psi.addEventListener('keydown',e=>{
  const t=e.target;if(!t.dataset||!t.dataset.k)return;const i=+t.dataset.i,ri=INPUT_KEYS.indexOf(t.dataset.k);let id=null;
  if(e.key==='Enter')id=`c-${t.dataset.k}-${e.shiftKey?i-1:i+1}`;
  else if(e.key==='ArrowDown')id=`c-${INPUT_KEYS[ri+1]}-${i}`;
  else if(e.key==='ArrowUp')id=`c-${INPUT_KEYS[ri-1]}-${i}`;
  if(id){const nx=$(id);if(nx){e.preventDefault();nx.focus()}}
});
psi.addEventListener('paste',e=>{
  const t=e.target;if(!t.dataset||!t.dataset.k)return;
  const txt=(e.clipboardData||window.clipboardData)?.getData('text')||'';
  if(!/[\t\n\r]/.test(txt.replace(/[\r\n]+$/,'')))return;
  e.preventDefault();const k=t.dataset.k,s0=+t.dataset.i,parts=txt.replace(/\r/g,'').replace(/\n+$/,'').split(/\t|\n/),D=data();
  parts.forEach((p,j)=>{const i=s0+j;if(i<D.n){D[k][i]=num(p);const c=$(`c-${k}-${i}`);if(c&&c!==t)c.value=fmt(num(p))}});
  t.value=String(num(D[k][s0]));refresh();toast(`Pasted ${Math.min(parts.length,D.n-s0)} periods`);
});
psi.addEventListener('click',e=>{
  const b=e.target.closest('[data-fill]');if(!b)return;const k=b.dataset.fill,D=data(),v=num(D[k][0]);
  D[k]=rep(D.n,v);for(let i=0;i<D.n;i++){const c=$(`c-${k}-${i}`);if(c)c.value=fmt(v)}refresh();toast(`Filled every period with ${fmt(v)}`);
});

const numFocus=el=>{el.addEventListener('focus',()=>{el.value=String(num(el.value));el.select()});el.addEventListener('blur',()=>{el.value=fmt(num(el.value))})};
document.querySelectorAll('[data-f]').forEach(el=>{
  el.addEventListener('input',()=>{const k=el.dataset.f;cur()[k]=k==='boh'?num(el.value):el.value.trim();refresh()});
  if(el.classList.contains('n'))numFocus(el);
});
document.querySelectorAll('[data-p]').forEach(el=>{
  const ev=(el.type==='checkbox'||el.tagName==='SELECT')?'change':'input';
  el.addEventListener(ev,()=>{const k=el.dataset.p,p=cur().p;
    p[k]=el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:Math.max(0,num(el.value));
    applyShow();if(k==='ssMethod'||k==='constrained'||k==='dtf'||k==='ptf'||k==='rtf')renderGrid();refresh()});
  if(el.classList.contains('n'))numFocus(el);
});

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{S.view=b.dataset.view;renderView();renderGrid();refresh()}));
$('hStartW').addEventListener('change',e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)){data().start=e.target.value;renderGrid();refresh()}});
$('hStartM').addEventListener('change',e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)){data().start=e.target.value;renderGrid();refresh()}});
function setPeriods(n){data().n=clamp(n,...LIM[S.view]);normalize();renderView();renderGrid();refresh()}
$('pdPlus').addEventListener('click',()=>setPeriods(data().n+1));
$('pdMinus').addEventListener('click',()=>setPeriods(data().n-1));

$('tabs').addEventListener('click',e=>{
  if(e.target.closest('#addItem')){S.items.push(blankItem(S.items.length+1));S.active=S.items.length-1;normalize();renderAll();$('fCode').focus();$('fCode').select();return}
  const t=e.target.closest('[data-tab]');if(t){S.active=+t.dataset.tab;renderAll()}
});
function arm(btn,label,armed,action){let tm;btn.addEventListener('click',()=>{
  if(btn.dataset.armed){clearTimeout(tm);delete btn.dataset.armed;btn.classList.remove('armed');btn.textContent=label;action();return}
  btn.dataset.armed='1';btn.classList.add('armed');btn.textContent=armed;
  tm=setTimeout(()=>{delete btn.dataset.armed;btn.classList.remove('armed');btn.textContent=label},4000)})}
arm($('delItem'),'Delete item','Click again to delete',()=>{if(S.items.length<2)return;const c=cur().code;S.items.splice(S.active,1);S.active=Math.max(0,S.active-1);renderAll();toast(`Deleted ${c}`)});
arm($('resetAll'),'Reset to sample data','Click again to reset',()=>{const v=S.view;S=sample();S.view=v;normalize();renderAll();toast('Sample data restored')});

$('copyCsv').addEventListener('click',()=>{
  const it=cur(),r=solve(it,S.view),B=r.B,rows=rowsFor(it);
  const q=v=>/[",\n]/.test(String(v))?`"${String(v).replace(/"/g,'""')}"`:v;
  const map={boh:r.boh,fc:r.fc,so:r.so,dem:r.dem,firm:r.firm,plan:r.plan,eoh:r.eoh,ss:r.ss,ssv:r.ss,gap:r.gap,rel:r.rel,cap:r.cap||[],util:(r.util||[]).map(v=>isFinite(v)?Math.round(v*100)+'%':'inf'),doc:r.doc.map(v=>isFinite(v)?Math.round(v):'inf'),st:r.st.map(s=>STLBL[s])};
  const lines=[[q(`${it.code} ${it.desc} (${it.uom}) - ${S.view}`),...B.map(b=>`${b.lab} ${b.sub}`)].join(',')];
  for(const row of rows)lines.push([q(row.name),...map[row.k].map(v=>typeof v==='number'?Math.round(v*100)/100:q(v))].join(','));
  const csv=lines.join('\n');
  const fallback=()=>{$('csvFallback').hidden=false;$('csvText').value=csv;$('csvText').focus();$('csvText').select();toast('Select all and copy the CSV below')};
  try{navigator.clipboard.writeText(csv).then(()=>{$('csvFallback').hidden=true;toast(`Copied ${S.view} CSV for ${it.code}`)},fallback)}catch(e){fallback()}
});
let toastT;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)}

renderAll();
if(location.hash==='#how'){const h=document.getElementById('how');if(h){h.open=true;h.scrollIntoView()}}
if(window.PSICloud)PSICloud.init({
  getState:()=>S,
  setState:d=>{const v=S.view;S=d;if(!VK[S.view])S.view=v;normalize();renderAll()},
  signedOut:()=>{S=loadLocal();normalize();renderAll();toast('Signed out. Showing demo data.')},
  toast
});
