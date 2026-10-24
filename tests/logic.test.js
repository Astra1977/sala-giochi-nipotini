import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMaze } from '../js/games/exploration.js';
import { advanceBall } from '../js/games/ball.js';
import { record, saveBest, saveFewest, read, write, clearRecords } from '../js/storage.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Andrea original road engine and immutable home keep their upstream Git blob hashes',()=>{
  function gitHash(bytes){return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')}
  const vendor=fs.readFileSync(path.join(root,'js/vendor/andrea/road.js'),'utf8');
  const original=vendor.split('export function registerRoad(App, U, Sound, setTimeout) {\n')[1].replace(/\n}\n$/,'');
  assert.equal(gitHash(Buffer.from(original)),'4b88da0d15b44b3d66fb4208ad5c22762a1df829');
  if(fs.existsSync(path.join(root,'home.png')))assert.equal(gitHash(fs.readFileSync(path.join(root,'home.png'))),'8d2f2a2e58f65fff47f4eee65ba16fc5763d3563');
});
test('100 generated mazes at each difficulty are connected and have a reachable exit',()=>{
  for(const size of [9,11,13])for(let trial=0;trial<100;trial++){
    const map=createMaze(size),queue=[[1,1]],seen=new Set(['1,1']);
    for(let i=0;i<queue.length;i++){
      const [x,y]=queue[i];
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){
        const nx=x+dx,ny=y+dy,key=nx+','+ny;
        if(map[ny]?.[nx]&&map[ny][nx]!=='#'&&!seen.has(key)){seen.add(key);queue.push([nx,ny])}
      }
    }
    assert(seen.has((size-2)+','+(size-2)));
    assert.equal(seen.size,map.flat().filter(x=>x!=='#').length);
    assert(map[0].every(x=>x==='#'));assert(map.at(-1).every(x=>x==='#'));
  }
});
test('basketball scores a downward rim crossing, rejects upward and outside crossings',()=>{
  const hoop={x:300,y:150,width:90};
  assert.equal(advanceBall({x:340,y:148,vx:0,vy:100},.03,hoop,false),true);
  assert.equal(advanceBall({x:340,y:152,vx:0,vy:-100},.03,hoop,false),false);
  assert.equal(advanceBall({x:240,y:148,vx:0,vy:100},.03,hoop,false),false);
  assert.equal(advanceBall({x:340,y:148,vx:0,vy:100},.03,hoop,true),false);
});
test('a physically launched ball can score without a scripted success result',()=>{
  const ball={x:92,y:320,vx:280,vy:-520},hoop={x:335,y:150,width:95};
  let scored=false;
  for(let i=0;i<480;i++)scored=advanceBall(ball,1/240,hoop,scored)||scored;
  assert(scored);
});
test('records retain maximum score and minimum memory attempts even without storage',()=>{
  globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
  saveBest('test',40);saveBest('test',20);assert.equal(record('test'),40);
  saveFewest('memory_test',12);saveFewest('memory_test',9);saveFewest('memory_test',15);assert.equal(record('memory_test'),9);
  write('best_corrupt','invalid');assert.equal(record('corrupt'),0);
  clearRecords(['test','memory_test']);assert.equal(record('test'),0);
  write('favorites',['maze']);assert.deepEqual(read('favorites'),['maze']);
});
test('every runtime module, nested asset and icon is listed in the offline inventory',()=>{
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  const assets=JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
  for(const folder of ['js','css','icons']){
    for(const file of fs.readdirSync(path.join(root,folder),{recursive:true})){
      const name=folder+'/'+file;
      if(fs.statSync(path.join(root,name)).isFile())assert(assets.includes(name),'Not cached: '+name);
    }
  }
  for(const name of ['home.png','index.html','manifest.webmanifest','bea.png','biscotto.png','ricky.png'])assert(assets.includes(name));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');assert.equal(manifest.display,'standalone');
  for(const icon of manifest.icons){assert(assets.includes(icon.src.replace('./','')));assert(fs.existsSync(path.join(root,icon.src)))}
  for(const name of assets.filter(x=>/\.(js|css|html)$/.test(x))){
    const source=fs.readFileSync(path.join(root,name),'utf8');
    assert(!/(?:src|href)\s*=\s*["']https?:|url\(["']?https?:|fetch\(["']https?:/.test(source),'Remote dependency: '+name);
  }
});
