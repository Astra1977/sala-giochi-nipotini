import { registerRoad } from '../vendor/andrea/road.js';
import { roadUtilities } from '../vendor/andrea/core-road.js';
import { button } from '../core.js';
import { read } from '../storage.js';

// Host adapter only. Projection, road generation, cars, hills, collisions,
// checkpoints, countdown, timer and vehicle handling remain Andrea's original.
export function road(ctx) {
  const stage=document.createElement('div');stage.className='roadStage';ctx.play.append(stage);
  const {U,Sound}=roadUtilities();
  Sound.on=read('road_sound',true)!==false;
  let definition,points=0,detail='Scegli il tuo veicolo',ended=false,game;
  const update=()=>ctx.info('⭐ '+points+' · '+detail+' · Record '+ctx.score('car'));
  function overlay(title,html){
    const layer=document.createElement('div');layer.className='roadIntro';
    const card=document.createElement('div');card.className='roadCard';
    const heading=document.createElement('h3');heading.textContent=title;card.append(heading);
    const body=document.createElement('p');body.innerHTML=html;card.append(body);layer.append(card);stage.append(layer);
    return {layer,card};
  }
  const api={
    canvas(){
      const c=document.createElement('canvas');c.className='roadCanvas';stage.append(c);
      c.setAttribute('aria-label','Corsa su Strada: tieni premuta la metà sinistra o destra per sterzare.');
      const cv={c,g:c.getContext('2d'),W:0,H:0};
      const fit=()=>{
        const r=stage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
        cv.W=r.width;cv.H=r.height;c.width=Math.round(r.width*dpr);c.height=Math.round(r.height*dpr);
        cv.g.setTransform(dpr,0,0,dpr,0,0);
      };
      const observer=new ResizeObserver(fit);observer.observe(stage);fit();
      cv.pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
      cv.dispose=()=>observer.disconnect();
      return cv;
    },
    info(text){detail=text;update()},
    add(n){if(ended)return;points=Math.max(0,points+n);ctx.best('car',points);update()},
    begin(){stage.dataset.running='true'},
    popup(text,x,y,kind=''){
      const popup=document.createElement('div');popup.className='roadPopup '+kind;popup.textContent=text;
      popup.style.left=x+'px';popup.style.top=y+'px';stage.append(popup);
      ctx.delay(()=>popup.remove(),1000);
    },
    intro(options,start){
      const {layer,card}=overlay(options.title,options.text);
      for(const choice of options.buttons)button(card,choice.label,()=>{
        layer.remove();Sound.unlock();start(choice.value);
      });
    },
    end(result){
      if(ended)return;ended=true;stage.dataset.running='false';
      ctx.best('car',points);detail='🏁 '+result.title;update();
      overlay(result.title,result.msg+'<br><strong>'+points+' punti</strong><br>Premi Riprova per una nuova corsa.');
      // Stop the original render loop and release keyboard / resize listeners.
      ctx.delay(()=>game?.stop(),0);
    }
  };
  registerRoad({register(value){definition=value}},U,Sound,(fn,ms)=>ctx.delay(fn,ms));
  game=definition.start(api);
  ctx.onCleanup(()=>{game.stop();if(Sound.ac)Sound.ac.close().catch(()=>{})});
  // Prevent page scrolling and stuck steering if the app loses focus.
  ctx.listen(window,'keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault()});
  const release=()=>{
    for(const key of ['ArrowLeft','ArrowRight'])window.dispatchEvent(new KeyboardEvent('keyup',{key}));
    // Original pointer handlers listen for pointercancel, including multi-touch.
    const canvas=stage.querySelector('canvas');
    if(canvas)for(const id of pointerIds)canvas.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id}));
    pointerIds.clear();
  };
  const pointerIds=new Set();
  ctx.listen(stage,'pointerdown',e=>pointerIds.add(e.pointerId));
  ctx.listen(stage,'pointerup',e=>pointerIds.delete(e.pointerId));
  ctx.listen(stage,'pointercancel',e=>pointerIds.delete(e.pointerId));
  ctx.listen(window,'blur',release);
  ctx.listen(document,'visibilitychange',()=>{if(document.hidden)release()});
  ctx.tip.textContent='Originale di Andrea · Accelera da solo. Tieni premuta la metà sinistra o destra del campo, oppure usa ← e →. I checkpoint aggiungono tempo; il traffico cresce.';
  update();
}
