import { read, write, record } from './storage.js';
import { GAMES } from './catalog.js';
export const PROGRESS_KEY='sala_progress_v8';
const ids=GAMES.map(g=>g.id);
const bounded=(n,max)=>Math.min(max,Math.max(0,Math.floor(Number(n)||0)));
export function medalsFor(percent){return Math.floor(bounded(percent,100)/20)}
export function normalize(value){
  const source=value&&typeof value==='object'?value:{};
  const result={version:8,games:{},retired:source.retired||{}};
  for(const id of ids){
    const old=source.games?.[id]||{};
    const completed=bounded(old.completed,id==='tetris'?10:5);
    result.games[id]={score:Math.max(0,Number(old.score)||0,record(id)),completed,medals:medalsFor(completed/(id==='tetris'?10:5)*100)};
  }
  // Never delete or reuse old scores for a different game.
  for(const id of ['bubbles','baby'])result.retired[id]=Math.max(Number(result.retired[id])||0,record(id));
  return result;
}
export function collection(){return normalize(read(PROGRESS_KEY,{}))}
export function gameProgress(id){return collection().games[id]||{score:0,completed:0,medals:0}}
export function migrate(){const data=collection();write(PROGRESS_KEY,data);return data}
export function saveScore(id,score){
  if(!ids.includes(id)||!Number.isFinite(score))return;
  const data=collection();data.games[id].score=Math.max(data.games[id].score,score);write(PROGRESS_KEY,data);
}
export function completeMilestone(id,completed){
  if(!ids.includes(id))return 0;
  const data=collection(),game=data.games[id],previous=game.medals;
  const next=bounded(completed,id==='tetris'?10:5);
  // Structured missions must be completed in order. Tetris may clear four lines at once.
  if(id!=='tetris'&&next>game.completed+1)return 0;
  game.completed=Math.max(game.completed,next);
  game.medals=medalsFor(game.completed/(id==='tetris'?10:5)*100);
  write(PROGRESS_KEY,data);
  return game.medals-previous;
}
export function totalMedals(){return Object.values(collection().games).reduce((sum,g)=>sum+g.medals,0)}
export function badgeRow(count){
  const row=document.createElement('span');row.className='biscottini';row.setAttribute('aria-label',count+' Biscottini su 5');
  for(let i=0;i<5;i++){const img=document.createElement('img');img.src='./icons/biscottino.svg';img.alt='';img.className=i<count?'earned':'locked';row.append(img)}
  return row;
}
