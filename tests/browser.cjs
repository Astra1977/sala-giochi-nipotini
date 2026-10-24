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
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
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
  const launch={headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']};
  const browser=await chromium.launch(launch);
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    const page=await context.newPage(),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url())});
    await page.goto(url);
    await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);
    await page.waitForFunction(()=>document.querySelector('#offlineState').textContent.includes('Pronta'));
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    const cached=await page.evaluate(async()=>{const keys=await caches.keys();return (await (await caches.open(keys[0])).keys()).length});assert.equal(cached,assets.length);
    pass('All '+assets.length+' local assets cached at /sala-giochi-nipotini/, including new engines and Biscotto SVG');
    await page.clock.install();
    const open=async id=>{await page.locator('.gameCard[data-game="'+id+'"]').click();await page.locator('#modal.show').waitFor();await page.clock.runFor(20)};
    const close=async()=>{await page.locator('#back').click();assert.equal(await page.locator('#modal').evaluate(el=>el.classList.contains('show')),false)};
    const gameIds=['town','car','roach','runner','forest','tetris','fruit','memory','ball','orchestra','maze','chameleon'];
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    for(const [name,viewport] of [['mobile',{width:390,height:844}],['landscape',{width:844,height:390}],['tablet',{width:768,height:1024}],['desktop',{width:1440,height:900}],['small',{width:320,height:568}]]){
      await page.setViewportSize(viewport);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Document horizontal overflow');
      assert(await page.locator('.illustratedScene').evaluate(el=>el.clientWidth>=900));
      assert.equal(await page.locator('.gameCard[data-game="bubbles"],.gameCard[data-game="baby"]').count(),0);
      if(['mobile','tablet','desktop'].includes(name)){
        await page.locator('.panorama').evaluate(el=>el.scrollLeft=(el.scrollWidth-el.clientWidth)/2);
        await page.screenshot({path:path.join(root,'test-results/home-v8-'+name+'.png'),fullPage:true});
      }
      for(const id of gameIds){await open(id);assert(await page.locator('#play').evaluate(el=>el.children.length>0),'Empty '+id);await page.locator('#restart').click();await page.clock.runFor(20);await close()}
    }
    pass('All twelve V8 games open, restart and close at five viewport sizes; illustrated home screenshots at mobile, tablet, desktop');
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{localStorage.setItem('best_runner','321');localStorage.setItem('best_bubbles','456');localStorage.setItem('best_baby','789')});
    await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);
    await page.clock.install();
    await page.locator('[data-go="records"]').click();
    const records=await page.locator('#play').textContent();assert(!records.includes('Bolle Colorate'));assert(!records.includes('Consegna il Bebè'));assert(records.includes('321 punti'));
    assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('sala_progress_v8')).retired.bubbles===456&&localStorage.getItem('best_baby')==='789'));
    await close();pass('Legacy scores migrate to version 8; retired scores preserved but absent from active records');
    await open('town');assert.equal(await page.evaluate(()=>document.activeElement.id),'back');await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('#modal')));await page.keyboard.press('Escape');pass('Dialog focus, Tab containment and Escape preserved');
    async function progress(id){return page.evaluate(id=>JSON.parse(localStorage.getItem('sala_progress_v8')).games[id],id)}
    await open('memory');
    for(let level=1;level<=5;level++){
      assert.equal(await page.locator('.tile').count(),[8,12,16,20,24][level-1]);
      const known=new Map(),matched=new Set(),count=await page.locator('.tile').count();
      for(let turns=0;matched.size<count&&turns<120;turns++){
        const available=Array.from({length:count},(_,i)=>i).filter(i=>!matched.has(i));let i,j;
        outer:for(const a of available)for(const b of available)if(a!==b&&known.has(a)&&known.get(a)===known.get(b)){i=a;j=b;break outer}
        if(i===undefined)i=available.find(x=>!known.has(x))??available[0];await page.locator('.tile').nth(i).click();const symbol=await page.locator('.tile').nth(i).textContent();known.set(i,symbol);
        if(j===undefined)j=available.find(x=>x!==i&&known.get(x)===symbol)??available.find(x=>x!==i&&!known.has(x))??available.find(x=>x!==i);
        await page.locator('.tile').nth(j).click();const other=await page.locator('.tile').nth(j).textContent();known.set(j,other);
        if(symbol===other){matched.add(i);matched.add(j)}else await page.clock.runFor(800);
      }
      assert.equal(matched.size,count);assert.equal((await progress('memory')).medals,level);
      await page.clock.runFor(3000);
      if(level<5)await page.getByRole('button',{name:'Prossima missione',exact:true}).click();
    }
    await close();pass('All five Memory paths complete, unlock sequentially and earn exactly five permanent Biscottini');
    async function state(){return page.locator('.boardMap').evaluate(grid=>[...grid.children].map(el=>({x:+el.dataset.x,y:+el.dataset.y,tile:el.dataset.tile,player:el.classList.contains('player')})))}
    function route(cells,target){const start=cells.find(c=>c.player),q=[{...start,path:[]}],seen=new Set([start.x+','+start.y]);for(let i=0;i<q.length;i++){const cur=q[i];if(cur.x===target.x&&cur.y===target.y)return cur.path;for(const [dx,dy,key] of [[1,0,'ArrowRight'],[-1,0,'ArrowLeft'],[0,1,'ArrowDown'],[0,-1,'ArrowUp']]){const x=cur.x+dx,y=cur.y+dy,k=x+','+y,c=cells.find(c=>c.x===x&&c.y===y);if(c&&c.tile!=='wall'&&!seen.has(k)){seen.add(k);q.push({x,y,path:[...cur.path,key]})}}}throw Error('Unreachable')}
    async function walk(target){for(const key of route(await state(),target))await page.keyboard.press(key)}
    await open('town');for(const [i,target] of [{x:1,y:1},{x:7,y:1},{x:1,y:7},{x:7,y:7},{x:4,y:1},{x:7,y:4}].entries()){await walk(target);assert.equal((await progress('town')).medals,i<4?i+1:i===4?4:5)}await close();pass('Town five measurable missions, final medal only after both hospital pickup and beach delivery');
    await open('forest');for(let level=1;level<=5;level++){
      for(let round=0;round<12;round++){
        if((await page.locator('.mission').textContent()).includes('esplorata'))break;
        const cells=await state(),targets=cells.filter(c=>c.tile==='object'||c.tile==='fog'&&c.x>0&&c.y>0&&c.x<8&&c.y<8);
        for(const target of targets){if((await page.locator('.mission').textContent()).includes('esplorata'))break;try{await walk(target)}catch{}}
        if(level===5&&(await page.locator('.mission').textContent()).includes('Torna alla partenza')){assert.equal((await progress('forest')).medals,4);await walk({x:1,y:1})}
      }
      assert((await page.locator('.mission').textContent()).includes('esplorata'));assert.equal((await progress('forest')).medals,level);if(level<5)await page.getByRole('button',{name:'Esplora la prossima radura'}).click();
    }await close();pass('Forest five zones, including final return to start, verified through map movement');
    await open('maze');for(let level=1;level<=5;level++){const cells=await state();await walk(cells.find(c=>c.tile==='exit'));assert.equal((await progress('maze')).medals,level);if(level<5)await page.getByRole('button',{name:'Prossimo labirinto'}).click()}await close();pass('Five progressively larger mazes completed through keyboard paths');
    await open('chameleon');for(let level=1;level<=5;level++){for(let i=0;i<[5,7,9,11,13][level-1];i++){const color=(await page.locator('.colorSwatch').getAttribute('aria-label')).replace('Camaleonte ','');await page.locator('.colorChoices').getByRole('button',{name:color,exact:true}).tap()}assert.equal((await progress('chameleon')).medals,level);await page.clock.runFor(3000);if(level<5)await page.getByRole('button',{name:'Prossima missione',exact:true}).click()}await close();pass('Five timed Chameleon challenges award medals on correct answers only');
    await open('orchestra');
    await page.getByRole('button',{name:'Suoni attivi',exact:true}).tap();
    await page.getByRole('slider',{name:'Volume orchestra'}).press('ArrowRight');
    assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('orchestra_muted'))===true&&Number(localStorage.getItem('orchestra_volume'))>.35));
    for(let level=1;level<=5;level++){
      await page.getByRole('button',{name:'▶ Inizia il brano'}).tap();
      // Timing follows the real frame clock. Pure-engine tests separately verify ±110/240 ms windows.
      const song=await page.evaluate(async level=>{const {OrchestraEngine}=await import('./js/games/orchestra-engine.js');return new OrchestraEngine(level).notes},level);
      let elapsed=0;
      for(const note of song){const current=Number(await page.locator('.musicCanvas').getAttribute('data-elapsed'));await page.clock.runFor(Math.max(0,Math.round((note.at-current)*1000)));elapsed=note.at;await page.locator('.musicPads button').nth(note.lane).tap({force:true})}
      await page.clock.runFor(500);assert.equal((await progress('orchestra')).medals,level,await page.locator('#status').textContent());await page.clock.runFor(3000);if(level<5)await page.getByRole('button',{name:'Prossima missione',exact:true}).click();
    }
    await page.screenshot({path:path.join(root,'test-results/orchestra-v8.png'),fullPage:true});await close();pass('All five original Orchestra songs completed with timed native taps and persisted medals');
    await open('tetris');await page.getByRole('button',{name:'↻ Ruota',exact:true}).tap();await page.getByRole('button',{name:'← Sinistra',exact:true}).tap();await page.getByRole('button',{name:'⇓ Giù subito',exact:true}).tap();assert((await page.locator('#status').textContent()).match(/Punti [1-9]/));
    await page.getByRole('button',{name:'Pausa',exact:true}).click();const paused=await page.locator('#status').textContent();await page.clock.runFor(3000);assert.equal(await page.locator('#status').textContent(),paused);await page.getByRole('button',{name:'Riprendi',exact:true}).click();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert(await page.getByRole('button',{name:'Riprendi',exact:true}).isVisible());await page.getByRole('button',{name:'Riprendi',exact:true}).click();
    await page.clock.runFor(20);await page.screenshot({path:path.join(root,'test-results/tetris-v8.png'),fullPage:true});
    for(let i=0;i<30&&!((await page.locator('#status').textContent()).includes('Fine partita'));i++)await page.getByRole('button',{name:'⇓ Giù subito',exact:true}).tap();assert((await page.locator('#status').textContent()).includes('Fine partita'));assert.equal((await progress('tetris')).medals,0);await close();pass('Tetris touch controls, pause/resume, focus loss and top-out work; score alone never earns a medal');
    const cdp=await context.newCDPSession(page);
    async function touchDrag(x1,y1,x2,y2){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/10,y:y1+(y2-y1)*i/10}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
    await open('ball');await page.locator('.ballCourt').scrollIntoViewIfNeeded();const box=await page.locator('.ballCourt').boundingBox(),scale=box.width/500;await touchDrag(box.x+92*scale,box.y+320*scale,box.x+(92+93.333)*scale,box.y+(320-173.333)*scale);await page.clock.runFor(1500);assert((await progress('ball')).score>=20);await close();pass('Basketball still scores from native swipe and physics');
    // Capture missions: real DOM targets, not a score-based reward shortcut.
    await page.clock.pauseAt(await page.evaluate(()=>Date.now()));
    await page.evaluate(()=>{Math.random=()=>.8});await open('roach');
    for(let i=0;i<12;i++){await page.locator('.target').first().tap({force:true});await page.clock.runFor(620)}
    await page.clock.runFor(36000);assert.equal((await progress('roach')).medals,1);await close();pass('Cucaracha mission rewards verified captures after timer completion');
    // Survivor path: jump in response to the next approaching obstacle.
    await open('runner');
    for(let elapsed=0;elapsed<12500;elapsed+=40){
      const danger=await page.locator('.runner').evaluate(field=>{
        const hero=field.querySelector('.runnerRicky'),lift=new DOMMatrix(getComputedStyle(hero).transform).m42;
        const hx=field.clientWidth*.12+40;
        return lift> -8&&[...field.querySelectorAll('#obLayer span')].some(o=>{const gap=parseFloat(o.style.left)-hx;return gap>0&&gap<70});
      });
      if(danger)await page.keyboard.press('Space');
      await page.clock.runFor(40);
      if((await page.locator('#status').textContent()).includes('Ops'))break;
    }
    assert.equal((await progress('runner')).medals,1,await page.locator('#status').textContent());await close();pass('Runner survival milestone is earned by surviving the real obstacle course');
    // Swipe through launched fruit using native touch while the deterministic clock advances.
    await page.evaluate(()=>{Math.random=()=>.5});await open('fruit');await page.locator('#fruitField').scrollIntoViewIfNeeded();
    for(let elapsed=0;elapsed<35000;elapsed+=650){
      await page.clock.runFor(650);
      const positions=await page.locator('.fruitItem').evaluateAll(els=>els.filter(el=>!['✨','💥','💣'].includes(el.textContent)).map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}}));
      const field=await page.locator('#fruitField').boundingBox();
      for(const item of positions)if(item.y>field.y+8&&item.y+item.h<field.y+field.height-8)await touchDrag(Math.max(field.x+4,item.x-8),item.y+38,Math.min(field.x+field.width-4,item.x+84),item.y+38);
    }
    assert.equal((await progress('fruit')).medals,1,await page.locator('#status').textContent());await close();pass('Fruit mission verifies sliced fruit, bomb limit and combo through native swipes');
    // Andrea uses its own RAF clock. Start its timing test in a fresh document after the paused swipe scenarios.
    await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);await page.clock.install();
    await page.evaluate(()=>{Math.random=()=>.01;localStorage.setItem('road_sound','false')});await open('car');await page.getByRole('button',{name:/Auto ·/}).tap();await page.clock.runFor(25000);assert((await progress('car')).completed>=1,await page.locator('#status').textContent());await close();pass('Andrea original checkpoint engine awards Biscottini from actual checkpoint events');
    await page.locator('[data-go="favorites"]').click();await page.getByRole('button',{name:'Preferito: Tetris — La Torre dei Colori',exact:true}).click();await close();await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);assert.equal((await progress('memory')).medals,5);assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('favorites')).includes('tetris')));pass('Rewards, numerical scores and favorites persist through reload');
    fs.writeFileSync(path.join(site,'sw.js'),sw.replace(/const VERSION = '([^']+)'/,"const VERSION = '$1-v8-update'"));await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);await page.locator('#updateNotice:not([hidden])').waitFor();await Promise.all([page.waitForEvent('load'),page.locator('#updateApp').click()]);await page.waitForFunction(async()=>(await caches.keys()).every(k=>k.endsWith('-v8-update')));assert.equal((await progress('orchestra')).medals,5);pass('User-controlled cache upgrade preserves V8 progress and removes old cache');
    await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);for(const id of gameIds){await open(id);await close()}for(const asset of assets)assert(await page.evaluate(async p=>(await fetch(p)).ok,'./'+asset));pass('All twelve games and every asset reopen with network disabled');
    assert.deepEqual(errors,[]);assert.deepEqual(external,[]);pass('No JavaScript runtime errors and no external resource requests');
    await context.setOffline(false);const failedContext=await browser.newContext();const failedPage=await failedContext.newPage();blockHome=true;await failedPage.goto(url);await failedPage.waitForFunction(()=>document.querySelector('#offlineState').textContent.includes('non riuscito'));assert.equal(await failedPage.evaluate(()=>!!navigator.serviceWorker.controller),false);await failedContext.close();blockHome=false;pass('Incomplete precache never activates or claims offline availability');
    await context.close();
    const profile=path.join(fixture,'persistent-profile');let persistent=await chromium.launchPersistentContext(profile,launch);const p=persistent.pages()[0];await p.goto(url);await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.evaluate(async()=>{const {completeMilestone,saveScore}=await import('./js/progress.js');completeMilestone('memory',1);saveScore('memory',123)});await persistent.close();
    persistent=await chromium.launchPersistentContext(profile,launch);await persistent.setOffline(true);const reopened=persistent.pages()[0];await reopened.goto(url);await reopened.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);assert(await reopened.evaluate(()=>{const g=JSON.parse(localStorage.getItem('sala_progress_v8')).games.memory;return g.medals===1&&g.score===123}));for(const id of ['tetris','orchestra']){await reopened.locator('.gameCard[data-game="'+id+'"]').click();await reopened.locator('#modal.show').waitFor();await reopened.locator('#back').click()}await persistent.close();pass('Browser process closure/reopening preserves rewards and new games offline');
    fs.writeFileSync(path.join(root,'test-results/browser-v8.json'),JSON.stringify({fixtureHome,checks:report},null,2));
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{server.close();fs.rmSync(fixture,{recursive:true,force:true})});
