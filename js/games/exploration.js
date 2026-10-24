import { board, mission, movement, button, shuffle } from '../core.js';

// A compact tile world: swipe, direction buttons and keyboard share one move path.
function world(ctx, parent, size) {
  const grid = document.createElement('div'); grid.className = 'boardMap';
  grid.style.gridTemplateColumns = 'repeat(' + size + ',1fr)';
  grid.setAttribute('role', 'img');
  parent.append(grid);
  const cells = Array.from({ length:size*size }, (_, i) => {
    const cell = document.createElement('div'); cell.className = 'mapCell';
    cell.dataset.x = i % size; cell.dataset.y = Math.floor(i / size);
    grid.append(cell); return cell;
  });
  return {
    grid, cells,
    draw(position, tile) {
      cells.forEach((cell, i) => {
        const x = i % size, y = Math.floor(i / size), value = tile(x,y);
        const player = position.x === x && position.y === y;
        cell.className = 'mapCell ' + value.className + (player ? ' player' : '');
        cell.textContent = player ? '🐱' : value.text;
        cell.dataset.tile = value.type || '';
      });
      grid.setAttribute('aria-label', 'Mappa: gatto in colonna ' + (position.x+1) + ', riga ' + (position.y+1));
    }
  };
}
const inside = (x,y,size) => x > 0 && y > 0 && x < size-1 && y < size-1;
const same = (a,b) => a.x === b.x && a.y === b.y;

export function town(ctx) {
  const root = board(ctx), label = mission(root), map = world(ctx,root,9);
  let pos = {x:4,y:7}, step = 0, points = 0, finished = false, moves = 0;
  const places = [
    {x:1,y:1,emoji:'🏪',name:'Negozio'}, {x:7,y:1,emoji:'🏫',name:'Scuola'},
    {x:1,y:7,emoji:'🏠',name:'Casa'}, {x:7,y:7,emoji:'🌳',name:'Parco'},
    {x:4,y:1,emoji:'🏥',name:'Ospedale'}, {x:7,y:4,emoji:'🏖️',name:'Spiaggia'}
  ];
  const quests = [
    [0,'Raccogli la merenda al negozio.'], [1,'Porta la merenda a scuola.'],
    [2,'Prendi il pallone a casa.'], [3,'Porta il pallone al parco.'],
    [4,'Ritira la borsa del dottore in ospedale.'], [5,'Porta la borsa alla spiaggia.']
  ];
  const walls = new Set(['2,3','3,3','5,3','6,3','2,5','3,5','5,5','6,5']);
  const draw = () => {
    map.draw(pos,(x,y) => {
      const place = places.find(p => p.x===x && p.y===y);
      if (!inside(x,y,9) || walls.has(x+','+y)) return {text:'🌲',className:'wall',type:'wall'};
      return {text:place?.emoji || '',className:place?'visited':'road',type:place?'place':'path'};
    });
    label.textContent = finished ? '🎉 Hai aiutato tutta la città!' : 'Missione '+(step+1)+'/6: '+quests[step][1];
    ctx.info('⭐ '+points+' · Passi '+moves+' · Zaino: '+(['vuoto','🥪','vuoto','⚽','vuoto','👜'][step] || 'vuoto'));
  };
  const move = (dx,dy) => {
    if (finished) return;
    const next = {x:pos.x+dx,y:pos.y+dy};
    if (!inside(next.x,next.y,9) || walls.has(next.x+','+next.y)) return;
    pos = next; moves++;
    if (same(pos,places[quests[step][0]])) {
      points+=20; step++;
      if (step===quests.length) {
        finished=true; points+=Math.max(0,120-moves);
        ctx.best('town',points);
      }
    }
    draw();
    if (finished) ctx.info('🏆 Missioni completate · '+points+' punti · Record '+ctx.score('town'));
  };
  movement(ctx,root,move,map.grid); draw();
  ctx.tip.textContent = 'Esplora le strade con frecce o swipe. Entra negli edifici per raccogliere e consegnare gli oggetti.';
}

