import { GAMES,STAGED,MILESTONES } from './catalog.js';
import { migrate,gameProgress,completeMilestone,saveScore,totalMedals,badgeRow } from './progress.js';
import { tetris } from './games/tetris.js';
import { orchestra } from './games/orchestra.js';
import { context, button } from './core.js';
import { record, saveBest, clearRecords, favorites, write, read } from './storage.js';
import { mountLegacy } from './games/legacy.js';
import { town, forest, maze } from './games/exploration.js';
import { memory, roach, chameleon } from './games/challenges.js';
import { basketball } from './games/ball.js';
import { road } from './games/road.js';

const games=GAMES;
migrate();
const home=document.getElementById('home'),modal=document.getElementById('modal');
const play=document.getElementById('play'),status=document.getElementById('status'),tip=document.getElementById('tip');
const back=document.getElementById('back'),restart=document.getElementById('restart'),title=document.getElementById('title');
const registry={ town,forest,maze,memory,roach,chameleon,ball:basketball,car:road,tetris,orchestra,
  fruit:ctx=>mountLegacy(ctx,'fruit'),runner:ctx=>mountLegacy(ctx,'runner') };
const readSound=()=>read('road_sound',true)!==false;
let current=null,ctx=null,opener=null,toastTimer;
const selectedStages={};
function reset(){ctx?.dispose();ctx=null;play.replaceChildren();status.textContent='';tip.textContent='';}
function render(id){
  ctx=context(play,text=>{status.textContent=text},tip,{
    best:(key,value)=>{saveBest(key,value);saveScore(key,value)},score:key=>Math.max(record(key),gameProgress(key).score)
  });
  play.dataset.game=id;
  if(registry[id]){
    const progress=gameProgress(id),stage=Math.min(progress.completed+1,selectedStages[id]||progress.completed+1,5);
    ctx.stage=Math.max(1,stage);
    if(STAGED.includes(id)){
      const row=document.createElement('div');row.className='levelControls';
      const label=document.createElement('label');label.textContent='Missione ';const select=document.createElement('select');select.id='pathLevel';select.setAttribute('aria-label','Scegli la missione');label.append(select);row.append(label);
      for(let i=1;i<=Math.min(5,progress.completed+1);i++){const o=document.createElement('option');o.value=i;o.textContent=i+'/5';o.selected=i===ctx.stage;select.append(o)}
      select.onchange=()=>{selectedStages[id]=Number(select.value);reset();render(id)};play.append(row);
      const goal=document.createElement('p');goal.className='pathGoal';goal.textContent=MILESTONES[id][ctx.stage-1];play.append(goal);
    }
    const collection=document.createElement('div');collection.className='pathBadges';collection.append(badgeRow(progress.medals));play.append(collection);
    let offered=false;
    ctx.complete=level=>{
      const earned=completeMilestone(id,level);collection.replaceChildren(badgeRow(gameProgress(id).medals));renderCollection();
      if(earned>0){const toast=document.getElementById('rewardToast');toast.replaceChildren(badgeRow(gameProgress(id).medals));const text=document.createElement('p');text.textContent='Un nuovo Biscottino! Bravo, continua così!';toast.append(text);toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2800)}
      if(STAGED.includes(id)&&level===ctx.stage&&level<5&&!offered){offered=true;ctx.makeButton('Prossima missione',()=>{selectedStages[id]=level+1;reset();render(id)})}
    };
    registry[id](ctx);return;
  }
  if(id==='records'){
    status.textContent='La tua collezione: '+totalMedals()+'/60 Biscottini · Solo su questo dispositivo';
    const list=document.createElement('ul');list.className='recordList';
    for(const game of games){
      const item=document.createElement('li'),name=document.createElement('span'),value=document.createElement('strong');
      const progress=gameProgress(game.id);name.textContent=game.name;value.textContent=progress.score+' punti · '+(game.id==='tetris'?'Livelli ':'Missioni ')+progress.completed+'/'+(game.id==='tetris'?10:5);item.append(name,value,badgeRow(progress.medals));list.append(item);
    }
    play.append(list);return;
  }
  if(id==='favorites'){
    status.textContent='Scegli i giochi da ritrovare più facilmente';
    const saved=new Set(favorites());
    games.forEach(game=>{
      const row=document.createElement('div');row.className='favoriteRow';play.append(row);
      const open=button(row,game.name,()=>openGame(game.id,game.name),'btn');
      open.style.boxShadow='none';
      const toggle=button(row,saved.has(game.id)?'♥':'♡',()=>{
        if(saved.has(game.id))saved.delete(game.id);else saved.add(game.id);
        write('favorites',[...saved]);toggle.textContent=saved.has(game.id)?'♥':'♡';toggle.setAttribute('aria-pressed',saved.has(game.id));renderHome();
      });
      toggle.setAttribute('aria-label','Preferito: '+game.name);toggle.setAttribute('aria-pressed',saved.has(game.id));
    });return;
  }
  if(id==='settings'){
    status.textContent='Solo giochi, nessun account';
    const p=document.createElement('p');
    p.textContent='I record e i preferiti rimangono in questo browser. Non ci sono pubblicità o tracciamenti. Se lo spazio è esaurito o il browser blocca il salvataggio, i risultati possono restare solo per questa sessione.';
    play.append(p);
    const sound=ctx.makeButton('Suoni Corsa su Strada: '+(readSound()?'attivi':'spenti'),()=>{
      write('road_sound',!readSound());
      sound.textContent='Suoni Corsa su Strada: '+(readSound()?'attivi':'spenti');
    });
    const help=document.createElement('p');help.textContent='Aspetta “Pronta per giocare offline” prima di scollegarti. Il browser può liberare i dati del sito: se succede, riaprilo con una connessione.';play.append(help);return;
  }
}
function openGame(id,name){
  if(!current)opener=document.activeElement;
  reset();current={id,name};title.textContent=name;modal.inert=false;modal.classList.add('show');home.inert=true;
  document.body.style.overflow='hidden';modal.scrollTop=0;
  restart.hidden=!registry[id];render(id);back.focus();
}
function closeGame(){
  reset();current=null;modal.classList.remove('show');modal.inert=true;home.inert=false;document.body.style.overflow='';
  if(opener?.isConnected)opener.focus();else document.querySelector('.gameCard')?.focus();
}
function renderCollection(){
  const el=document.getElementById('collectionHome');el.replaceChildren();
  const img=document.createElement('img');img.src='./icons/biscottino.svg';img.alt='';el.append(img,document.createTextNode('La collezione di Biscotto: '+totalMedals()+' / 60'));
}
function renderHome(){
  const grid=document.getElementById('gameGrid'),saved=favorites();grid.replaceChildren();
  const coords=[[24,470,250,199],[283,470,248,199],[537,470,244,199],[787,470,225,199],[1018,470,238,199],[1261,470,251,199],[24,686,250,200],[283,686,248,200],[537,686,234,200],[775,686,237,200],[1018,686,237,200],[1261,686,251,200]];
  for(const game of games){
    const b=button(grid,'',()=>openGame(game.id,game.name),'gameCard illustratedHotspot');b.dataset.game=game.id;b.setAttribute('aria-label',game.name);
    const [x,y,w,h]=coords[game.tile];Object.assign(b.style,{left:x/1536*100+'%',top:y/1024*100+'%',width:w/1536*100+'%',height:h/1024*100+'%'});
    // Reuse the existing illustrated tile on mobile; home.png itself stays untouched.
    b.style.setProperty('--thumb-size',(1536/w*100)+'% '+(1024/h*100)+'%');
    b.style.setProperty('--thumb-position',(x/(1536-w)*100)+'% '+(y/(1024-h)*100)+'%');
    const name=document.createElement('span');name.textContent=(saved.includes(game.id)?'♥ ':'')+game.name;b.append(name);
    if(game.id==='orchestra'||game.id==='tetris'){b.classList.add('newGame');const art=document.createElement('span');art.className='newArt '+game.id;art.setAttribute('aria-hidden','true');if(game.id==='orchestra')art.textContent='♫';else for(let i=0;i<7;i++)art.append(document.createElement('i'));b.append(art)}
  }
  renderCollection();
}
const panorama=document.querySelector('.panorama');
for(const [id,direction] of [['panLeft',-1],['panRight',1]])document.getElementById(id).onclick=()=>panorama.scrollBy({left:direction*Math.max(200,panorama.clientWidth-30),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
back.onclick=closeGame;
restart.onclick=()=>{if(current){const id=current.id;reset();render(id);restart.focus()}};
document.querySelectorAll('.homeNav [data-go]').forEach(b=>b.onclick=()=>openGame(b.dataset.go,b.textContent));
window.addEventListener('keydown',e=>{
  if(!current)return;
  if(e.key==='Escape'){e.preventDefault();closeGame();return}
  if(e.key!=='Tab')return;
  const focusable=[...modal.querySelectorAll('button:not([disabled]),select,[tabindex="0"]')].filter(el=>!el.hidden&&el.getClientRects().length);
  const first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
});
renderHome();
