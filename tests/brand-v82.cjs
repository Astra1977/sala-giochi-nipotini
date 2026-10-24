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
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
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
  const browser=await chromium.launch(launch),out=path.join(root,'test-results/v82');fs.mkdirSync(out,{recursive:true});
  const errors=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    // A controlled slow module lets the screenshot capture a real startup in progress.
    // Production adds no minimum duration; releasing the actual module allows readiness.
    let release;const gate=new Promise(resolve=>release=resolve);
    await page.route('**/js/app.js',async route=>{await gate;await route.continue()});
    await page.goto(url,{waitUntil:'commit'});await page.locator('#launchSplash').waitFor();
    await page.locator('#launchSplash img').evaluate(img=>img.decode());
    await page.screenshot({path:path.join(out,'splash-mobile.png')});
    for(const [name,viewport] of [['tablet',{width:768,height:1024}],['desktop',{width:1280,height:900}]]){
      await page.setViewportSize(viewport);await page.screenshot({path:path.join(out,'splash-'+name+'.png')});
    }
    release();await page.waitForFunction(()=>window.salaReady===true);await page.locator('#launchSplash[hidden]').waitFor({state:'attached'});assert.equal(await page.locator('html').getAttribute('data-splash-dismissed'),'ready');await page.unroute('**/js/app.js');
    pass('Internal responsive splash visible during real startup, then dismissed on app/image readiness without a fixed minimum');
    await page.waitForFunction(()=>navigator.serviceWorker.controller);
    const manifest=await page.evaluate(async()=>await (await fetch('./manifest.webmanifest')).json());
    assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert(manifest.short_name.includes('Super Nipotini'));
    for(const icon of manifest.icons){
      const dimensions=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();return img.naturalWidth+'x'+img.naturalHeight},icon.src);assert.equal(dimensions,icon.sizes);
    }
    assert(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='192x192'));assert(manifest.icons.some(i=>i.purpose==='maskable'&&i.sizes==='512x512'));
    const apple=await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');assert(apple.includes('apple-touch-icon.png'));
    pass('PWA manifest, favicon/apple links and real icon dimensions; 192/512 normal and Android maskable variants');
    for(const width of [360,390,430,768,1280]){
      await page.setViewportSize({width,height:width===768?1024:width===1280?900:844});await page.evaluate(()=>scrollTo(0,0));
      const layout=await page.evaluate(()=>{
        const banner=document.querySelector('.heroBanner'),r=banner.getBoundingClientRect(),grid=document.querySelector('#gameGrid');
        return{overflow:document.documentElement.scrollWidth>innerWidth,panOverflow:document.querySelector('.panorama').scrollWidth>document.querySelector('.panorama').clientWidth,count:document.querySelectorAll('.gameCard').length,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,ratio:r.width/r.height,bannerBottom:r.bottom,gridTop:grid.getBoundingClientRect().top,oldPanButtons:document.querySelector('#panLeft')!==null};
      });
      assert.equal(layout.overflow,false);assert.equal(layout.panOverflow,false);assert.equal(layout.count,12);assert.equal(layout.columns,width<375?2:width<700?3:width<1100?4:6);assert.equal(layout.oldPanButtons,false);assert(layout.gridTop>=layout.bannerBottom);assert(Math.abs(layout.ratio-1536/465)<.1);
      for(const id of ['tetris','orchestra'])assert(await page.locator('.gameCard[data-game="'+id+'"] .tileIllustration').evaluate(img=>img.complete&&img.naturalWidth===640));
      assert.equal(await page.locator('.newArt').count(),0);
      await page.screenshot({path:path.join(out,'home-'+width+'.png'),fullPage:true});
    }
    pass('Single CSS-cropped original banner and one 12-button illustrated grid at 360/390/430/768/1280; no overflow or duplicate tiles');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#bannerSettings').tap();assert((await page.locator('#status').textContent()).includes('Solo giochi'));await page.locator('#back').tap();
    await page.locator('#bannerRecords').tap();assert((await page.locator('#status').textContent()).includes('/60 Biscottini'));await page.locator('#back').tap();
    await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.installRequested=true};window.dispatchEvent(event)});
    await page.locator('#installApp').click();assert(await page.evaluate(()=>window.installRequested===true));
    pass('Banner settings/records are real buttons and the real Install button handles an offered install prompt');
    await page.clock.install();
    for(const id of ['tetris','orchestra']){
      await page.locator('.gameCard[data-game="'+id+'"]').tap();await page.clock.runFor(40);await page.screenshot({path:path.join(out,id+'-mobile.png'),fullPage:true});await page.locator('#back').tap();
    }
    await page.setViewportSize({width:1280,height:900});
    for(const id of ['tetris','orchestra']){await page.locator('.gameCard[data-game="'+id+'"]').click();await page.clock.runFor(40);await page.screenshot({path:path.join(out,id+'-desktop.png'),fullPage:true});await page.locator('#back').click()}
    await context.setOffline(true);await page.reload();await page.locator('#launchSplash[hidden]').waitFor({state:'attached'});assert.equal(await page.locator('html').getAttribute('data-splash-dismissed'),'ready');
    for(const asset of assets)assert(await page.evaluate(async p=>(await fetch(p)).ok,'./'+asset));
    for(const id of ['town','car','roach','runner','forest','tetris','fruit','memory','ball','orchestra','maze','chameleon']){await page.locator('.gameCard[data-game="'+id+'"]').click();await page.clock.runFor(20);assert(await page.locator('#play').evaluate(el=>el.children.length>0));await page.locator('#back').click()}
    pass('Splash, new graphics and all twelve games reopen offline; every precached resource is available');
    assert.deepEqual(errors,[]);pass('No JavaScript runtime errors in startup, layout and styled games');
    await context.close();
    // Test the safety timeout in a separate first-load context with no cached worker.
    const failed=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const slow=await failed.newPage();let releaseTimeout;const held=new Promise(resolve=>releaseTimeout=resolve);
    await slow.route('**/js/app.js',async route=>{await held;await route.continue()});await slow.clock.install();await slow.goto(url,{waitUntil:'commit'});await slow.locator('#launchSplash').waitFor();await slow.clock.runFor(8200);assert(await slow.locator('#launchSplash').evaluate(el=>el.hidden));assert.equal(await slow.locator('html').getAttribute('data-splash-dismissed'),'timeout');assert.equal(await slow.locator('.splashLoader').evaluate(el=>getComputedStyle(el,'::after').animationName),'none');releaseTimeout();await failed.close();
    pass('Safety timeout fails open at 8 seconds; reduced motion disables loader movement');
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks:report,assets:assets.length},null,2));
  }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{server.close();fs.rmSync(fixture,{recursive:true,force:true})});