export function forest(ctx) {
  const root=board(ctx), label=mission(root);
  let level=1, points=0, finished=false, pos, objects, found, visited, walls, map;
  const startLevel=() => {
    root.querySelector('.boardMap')?.remove();
    pos={x:1,y:1}; found=0; visited=new Set(); finished=false;
    walls=new Set(['3,2','3,3','3,4','5,4','5,5','5,6']);
    const spots=shuffle([{x:7,y:1},{x:1,y:7},{x:7,y:7},{x:4,y:7},{x:6,y:2},{x:2,y:5}]);
    objects=spots.slice(0,level+2).map((p,i)=>({...p,emoji:['🍄','🌺','🦋','🪶','🍓'][i],collected:false}));
    map=world(ctx,root,9);
    root.insertBefore(map.grid,root.querySelector('.dpad'));
    // The swipe listeners are tied to each current map; all are removed on exit.
    let from;
    ctx.listen(map.grid,'pointerdown',e=>{from={x:e.clientX,y:e.clientY};map.grid.setPointerCapture(e.pointerId)});
    ctx.listen(map.grid,'pointerup',e=>{
      if(!from)return;const dx=e.clientX-from.x,dy=e.clientY-from.y;from=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;
      if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy));
    });
    ctx.listen(map.grid,'pointercancel',()=>{from=null});
    draw();
  };
  const draw=() => {
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)visited.add((pos.x+dx)+','+(pos.y+dy));
    map.draw(pos,(x,y)=>{
      if(!visited.has(x+','+y))return {text:'🌲',className:'wall',type:'fog'};
      if(!inside(x,y,9)||walls.has(x+','+y))return {text:'🌳',className:'wall',type:'wall'};
      const object=objects.find(o=>!o.collected&&o.x===x&&o.y===y);
      return {text:object?.emoji||'·',className:'visited',type:object?'object':'path'};
    });
    label.textContent='Livello '+level+'/3 · Cerca '+objects.filter(o=>!o.collected).map(o=>o.emoji).join(' ');
    ctx.info('⭐ '+points+' · Oggetti '+found+'/'+objects.length);
  };
  const move=(dx,dy)=>{
    if(finished)return;const x=pos.x+dx,y=pos.y+dy;
    if(!inside(x,y,9)||walls.has(x+','+y))return;pos={x,y};
    const object=objects.find(o=>!o.collected&&same(o,pos));
    if(object){object.collected=true;found++;points+=20*level}
    draw();
    if(found===objects.length){
      finished=true;ctx.best('forest',points);
      if(level<3){
        label.textContent='🌟 Radura esplorata!';
        const next=button(root,'Esplora la prossima radura',()=>{next.remove();level++;startLevel()});
      }else{label.textContent='🏆 Tutta la foresta esplorata!';ctx.info('⭐ '+points+' · Record '+ctx.score('forest'))}
    }
  };
  movement(ctx,root,move);
  startLevel();
  ctx.tip.textContent='La foresta si rivela camminando. Cerca gli oggetti nascosti nelle tre radure: usa frecce o swipe.';
}

