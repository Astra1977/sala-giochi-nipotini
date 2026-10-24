import { context, button } from './core.js';
import { record, saveBest, clearRecords, favorites, write, read } from './storage.js';
import { mountLegacy } from './games/legacy.js';
import { town, forest, baby, maze } from './games/exploration.js';
import { memory, roach, bubbles, chameleon } from './games/challenges.js';
import { basketball } from './games/ball.js';
import { road } from './games/road.js';

const games=[
  {name:'Acchiappa la Cucaracha',id:'roach',icon:'🪳',hint:'Riflessi e combo'},
  {name:'Salta la Cacca',id:'runner',icon:'🐱',hint:'Salta gli ostacoli'},
  {name:'Taglia la Frutta',id:'fruit',icon:'🍉',hint:'Scorri e taglia'},
  {name:'Memory',id:'memory',icon:'🧠',hint:'Trova le coppie'},
  {name:'Bolle Colorate',id:'bubbles',icon:'🫧',hint:'Tocca le bolle'},
  {name:'Mini Town',id:'town',icon:'🏘️',hint:'Esplora e aiuta la città'},
  {name:'La Macchina',id:'car',icon:'🏎️',hint:'Corsa su Strada · Andrea'},
  {name:'Avventura Foresta',id:'forest',icon:'🌲',hint:'Esplora e cerca'},
  {name:'Consegna il Bebè',id:'baby',icon:'👶',hint:'Trova la strada di casa'},
  {name:'Palla nel Cesto',id:'ball',icon:'🏀',hint:'Trascina, mira e tira'},
  {name:'Labirinto',id:'maze',icon:'🧩',hint:'Trova la via d’uscita'},
  {name:'Chameleon',id:'chameleon',icon:'🦎',hint:'Una sfida di colori'}
];
const home=document.getElementById('home'),modal=document.getElementById('modal');
const play=document.getElementById('play'),status=document.getElementById('status'),tip=document.getElementById('tip');
const back=document.getElementById('back'),restart=document.getElementById('restart'),title=document.getElementById('title');
const registry={ town,forest,baby,maze,memory,roach,bubbles,chameleon,ball:basketball,car:road,
  fruit:ctx=>mountLegacy(ctx,'fruit'),runner:ctx=>mountLegacy(ctx,'runner') };
const readSound=()=>read('road_sound',true)!==false;
let current=null,ctx=null,opener=null;
function reset(){ctx?.dispose();ctx=null;play.replaceChildren();status.textContent='';tip.textContent='';}
function render(id){
  ctx=context(play,text=>{status.textContent=text},tip,{best:saveBest,score:record});
  play.dataset.game=id;
  if(registry[id]){registry[id](ctx);return}
  if(id==='records'){
    status.textContent='I migliori risultati su questo dispositivo';
    const list=document.createElement('ul');list.className='recordList';
    for(const game of games){
      const item=document.createElement('li'),name=document.createElement('span'),value=document.createElement('strong');
      name.textContent=game.icon+' '+game.name;value.textContent=record(game.id)+' punti';item.append(name,value);list.append(item);
    }
    for(const [id,name] of [['easy','Facile'],['medium','Medio'],['hard','Difficile']]){
      const item=document.createElement('li');item.textContent='Memory '+name+': '+(record('memory_'+id)||'—')+' tentativi';list.append(item);
    }
    play.append(list);return;
  }
  if(id==='favorites'){
    status.textContent='Scegli i giochi da ritrovare più facilmente';
    const saved=new Set(favorites());
    games.forEach(game=>{
      const row=document.createElement('div');row.className='favoriteRow';play.append(row);
      const open=button(row,game.icon+' '+game.name,()=>openGame(game.id,game.name),'btn');
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
    ctx.makeButton('Cancella record locali',()=>{
      if(!confirm('Cancellare i record su questo dispositivo?'))return;
      clearRecords([...games.map(g=>g.id),'memory_easy','memory_medium','memory_hard']);
      status.textContent='Record locali cancellati';
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
function renderHome(){
  const grid=document.getElementById('gameGrid'),saved=favorites();grid.replaceChildren();
  const ordered=[...games].sort((a,b)=>Number(saved.includes(b.id))-Number(saved.includes(a.id)));
  ordered.forEach(game=>{
    const b=button(grid,'',()=>openGame(game.id,game.name),'gameCard');
    b.dataset.game=game.id;
    const symbol=document.createElement('span');symbol.className='symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=game.icon;
    const name=document.createElement('span');name.textContent=(saved.includes(game.id)?'♥ ':'')+game.name;
    const hint=document.createElement('small');hint.textContent=game.hint;b.append(symbol,name,hint);
  });
}
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
