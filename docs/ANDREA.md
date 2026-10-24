# Corsa su Strada — provenienza e integrazione

Autore originale: Andrea, repository pubblico [klide1010/ChildGames](https://github.com/klide1010/ChildGames). Nessuna scrittura è stata eseguita su quel repository.

Sorgenti letti il 24 ottobre 2026:

- [js/games/road.js](https://github.com/klide1010/ChildGames/blob/main/js/games/road.js), blob Git `4b88da0d15b44b3d66fb4208ad5c22762a1df829`.
- [js/core.js](https://github.com/klide1010/ChildGames/blob/main/js/core.js), blob Git `a2a5957526939b120a992d01202a488e9b39cf20`.
- [css/style.css](https://github.com/klide1010/ChildGames/blob/main/css/style.css), blob Git `4ec2181a4fba28fb7bc4012954fed0af22d8bfa2`.

`js/vendor/andrea/road.js` contiene il file road.js originale, invariato, all'interno della sola funzione `registerRoad(App, U, Sound, setTimeout)`. Il test estrae il corpo originale e confronta il blob Git. Il parametro setTimeout inoltra i popup ritardati al gestore della sessione, che li annulla quando il gioco viene chiuso.

`js/vendor/andrea/core-road.js` contiene esclusivamente Sound e U del core originale, in una funzione locale, con Store.get collegato al nostro archivio locale. Nessun menu, profilo, classifica nominativa o altro gioco di Andrea è stato importato. Sono mantenuti i suoni sintetizzati; nessun file audio remoto.

`js/games/road.js` adatta canvas, intro con scelta dei tre veicoli, punteggi, popup, fine partita e cleanup alla sala giochi. Il canvas usa ResizeObserver e devicePixelRatio. I tasti e i puntatori vengono rilasciati alla perdita di focus. `css/road.css` riprende solo gli stili necessari a canvas, introduzione e popup, con selettori dedicati; il foglio completo originale non viene caricato e non vengono scaricati font.

Restano originali: proiezione pseudo-3D, generazione di curve e salite, accelerazione automatica, caratteristiche di moto/auto/camion, forza centrifuga, traffico con cambi di corsia, collisioni, sorpassi, checkpoint e bonus di tempo decrescenti, panorama al tramonto e disegno dei veicoli.

Il record è salvato come `best_car`, compatibile con la tessera esistente. Suoni attivabili/disattivabili dalle impostazioni, salvati solo localmente.
