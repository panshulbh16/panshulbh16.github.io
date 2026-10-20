/* PSI Planning Grid solver: pure functions, no DOM. Loaded as a classic script; also exported for Node tests. */
const NF=new Intl.NumberFormat('en-IN',{maximumFractionDigits:2});
const DF=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',timeZone:'UTC'});
const MF=new Intl.DateTimeFormat('en-US',{month:'short',timeZone:'UTC'});
const fmt=n=>NF.format(Math.round(n*100)/100+0);
const num=v=>{if(typeof v==='number')return isFinite(v)?v:0;const x=parseFloat(String(v??'').replace(/[,\s]/g,''));return isFinite(x)?x:0};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rep=(n,v)=>Array.from({length:n},()=>v);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad2=n=>String(n).padStart(2,'0');
const VK={weekly:'wk',monthly:'mo'};
const LIM={weekly:[4,52],monthly:[3,24]};
const STLBL={ok:'OK',low:'Below SS',out:'Stockout',excess:'Excess'};
const LOTLBL={L4L:'Lot-for-lot',FOQ:'Fixed order qty',FDS:'Fixed days supply',MINMAX:'Min–max'};
const CONLBL={GREATER:'greater of forecast and orders',FC:'forecast only',SO:'sales orders only',SUM:'forecast + orders'};
const SSLBL={USER:'User-defined',DOC:'Days of cover',STAT:'Statistical'};

function defaults(){return{lotRule:'L4L',foq:0,fdsDays:14,minInv:0,maxInv:0,moq:0,maxOq:0,flm:0,roundQty:true,
  preLT:0,procLT:7,postLT:0,ssMethod:'USER',ssDays:14,svc:95,dtf:14,ptf:7,rtf:7,consume:'GREATER',shrink:0,
  yield:100,autoPlan:true,includeFirm:true,constrained:false,buildAhead:true,excessDays:60}}
function plan(start,n,fc,so,firm,ss,cap){return{start,n,fc,so,firm,ss,cap}}
const z12=()=>rep(12,0);
function sample(){return{view:'weekly',active:0,items:[
  {code:'FG-1001',desc:'Steel mounting bracket 40 mm',uom:'EA',boh:1200,
   p:Object.assign(defaults(),{lotRule:'L4L',flm:500,preLT:1,procLT:14,postLT:1,ssMethod:'USER',dtf:14,ptf:7,rtf:14,excessDays:60}),
   wk:plan('2026-10-19',12,[320,340,360,410,380,350,400,430,390,360,340,330],[340,300,220,150,80,40,0,0,0,0,0,0],[0,800,0,0,0,600,0,0,0,0,0,0],rep(12,500),rep(12,700)),
   mo:plan('2026-10',12,[1450,1520,1600,1380,1500,1650,1700,1620,1550,1480,1600,1700],[1300,700,250,0,0,0,0,0,0,0,0,0],[800,1200,0,0,1000,0,0,0,0,0,0,0],rep(12,600),rep(12,2500))},
  {code:'FG-2040',desc:'Hydraulic hose assembly 3/8"',uom:'EA',boh:260,
   p:Object.assign(defaults(),{lotRule:'FOQ',foq:120,preLT:2,procLT:14,postLT:1,ssMethod:'DOC',ssDays:10,yield:95,constrained:true,buildAhead:true,dtf:7,ptf:14,rtf:7,excessDays:45}),
   wk:plan('2026-10-19',12,[90,85,110,95,100,120,105,90,420,130,110,95],[140,80,60,30,10,0,0,0,0,0,0,0],[0,240,0,0,0,0,0,0,0,0,0,0],rep(12,150),rep(12,260)),
   mo:plan('2026-10',12,[430,450,520,480,500,560,470,440,900,520,480,450],[400,200,50,0,0,0,0,0,0,0,0,0],[480,240,0,0,0,0,0,0,0,0,0,0],rep(12,150),rep(12,700))},
  {code:'RM-0310',desc:'Polypropylene resin, natural',uom:'KG',boh:4800,
   p:Object.assign(defaults(),{lotRule:'MINMAX',minInv:2500,maxInv:7000,moq:1000,maxOq:2500,preLT:2,procLT:21,postLT:3,ssMethod:'STAT',svc:97.5,shrink:2,dtf:7,ptf:7,rtf:14,excessDays:90}),
   wk:plan('2026-10-19',12,[600,620,580,650,700,640,610,590,660,700,680,620],[580,500,300,100,0,0,0,0,0,0,0,0],[0,0,3000,0,0,0,0,0,2000,0,0,0],rep(12,1500),rep(12,5000)),
   mo:plan('2026-10',12,[2650,2700,2800,2600,2900,3000,2750,2700,2850,2950,3000,2800],[2400,1200,300,0,0,0,0,0,0,0,0,0],[3000,0,0,2000,0,0,0,0,0,0,0,0],rep(12,1500),rep(12,15000))}
]}}
function isoWeek(d){const t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return{w:Math.ceil(((t-y0)/864e5+1)/7),y:t.getUTCFullYear()}}
function buckets(view,D){
  const out=[];
  if(view==='weekly'){const [y,m,d]=D.start.split('-').map(Number);
    for(let i=0;i<D.n;i++){const dt=new Date(Date.UTC(y,m-1,d+7*i));const iw=isoWeek(dt);out.push({lab:'W'+pad2(iw.w),sub:DF.format(dt),yr:iw.y,days:7,startDay:7*i})}}
  else{const [y,m]=D.start.split('-').map(Number);let day=0;
    for(let i=0;i<D.n;i++){const dt=new Date(Date.UTC(y,m-1+i,1));const days=new Date(Date.UTC(y,m+i,0)).getUTCDate();
      out.push({lab:MF.format(dt),sub:String(dt.getUTCFullYear()),yr:dt.getUTCFullYear(),days,startDay:day});day+=days}}
  return out;
}

