# Collaudo — 24 ottobre 2026

## Automatizzato: superato

Eseguito con Node.js 24, Python 3 e Chromium headless tramite Playwright 1.62.1. Sito servito localmente sotto /sala-giochi-nipotini/. Sono state usate tutte le immagini originali, compresa home.png: nessun segnaposto nel collaudo finale.

Sei gruppi di test di logica/integrità superati con `npm test`:

1. Hash Git del motore road.js originale di Andrea e di home.png approvata.
2. 300 labirinti generati: tutti i corridoi connessi e uscita raggiungibile, nelle tre difficoltà.
3. Il canestro accetta attraversamenti discendenti nel cerchio e rifiuta salite/attraversamenti esterni o doppi conteggi.
4. Un lancio fisico dalla posizione iniziale può segnare senza esito casuale o prestabilito.
5. Record massimi e minimo di tentativi, valori corrotti e archivio locale bloccato.
6. Inventario offline completo e ricorsivo, manifest relativo e nessuna dipendenza remota HTML/CSS/JS.

Test di integrazione `npm run test:browser` superato:

- Tutte le 24 risorse runtime sono nella cache della sottocartella corretta.
- Apertura, chiusura e riavvio di tutti i 12 giochi a 390×844, 844×390, 768×1024, 1440×900 e 320×568, senza overflow orizzontale della home.
- Focus del dialogo, contenimento del Tab, Escape e ritorno al pulsante iniziale.
- Memory completato in tutte le difficoltà e record dei tentativi salvati.
- Mini Town: sei missioni di raccolta/consegna completate camminando.
- Foresta: ricerca e raccolta completate in tre livelli.
- Labirinto: tre mappe risolte attraverso input reali e movimento touch con swipe.
- Bebè: nove consegne completate nei tre livelli, evitando scooter in movimento.
- Palla: trascinamento touch nativo emulato, lancio con fisica e canestro con punteggio salvato.
- Frutta: taglio tramite swipe touch nativo emulato.
- Runner: gatto SVG che salta al tocco.
- Bolle: punteggio dopo un tocco su una bolla in movimento.
- Chameleon: quindici risposte, tre livelli temporizzati.
- Corsa su Strada: avvio dei tre veicoli, checkpoint che aumenta il livello e il tempo, sterzo con tocco mantenuto e record salvati. Il test del checkpoint usa casualità controllata per una strada rettilinea ripetibile; l'hash verifica che generazione di curve, salite e traffico sia esattamente quella originale.
- Cucaracha: lo stesso boss richiede cinque colpi; fine del timer salva il punteggio; uscita annulla i timer.
- Record e preferiti persistono al ricaricamento.
- Nuova versione scaricata ma in attesa: si attiva solo col pulsante, ricarica e rimuove la cache precedente.
- Reload, nuova finestra e richieste di tutte le risorse riescono senza rete.
- Un processo Chromium viene chiuso e riavviato con lo stesso profilo: a rete disattivata si apre l'app e l'introduzione originale di Corsa su Strada.
- Risorsa obbligatoria mancante: il service worker non si attiva e non viene annunciata disponibilità offline.
- Nessun errore JavaScript runtime durante la suite.

I test non certificano ogni possibile partita o prestazioni di ogni dispositivo. I controlli browser sono funzionali e usano input touch emulato, non dita su hardware reale.

## Collaudo manuale richiesto su dispositivi reali

1. Aprire il sito HTTPS aggiornato in Safari su iPhone/iPad e Chrome su Android. Aspettare “Pronta per giocare offline”.
2. Installare dalla schermata Home (Safari: Condividi → Aggiungi alla schermata Home; Android: Installa).
3. Attivare modalità aereo, chiudere completamente l'app e riaprirla dall'icona. Aprire tutti i dodici giochi.
4. Provare portrait/landscape, notch, safe area, scorrimento delle istruzioni e visibilità dei comandi Home/Riprova.
5. Provare sterzo mantenuto e multi-touch su Corsa su Strada, curve, salite, traffico e checkpoint in una partita casuale. Verificare suoni e interruzioni audio passando ad altre app.
6. Provare swipe frutta, gesto del canestro, salto e comandi dei percorsi. Verificare reattività su telefoni meno recenti.
7. Ottenere un record, chiudere e riaprire: il record deve restare. I dati sono separati tra browser e installazioni secondo il sistema operativo.
8. Ricollegare la rete, distribuire una nuova versione su un ambiente di prova e verificare che l'avviso non interrompa la partita. Accettare l'aggiornamento e ricontrollare offline e record.

Queste prove su iOS/Android reali non sono state eseguite in questo ambiente.