export function baby(ctx) {
  const root=board(ctx),label=mission(root),map=world(ctx,root,9);
  const depot={x:1,y:7}, homes=[{x:7,y:1},{x:7,y:7},{x:1,y:1}];
  const walls=new Set(['3,3','4,3','5,3','3,5','4,5','5,5']);
  let pos={...depot},carrying=true,deliveries=0,level=1,points=0,finished=false,moves=0,bumps=0;
  const hazards=()=>[{x:2+(moves%(4+level)),y:2},{x:6-((moves+2)%(4+level)),y:6}];
  const draw=()=>{
    map.draw(pos,(x,y)=>{
      if(!inside(x,y,9)||walls.has(x+','+y))return {text:'🌳',className:'wall',type:'wall'};
      if(hazards().some(h=>h.x===x&&h.y===y))return {text:'🛴',className:'danger',type:'hazard'};
      if(x===depot.x&&y===depot.y)return {text:'👶',className:'visited',type:'depot'};
      const house=homes.findIndex(h=>h.x===x&&h.y===y);
      return {text:house<0?'':house===deliveries%3?'🏡':'🏠',className:'road',type:house<0?'path':'home'};
    });
    const target=homes[deliveries%3];
    label.textContent=carrying?'Porta il bebè alla 🏡 (colonna '+(target.x+1)+', riga '+(target.y+1)+').':'Torna a 👶 per prendere un altro bebè.';
    ctx.info('Livello '+level+'/3 · Consegne '+deliveries+'/9 · ⭐ '+points+' · Zaino '+(carrying?'👶':'vuoto'));
  };
  const move=(dx,dy)=>{
    if(finished)return;const next={x:pos.x+dx,y:pos.y+dy};
    if(!inside(next.x,next.y,9)||walls.has(next.x+','+next.y))return;
    const before=hazards();moves++;pos=next;
    let bumped=before.concat(hazards()).some(h=>same(h,pos));
    if(bumped){pos={...depot};bumps++;points=Math.max(0,points-5)}
    if(!carrying&&same(pos,depot))carrying=true;
    if(carrying&&same(pos,homes[deliveries%3])){
      carrying=false;deliveries++;points+=25*level;
      level=Math.min(3,1+Math.floor(deliveries/3));
      ctx.best('baby',points);
      if(deliveries===9)finished=true;
    }
    draw();
    if(bumped)ctx.info('🛴 Strada occupata: riparti dal nido. −5 punti · Urti '+bumps);
    if(finished){label.textContent='🏆 Nove bebè arrivati a casa!';ctx.info('⭐ '+points+' · Record '+ctx.score('baby'))}
  };
  movement(ctx,root,move,map.grid);draw();
  ctx.tip.textContent='Percorri la città, evita gli scooter e torna al nido dopo ogni consegna. Gli scooter avanzano a ogni tuo passo.';
}

export function createMaze(size) {
  const map=Array.from({length:size},()=>Array(size).fill('#'));
  const carve=(x,y)=>{
    map[y][x]='.';
    for(const [dx,dy] of shuffle([[2,0],[-2,0],[0,2],[0,-2]])){
      const nx=x+dx,ny=y+dy;
      if(inside(nx,ny,size)&&map[ny][nx]==='#'){
        map[y+dy/2][x+dx/2]='.';carve(nx,ny);
      }
    }
  };
  carve(1,1);map[size-2][size-2]='E';return map;
}
export function maze(ctx) {
  const root=board(ctx),label=mission(root);
  let level=1,points=0,moves=0,map,view,pos,finished=false;
  const draw=()=>{
    view.draw(pos,(x,y)=>({text:map[y][x]==='E'?'🏆':'',className:map[y][x]==='#'?'wall':'visited',type:map[y][x]==='#'?'wall':map[y][x]==='E'?'exit':'path'}));
    label.textContent='Labirinto '+level+'/3 · Raggiungi il trofeo';
    ctx.info('Passi '+moves+' · ⭐ '+points);
  };
  const start=()=>{
    root.querySelector('.boardMap')?.remove();
    const size=7+level*2;map=createMaze(size);pos={x:1,y:1};moves=0;finished=false;
    view=world(ctx,root,size);root.insertBefore(view.grid,root.querySelector('.dpad'));
    // Dragging farther than a cell moves one cell, so walls cannot be skipped.
    let from;
    ctx.listen(view.grid,'pointerdown',e=>{from={x:e.clientX,y:e.clientY};view.grid.setPointerCapture(e.pointerId)});
    ctx.listen(view.grid,'pointerup',e=>{
      if(!from)return;const dx=e.clientX-from.x,dy=e.clientY-from.y;from=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<12)return;
      if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy));
    });
    ctx.listen(view.grid,'pointercancel',()=>{from=null});draw();
  };
  const move=(dx,dy)=>{
    if(finished)return;const x=pos.x+dx,y=pos.y+dy;
    if(!map[y]||!map[y][x]||map[y][x]==='#')return;
    pos={x,y};moves++;draw();
    if(map[y][x]==='E'){
      finished=true;points+=Math.max(20,level*300-moves*2);ctx.best('maze',points);
      label.textContent='🏆 Uscita trovata in '+moves+' passi!';
      if(level<3){const next=button(root,'Prossimo labirinto',()=>{next.remove();level++;start()})}
      else ctx.info('🏆 Tre labirinti risolti · ⭐ '+points+' · Record '+ctx.score('maze'));
    }
  };
  movement(ctx,root,move);start();
  ctx.tip.textContent='Muoviti con frecce o swipe. Tre labirinti sempre nuovi, via via più grandi. Meno passi danno più punti.';
}
