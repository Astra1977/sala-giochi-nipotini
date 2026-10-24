/* Real Chromium integration tests, served below the GitHub Pages subdirectory.
   --fixture-home is an explicit, reported fallback when the immutable original binary is unavailable. */
const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'sala-giochi-tests-'));
const site=path.join(fixture,'sala-giochi-nipotini');fs.mkdirSync(site);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const assets=JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
let fixtureHome=false;
for(const file of [...assets,'sw.js']){
  const dest=path.join(site,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  if(file==='home.png'&&!fs.existsSync(path.join(root,file))&&process.argv.includes('--fixture-home')){
    fs.copyFileSync(path.join(root,'icons/icon-512.png'),dest);fixtureHome=true;
  }else fs.copyFileSync(path.join(root,file),dest);
}
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json'};
let blockHome=false;
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.join(fixture,pathname.endsWith('/')?pathname+'index.html':pathname);
  if(!file.startsWith(fixture+path.sep)||!fs.existsSync(file)||(blockHome&&file.endsWith('home.png'))){res.writeHead(404);res.end('Missing');return}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(fs.readFileSync(file));
});
const report=[];
function pass(message){report.push(message);console.log('PASS',message)}
async function main(){
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port,url=origin+'/sala-giochi-nipotini/';
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);
    await page.waitForFunction(()=>document.querySelector('#offlineState').textContent.includes('Pronta'));
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    const cached=await page.evaluate(async()=>{const keys=await caches.keys();const cache=await caches.open(keys[0]);return (await cache.keys()).map(x=>new URL(x.url).pathname)});
    assert.equal(cached.length,assets.length);
    for(const file of assets)assert(cached.includes('/sala-giochi-nipotini/'+file));
    pass('All '+assets.length+' runtime assets cached under /sala-giochi-nipotini/');
    const open=async id=>{await page.locator('.gameCard[data-game="'+id+'"]').click();await page.locator('#modal.show').waitFor()};
    const close=async()=>{await page.locator('#back').click();assert.equal(await page.locator('#modal').evaluate(el=>el.classList.contains('show')),false)};
    for(const viewport of [{width:390,height:844},{width:844,height:390},{width:768,height:1024},{width:1440,height:900},{width:320,height:568}]){
      await page.setViewportSize(viewport);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+JSON.stringify(viewport));
      for(const id of ['roach','runner','fruit','memory','bubbles','town','car','forest','baby','ball','maze','chameleon']){
        await open(id);
        assert(await page.locator('#play').evaluate(el=>el.children.length>0),'Empty game '+id);
        assert(await page.locator('#back').isVisible());
        await page.locator('#restart').click();
        await close();
      }
    }
    pass('All 12 tiles open/close; 12 games restart at five mobile, tablet, landscape and desktop sizes');
    await page.setViewportSize({width:390,height:844});
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    await page.screenshot({path:path.join(root,'test-results/home-mobile.png'),fullPage:true});
    // Accessible modal focus and Escape.
    await open('town');assert.equal(await page.evaluate(()=>document.activeElement.id),'back');
    await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.activeElement.closest('#modal')!==null));
    await page.keyboard.press('Escape');assert(await page.evaluate(()=>document.activeElement.classList.contains('gameCard')));
    pass('Dialog focus containment, Escape and return focus');
    // Memory uses the real shuffled deck. Discover pairs through the UI.
    await open('memory');
    for(const difficulty of ['easy','medium','hard']){
      await page.locator('#memoryLevel').selectOption(difficulty);
      const known=new Map(),matched=new Set();
      const count=await page.locator('.tile').count();
      for(let turns=0;matched.size<count&&turns<100;turns++){
        const available=Array.from({length:count},(_,x)=>x).filter(x=>!matched.has(x));
        let i,j;
        outer: for(const a of available)for(const b of available)if(a!==b&&known.has(a)&&known.get(a)===known.get(b)){i=a;j=b;break outer}
        if(i===undefined)i=available.find(x=>!known.has(x))??available[0];
        await page.locator('.tile').nth(i).click();
        const symbol=await page.locator('.tile').nth(i).textContent();known.set(i,symbol);
        if(j===undefined)j=available.find(x=>x!==i&&known.get(x)===symbol)??available.find(x=>x!==i&&!known.has(x))??available.find(x=>x!==i);
        assert.notEqual(j,undefined);
        await page.locator('.tile').nth(j).click();
        const other=await page.locator('.tile').nth(j).textContent();known.set(j,other);
        if(symbol===other){matched.add(i);matched.add(j)}else await page.waitForTimeout(790);
      }
      assert.equal(await page.locator('.tile.matched').count(),count);
      assert(await page.evaluate(key=>Number(localStorage.getItem('best_memory_'+key))>0,difficulty));
    }
    await close();pass('Memory completes and persists minimum attempts at all three difficulties');
    // Read rendered world cells and solve through keyboard events, never internal game functions.
    async function worldState(){
      return page.locator('.boardMap').evaluate(grid=>{
        const cells=[...grid.children].map(el=>({x:Number(el.dataset.x),y:Number(el.dataset.y),tile:el.dataset.tile,player:el.classList.contains('player')}));
        return{size:Math.sqrt(cells.length),cells};
      });
    }
    function route(state,target,blocked=new Set(['wall'])){
      const start=state.cells.find(x=>x.player),queue=[{...start,path:[]}],seen=new Set([start.x+','+start.y]);
      for(let i=0;i<queue.length;i++){
        const cur=queue[i];if(cur.x===target.x&&cur.y===target.y)return cur.path;
        for(const [dx,dy,key] of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']]){
          const x=cur.x+dx,y=cur.y+dy,k=x+','+y,c=state.cells.find(c=>c.x===x&&c.y===y);
          if(c&&!blocked.has(c.tile)&&!seen.has(k)){seen.add(k);queue.push({x,y,path:[...cur.path,key]})}
        }
      }throw Error('Unreachable '+JSON.stringify(target));
    }
    async function walkTo(target){for(const key of route(await worldState(),target))await page.keyboard.press(key)}
    await open('town');
    for(const target of [{x:1,y:1},{x:7,y:1},{x:1,y:7},{x:7,y:7},{x:4,y:1},{x:7,y:4}])await walkTo(target);
    assert((await page.locator('#status').textContent()).includes('Missioni completate'));await close();
    pass('Mini Town completes six pickup/delivery missions through the map');
    await open('forest');
    for(let level=1;level<=3;level++){
      // Explore every reachable coordinate. Fog is traversable until a tree is revealed.
      for(let round=0;round<10;round++){
        const st=await worldState();
        const targets=st.cells.filter(c=>c.tile==='object'||c.tile==='fog'&&(c.x>0&&c.y>0&&c.x<8&&c.y<8));
        if(!targets.length)break;
        let moved=false;
        for(const target of targets){
          if((await page.locator('.mission').textContent()).includes('esplorata'))break;
          try{await walkTo(target);moved=true}catch{}
        }
        if((await page.locator('.mission').textContent()).includes('esplorata'))break;
        if(!moved)break;
      }
      assert((await page.locator('.mission').textContent()).includes('esplorata'));
      if(level<3)await page.getByRole('button',{name:'Esplora la prossima radura'}).click();
    }
    await close();pass('Forest exploration collects objects across all three levels');
    await open('maze');
    for(let level=1;level<=3;level++){
      const state=await worldState(),exit=state.cells.find(c=>c.tile==='exit');
      for(const key of route(state,exit))await page.keyboard.press(key);
      assert((await page.locator('.mission').textContent()).includes('Uscita trovata'));
      if(level<3)await page.getByRole('button',{name:'Prossimo labirinto'}).click();
    }
    await close();pass('Three generated mazes solved with real input and wall collisions');
    await open('baby');
    // Plan in (x,y,move count) space to account for moving scooters.
    let moveCount=0;
    async function safeWalk(target){
      const state=await worldState(),start=state.cells.find(c=>c.player);
      const text=await page.locator('#status').textContent(),level=Number(text.match(/Livello (\d)/)[1]);
      const period=4+level;
      const hazards=t=>[{x:2+t%period,y:2},{x:6-(t+2)%period,y:6}];
      const queue=[{x:start.x,y:start.y,t:moveCount,path:[]}],seen=new Set();
      let plan;
      for(let i=0;i<queue.length;i++){
        const cur=queue[i];if(cur.x===target.x&&cur.y===target.y){plan=cur.path;break}
        for(const [dx,dy,key] of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']]){
          const x=cur.x+dx,y=cur.y+dy,k=x+','+y+','+((cur.t+1)%period);
          const cell=state.cells.find(c=>c.x===x&&c.y===y);
          if(!cell||cell.tile==='wall'||seen.has(k)||[...hazards(cur.t),...hazards(cur.t+1)].some(h=>h.x===x&&h.y===y))continue;
          seen.add(k);queue.push({x,y,t:cur.t+1,path:[...cur.path,key]});
        }
      }
      assert(plan,'Safe delivery route');for(const key of plan){await page.keyboard.press(key);moveCount++}
    }
    for(let delivery=0;delivery<9;delivery++){
      if(delivery)await safeWalk({x:1,y:7});
      await safeWalk([{x:7,y:1},{x:7,y:7},{x:1,y:1}][delivery%3]);
    }
    assert((await page.locator('.mission').textContent()).includes('Nove bebè'));
    await close();pass('Nine baby deliveries across three levels with scooter avoidance');
    // Native touch sequences through Chrome DevTools, not a click substitute.
    const cdp=await context.newCDPSession(page);
    async function touchDrag(x1,y1,x2,y2){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
      for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/10,y:y1+(y2-y1)*i/10}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await open('maze');const gridBox=await page.locator('.boardMap').boundingBox();
    const before=await worldState(),pos=before.cells.find(c=>c.player);
    const exit=before.cells.find(c=>c.tile==='exit'),first=route(before,exit)[0],d={ArrowRight:[60,0],ArrowLeft:[-60,0],ArrowUp:[0,-60],ArrowDown:[0,60]}[first];
    await touchDrag(gridBox.x+gridBox.width/2,gridBox.y+gridBox.height/2,gridBox.x+gridBox.width/2+d[0],gridBox.y+gridBox.height/2+d[1]);
    assert.notDeepEqual((await worldState()).cells.find(c=>c.player),pos);await close();
    pass('Maze swipe uses native touchscreen input');
    await open('ball');await page.locator('.ballCourt').scrollIntoViewIfNeeded();
    const box=await page.locator('.ballCourt').boundingBox(),scale=box.width/500;
    await touchDrag(box.x+92*scale,box.y+320*scale,box.x+(92+93.333)*scale,box.y+(320-173.333)*scale);
    await page.waitForFunction(()=>Number(localStorage.getItem('best_ball'))>=20,{},{timeout:6000});
    await close();pass('Native touch drag launches a physical basketball and scores');
    await open('fruit');await page.locator('#fruitField').scrollIntoViewIfNeeded();
    let sliced=false;
    for(let attempt=0;attempt<15&&!sliced;attempt++){
      await page.waitForTimeout(150);
      const items=await page.locator('.fruitItem').evaluateAll(els=>els.filter(e=>!['💣','✨','💥'].includes(e.textContent)).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));
      const field=await page.locator('#fruitField').boundingBox();
      const item=items.find(r=>r.y>field.y+20&&r.y+r.h<field.y+field.height-20);
      if(!item)continue;
      await touchDrag(Math.max(field.x+5,item.x-20),item.y+38,Math.min(field.x+field.width-5,item.x+95),item.y+38);
      sliced=await page.locator('#status').textContent().then(t=>/Punti: [1-9]/.test(t));
    }
    assert(sliced,'Fruit responds to swipe');
    await close();pass('Fruit slicing responds to a native touch swipe');
    await open('runner');await page.getByRole('button',{name:'⬆ SALTA!'}).tap();await page.waitForTimeout(150);
    const lift=await page.locator('.runnerRicky').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m42);assert(lift<0);
    await close();pass('Full SVG cat jumps on touch');
    await open('bubbles');
    await page.waitForFunction(()=>{const b=document.querySelector('.bubble'),f=document.querySelector('.bubbleField');return b&&b.getBoundingClientRect().bottom<f.getBoundingClientRect().bottom-3});
    const bubbleBox=await page.locator('.bubble').first().boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bubbleBox.x+bubbleBox.width/2,y:bubbleBox.y+bubbleBox.height/2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert((await page.locator('#status').textContent()).includes('Bolle 1'));await close();pass('Bubbles score from touch');
    await open('chameleon');
    for(let turn=0;turn<15;turn++){
      const color=(await page.locator('.colorSwatch').getAttribute('aria-label')).replace('Camaleonte ','');
      await page.locator('.colorChoices').getByRole('button',{name:color,exact:true}).tap();
    }
    assert((await page.locator('.mission').textContent()).includes('Quindici'));await close();pass('Chameleon completes timed progression over three levels');
    // Original OutRun integration: deterministic straight road for reproducible checkpoint timing.
    // Integrity tests separately verify that curves/hills are Andrea's unchanged algorithm.
    await page.clock.install();
    await page.evaluate(()=>{Math.random=()=>.01;localStorage.setItem('road_sound','false')});
    for(const vehicle of ['Moto','Auto','Camion']){
      await open('car');
      await page.getByRole('button',{name:new RegExp(vehicle+' ·')}).tap();
      await page.clock.runFor(3300);
      assert.equal(await page.locator('.roadStage').getAttribute('data-running'),'true');
      if(vehicle==='Auto'){
        await page.clock.runFor(21000);
        assert(/Livello [2-9]/.test(await page.locator('#status').textContent()),'Original checkpoint adds a level');
        assert(await page.evaluate(()=>Number(localStorage.getItem('best_car'))>=100));
        const canvas=await page.locator('.roadCanvas').boundingBox();
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:canvas.x+30,y:canvas.y+canvas.height-40}]});
        await page.clock.runFor(400);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.screenshot({path:path.join(root,'test-results/corsa-su-strada.png'),fullPage:true});
      }
      await close();
    }
    pass('Original OutRun starts all three vehicles, runs checkpoints, accepts held touch and stores records');
    // Clock acceleration tests end-of-game persistence and cleanup.
    await page.evaluate(()=>{Math.random=()=>.1});
    await open('roach');const boss=page.locator('.boss');await boss.waitFor();
    for(let hit=1;hit<=4;hit++){await boss.click();assert.equal(await boss.count(),1);assert((await boss.textContent()).includes((5-hit)+' colpi'))}
    await boss.click();assert.equal(await boss.count(),0);
    await page.clock.runFor(36000);
    assert(await page.evaluate(()=>Number(localStorage.getItem('best_roach'))>=150));
    await close();const stable=await page.locator('#status').textContent();await page.clock.fastForward(5000);assert.equal(await page.locator('#status').textContent(),stable);
    pass('Same boss takes five hits; timer stores score; exit cancels timers');
    // Preferences and records survive reload.
    await page.locator('[data-go="favorites"]').click();
    await page.getByRole('button',{name:'Preferito: Labirinto',exact:true}).click();
    await close();await page.reload();
    assert.equal(await page.locator('.gameCard').first().getAttribute('data-game'),'maze');
    assert(await page.evaluate(()=>Number(localStorage.getItem('best_ball'))>=20));
    pass('Records and favorites survive reload');
    // Update cache lifecycle: existing game continues until the user chooses update.
    fs.writeFileSync(path.join(site,'sw.js'),sw.replace(/const VERSION = '([^']+)'/,"const VERSION = '$1-update-test'"));
    await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update()});
    await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
    await page.locator('#updateNotice:not([hidden])').waitFor();
    await Promise.all([page.waitForEvent('load'),page.locator('#updateApp').click()]);
    await page.waitForFunction(async()=>(await caches.keys()).every(k=>k.endsWith('-update-test')));
    pass('Update waits for user action, reloads and removes old cache');
    await context.setOffline(true);await page.reload();
    await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);
    await open('memory');await page.locator('.tile').first().tap();await close();
    const offlinePage=await context.newPage();await offlinePage.goto(url);await offlinePage.locator('.gameCard[data-game="forest"]').click();await offlinePage.locator('.boardMap').waitFor();await offlinePage.close();
    for(const file of assets)assert(await page.evaluate(async path=>(await fetch(path)).ok,'./'+file));
    pass('Offline reload, new window and all cached resource requests work');
    assert.deepEqual(errors,[]);pass('No JavaScript runtime errors');
    // Failed install must not claim offline readiness or activate a partial cache.
    await context.setOffline(false);
    const failedContext=await browser.newContext(),failedPage=await failedContext.newPage();blockHome=true;
    await failedPage.goto(url);
    await failedPage.waitForFunction(()=>document.querySelector('#offlineState').textContent.includes('non riuscito'));
    assert.equal(await failedPage.evaluate(()=>!!navigator.serviceWorker.controller),false);
    pass('Missing required asset prevents offline-ready claim and worker activation');
    await failedContext.close();await context.close();blockHome=false;
    const profile=path.join(fixture,'persistent-profile');
    const options={headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']};
    let persistent=await chromium.launchPersistentContext(profile,options);
    await persistent.pages()[0].goto(url);
    await persistent.pages()[0].waitForFunction(()=>navigator.serviceWorker.controller);
    await persistent.close();
    persistent=await chromium.launchPersistentContext(profile,options);
    await persistent.setOffline(true);
    await persistent.pages()[0].goto(url);
    await persistent.pages()[0].locator('.gameCard[data-game="car"]').click();
    await persistent.pages()[0].getByRole('button',{name:/Auto ·/}).waitFor();
    await persistent.close();
    pass('Offline resources and original road intro survive closing and reopening the browser process');
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    fs.writeFileSync(path.join(root,'test-results/browser.json'),JSON.stringify({fixtureHome,checks:report},null,2));
    console.log(fixtureHome?'LIMIT: home.png was a test-only stand-in; original artwork was not inspected.':'Original home.png included in offline test.');
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{server.close();fs.rmSync(fixture,{recursive:true,force:true})});
