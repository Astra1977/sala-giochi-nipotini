import { TetrisEngine,SHAPES,BLOCK_COLORS } from './tetris-engine.js';
import { button } from '../core.js';
export function tetris(ctx){
  const engine=new TetrisEngine(),root=document.createElement('div');root.className='tetrisGame';ctx.play.append(root);
  const layout=document.createElement('div');layout.className='tetrisLayout';root.append(layout);
  const canvas=document.createElement('canvas');canvas.width=300;canvas.height=600;canvas.className='tetrisBoard';canvas.tabIndex=0;canvas.setAttribute('aria-label','Griglia Tetris 10 colonne e 20 righe');layout.append(canvas);
  const sidebar=document.createElement('div');sidebar.className='tetrisSidebar';layout.append(sidebar);
  const nextTitle=document.createElement('p');nextTitle.textContent='Prossimo pezzo';sidebar.append(nextTitle);
  const preview=document.createElement('canvas');preview.width=120;preview.height=120;preview.setAttribute('aria-label','Anteprima del prossimo tetramino');sidebar.append(preview);
  const progress=document.createElement('progress');progress.max=50;progress.setAttribute('aria-label','Righe verso il completamento del percorso');sidebar.append(progress);
  const detail=document.createElement('p');sidebar.append(detail);
  let paused=false,elapsed=0,continueButton,reported=0,repeatAction=null,repeatTime=0;
  const pause=button(sidebar,'Pausa',()=>{if(engine.state==='playing'){paused=!paused;pause.textContent=paused?'Riprendi':'Pausa';repeatAction=null}},'btn');
  function update(){
    ctx.best('tetris',engine.score);progress.value=Math.min(50,engine.lines);
    detail.textContent='Livello '+engine.level+'/10 · Completati '+engine.completed+' · '+(engine.completed===10?'Modalità record':(5-engine.lines%5)+' righe al prossimo livello');
    ctx.info('Punti '+engine.score+' · Righe '+engine.lines+' · '+(paused?'In pausa':engine.state==='over'?'Fine partita — riprova!':engine.state==='won'?'Percorso completato!':'Costruisci la torre'));
    if(engine.completed>reported){reported=engine.completed;ctx.complete(reported)}
    if(engine.state==='won'&&!continueButton)continueButton=button(sidebar,'Continua per il record',()=>{engine.state='playing';continueButton.remove();elapsed=0;update()});
  }
  const act=action=>{if(paused||engine.state!=='playing')return;({left:()=>engine.move(-1),right:()=>engine.move(1),rotate:()=>engine.rotate(),soft:()=>engine.down(true),drop:()=>engine.hardDrop()})[action]();update()};
  const controls=document.createElement('div');controls.className='tetrisControls';root.append(controls);
  for(const [action,label] of [['left','← Sinistra'],['rotate','↻ Ruota'],['right','Destra →'],['soft','↓ Scendi'],['drop','⇓ Giù subito']]){
    const b=button(controls,label,()=>act(action));
    if(['left','right','soft'].includes(action)){
      ctx.listen(b,'pointerdown',e=>{b.setPointerCapture(e.pointerId);repeatAction=action;repeatTime=-.24});
      const stop=()=>{repeatAction=null};ctx.listen(b,'pointerup',stop);ctx.listen(b,'pointercancel',stop);
    }
  }
  ctx.listen(window,'keydown',e=>{
    if(/INPUT|SELECT/.test(e.target.tagName))return;
    const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'soft',' ':'drop'};
    if(e.key.toLowerCase()==='p'){e.preventDefault();pause.click();return}
    if(map[e.key]){e.preventDefault();if(!e.repeat||!['rotate','drop'].includes(map[e.key]))act(map[e.key])}
  });
  const loseFocus=()=>{if(engine.state==='playing'){paused=true;pause.textContent='Riprendi';repeatAction=null;update()}};
  ctx.listen(window,'blur',loseFocus);ctx.listen(document,'visibilitychange',()=>{if(document.hidden)loseFocus()});
  function block(g,x,y,size,color){g.fillStyle=color;g.fillRect(x+1,y+1,size-2,size-2);g.fillStyle='#ffffff55';g.fillRect(x+3,y+3,size-6,3)}
  ctx.frames(dt=>{
    if(!paused&&engine.state==='playing'){
      elapsed+=dt*1000;if(elapsed>=engine.interval){elapsed=0;engine.down();update()}
      if(repeatAction){repeatTime+=dt;if(repeatTime>.12){repeatTime=0;act(repeatAction)}}
    }
    const g=canvas.getContext('2d');g.fillStyle='#102f49';g.fillRect(0,0,300,600);
    for(let y=0;y<20;y++)for(let x=0;x<10;x++){g.strokeStyle='#ffffff0c';g.strokeRect(x*30,y*30,30,30);if(engine.board[y][x])block(g,x*30,y*30,30,BLOCK_COLORS[engine.board[y][x]-1])}
    engine.piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v)block(g,(engine.piece.x+x)*30,(engine.piece.y+y)*30,30,BLOCK_COLORS[engine.piece.kind])}));
    if(paused||engine.state!=='playing'){g.fillStyle='#092239cb';g.fillRect(0,230,300,100);g.fillStyle='white';g.font='bold 22px system-ui';g.textAlign='center';g.fillText(paused?'In pausa':engine.state==='won'?'Torre completata!':'Riprova!',150,285)}
    const p=preview.getContext('2d');p.clearRect(0,0,120,120);SHAPES[engine.next].forEach((r,y)=>r.forEach((v,x)=>{if(v)block(p,x*25+10,y*25+10,25,BLOCK_COLORS[engine.next])}));
  });update();
  ctx.tip.textContent='Completa una riga senza buchi. Ogni 5 righe completi un livello; ogni 2 livelli conquisti un Biscottino. Frecce: sposta/ruota/scendi; spazio: caduta; P: pausa.';
}
