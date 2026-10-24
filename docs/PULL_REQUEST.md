La sala giochi originale non avviava lo script per una stringa multilinea non valida e non aveva manifest o service worker. Questa modifica rende i dodici giochi navigabili su touch, aggiunge installazione PWA e precache completo sotto `/sala-giochi-nipotini/`, con aggiornamenti attivati dall'utente e record locali.

`home.png` conserva esattamente il blob approvato. La home ora usa tessere HTML e safe area. Frutta e gatto SVG sono conservati; Cucaracha ha un boss da cinque colpi; Memory, Bolle e Chameleon hanno progressione; città, foresta, consegne e labirinti hanno percorsi esplorabili; il canestro usa trascinamento e fisica.

“La Macchina” integra esclusivamente **Corsa su Strada originale di Andrea** da `klide1010/ChildGames`, con il motore road.js invariato e verificato tramite hash: pseudo-3D, curve, salite, tre veicoli, traffico, collisioni e checkpoint. Un adattatore locale collega canvas, intro, suoni sintetizzati, cleanup e record alla nostra sala giochi. Nessuna modifica al repository originale di Andrea e nessuna dipendenza runtime online.

Validazione completata:

- `python3 scripts/build-offline.py`: 24 risorse runtime nel precache, inclusi moduli annidati, home originale e gioco di Andrea.
- `npm test`: sei gruppi superati, con 300 labirinti, fisica, archivio bloccato, manifest, inventario e integrità degli originali.
- `npm run test:browser`: 22 controlli Chromium superati, cinque viewport, navigazione dei dodici giochi, partite/missioni, touch nativo emulato, record, tre veicoli e checkpoint originali, aggiornamento della cache e riapertura offline anche dopo chiusura del processo browser. Nessun errore JavaScript runtime.

Collaudo offline per il revisore:

1. Aprire online da HTTPS o localhost e aspettare “Pronta per giocare offline”.
2. Installare con Safari → Condividi → Aggiungi alla schermata Home oppure con il comando Installa di Android.
3. Attivare modalità aereo, chiudere e riaprire dall'icona, aprire i dodici giochi e verificare i record.
4. Provare orientamenti e safe area, sterzo mantenuto, curve/salite/traffico, swipe frutta e tiro nel cesto.
5. Su una successiva versione, verificare l'avviso di aggiornamento e confermare che accettarlo ricarichi l'app mantenendo i record.

L'installazione e il touch su iPhone/iPad/Android reali richiedono ancora collaudo manuale. Dettagli in `docs/TEST.md`, audit in `docs/AUDIT.md`, provenienza dell'integrazione in `docs/ANDREA.md`. Rigenerare sw.js dopo ogni modifica alle risorse runtime. **Non effettuare il merge senza approvazione.**
