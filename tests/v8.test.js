import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisEngine,SHAPES } from '../js/games/tetris-engine.js';
import { OrchestraEngine } from '../js/games/orchestra-engine.js';
import { GAMES,MILESTONES } from '../js/catalog.js';
import { write,read } from '../js/storage.js';
import { PROGRESS_KEY,migrate,gameProgress,completeMilestone,saveScore,totalMedals,medalsFor } from '../js/progress.js';
const backing=new Map();
globalThis.localStorage={getItem:k=>backing.get(k)??null,setItem:(k,v)=>backing.set(k,String(v)),removeItem:k=>backing.delete(k)};

test('Tetris has 7 tetrominoes and each 7-bag contains every shape exactly once',()=>{
  assert.equal(SHAPES.length,7);for(const m of SHAPES)assert.equal(m.flat().filter(Boolean).length,4);
  const engine=new TetrisEngine();engine.bag=[];
  for(let bag=0;bag<30;bag++)assert.equal(new Set(Array.from({length:7},()=>engine.take())).size,7);
});
test('Tetris wall/floor/stack collisions, wall kick and four rotations preserve shape',()=>{
  const e=new TetrisEngine();e.piece={kind:5,matrix:SHAPES[5].map(r=>[...r]),x:0,y:3};
  assert.equal(e.move(-1),false);assert.equal(e.collides(e.piece.matrix,9,3),true);assert.equal(e.collides(e.piece.matrix,0,19),true);
  const before=JSON.stringify(e.piece.matrix);for(let i=0;i<4;i++)assert(e.rotate());assert.equal(JSON.stringify(e.piece.matrix),before);
  e.board[4][0]=1;assert(e.collides());
});
test('Tetris clears rows, scores, completes all ten levels and permits record mode',()=>{
  const e=new TetrisEngine();
  for(let i=0;i<25;i++){
    e.board=Array.from({length:20},()=>Array(10).fill(0));
    e.board[18]=Array(10).fill(1);e.board[19]=Array(10).fill(1);e.board[18][4]=e.board[18][5]=0;e.board[19][4]=e.board[19][5]=0;
    e.piece={kind:3,matrix:SHAPES[3].map(r=>[...r]),x:4,y:18};e.lock();
    assert.equal(e.lines,(i+1)*2);assert.equal(e.completed,Math.min(10,Math.floor(e.lines/5)));assert.equal(e.board.length,20);
  }
  assert(e.score>0);assert.equal(e.state,'won');e.state='playing';e.hardDrop();assert.notEqual(e.state,'won');
});
test('Tetris top-out ends play and stopped game cannot move',()=>{
  const e=new TetrisEngine();e.board=Array.from({length:20},()=>Array(10).fill(1));e.spawn();assert.equal(e.state,'over');assert.equal(e.move(1),false);assert.equal(e.rotate(),false);
});
test('Orchestra timing judges perfect, good, incorrect lanes and misses',()=>{
  const e=new OrchestraEngine(1);assert.equal(e.judge(0),'Riprova');e.advance(3);assert.equal(e.judge(1),'Riprova');assert.equal(e.judge(0),'Perfetto');e.advance(.95+.18);assert.equal(e.judge(1),'Bene');assert.equal(e.hits,2);e.advance(100);assert.equal(e.passed,false);assert.equal(e.combo,0);
});
test('All five original songs require full duration and at least 80% of notes',()=>{
  let previous=0;
  for(let stage=1;stage<=5;stage++){
    const e=new OrchestraEngine(stage);assert(e.notes.length>previous);previous=e.notes.length;
    for(const note of e.notes){e.advance(note.at-e.time);assert.equal(e.judge(note.lane),'Perfetto');assert.equal(e.passed,false)}
    e.advance(.4);assert(e.passed);assert(e.score>0);assert.equal(e.combo,e.notes.length);
    const missed=new OrchestraEngine(stage);missed.advance(100);assert.equal(missed.passed,false);assert(missed.notes.every(n=>n.result==='Riprova'));
  }
});
test('V8 safely migrates legacy scores, archives retired games and does not infer medals',()=>{
  write('best_runner',321);write('best_bubbles',400);write('best_baby',200);write(PROGRESS_KEY,{});
  const data=migrate();assert.equal(data.version,8);assert.equal(data.games.runner.score,321);assert.equal(data.retired.bubbles,400);assert.equal(data.retired.baby,200);
  assert.equal(read('best_bubbles'),400);assert.equal(gameProgress('runner').medals,0);assert.equal(GAMES.length,12);assert(!GAMES.some(g=>['baby','bubbles'].includes(g.id)));
});
test('Universal thresholds, all twelve paths, monotonic persistence, five per game and sixty total',()=>{
  for(const [percent,expected] of [[0,0],[19,0],[20,1],[39,1],[40,2],[59,2],[60,3],[79,3],[80,4],[99,4],[100,5],[300,5]])assert.equal(medalsFor(percent),expected);
  write(PROGRESS_KEY,{});
  for(const {id} of GAMES){
    assert.equal(MILESTONES[id].length,5);saveScore(id,999999);assert.equal(gameProgress(id).medals,0);
    if(id!=='tetris'){assert.equal(completeMilestone(id,5),0);assert.equal(gameProgress(id).completed,0)}
    for(let stage=1;stage<=5;stage++){
      if(id==='tetris'){completeMilestone(id,stage*2-1);assert.equal(gameProgress(id).medals,stage-1);completeMilestone(id,stage*2)}else completeMilestone(id,stage);
      assert.equal(gameProgress(id).medals,stage);
    }
    completeMilestone(id,1);saveScore(id,1);assert.equal(gameProgress(id).medals,5);assert.equal(gameProgress(id).score,999999);
    completeMilestone(id,500);assert.equal(gameProgress(id).medals,5);
  }
  assert.equal(totalMedals(),60);assert.equal(migrate().games.tetris.medals,5);assert.equal(totalMedals(),60);
});
