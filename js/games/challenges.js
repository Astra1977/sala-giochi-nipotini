import { board, mission, button, shuffle, random } from '../core.js';
import { record, saveFewest } from '../storage.js';

export function memory(ctx) {
  const root=board(ctx), controls=document.createElement('div');controls.className='levelControls';root.append(controls);
  const label=document.createElement('label');label.textContent='Difficoltà ';label.htmlFor='memoryLevel';controls.append(label);
  const select=document.createElement('select');select.id='memoryLevel';
  for(const [value,text] of [['easy','Facile · 4 coppie'],['medium','Medio · 6 coppie'],['hard','Difficile · 10 coppie']]){
    const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);
  }
  controls.append(select);
  const grid=document.createElement('div');grid.className='grid';root.append(grid);
  let generation=0;
  function deal(){
    generation++;const round=generation,key='memory_'+select.value;
    const pairs={easy:4,medium:6,hard:10}[select.value];
    const symbols=shuffle(['🐼','🦁','🐧','🦊','🐱','🐸','🐙','🐝','🐬','🦋']).slice(0,pairs);
    const cards=shuffle([...symbols,...symbols]);let open=[],matched=0,moves=0,locked=false;
    grid.replaceChildren();grid.style.gridTemplateColumns='repeat(4,1fr)';
    const update=()=>ctx.info('Coppie '+matched+'/'+pairs+' · Tentativi '+moves+' · Record '+(record(key)||'—')+' tentativi');
    cards.forEach((symbol,i)=>{
      const b=button(grid,'❓',()=>{
        if(locked||b.disabled||open.some(o=>o.b===b))return;
        b.textContent=symbol;b.setAttribute('aria-label','Carta '+(i+1)+': '+symbol);b.setAttribute('aria-pressed','true');
        open.push({b,symbol});
        if(open.length===2){
          moves++;
          if(open[0].symbol===open[1].symbol){
            open.forEach(o=>{o.b.disabled=true;o.b.classList.add('matched')});
            matched++;open=[];
            if(matched===pairs){saveFewest(key,moves);ctx.best('memory',Math.max(1,300-moves*3));}
          }else{
            locked=true;const pending=open;open=[];
            ctx.delay(()=>{
              if(round!==generation)return;
              pending.forEach(o=>{o.b.textContent='❓';o.b.setAttribute('aria-label','Carta coperta');o.b.setAttribute('aria-pressed','false')});locked=false;
            },750);
          }
        }
        update();
        if(matched===pairs)ctx.info('🏆 Completato! '+moves+' tentativi · Record '+record(key));
      },'tile');
      b.setAttribute('aria-label','Carta '+(i+1)+' coperta');b.setAttribute('aria-pressed','false');
    });
    update();
  }
  select.onchange=deal;deal();
  ctx.tip.textContent='Scopri due carte alla volta. Ogni difficoltà conserva il minor numero di tentativi su questo dispositivo.';
}

export function roach(ctx) {
  const field=document.createElement('div');field.className='bubbleField';
  field.style.background='radial-gradient(circle,#d4ff9d,#50ae70)';ctx.play.append(field);
  let active=true,remaining=35,points=0,combo=0,boss=null,bossHits=0,defeated=0;
  const targets=new Set();
  const update=()=>ctx.info('⏱ '+remaining+' s · ⭐ '+points+' · Combo '+combo+' · Boss '+bossHits+'/5');
  const remove=b=>{targets.delete(b);b.remove()};
  const spawn=()=>{
    if(!active)return;
    // A boss remains the SAME target for all five hits and has its own HP.
    const roll=Math.random(),type=!boss&&roll<.22?'boss':roll<.49?'decoy':'roach';
    const decoy=type==='decoy'?shuffle(['ricky','bea','biscotto'])[0]:null;
    const b=document.createElement('button');b.className='target'+(type==='boss'?' boss':'');
    b.style.left=random(17,82)+'%';b.style.top=random(18,80)+'%';
    b.setAttribute('aria-label',decoy?'Non colpire '+decoy:type==='boss'?'Boss: 5 colpi rimasti':'Cucaracha');
    if(decoy){const img=document.createElement('img');img.src='./'+decoy+'.png';img.alt=decoy;img.className='avatarTarget';b.append(img)}
    else b.textContent=type==='boss'?'🪳👑':'🪳';
    let hp=5,health;
    if(type==='boss'){boss=b;bossHits=0;health=document.createElement('small');health.textContent='5 colpi';b.append(health)}
    field.append(b);targets.add(b);
    if(type!=='boss')ctx.delay(()=>remove(b),Math.max(650,1400-(35-remaining)*18));
    b.onclick=()=>{
      if(!active||!targets.has(b))return;
      if(decoy){points=Math.max(0,points-(decoy==='biscotto'?30:15));combo=0;remove(b)}
      else if(type==='boss'){
        hp--;bossHits=5-hp;combo++;points+=10;
        health.textContent=hp+' colpi';b.setAttribute('aria-label','Boss: '+hp+' colpi rimasti');
        if(!hp){points+=100;defeated++;remove(b);boss=null}
      }else{combo++;points+=10+Math.min(20,Math.floor(combo/3)*5);remove(b)}
      update();
    };
  };
  ctx.every(spawn,600);
  ctx.every(()=>{
    if(!active)return;
    remaining--;update();
    if(remaining<=0){
      active=false;ctx.best('roach',points);
      targets.forEach(b=>b.remove());targets.clear();
      ctx.info('🏆 '+points+' punti · Boss sconfitti '+defeated+' · Record '+ctx.score('roach'));
    }
  },1000);
  ctx.onCleanup(()=>{active=false});
  ctx.tip.textContent='🪳 +10 e combo · 👑 cinque colpi sullo stesso boss, bonus +100. Non colpire Ricky/Bea (−15) o Biscotto (−30).';
  spawn();update();
}

