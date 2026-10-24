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
    label.textContent = finished ? '🎉 Hai aiutato tutta la città!' : 'Missione '+Math.min(5,step+1)+'/5: '+quests[step][1];
    ctx.info('⭐ '+points+' · Passi '+moves+' · Zaino: '+(['vuoto','🥪','vuoto','⚽','vuoto','👜'][step] || 'vuoto'));
  };
  const move = (dx,dy) => {
    if (finished) return;
    const next = {x:pos.x+dx,y:pos.y+dy};
    if (!inside(next.x,next.y,9) || walls.has(next.x+','+next.y)) return;
    pos = next; moves++;
    if (same(pos,places[quests[step][0]])) {
      points+=20; step++;
      if(step<=4)ctx.complete(step);else if(step===6)ctx.complete(5);
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
    objects=spots.slice(0,level+2).map((p,i)=>({...p,emoji:['🍄','🌺','🦋','🪶','🍓','🍃'][i],collected:false}));
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
    label.textContent=found===objects.length&&level===5?'Torna alla partenza (colonna 2, riga 2)!':'Zona '+level+'/5 · Cerca '+objects.filter(o=>!o.collected).map(o=>o.emoji).join(' ');
    ctx.info('⭐ '+points+' · Oggetti '+found+'/'+objects.length);
  };
  const move=(dx,dy)=>{
    if(finished)return;const x=pos.x+dx,y=pos.y+dy;
    if(!inside(x,y,9)||walls.has(x+','+y))return;pos={x,y};
    const object=objects.find(o=>!o.collected&&same(o,pos));
    if(object){object.collected=true;found++;points+=20*level}
    draw();
    if(found===objects.length&&(level<5||pos.x===1&&pos.y===1)){
      finished=true;ctx.best('forest',points);ctx.complete(level);
      if(level<5){
        label.textContent='🌟 Radura esplorata!';
        const next=button(root,'Esplora la prossima radura',()=>{next.remove();level++;startLevel()});
      }else{label.textContent='🏆 Tutta la foresta esplorata!';ctx.info('⭐ '+points+' · Record '+ctx.score('forest'))}
    }
  };
  movement(ctx,root,move);
  startLevel();
  ctx.tip.textContent='La foresta si rivela camminando. Cerca gli oggetti nascosti nelle cinque radure: usa frecce o swipe.';
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
    label.textContent='Labirinto '+level+'/5 · Raggiungi il trofeo';
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
      finished=true;points+=Math.max(20,level*300-moves*2);ctx.best('maze',points);ctx.complete(level);
      label.textContent='🏆 Uscita trovata in '+moves+' passi!';
      if(level<5){const next=button(root,'Prossimo labirinto',()=>{next.remove();level++;start()})}
      else ctx.info('🏆 Cinque labirinti risolti · ⭐ '+points+' · Record '+ctx.score('maze'));
    }
  };
  movement(ctx,root,move);start();
  ctx.tip.textContent='Muoviti con frecce o swipe. Cinque labirinti sempre nuovi, via via più grandi. Meno passi danno più punti.';
}
