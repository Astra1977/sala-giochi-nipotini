import { board, mission } from '../core.js';

// Physics in fixed world coordinates, independent of viewport and canvas resolution.
export function advanceBall(ball, dt, hoop, scored) {
  const oldX=ball.x,oldY=ball.y;
  ball.vy+=700*dt;ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
  const rimY=hoop.y;
  // Count only a downward crossing through the inside of the rim.
  if(!scored&&ball.vy>0&&oldY<rimY&&ball.y>=rimY){
    const t=(rimY-oldY)/(ball.y-oldY);
    const crossingX=oldX+(ball.x-oldX)*t;
    if(crossingX>hoop.x+9&&crossingX<hoop.x+hoop.width-9)return true;
  }
  if(ball.x<12){ball.x=12;ball.vx=Math.abs(ball.vx)*.6}
  if(ball.x>488){ball.x=488;ball.vx=-Math.abs(ball.vx)*.6}
  // Backboard and rim have simple restitution, not a random success chance.
  if(ball.x+12>hoop.x+hoop.width+6&&oldX+12<=hoop.x+hoop.width+6&&ball.y>hoop.y-70&&ball.y<hoop.y+10)ball.vx=-Math.abs(ball.vx)*.65;
  if(!scored)for(const x of [hoop.x,hoop.x+hoop.width]){
    const dx=ball.x-x,dy=ball.y-hoop.y,dist=Math.hypot(dx,dy);
    if(dist<15&&dist>0){
      ball.x=x+dx/dist*16;ball.y=hoop.y+dy/dist*16;
      const dot=ball.vx*dx/dist+ball.vy*dy/dist;
      if(dot<0){ball.vx-=1.7*dot*dx/dist;ball.vy-=1.7*dot*dy/dist}
    }
  }
  return false;
}