function invNorm(p){
  const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],
  b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],
  c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],
  d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  const pl=0.02425;let q,r;
  if(p<pl){q=Math.sqrt(-2*Math.log(p));return(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
  if(p<=1-pl){q=p-.5;r=q*q;return(((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
  q=Math.sqrt(-2*Math.log(1-p));return-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
}

/* ---------- solver ---------- */
function solve(it,view){
  const P=it.p,D=it[VK[view]],B=buckets(view,D),n=B.length;
  const fence=d=>B.filter(b=>b.startDay<num(d)).length;
  const dtfB=fence(P.dtf),ptfB=fence(P.ptf),rtfB=fence(P.rtf);
  const shrink=clamp(num(P.shrink)/100,0,.9),yld=clamp((num(P.yield)||100)/100,.01,1);
  const LT=Math.max(0,num(P.preLT))+Math.max(0,num(P.procLT))+Math.max(0,num(P.postLT));
  const R=!!P.roundQty,up=v=>R?Math.ceil(v-1e-9)+0:v,dn=v=>R?Math.floor(v+1e-9)+0:v;
  const fc=[],so=[],dem=[],firm=[];
  for(let i=0;i<n;i++){
    const f=num(D.fc[i]),o=num(D.so[i]);
    const base=i<dtfB?o:P.consume==='FC'?f:P.consume==='SO'?o:P.consume==='SUM'?f+o:Math.max(f,o);
    fc.push(f);so.push(o);dem.push(up(base/(1-shrink)));firm.push(P.includeFirm?num(D.firm[i]):0);
  }
  let ss,z=null,sigma=null;
  if(P.ssMethod==='DOC')ss=B.map((b,i)=>{let sd=0,sy=0;for(let j=i;j<Math.min(n,i+4);j++){sd+=dem[j];sy+=B[j].days}return up(sy?sd/sy*num(P.ssDays):0)});
  else if(P.ssMethod==='STAT'){const m=dem.reduce((a,v)=>a+v,0)/n;sigma=n>1?Math.sqrt(dem.reduce((a,v)=>a+(v-m)**2,0)/(n-1)):0;
    z=invNorm(clamp(num(P.svc)/100,.5,.9999));ss=B.map(b=>up(Math.max(0,z*sigma*Math.sqrt(Math.max(LT,b.days)/b.days))))}
  else ss=B.map((b,i)=>num(D.ss[i]));
  const cap=P.constrained?B.map((b,i)=>Math.max(0,num(D.cap[i]))):null;
  const lot=P.lotRule,foq=num(P.foq),flm=num(P.flm),moq=num(P.moq),mxo=num(P.maxOq);
  const extra=rep(n,0),skip=new Set(),unit=flm>0?flm:(lot==='FOQ'&&foq>0?foq:0);

  function pass(){
    const o={boh:[],plan:[],eoh:[],capShort:[],reason:[],cnt:[]};let b=num(it.boh);
    for(let i=0;i<n;i++){
      const f=firm[i],d=dem[i],s=ss[i],x=extra[i],proj=b+f+x-d;
      const trig=lot==='MINMAX'?Math.max(s,num(P.minInv)):s;
      let q=0,reason='';
      if(proj<trig-1e-9){
        if(!P.autoPlan)reason='off';
        else if(i<ptfB)reason='ptf';
        else{
          let net=s-proj;
          if(lot==='MINMAX')net=Math.max(num(P.maxInv),trig)-proj;
          else if(lot==='FDS'){const end=B[i].startDay+Math.max(1,num(P.fdsDays));let k=i;while(k+1<n&&B[k+1].startDay<end)k++;
            let add=0;for(let j=i+1;j<=k;j++)add+=dem[j]-firm[j];net=Math.max(net,ss[k]+add-proj)}
          if(lot==='FOQ'&&foq>0)net=Math.ceil(net/foq-1e-9)*foq;
          if(moq>0)net=Math.max(net,moq);
          if(flm>0)net=Math.ceil(net/flm-1e-9)*flm;
          q=up(net);
          if(cap){const avail=Math.max(0,cap[i]-f-x);
            if(q>avail+1e-9){let c=avail;if(flm>0)c=Math.floor(c/flm+1e-9)*flm;else if(lot==='FOQ'&&foq>0)c=Math.floor(c/foq+1e-9)*foq;
              q=Math.max(0,dn(c));if(proj+q<s-1e-9)reason='cap'}}
        }
      }
      const e=proj+q;
      o.boh.push(b);o.plan.push(x+q);o.eoh.push(e);
      o.reason.push(e<s-1e-9?reason:'');o.capShort.push(reason==='cap'?Math.max(0,s-e):0);
      o.cnt.push((q>0?(mxo>0?Math.ceil(q/mxo-1e-9):1):0)+(x>1e-9?1:0));
      b=e;
    }
    return o;
  }
  let r=pass();
  if(cap&&P.buildAhead&&P.autoPlan){
    for(let k=0;k<300;k++){
      const i=r.capShort.findIndex((v,j)=>v>1e-9&&!skip.has(j));if(i<0)break;
      let need=r.capShort[i],moved=false;
      for(let j=i-1;j>=ptfB&&need>1e-9;j--){const spare=dn(cap[j]-firm[j]-r.plan[j]);if(spare>1e-9){let add=Math.min(spare,need);if(unit>0)add=Math.min(Math.ceil(add/unit-1e-9)*unit,Math.floor(spare/unit+1e-9)*unit);if(add>1e-9){extra[j]+=add;need-=add;moved=true}}}
      if(!moved)skip.add(i);
      r=pass();
    }
  }
  const rel=rep(n,0),orders=[];
  for(let i=0;i<n;i++){const q=r.plan[i];if(q<=1e-9)continue;
    const rd=B[i].startDay-LT;let idx=0;for(let k=0;k<n;k++)if(B[k].startDay<=rd)idx=k;
    const start=up(q/yld);rel[idx]+=start;
    orders.push({due:i,rel:idx,late:rd<0?-rd:0,qty:q,start,count:r.cnt[i],built:extra[i]})}
  const doc=[],st=[],util=[],gap=[];const xs=num(P.excessDays);
  for(let i=0;i<n;i++){
    let sd=0,sy=0;for(let j=i+1;j<=Math.min(n-1,i+4);j++){sd+=dem[j];sy+=B[j].days}if(!sy){sd=dem[i];sy=B[i].days}
    const daily=sd/sy,e=r.eoh[i];
    doc.push(daily>0?e/daily:(e>0?Infinity:0));gap.push(e-ss[i]);
    st.push(e<-1e-9?'out':e<ss[i]-1e-9?'low':(xs>0&&doc[i]>xs)?'excess':'ok');
    util.push(cap?(cap[i]>0?(firm[i]+r.plan[i])/cap[i]:(firm[i]+r.plan[i]>0?Infinity:0)):null);
  }
  return{B,n,dtfB,ptfB,rtfB,LT,z,sigma,yld,fc,so,dem,firm,ss,cap,rel,orders,doc,st,util:cap?util:null,gap,boh:r.boh,plan:r.plan,eoh:r.eoh,reason:r.reason};
}
const worst=st=>st.includes('out')?'out':st.includes('low')?'low':st.includes('excess')?'excess':'ok';

function messages(it,r){
  const u=esc(it.uom),B=r.B,L=i=>B[i].lab,ex=[];
  for(const o of r.orders){
    const split=o.count>1?` as ${o.count} orders`:'',ys=r.yld<1?`, start qty ${fmt(o.start)} at ${fmt(r.yld*100)}% yield`:'';
    if(o.late)ex.push({c:'out',i:o.due,t:`<b>Past due release.</b> Planned order ${fmt(o.qty)} ${u} due ${L(o.due)} should have been released ${fmt(o.late)} days before the horizon start (lead time ${fmt(r.LT)} days). Expedite.`});
    else if(o.rel<r.rtfB)ex.push({c:'rel',i:o.rel,t:`<b>Release now.</b> Planned order ${fmt(o.qty)} ${u}${split}, due ${L(o.due)}${ys}.`});
    else ex.push({c:'plan',i:o.rel,t:`<b>Planned order</b> ${fmt(o.qty)} ${u}${split}: release ${L(o.rel)}, due ${L(o.due)}${ys}.`});
    if(o.built>1e-9)ex.push({c:'cap',i:o.due,t:`<b>Build ahead.</b> ${fmt(o.built)} ${u} pulled into ${L(o.due)} to cover a later capacity shortfall.`});
  }
  const used=new Set();
  for(let i=0;i<r.n;i++){
    const e=r.eoh[i],s=r.ss[i];
    if(r.cap&&r.firm[i]>r.cap[i]+1e-9)ex.push({c:'cap',i,t:`<b>Capacity overload.</b> Firm supply ${fmt(r.firm[i])} ${u} exceeds capacity ${fmt(r.cap[i])}.`});
    if(e>=s-1e-9)continue;
    const why=r.reason[i]==='ptf'?' Inside the planning time fence, so no planned order was created.':r.reason[i]==='cap'?` Capacity limits supply to ${fmt(r.cap[i])} ${u}.`:r.reason[i]==='off'?' Planned orders are switched off.':'';
    if(e<0)ex.push({c:'out',i,t:`<b>Stockout.</b> Ending on hand ${fmt(e)} ${u}; ${fmt(s-e)} ${u} needed to restore safety stock.${why}`});
    else ex.push({c:'low',i,t:`<b>Below safety stock</b> by ${fmt(s-e)} ${u} (ending ${fmt(e)} vs ${fmt(s)}).${why}`});
    const j=r.firm.findIndex((f,k)=>k>i&&f>0&&!used.has(k));
    if(j>0){used.add(j);ex.push({c:'resch',i,t:`<b>Reschedule in</b> firm supply ${fmt(r.firm[j])} ${u} from ${L(j)} to ${L(i)}.`})}
  }
  for(let j=0;j<r.n;j++){const f=r.firm[j];if(f<=0||used.has(j))continue;
    let k=-1,viaPlan=false;
    for(let m=j;m<r.n;m++){if(m>j&&r.plan[m]>1e-9){k=m;viaPlan=true;break}if(r.eoh[m]-f<r.ss[m]-1e-9){k=m;break}}
    if(k===j)continue;
    if(k<0)ex.push({c:'excess',i:j,t:`<b>Cancel or defer</b> firm supply ${fmt(f)} ${u} in ${L(j)}. It isn't needed to hold safety stock within the horizon.`});
    else ex.push({c:'resch',i:j,t:`<b>Reschedule out</b> firm supply ${fmt(f)} ${u} from ${L(j)} to ${L(k)}${viaPlan?', where it can replace the planned order':''}.`});
  }
  for(let i=0;i<r.n;i++){if(r.st[i]!=='excess')continue;let k=i;while(k+1<r.n&&r.st[k+1]==='excess')k++;
    const mx=Math.max(...r.doc.slice(i,k+1));
    ex.push({c:'excess',i,t:`<b>Excess</b> ${k>i?`${L(i)}–${L(k)}`:L(i)}: up to ${mx===Infinity?'unlimited':fmt(Math.round(mx))} days of cover against the ${fmt(num(it.p.excessDays))}-day limit.`});i=k}
  const ord={out:0,low:1,rel:2,resch:3,cap:4,plan:5,excess:6};
  return ex.sort((a,b)=>a.i-b.i||ord[a.c]-ord[b.c]);
}
if(typeof module!=="undefined")module.exports={fmt,num,clamp,rep,esc,VK,LIM,STLBL,LOTLBL,CONLBL,SSLBL,defaults,plan,sample,isoWeek,buckets,invNorm,solve,worst,messages};
