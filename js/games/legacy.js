// Preserve the working fruit swipe engine and complete SVG cat from upstream.
export function mountLegacy(ctx, k) {
  const { play, info, tip, makeButton, best, score } = ctx;
  let points = 0;
  const rand = (a,b) => a + Math.random()*(b-a);
 if(k==='fruit'){
  let remaining=35,active=true,items=[],lastPointer=null,trail=[];
  const stage=ctx.stage,goal=[8,12,16,20,24][stage-1];let hits=0,bombs=0,combo=0,maxCombo=0,lastHit=-Infinity;
  info('🍉 Punti: 0 · ⏱ 35 s');
  tip.textContent='Sfida '+stage+': '+goal+' frutti, massimo '+Math.max(0,4-stage)+' bombe, combo '+stage+'. Scorri il dito per tagliare la frutta! Lanci bassi, medi e alti: segui la traiettoria. Evita le bombe 💣 (−20).';
  const field=document.createElement('div');field.id='fruitField';play.append(field);
  const canvas=document.createElement('canvas');canvas.id='slashCanvas';field.append(canvas);
  const paint=canvas.getContext('2d');
  const resize=()=>{canvas.width=field.clientWidth;canvas.height=field.clientHeight};
  resize();window.addEventListener('resize',resize);
  function update(){info('🍉 Punti: '+points+' · Frutti '+hits+'/'+goal+' · Bombe '+bombs+' · Combo '+maxCombo+' · ⏱ '+remaining+' s')}
  function addFruit(){
    if(!active)return;
    const bomb=Math.random()<.16;
    const b=document.createElement('div');b.className='fruitItem';b.textContent=bomb?'💣':['🍉','🍎','🍍','🍊','🍓','🥝'][Math.floor(rand(0,6))];
    const x=rand(8,Math.max(9,field.clientWidth-84)),y=field.clientHeight+12;
    b.style.left=x+'px';b.style.top=y+'px';field.append(b);
    const gravity=920;
    const targetHeight=rand(field.clientHeight*.35,field.clientHeight*.91);
    const launchVelocity=-Math.sqrt(2*gravity*targetHeight);
    items.push({b,x,y,vx:rand(-65,65),vy:launchVelocity,gravity,age:0,bomb,hit:false});
  }
  function slice(obj){
    if(obj.hit||!active)return;
    obj.hit=true;points+=obj.bomb?-20:10;
    if(obj.bomb){bombs++;combo=0}else{hits++;const now=performance.now();combo=now-lastHit<1300?combo+1:1;lastHit=now;maxCombo=Math.max(maxCombo,combo)}
    if(points<0)points=0;
    obj.b.textContent=obj.bomb?'💥':'✨';obj.b.style.transform='scale(1.35)';
    ctx.delay(()=>obj.b.remove(),180);update();
  }
  function local(e){const r=field.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  function intersect(a,b,c,r){
    const vx=b.x-a.x,vy=b.y-a.y,wx=c.x-a.x,wy=c.y-a.y;
    const t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/(vx*vx+vy*vy||1)));
    return Math.hypot(a.x+vx*t-c.x,a.y+vy*t-c.y)<r;
  }
  const down=e=>{e.preventDefault();field.setPointerCapture(e.pointerId);lastPointer=local(e)};
  const move=e=>{
    if(!lastPointer||!active)return;
    e.preventDefault();const p=local(e);
    items.forEach(o=>{if(!o.hit&&intersect(lastPointer,p,{x:o.x+38,y:o.y+38},35))slice(o)});
    trail.push({a:lastPointer,b:p,life:0.18});lastPointer=p;
  };
  const up=()=>lastPointer=null;
  field.addEventListener('pointerdown',down);field.addEventListener('pointermove',move);
  field.addEventListener('pointerup',up);field.addEventListener('pointercancel',up);
  let prev=performance.now(),frame=0,spawnTime=0;
  function tick(now){
    if(!active)return;
    const dt=Math.min(.05,(now-prev)/1000);prev=now;spawnTime+=dt;
    if(spawnTime>rand(.43,.65)){spawnTime=0;addFruit();if(Math.random()<.23)addFruit()}
    items.forEach(o=>{if(o.hit)return;o.age+=dt;o.vy+=o.gravity*dt;o.x+=o.vx*dt;o.y+=o.vy*dt;o.b.style.left=o.x+'px';o.b.style.top=o.y+'px'});
    items=items.filter(o=>{if(o.hit||o.y>field.clientHeight+90){if(!o.hit)o.b.remove();return false}return true});
    paint.clearRect(0,0,canvas.width,canvas.height);paint.lineWidth=7;paint.lineCap='round';paint.strokeStyle='#fff5a2';
    trail.forEach(t=>{paint.globalAlpha=t.life/.18;paint.beginPath();paint.moveTo(t.a.x,t.a.y);paint.lineTo(t.b.x,t.b.y);paint.stroke();t.life-=dt});
    paint.globalAlpha=1;trail=trail.filter(t=>t.life>0);
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  const clock=setInterval(()=>{remaining--;update();if(remaining<=0){active=false;clearInterval(clock);cancelAnimationFrame(frame);best('fruit',points);if(hits>=goal&&bombs<=Math.max(0,4-stage)&&maxCombo>=stage)ctx.complete(stage);info('🏆 Fine! '+points+' punti · Record '+score('fruit'));tip.textContent='Premi Riprova per una nuova sfida!'}},1000);
  ctx.onCleanup(()=>{active=false;clearInterval(clock);cancelAnimationFrame(frame);window.removeEventListener('resize',resize)});
  return;
 }
 if(k==='runner'){
 let active=true,elapsed=0,scoreNow=0,jumpUntil=0,obstacles=[],frame=0;
 const stage=ctx.stage,duration=[12,18,24,30,36][stage-1];
 play.innerHTML=`<div class="runner" style="height:320px;position:relative;overflow:hidden"><div class="runnerRicky" aria-label="Gatto grigio e bianco">
<svg viewBox="0 0 110 92" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gatto grigio e bianco che corre verso destra">
<path d="M25 55 C-5 56 0 22 17 25 C24 26 23 35 17 35 C15 35 16 48 30 45" fill="none" stroke="#717986" stroke-width="10" stroke-linecap="round"/>
<ellipse cx="47" cy="58" rx="38" ry="25" fill="#8e96a3" stroke="#444d59" stroke-width="2.5"/>
<path d="M27 56 Q43 75 66 61 Q56 79 34 76Z" fill="#f7f8fc"/>
<path d="M21 39 l7 11 M40 35 l5 12 M56 37 l-4 10" stroke="#636b78" stroke-width="5" stroke-linecap="round"/>
<path d="M21 73 Q19 84 31 85 L39 85 Q43 81 36 78 M52 74 Q53 84 65 85 L72 85 Q76 80 68 76" fill="#f7f8fc" stroke="#535b66" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M61 27 L65 6 Q68 1 73 7 L84 17 L96 7 Q102 2 104 10 L106 30 Q111 46 101 55 Q85 68 69 56 Q58 47 61 27Z" fill="#8e96a3" stroke="#444d59" stroke-width="2.5"/>
<path d="M69 17 L71 11 L79 19Z M94 18 L101 12 L102 22Z" fill="#eaa4b0"/>
<path d="M71 40 Q83 56 100 39 L100 50 Q87 63 73 51Z" fill="#fff"/>
<ellipse cx="81" cy="34" rx="4" ry="6" fill="#243142"/><ellipse cx="99" cy="34" rx="4" ry="6" fill="#243142"/>
<circle cx="82" cy="32" r="1.3" fill="#fff"/><circle cx="100" cy="32" r="1.3" fill="#fff"/>
<path d="M88 43 L94 43 L91 47Z" fill="#dc8c9b"/>
<path d="M91 47 q-4 5 -8 0 M91 47 q4 5 8 0" fill="none" stroke="#414958" stroke-width="1.5"/>
<path d="M75 46 l-12 -2 M76 50 l-12 3 M101 46 l8 -3 M101 50 l8 3" stroke="#f7f8fc" stroke-width="1.7" stroke-linecap="round"/>
</svg></div><div id="obLayer"></div><div style="position:absolute;bottom:0;width:100%;height:23%;background:repeating-linear-gradient(90deg,#7bba42 0 32px,#85c64b 32px 64px)"></div></div>`;
 const field=play.querySelector('.runner'),hero=play.querySelector('.runnerRicky'),layer=play.querySelector('#obLayer');
 const jump=()=>{if(!active)return;const now=performance.now();if(now>jumpUntil-220)jumpUntil=now+720};
 makeButton('⬆ SALTA!',jump);
 const tap=e=>{if(e.target.closest('.runner'))jump()};play.addEventListener('pointerdown',tap);
 const key=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump()}};window.addEventListener('keydown',key);
 info('Percorso '+stage+': sopravvivi '+duration+' secondi');tip.textContent='Aiuta Biscotto a saltare! Tocca il campo o SALTA: ostacoli piccoli, grandi e velocità crescente.';
 let previous=performance.now(),spawnAt=0;
 function tick(now){
  if(!active)return;
  const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;
  const jumping=now<jumpUntil;
  const phase=jumping?1-(jumpUntil-now)/720:0;
  const lift=jumping?Math.sin(Math.PI*phase)*125:0;
  hero.style.transform='translateY('+(-lift)+'px)';
  if(elapsed>spawnAt){
   const size=[32,45,60,75][Math.floor(Math.random()*4)];
   const obj={x:field.clientWidth+30,size,el:document.createElement('span'),passed:false};
   obj.el.textContent='💩';obj.el.style.cssText='position:absolute;bottom:23%;font-size:'+size+'px;line-height:1;transform:translateX(-50%);z-index:2';
   layer.append(obj.el);obstacles.push(obj);
   spawnAt=elapsed+rand(.85,1.55)*Math.max(.65,1-elapsed/180);
  }
  const speed=160+stage*15+Math.min(170,elapsed*3);
  const heroX=field.clientWidth*.12+40;
  obstacles.forEach(o=>{
   o.x-=speed*dt;o.el.style.left=o.x+'px';
   if(!o.passed&&o.x<heroX-45){o.passed=true;scoreNow+=Math.round(o.size/10);info('⭐ '+scoreNow+' · Percorso '+stage+' · '+Math.floor(elapsed)+'/'+duration+' s')}
   if(Math.abs(o.x-heroX)<(o.size*.28+18)&&lift<o.size*.70){
    active=false;best('runner',scoreNow);info('💥 Ops! '+scoreNow+' punti · Record '+score('runner'));tip.textContent='Riprova: cambia dimensione e ritmo degli ostacoli!';
   }
  });
  obstacles=obstacles.filter(o=>{if(o.x< -90){o.el.remove();return false}return true});
  if(active&&elapsed>=duration){active=false;best('runner',scoreNow);ctx.complete(stage);info('Percorso '+stage+' completato! '+scoreNow+' punti')}
  if(active)frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);
 ctx.onCleanup(()=>{active=false;cancelAnimationFrame(frame);play.removeEventListener('pointerdown',tap);window.removeEventListener('keydown',key)});
 return;
 }


}
