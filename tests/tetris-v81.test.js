import test from 'node:test';
import assert from 'node:assert/strict';
import { TetrisEngine,SHAPES } from '../js/games/tetris-engine.js';
import { write } from '../js/storage.js';
import { PROGRESS_KEY,completeMilestone,gameProgress } from '../js/progress.js';

const empty=()=>Array.from({length:20},()=>Array(10).fill(0));
const verticalI=()=>({kind:0,matrix:[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],x:3,y:16});
function prepare(engine,count){
  engine.board=empty();
  engine.board[2][3]=6;engine.board[10][1]=5;engine.board[10][8]=2;
  for(let y=20-count;y<20;y++){
    engine.board[y]=Array.from({length:10},(_,x)=>(x+y)%7+1);
    engine.board[y][4]=0;
  }
  engine.piece=verticalI();
}
for(const count of [1,2,3,4])test('Clear '+count+' mixed-color horizontal row(s) simultaneously, preserve order and drop every block correctly',()=>{
  const engine=new TetrisEngine();prepare(engine,count);
  engine.score=17;engine.lines=10; // Score uses level 3 before the clear.
  assert.equal(engine.collides(),false);
  engine.lock();
  const expected=empty();expected[2+count][3]=6;expected[10+count][1]=5;expected[10+count][8]=2;
  for(let y=16+count;y<20;y++)expected[y][4]=1;
  assert.deepEqual(engine.board,expected);
  assert.equal(engine.lines,10+count);
  assert.equal(engine.score,17+[0,100,300,500,800][count]*3);
  assert.equal(engine.board.length,20);assert(engine.board.every(row=>row.length===10));
});
test('Full rows separated by an incomplete row clear together and intervening blocks fall only as far as appropriate',()=>{
  const engine=new TetrisEngine();engine.board=empty();
  for(const y of [16,18]){engine.board[y]=Array.from({length:10},(_,x)=>x%7+1);engine.board[y][4]=0}
  engine.board[17][8]=3;engine.board[4][2]=7;engine.piece=verticalI();engine.lock();
  const expected=empty();expected[6][2]=7;expected[18][8]=3;expected[18][4]=1;expected[19][4]=1;
  assert.deepEqual(engine.board,expected);assert.equal(engine.lines,2);assert.equal(engine.score,300);
});
test('Nine occupied cells never clear; a complete vertical column never clears',()=>{
  const engine=new TetrisEngine();engine.board=empty();engine.board[19]=Array(10).fill(2);engine.board[19][9]=0;
  engine.piece={kind:3,matrix:SHAPES[3].map(row=>[...row]),x:0,y:17};engine.lock();
  assert.equal(engine.lines,0);assert.equal(engine.score,0);assert.equal(engine.board[19][9],0);
  const column=new TetrisEngine();column.board=empty();for(let y=0;y<16;y++)column.board[y][4]=(y%7)+1;
  column.piece=verticalI();column.lock();assert.equal(column.lines,0);assert.equal(column.score,0);assert(column.board.every(row=>row[4]!==0));
});
test('Every five actual row clears completes a level and each two completed levels earns exactly one permanent Biscottino',()=>{
  write(PROGRESS_KEY,{});const engine=new TetrisEngine();
  for(let lines=1;lines<=50;lines++){
    prepare(engine,1);engine.lock();completeMilestone('tetris',engine.completed);
    assert.equal(engine.lines,lines);assert.equal(engine.completed,Math.floor(lines/5));
    assert.equal(engine.level,Math.min(10,Math.floor(lines/5)+1));
    assert.equal(gameProgress('tetris').medals,Math.floor(lines/10));
  }
  assert.equal(engine.state,'won');assert.equal(gameProgress('tetris').completed,10);
  engine.state='playing';prepare(engine,1);engine.lock();completeMilestone('tetris',engine.completed);
  assert.equal(engine.lines,51);assert.equal(gameProgress('tetris').medals,5);
  const restarted=new TetrisEngine();completeMilestone('tetris',restarted.completed);
  assert.equal(restarted.lines,0);assert.equal(restarted.score,0);assert.equal(restarted.state,'playing');assert.equal(gameProgress('tetris').medals,5);
});
test('Rotation and collision are constrained by the stack; top-out stops input and a fresh engine resets the board',()=>{
  const engine=new TetrisEngine();engine.piece={kind:5,matrix:SHAPES[5].map(row=>[...row]),x:3,y:4};
  const original=JSON.stringify(engine.piece.matrix);for(let i=0;i<4;i++)assert(engine.rotate());assert.equal(JSON.stringify(engine.piece.matrix),original);
  engine.board=Array.from({length:20},()=>Array(10).fill(7));engine.spawn();const x=engine.piece.x;
  assert.equal(engine.state,'over');assert.equal(engine.move(1),false);assert.equal(engine.rotate(),false);engine.hardDrop();assert.equal(engine.piece.x,x);
  const restarted=new TetrisEngine();assert.deepEqual(restarted.board,empty());assert.equal(restarted.state,'playing');
});