export function basketball(ctx){
  const root=board(ctx),label=mission(root),canvas=document.createElement('canvas');
  canvas.className='ballCourt';canvas.width=1000;canvas.height=760;canvas.tabIndex=0;
  canvas.setAttribute('aria-label','Campo da basket. Trascina la palla verso il canestro e rilascia per tirare.');root.append(canvas);
  const paint=canvas.getContext('2d');paint.scale(2,2);
  let shots=0,points=0,scored=false,inFlight=false,active=true,aim=null,ball={x:92,y:320,vx:0,vy:0},flightTime=0;
  const hoop={x:335,y:150,width:95};
  const update=()=>{label.textContent='Tiro '+Math.min(10,shots+1)+'/10 · Trascina dalla palla verso il canestro';ctx.info('⭐ '+points+' · Record '+ctx.score('ball'))};
  const reset=()=>{
    inFlight=false;scored=false;ball={x:80+(shots%3)*22,y:320,vx:0,vy:0};
    hoop.x=335-(Math.floor(shots/3)%2)*35;hoop.y=150-(Math.floor(shots/3)%3)*12;hoop.width=Math.max(65,95-shots*3);
    update();
  };
  const local=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*500/r.width,y:(e.clientY-r.top)*380/r.height}};
  const velocity=p=>{
    let vx=(p.x-ball.x)*3,vy=(p.y-ball.y)*3;
    const speed=Math.hypot(vx,vy),max=950;
    if(speed>max){vx*=max/speed;vy*=max/speed}
    return{vx,vy};
  };
  ctx.listen(canvas,'pointerdown',e=>{
    if(!active||inFlight)return;const p=local(e);
    if(Math.hypot(p.x-ball.x,p.y-ball.y)>52)return;
    e.preventDefault();canvas.setPointerCapture(e.pointerId);aim={...p,id:e.pointerId};
  });
  ctx.listen(canvas,'pointermove',e=>{if(aim&&aim.id===e.pointerId){e.preventDefault();aim={...local(e),id:e.pointerId}}});
  ctx.listen(canvas,'pointerup',e=>{
    if(!aim||aim.id!==e.pointerId)return;const p=local(e);aim=null;
    if(!active||inFlight||Math.hypot(p.x-ball.x,p.y-ball.y)<15)return;
    Object.assign(ball,velocity(p));inFlight=true;flightTime=0;shots++;
  });
  ctx.listen(canvas,'pointercancel',()=>{aim=null});
  // A keyboard alternative allows the game to be played without dragging.
  let keyboardX=170,keyboardY=-150;
  ctx.listen(canvas,'keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;e.preventDefault();
    if(!active||inFlight)return;
    if(e.key==='ArrowLeft')keyboardX-=10;if(e.key==='ArrowRight')keyboardX+=10;
    if(e.key==='ArrowUp')keyboardY-=10;if(e.key==='ArrowDown')keyboardY+=10;
    keyboardX=Math.max(30,Math.min(280,keyboardX));keyboardY=Math.max(-250,Math.min(-40,keyboardY));
    aim={x:ball.x+keyboardX,y:ball.y+keyboardY,id:-1};
    if(e.key===' '){Object.assign(ball,velocity(aim));aim=null;inFlight=true;flightTime=0;shots++}
  });
  const circle=(x,y,r,color)=>{paint.fillStyle=color;paint.beginPath();paint.arc(x,y,r,0,Math.PI*2);paint.fill()};
  ctx.frames(dt=>{
    paint.clearRect(0,0,500,380);
    paint.fillStyle='#aee4f9';paint.fillRect(0,0,500,380);paint.fillStyle='#dfa45f';paint.fillRect(0,350,500,30);
    paint.strokeStyle='#fff8';paint.lineWidth=2;paint.beginPath();paint.ellipse(245,365,90,20,0,0,Math.PI*2);paint.stroke();
    paint.fillStyle='#f8fafb';paint.fillRect(hoop.x+hoop.width+6,hoop.y-70,8,85);
    paint.strokeStyle='#fff';paint.lineWidth=3;
    for(let i=0;i<=4;i++){paint.beginPath();paint.moveTo(hoop.x+i*hoop.width/4,hoop.y);paint.lineTo(hoop.x+20+i*(hoop.width-40)/4,hoop.y+45);paint.stroke()}
    paint.strokeStyle='#e96b2b';paint.lineWidth=5;paint.beginPath();paint.moveTo(hoop.x,hoop.y);paint.lineTo(hoop.x+hoop.width,hoop.y);paint.stroke();
    if(inFlight&&active){
      flightTime+=dt;
      // Substeps keep fast balls from skipping rim collisions.
      for(let i=0;i<3;i++)if(advanceBall(ball,dt/3,hoop,scored)){scored=true;points+=20;ctx.best('ball',points);ctx.info('🏀 Canestro! ⭐ '+points)}
      if(ball.y>410||flightTime>4){
        if(shots>=10){active=false;inFlight=false;label.textContent='🏆 Partita finita';ctx.info(points+' punti · Record '+ctx.score('ball'))}
        else reset();
      }
    }
    if(aim&&!inFlight&&active){
      const v=velocity(aim);paint.fillStyle='#ffffffcc';
      for(let i=1;i<=12;i++){const t=i*.055;circle(ball.x+v.vx*t,ball.y+v.vy*t+350*t*t,2.5,'#ffffffcc')}
    }
    circle(ball.x,ball.y,12,'#e57c20');
    paint.strokeStyle='#703c17';paint.lineWidth=1.5;paint.beginPath();paint.arc(ball.x,ball.y,12,0,Math.PI*2);paint.moveTo(ball.x-12,ball.y);paint.lineTo(ball.x+12,ball.y);paint.moveTo(ball.x,ball.y-12);paint.lineTo(ball.x,ball.y+12);paint.stroke();
    if(scored){paint.fillStyle='#1c6950';paint.font='bold 23px system-ui';paint.fillText('CANESTRO! +20',160,70)}
  });
  ctx.tip.textContent='Parti dalla palla, trascina in alto verso destra e rilascia. La linea mostra la traiettoria. Da tastiera: frecce per mirare, spazio per tirare. Dieci tiri, canestro più piccolo.';
  update();
}
