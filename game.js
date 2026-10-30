(()=>{
const SUITS=['♠','♥','♦','♣'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const $=id=>document.getElementById(id);
let S,hist,moves,secs,tick,started;
let photos={};const urls=[];
const ORDER=(()=>{const o=[];for(const r of [13,12,11,1,10,9,8,7,6,5,4,3,2])for(let s=0;s<4;s++)o.push(s+'-'+r);return o})();

function applyTheme(){
  const b=document.body;
  if(!urls.length){b.classList.remove('themed');return}
  b.classList.add('themed');
  const img=new Image();
  img.crossOrigin='anonymous';
  img.onload=()=>{
    try{
      const c=document.createElement('canvas');c.width=32;c.height=32;
      const x=c.getContext('2d');x.drawImage(img,0,0,32,32);
      const d=x.getImageData(0,0,32,32).data;let r=0,g=0,bl=0,n=0;
      for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];bl+=d[i+2];n++}
      r=r/n|0;g=g/n|0;bl=bl/n|0;
      document.documentElement.style.setProperty('--theme-rgb',r+','+g+','+bl);
      document.documentElement.style.setProperty('--theme-mid','rgb('+Math.max(40,r*.45)+','+Math.max(60,g*.55)+','+Math.max(40,bl*.4)+')');
      document.documentElement.style.setProperty('--theme-dark','rgb('+Math.max(20,r*.25)+','+Math.max(35,g*.35)+','+Math.max(20,bl*.22)+')');
    }catch(e){}
  };
  img.src=urls[0];
}

function mapPhotos(){photos={};urls.slice(0,52).forEach((u,i)=>photos[ORDER[i]]=u);
  $('clear-photos').classList.toggle('hidden',!urls.length);applyTheme();}
const red=c=>c.s===1||c.s===2;
function newGame(){
  const d=[];for(let s=0;s<4;s++)for(let r=1;r<=13;r++)d.push({s,r,up:false});
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}
  S={stock:[],waste:[],f:[[],[],[],[]],t:[[],[],[],[],[],[],[]]};
  for(let c=0;c<7;c++)for(let k=0;k<=c;k++){const x=d.pop();x.up=k===c;S.t[c].push(x)}
  S.stock=d;hist=[];moves=0;secs=0;started=false;clearInterval(tick);
  $('win-dialog').classList.add('hidden');render();
}
const snap=()=>hist.push(JSON.stringify([S,moves]));
function startT(){if(!started){started=true;tick=setInterval(()=>{secs++;$('timer').textContent=fmt(secs)},1000)}}
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function pile(id){const[a,b]=id.split(':');return a==='f'?S.f[b]:a==='t'?S.t[b]:S[a]}
function canPlace(card,id,n){
  const[a,b]=id.split(':'),p=pile(id),top=p[p.length-1];
  if(a==='f')return n===1&&(top?top.s===card.s&&top.r===card.r-1:card.r===1);
  if(a==='t')return top?top.up&&red(top)!==red(card)&&top.r===card.r+1:card.r===13;
  return false;
}
function move(from,idx,to){
  snap();const src=pile(from),cards=src.splice(idx);pile(to).push(...cards);
  const t=src[src.length-1];if(t&&from[0]==='t')t.up=true;
  moves++;startT();render();checkWin();
}
function drawStock(){
  snap();
  if(S.stock.length){const c=S.stock.pop();c.up=true;S.waste.push(c)}
  else if(S.waste.length){S.stock=S.waste.reverse().map(c=>(c.up=false,c));S.waste=[]}
  else{hist.pop();return}
  moves++;startT();render();
}
function autoMove(from,idx){
  const src=pile(from),card=src[idx],n=src.length-idx;
  const targets=[...(n===1?[0,1,2,3].map(i=>'f:'+i):[]),...[0,1,2,3,4,5,6].map(i=>'t:'+i)].filter(x=>x!==from);
  for(const t of targets)if(canPlace(card,t,n)){move(from,idx,t);return true}
  return false;
}
function checkWin(){
  if(S.f.every(p=>p.length===13)){clearInterval(tick);
    $('win-summary').textContent=`ניצחת ב-${moves} מהלכים, בזמן ${fmt(secs)}`;$('win-dialog').classList.remove('hidden')}
}
function cardEl(c,from,idx){
  const e=document.createElement('div');e.className='card'+(c.up?'':' down')+(red(c)?' red':'');
  const l=RANKS[c.r-1]+SUITS[c.s];e.innerHTML=`<span class="tl">${l}</span><span class="c">${SUITS[c.s]}</span>`;
  const ph=c.up&&photos[c.s+'-'+c.r];if(ph){e.classList.add('photo');e.style.backgroundImage=`url("${ph}")`}
  e.dataset.from=from;e.dataset.idx=idx;return e;
}
function render(){
  const st=$('stock');st.querySelectorAll('.card').forEach(e=>e.remove());
  if(S.stock.length)st.appendChild(cardEl(S.stock[S.stock.length-1],'stock',S.stock.length-1));
  $('stock-count').textContent=S.stock.length||'↻';
  const w=$('waste');w.innerHTML='';if(S.waste.length)w.appendChild(cardEl(S.waste[S.waste.length-1],'waste',S.waste.length-1));
  const f=$('foundations');f.innerHTML='';
  S.f.forEach((p,i)=>{const e=document.createElement('div');e.className='pile foundation';e.dataset.suit=SUITS[i];e.dataset.drop='f:'+i;
    if(p.length)e.appendChild(cardEl(p[p.length-1],'f:'+i,p.length-1));f.appendChild(e)});
  const t=$('tableau');t.innerHTML='';
  S.t.forEach((p,i)=>{const col=document.createElement('div');col.className='col';col.dataset.drop='t:'+i;let y=0;
    p.forEach((c,k)=>{const e=cardEl(c,'t:'+i,k);e.style.top=`calc(${y})`;y+=`${k?' + ':''}var(${c.up?'--fan':'--fan-down'})`;
      if(!k)y='var('+(c.up?'--fan':'--fan-down')+')';col.appendChild(e)});t.appendChild(col)});
  $('moves').textContent=moves;$('timer').textContent=fmt(secs);
}
// pointer drag
let drag=null;
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest('.card');
  if(e.target.closest('#stock')){drawStock();return}
  if(!el||el.classList.contains('down'))return;
  const from=el.dataset.from,idx=+el.dataset.idx;if(from==='stock')return;
  const els=from[0]==='t'?[...el.parentNode.children].filter(c=>+c.dataset.idx>=idx):[el];
  drag={from,idx,els,x:e.clientX,y:e.clientY,moved:false,orig:els.map(c=>c.getBoundingClientRect())};
});
document.addEventListener('pointermove',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  if(!drag.moved){drag.moved=true;drag.els.forEach((c,i)=>{const r=drag.orig[i];c.classList.add('drag');
    Object.assign(c.style,{position:'fixed',left:r.left+'px',top:r.top+'px'});document.body.appendChild(c)})}
  drag.els.forEach((c,i)=>{const r=drag.orig[i];c.style.left=r.left+dx+'px';c.style.top=r.top+dy+'px'});
});
document.addEventListener('pointerup',e=>{
  if(!drag)return;const d=drag;drag=null;
  if(!d.moved){autoMove(d.from,d.idx);return}
  const hit=document.elementsFromPoint(e.clientX,e.clientY).map(x=>x.closest('[data-drop]')).find(Boolean);
  const to=hit&&hit.dataset.drop,card=pile(d.from)[d.idx];
  if(to&&to!==d.from&&canPlace(card,to,d.els.length))move(d.from,d.idx,to);else render();
});
$('undo').onclick=()=>{if(!hist.length)return;const[s,m]=JSON.parse(hist.pop());S=s;moves=m;render()};
$('add-photos').onclick=()=>$('photo-input').click();
$('photo-input').onchange=e=>{for(const f of e.target.files)if(f.type.startsWith('image/'))urls.push(URL.createObjectURL(f));e.target.value='';mapPhotos();render()};
$('clear-photos').onclick=()=>{urls.forEach(u=>URL.revokeObjectURL(u));urls.length=0;mapPhotos();render()};
$('new-game').onclick=newGame;$('play-again').onclick=newGame;
window.addEventListener('beforeunload',e=>{if(started&&moves&&!$('skip-leave-warning').checked){e.preventDefault();e.returnValue=''}});
newGame();
})();
