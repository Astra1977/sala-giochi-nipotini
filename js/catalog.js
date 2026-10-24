export const GAMES = [
  ['town','Mini Town',0],['car','La Macchina',1],['roach','Acchiappa la Cucaracha',2],
  ['runner','Salta la Cacca',3],['forest','Avventura Foresta',4],['tetris','Tetris — La Torre dei Colori',5],
  ['fruit','Taglia la Frutta',6],['memory','Memory',7],['ball','Palla nel Cesto',8],
  ['orchestra','Orchestra di Biscotto',9],['maze','Labirinto',10],['chameleon','Chameleon',11]
].map(([id,name,tile])=>({id,name,tile}));
export const STAGED = ['roach','runner','fruit','memory','ball','orchestra','chameleon'];
export const MILESTONES = {
  roach: ['8 catture, massimo 4 errori','12 catture, massimo 3 errori','16 catture, massimo 2 errori','20 catture, massimo 1 errore','24 catture, nessun errore e un boss sconfitto'],
  runner: ['Sopravvivi 12 secondi','Sopravvivi 18 secondi','Sopravvivi 24 secondi','Sopravvivi 30 secondi','Sopravvivi 36 secondi'],
  fruit: ['Taglia 8 frutti, massimo 3 bombe','12 frutti, massimo 2 bombe, combo 2','16 frutti, massimo 1 bomba, combo 3','20 frutti, nessuna bomba, combo 4','24 frutti, nessuna bomba, combo 5'],
  memory: ['Trova 4 coppie','Trova 6 coppie','Trova 8 coppie','Trova 10 coppie','Trova 12 coppie'],
  orchestra: ['Completa Alba di Biscotto','Completa Palme in festa','Completa Passi sulla sabbia','Completa Il coro del mare','Completa La grande orchestra'],
  town: ['Ritira la merenda','Consegna a scuola','Prendi il pallone','Portalo al parco','Ritira in ospedale e consegna alla spiaggia'],
  car: ['Supera il checkpoint 1','Supera il checkpoint 2','Supera il checkpoint 3','Supera il checkpoint 4','Supera il checkpoint 5'],
  forest: ['Esplora la zona 1: 3 oggetti','Zona 2: 4 oggetti','Zona 3: 5 oggetti','Zona 4: 6 oggetti','Zona 5: 6 oggetti e ritorno alla partenza'],
  tetris: ['Completa 2 livelli: 10 righe','4 livelli: 20 righe','6 livelli: 30 righe','8 livelli: 40 righe','10 livelli: 50 righe'],
  ball: ['2 canestri in 5 tiri','3 canestri in 6 tiri','4 canestri in 7 tiri','5 canestri in 8 tiri','6 canestri in 9 tiri'],
  maze: ['Risolvi la mappa 9×9','Risolvi la mappa 11×11','Risolvi la mappa 13×13','Risolvi la mappa 15×15','Risolvi la mappa 17×17'],
  chameleon: ['Riconosci 5 colori, 14 s per risposta','7 colori, 12 s','9 colori, 10 s','11 colori, 8 s','13 colori, 6 s']
};
