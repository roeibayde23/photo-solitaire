(()=>{
const SUITS=['♠','♥'],RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const $=id=>document.getElementById(id);
let S,hist,moves,secs,tick,started;
let photos={};const urls=[];
const ORDER=(()=>{const o=[];for(const r of [13,12,11,1,10,9,8,7,6,5,4,3,2])for(let s=0;s<2;s++)o.push(s+'-'+r);return o})();

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

function mapPhotos(){photos={};urls.slice(0,26).forEach((u,i)=>photos[ORDER[i]]=u);
  $('clear-photos').classList.toggle('hidden',!urls.length);applyTheme();}
const red=c=>c.s===1||c.s===2;
function newGame(){
  const d=[];for(let k=0;k<4;k++)for(let s=0;s<2;s++)for(let r=1;r<=13;r++)d.push({s,r,up:false});
  for(let i=d.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[d[i],d[j]]=[d[j],d[i]]}
  S={stock:[],f:[],t:[[],[],[],[],[],[],[],[],[],[]]};
  for(let c=0;c<10;c++){const n=c<4?6:5;for(let k=0;k<n;k++){const x=d.pop();x.up=k===n-1;S.t[c].push(x)}}
  S.stock=d;hist=[];moves=0;secs=0;started=false;clearInterval(tick);
  $('win-dialog').classList.add('hidden');render();
}
const snap=()=>hist.push(JSON.stringify([S,moves]));
function startT(){if(!started){started=true;tick=setInterval(()=>{secs++;$('timer').textContent=fmt(secs)},1000)}}
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function pile(id){const[a,b]=id.split(':');return a==='t'?S.t[b]:S[a]}
function movable(p,idx){if(!p[idx]||!p[idx].up)return false;
  for(let k=idx+1;k<p.length;k++)if(p[k].s!==p[idx].s||p[k].r!==p[k-1].r-1)return false;return true}
function canPlace(card,id){
  const[a]=id.split(':');if(a!=='t')return false;const p=pile(id),top=p[p.length-1];
  return !top||(top.up&&top.r===card.r+1);
}
function flipTops(){S.t.forEach(p=>{const t=p[p.length-1];if(t)t.up=true})}
function clearRuns(){
  S.t.forEach(p=>{if(p.length<13)return;const i=p.length-13;
    if(p[i].r===13&&movable(p,i)){S.f.push(p.splice(i));const t=p[p.length-1];if(t)t.up=true}});
}
function after(){clearRuns();flipTops();moves++;startT();render();checkWin()}
function move(from,idx,to){snap();const cards=pile(from).splice(idx);pile(to).push(...cards);after()}
function drawStock(){
  if(!S.stock.length)return;
  if(S.t.some(p=>!p.length)){alert('אי אפשר לחלק כשיש עמודה ריקה');return}
  snap();for(const p of S.t){const c=S.stock.pop();c.up=true;p.push(c)}after();
}
function autoMove(from,idx){
  const src=pile(from);if(!movable(src,idx))return false;const card=src[idx];
  const ts=[...Array(10).keys()].map(i=>'t:'+i).filter(x=>x!==from);
  const pick=ts.find(t=>pile(t).length&&canPlace(card,t)&&pile(t).at(-1).s===card.s)||ts.find(t=>pile(t).length&&canPlace(card,t))||(idx>0?ts.find(t=>!pile(t).length):null);
  if(pick){move(from,idx,pick);return true}return false;
}
function checkWin(){
  if(S.f.length===8){clearInterval(tick);
    $('win-summary').textContent=`ניצחת ב-${moves} מהלכים, בזמן ${fmt(secs)}`;$('win-dialog').classList.remove('hidden')}
}
function cardEl(c,from,idx){
  const e=document.createElement('div');e.className='card'+(c.up?'':' down')+(red(c)?' red':'');
  const l=RANKS[c.r-1]+SUITS[c.s];e.innerHTML=`<span class="tl">${l}</span><span class="c">${SUITS[c.s]}</span>`;
  const ph=c.up&&photos[c.s+'-'+c.r];if(ph){e.classList.add('photo');e.style.backgroundImage=`url("${ph}")`}
  e.dataset.from=from;e.dataset.idx=idx;return e;
}
function clearGhosts(){
  document.querySelectorAll('body > .card').forEach(e=>e.remove());
}
function render(){
  clearGhosts();
  const st=$('stock');st.querySelectorAll('.card').forEach(e=>e.remove());
  if(S.stock.length)st.appendChild(cardEl(S.stock[S.stock.length-1],'stock',S.stock.length-1));
  $('stock-count').textContent=S.stock.length?Math.ceil(S.stock.length/10):'';
  const f=$('foundations');f.innerHTML='';
  for(let i=0;i<8;i++){const p=S.f[i]||[];const e=document.createElement('div');e.className='pile foundation';e.dataset.suit=p.length?'':'K';
    if(p.length)e.appendChild(cardEl(p[0],'f:'+i,0));f.appendChild(e)}
  const t=$('tableau');t.innerHTML='';
  S.t.forEach((p,i)=>{
    const col=document.createElement('div');col.className='col';col.dataset.drop='t:'+i;
    let parts=[];
    p.forEach((c,k)=>{
      const e=cardEl(c,'t:'+i,k);
      if(k===0){e.style.top='0px';parts=['0px']}
      else{parts.push(`var(${p[k-1].up?'--fan':'--fan-down'})`);e.style.top=`calc(${parts.join(' + ')})`}
      col.appendChild(e);
    });
    t.appendChild(col);
  });
  $('moves').textContent=moves;$('timer').textContent=fmt(secs);
}
// pointer drag
let drag=null;
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest('.card');
  if(e.target.closest('#stock')){drawStock();return}
  if(!el||el.classList.contains('down'))return;
  const from=el.dataset.from,idx=+el.dataset.idx;if(from[0]!=='t'||!movable(pile(from),idx))return;
  const els=from[0]==='t'?[...el.parentNode.children].filter(c=>+c.dataset.idx>=idx):[el];
  drag={from,idx,els,x:e.clientX,y:e.clientY,moved:false,orig:els.map(c=>c.getBoundingClientRect()),pid:e.pointerId};
  try{el.setPointerCapture(e.pointerId)}catch(_){}
});
document.addEventListener('pointermove',e=>{
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.moved&&Math.hypot(dx,dy)<6)return;
  if(!drag.moved){drag.moved=true;drag.els.forEach((c,i)=>{const r=drag.orig[i];c.classList.add('drag');
    Object.assign(c.style,{position:'fixed',left:r.left+'px',top:r.top+'px',margin:0,zIndex:2000+i});document.body.appendChild(c)})}
  drag.els.forEach((c,i)=>{const r=drag.orig[i];c.style.left=(r.left+dx)+'px';c.style.top=(r.top+dy)+'px'});
});
function endDrag(e){
  if(!drag)return;const d=drag;drag=null;
  if(!d.moved){autoMove(d.from,d.idx)||render();return}
  // Always clear floating cards first, then apply move or redraw
  clearGhosts();
  const hit=document.elementsFromPoint(e.clientX,e.clientY).map(x=>x.closest('[data-drop]')).find(Boolean);
  const to=hit&&hit.dataset.drop,card=pile(d.from)[d.idx];
  if(card&&to&&to!==d.from&&canPlace(card,to))move(d.from,d.idx,to);else render();
}
document.addEventListener('pointerup',endDrag);
document.addEventListener('pointercancel',endDrag);
$('undo').onclick=()=>{if(!hist.length)return;const[s,m]=JSON.parse(hist.pop());S=s;moves=m;clearGhosts();render()};
$('add-photos').onclick=()=>$('photo-input').click();
$('photo-input').onchange=e=>{for(const f of e.target.files)if(f.type.startsWith('image/'))urls.push(URL.createObjectURL(f));e.target.value='';mapPhotos();render()};
$('clear-photos').onclick=()=>{urls.forEach(u=>URL.revokeObjectURL(u));urls.length=0;mapPhotos();render()};
$('new-game').onclick=newGame;$('play-again').onclick=newGame;
window.addEventListener('beforeunload',e=>{if(started&&moves&&!$('skip-leave-warning').checked){e.preventDefault();e.returnValue=''}});
newGame();
})();