export function bubbles(ctx) {
  const root=board(ctx),label=mission(root),field=document.createElement('div');field.className='bubbleField';root.append(field);
  let level=1,popped=0,points=0,remaining=25,active=true,elapsed=0,spawnAt=0;
  const bubbles=new Set();
  const update=()=>{label.textContent='Livello '+level+' · Scoppia '+(level*8-popped)+' bolle per salire';ctx.info('⭐ '+points+' · ⏱ '+remaining+' s · Bolle '+popped)};
  const colors=['#f4808e','#ffda59','#7dd99a','#9d9cec','#83dff2'];
  const spawn=()=>{
    if(!active||bubbles.size>=9)return;
    const b=button(field,'✦',()=>{
      if(!active||!bubbles.has(b))return;
      bubbles.delete(b);b.remove();popped++;points+=level*5;
      if(popped>=level*8){level++;remaining+=8}
      update();
    },'bubble');
    const item={b,x:random(13,87),y:field.clientHeight+30,speed:35+level*12};
    b.style.left=item.x+'%';b.style.top=item.y+'px';b.style.background=colors[Math.floor(random(0,colors.length))];
    b.setAttribute('aria-label','Scoppia la bolla');
    // Keep a minimum 48px target at every difficulty.
    const size=Math.max(48,70-level*4);b.style.width=size+'px';b.style.height=size+'px';bubbles.add(b);
    b.item=item;
  };
  ctx.frames(dt=>{
    if(!active)return false;elapsed+=dt;
    if(elapsed>spawnAt){spawn();spawnAt=elapsed+Math.max(.22,.85-level*.09)}
    for(const b of bubbles){b.item.y-=b.item.speed*dt;b.style.top=b.item.y+'px';if(b.item.y < -45){b.remove();bubbles.delete(b)}}
  });
  ctx.every(()=>{
    if(!active)return;
    remaining--;update();
    if(remaining<=0){active=false;ctx.best('bubbles',points);field.replaceChildren();bubbles.clear();label.textContent='🫧 Partita terminata';ctx.info('🏆 '+points+' punti · Livello '+level+' · Record '+ctx.score('bubbles'))}
  },1000);
  ctx.tip.textContent='Tocca le bolle che salgono. Ogni 8 bolle sali di livello e ricevi tempo extra; le bolle diventano più veloci.';
  update();
}

const COLORS=[
  ['Rosso','#ed515a'],['Verde','#3bb974'],['Blu','#3683dc'],
  ['Giallo','#efc33e'],['Viola','#a06bdd'],['Arancione','#ed9340']
];
export function chameleon(ctx) {
  const root=board(ctx),label=mission(root),sample=document.createElement('div');
  sample.className='colorSwatch';sample.setAttribute('role','img');root.append(sample);
  const choices=document.createElement('div');choices.className='colorChoices';root.append(choices);
  let turn=0,level=1,points=0,target=0,time=12,active=true;
  const update=()=>ctx.info('Livello '+level+'/3 · Round '+(turn+1)+'/15 · ⏱ '+time+' s · ⭐ '+points);
  const next=()=>{
    level=1+Math.floor(turn/5);time=level===1?12:level===2?9:6;
    const pool=COLORS.slice(0,level===1?3:level===2?5:6);target=Math.floor(random(0,pool.length));
    sample.style.background=pool[target][1];sample.setAttribute('aria-label','Camaleonte '+pool[target][0]);
    label.textContent=level===1?'🦎 Trova il colore '+pool[target][0]:'🦎 Qual è il colore del camaleonte?';
    choices.replaceChildren();
    shuffle(pool).forEach(([name,color])=>{
      const b=button(choices,level===1?'● '+name:name,()=>{
        if(!active)return;
        if(name===pool[target][0]){points+=10*level+time;turn++;if(turn===15){finish('🌈 Quindici colori riconosciuti!');return}next()}
        else{points=Math.max(0,points-5);time=Math.max(0,time-2);if(!time){finish('⏰ Tempo scaduto');return}update()}
      },'');
      if(level===1){b.style.background=color;b.style.color=name==='Blu'?'white':'#142c36'}
      b.setAttribute('aria-label',name);
    });
    update();
  };
  const finish=message=>{
    active=false;ctx.best('chameleon',points);label.textContent=message;choices.querySelectorAll('button').forEach(b=>b.disabled=true);
    ctx.info('🏆 '+points+' punti · Record '+ctx.score('chameleon'));
  };
  ctx.every(()=>{if(active){time--;if(time<=0)finish('⏰ Tempo scaduto');else update()}},1000);
  next();
  ctx.tip.textContent='Riconosci il colore prima che scada il tempo. Ogni cinque risposte aumentano colori e difficoltà. Errore: −5 punti e −2 secondi.';
}
