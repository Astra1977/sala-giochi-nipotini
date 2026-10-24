/* Real Chromium integration tests, served below the GitHub Pages subdirectory.
   --fixture-home is an explicit, reported fallback when the immutable original binary is unavailable. */
const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),fixture=fs.mkdtempSync(path.join(os.tmpdir(),'sala-giochi-tests-'));
const site=path.join(fixture,'sala-giochi-nipotini');fs.mkdirSync(site);
const sourceArg=process.argv.find(x=>x.startsWith('--source='));
const source=sourceArg?path.resolve(sourceArg.slice(9)):root;
const before=process.argv.includes('--before');
const sw=fs.readFileSync(path.join(source,'sw.js'),'utf8');
const assets=JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1]);
let fixtureHome=false;
for(const file of [...assets,'sw.js']){
  const dest=path.join(site,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  if(file==='home.png'&&!fs.existsSync(path.join(source,file))&&process.argv.includes('--fixture-home')){
    fs.copyFileSync(path.join(source,'icons/icon-512.png'),dest);fixtureHome=true;
  }else fs.copyFileSync(path.join(source,file),dest);
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
  const url='http://127.0.0.1:'+server.address().port+'/sala-giochi-nipotini/';
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
  const output=path.join(root,'test-results','v81',before?'before':'after');fs.mkdirSync(output,{recursive:true});
  const errors=[],layouts=[];
  try{
    const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);await page.waitForFunction(()=>navigator.serviceWorker.controller);
    for(const width of [360,390,430,768,1280]){
      await page.setViewportSize({width,height:width===768?1024:width===1280?900:844});
      await page.evaluate(()=>{scrollTo(0,0);document.querySelector('.panorama').scrollLeft=0});
      const layout=await page.evaluate(()=>{
        const scene=document.querySelector('.illustratedScene'),image=scene.querySelector('img'),pan=document.querySelector('.panorama'),grid=document.querySelector('#gameGrid');
        const r=image.getBoundingClientRect(),p=pan.getBoundingClientRect();
        return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,panWidth:pan.clientWidth,panScroll:pan.scrollWidth,sceneWidth:scene.clientWidth,image:{left:r.left,right:r.right,width:r.width,height:r.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight},columns:getComputedStyle(grid).gridTemplateColumns,firstGame:document.querySelector('.gameCard').getBoundingClientRect().top,panTop:p.top};
      });layouts.push(layout);
      assert.equal(layout.overflow,false);
      if(!before&&width<701){
        assert.equal(layout.panScroll,layout.panWidth);assert(layout.image.left>=0&&layout.image.right<=width);
        assert.equal(layout.image.naturalWidth,1536);assert.equal(layout.image.naturalHeight,1024);
        assert(Math.abs(layout.image.width/layout.image.height-1.5)<.02);
        assert(layout.firstGame>=layout.panTop+layout.image.height);
        assert.equal(layout.columns.split(' ').length,width<410?2:3);
        for(const card of await page.locator('.gameCard').all()){const r=await card.boundingBox();assert(r.width>=48&&r.height>=48)}
      }
      if(width>=701)assert(layout.sceneWidth>=900);
      await page.screenshot({path:path.join(output,'home-'+width+'.png'),fullPage:true});
    }
    pass('Before/after screenshots at 360, 390, 430, 768 and 1280 px; full original image and no document overflow');
    if(before){fs.writeFileSync(path.join(output,'layouts.json'),JSON.stringify(layouts,null,2));return}
    await page.setViewportSize({width:844,height:390});
    assert(await page.locator('.panorama').evaluate(el=>el.scrollWidth===el.clientWidth),JSON.stringify(await page.evaluate(()=>({w:innerWidth,h:innerHeight,coarse:matchMedia('(pointer:coarse)').matches,mobile:matchMedia('(max-width:950px) and (max-height:500px) and (pointer:coarse)').matches,scene:document.querySelector('.illustratedScene').clientWidth,pan:document.querySelector('.panorama').clientWidth,scroll:document.querySelector('.panorama').scrollWidth}))));
    pass('Phone landscape uses responsive grid; tablet and desktop keep the panorama');
    await page.setViewportSize({width:390,height:844});
    await page.clock.install();
    await page.locator('.gameCard[data-game="tetris"]').tap();await page.clock.runFor(30);
    for(const name of ['← Sinistra','↻ Ruota','Destra →','↓ Scendi'])await page.getByRole('button',{name,exact:true}).tap();
    await page.clock.runFor(30);assert((await page.locator('#status').textContent()).match(/Punti [1-9]/));
    const cdp=await context.newCDPSession(page),soft=await page.getByRole('button',{name:'↓ Scendi',exact:true}).boundingBox();
    const score=Number((await page.locator('#status').textContent()).match(/Punti (\d+)/)[1]);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:soft.x+soft.width/2,y:soft.y+soft.height/2}]});await page.clock.runFor(800);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert(Number((await page.locator('#status').textContent()).match(/Punti (\d+)/)[1])>score);
    await page.getByRole('button',{name:'⇓ Giù subito',exact:true}).tap();
    await page.getByRole('button',{name:'Pausa',exact:true}).tap();const paused=await page.locator('#status').textContent();await page.clock.runFor(1500);assert.equal(await page.locator('#status').textContent(),paused);
    await page.getByRole('button',{name:'Riprendi',exact:true}).tap();await page.evaluate(()=>window.dispatchEvent(new Event('blur')));assert(await page.getByRole('button',{name:'Riprendi',exact:true}).isVisible());await page.getByRole('button',{name:'Riprendi',exact:true}).tap();
    for(let i=0;i<35&&!((await page.locator('#status').textContent()).includes('Fine partita'));i++)await page.getByRole('button',{name:'⇓ Giù subito',exact:true}).tap();assert((await page.locator('#status').textContent()).includes('Fine partita'));
    await page.locator('#restart').tap();assert((await page.locator('#status').textContent()).includes('Punti 0'));await page.locator('#back').tap();
    pass('Android-emulated native touch: five Tetris controls, held soft drop, pause/focus loss, top-out and restart');
    await context.setOffline(true);await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.gameCard').length===12);
    for(const id of ['town','car','roach','runner','forest','tetris','fruit','memory','ball','orchestra','maze','chameleon']){
      await page.locator('.gameCard[data-game="'+id+'"]').tap();await page.clock.runFor(20);assert(await page.locator('#play').evaluate(el=>el.children.length>0));await page.locator('#back').tap();
    }
    pass('All twelve game thumbnails remain accessible and games reopen offline on the responsive phone home');
    assert.deepEqual(errors,[]);pass('No JavaScript runtime errors');
    fs.writeFileSync(path.join(output,'layouts.json'),JSON.stringify(layouts,null,2));fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks:report,layouts},null,2));
    await context.close();
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{server.close();fs.rmSync(fixture,{recursive:true,force:true})});
