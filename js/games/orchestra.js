import { OrchestraEngine,SONGS } from './orchestra-engine.js';
import { button } from '../core.js';
import { read,write } from '../storage.js';
const COLORS=['#f47f95','#f1c854','#70cdba','#9d98ed'],NAMES=['DO','RE','MI','FA'];
export function orchestra(ctx){
  const engine=new OrchestraEngine(ctx.stage),root=document.createElement('div');root.className='orchestraGame';ctx.play.append(root);
  const title=document.createElement('h3');title.textContent=SONGS[ctx.stage-1];root.append(title);
  const audioControls=document.createElement('div');audioControls.className='levelControls';root.append(audioControls);
  let muted=read('orchestra_muted',false)===true,volume=Math.max(0,Math.min(1,Number(read('orchestra_volume',.35))||0)),audio,started=false,paused=false,finished=false,feedback='Tocca Inizia e segui il ritmo';
  const mute=button(audioControls,muted?'Suoni spenti':'Suoni attivi',()=>{muted=!muted;write('orchestra_muted',muted);mute.textContent=muted?'Suoni spenti':'Suoni attivi'});
  const label=document.createElement('label');label.textContent='Volume ';audioControls.append(label);
  const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=1;slider.step=.05;slider.value=volume;slider.setAttribute('aria-label','Volume orchestra');label.append(slider);
  slider.oninput=()=>{volume=Number(slider.value);write('orchestra_volume',volume)};
  function unlock(){try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A()}if(audio?.state==='suspended')audio.resume().catch(()=>{})}catch{feedback='Puoi giocare anche senza suoni'}}
  function tone(lane){if(muted||!audio)return;try{const o=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;o.type='triangle';o.frequency.value=[261.63,293.66,329.63,349.23][lane];gain.gain.setValueAtTime(volume*.3,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);o.connect(gain);gain.connect(audio.destination);o.start(now);o.stop(now+.26)}catch{}}
  const start=button(root,'▶ Inizia il brano',()=>{unlock();started=true;paused=false;start.hidden=true;feedback='Preparati: tre, due, uno…'});
  const pause=button(root,'Pausa',()=>{if(started&&!finished){paused=!paused;pause.textContent=paused?'Riprendi':'Pausa';if(!paused)unlock()}});
  const canvas=document.createElement('canvas');canvas.width=480;canvas.height=400;canvas.className='musicCanvas';canvas.setAttribute('aria-label','Quattro corsie: tocca DO RE MI FA quando le note raggiungono la linea');root.append(canvas);
  const pads=document.createElement('div');pads.className='musicPads';root.append(pads);
  const press=lane=>{unlock();if(!started||paused||finished)return;feedback=engine.judge(lane);tone(lane);padButtons[lane].classList.add('played');ctx.delay(()=>padButtons[lane].classList.remove('played'),140);update()};
  const padButtons=NAMES.map((name,lane)=>{const b=button(pads,name,()=>press(lane),'');b.style.background=COLORS[lane];return b});
  ctx.listen(window,'keydown',e=>{if(/INPUT|SELECT/.test(e.target.tagName)||e.repeat)return;const lane=['d','f','j','k'].indexOf(e.key.toLowerCase());if(lane>=0){e.preventDefault();press(lane)}});
  const loseFocus=()=>{if(started&&!finished){paused=true;pause.textContent='Riprendi';update()}};
  ctx.listen(window,'blur',loseFocus);ctx.listen(document,'visibilitychange',()=>{if(document.hidden)loseFocus()});ctx.onCleanup(()=>{audio?.close().catch(()=>{})});
  function update(){ctx.info(feedback+' · Punti '+engine.score+' · Combo '+engine.combo+' · Note '+engine.hits+'/'+engine.notes.length+(paused?' · In pausa':''))}
  ctx.frames(dt=>{
    if(started&&!paused&&!finished){engine.advance(dt);if(engine.done){finished=true;ctx.best('orchestra',engine.score);if(engine.passed){feedback='Bravissimo! Brano completato';ctx.complete(ctx.stage)}else feedback='Ci sei quasi! Riprova il brano: serve l’80% delle note';pause.hidden=true}update()}
    canvas.dataset.elapsed=engine.time.toFixed(3);
    const g=canvas.getContext('2d');g.fillStyle='#163753';g.fillRect(0,0,480,400);
    for(let lane=0;lane<4;lane++){g.fillStyle=COLORS[lane]+'22';g.fillRect(lane*120+3,0,114,400);g.strokeStyle=COLORS[lane];g.lineWidth=5;g.strokeRect(lane*120+8,332,104,32)}
    for(const note of engine.notes){if(note.result!==null)continue;const y=348+(engine.time-note.at)*120;if(y < -25||y>400)continue;g.fillStyle=COLORS[note.lane];g.beginPath();g.roundRect(note.lane*120+20,y-15,80,30,12);g.fill();g.fillStyle='#143650';g.font='bold 18px system-ui';g.textAlign='center';g.fillText(NAMES[note.lane],note.lane*120+60,y+6)}
  });update();
  ctx.tip.textContent='Tocca il tasto quando la nota arriva alla linea. Perfetto o Bene fanno crescere la combo. Completa almeno l’80% delle note del brano per il Biscottino. Tastiera: D F J K.';
}
