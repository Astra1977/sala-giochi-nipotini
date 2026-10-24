// Internal HTML launch screen. Native OS launch screens are controlled by the OS.
(() => {
  const splash=document.getElementById('launchSplash');
  if(!splash)return;
  let preparing=false;
  const finish=reason=>{
    if(splash.hidden)return;
    splash.hidden=true;
    document.documentElement.dataset.splashDismissed=reason;
    clearTimeout(safety);
  };
  // Fail open, including if application startup or an image download fails.
  const safety=setTimeout(()=>finish('timeout'),8000);
  function ready(){
    if(preparing)return;preparing=true;
    const images=[...document.querySelectorAll('.heroBanner img,.tileIllustration')];
    Promise.allSettled(images.map(img=>img.decode?img.decode():Promise.resolve()))
      .then(()=>finish('ready'));
  }
  document.addEventListener('sala:ready',ready,{once:true});
  if(window.salaReady)ready();
  window.addEventListener('pageshow',event=>{if(event.persisted&&window.salaReady)finish('resume')});
})();
