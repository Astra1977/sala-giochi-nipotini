# Audit iniziale — 24 ottobre 2026

Base esaminata: `main`, albero Git `b0b0897d33040991c596ba489d43fbfc12dc37a3`.

## Struttura effettiva

Sette file: README.md, index.html (HTML/CSS/JS monolitico), home.png, bea.png, ricky.png, biscotto.png e sala-giochi-da-zero.zip. Nessuna sottocartella di giochi, manifest, service worker, configurazione test o dipendenza esterna nel codice pubblicato. Le tre immagini piccole sono avatar cartoon; Bea è stata ispezionata visivamente. home.png è intoccabile: blob `8d2f2a2e58f65fff47f4eee65ba16fc5763d3563`.

Lo ZIP non è stato ispezionato: il connettore restituisce contenuto vuoto per il binario grande e il clone fallisce perché il proxy dell'ambiente non è raggiungibile. Non si può escludere che lo ZIP contenga altri sorgenti. Non sono state apportate modifiche al repository originale di Andrea.

## Problemi riscontrati prima delle modifiche

Errore bloccante confermato dal parser JavaScript: il markup SVG del runner è in una stringa con apici singoli distribuita su più righe. Questo impedisce l’esecuzione dell’intero script inline originale. Correzione con template literal nel modulo conservato.

- PWA completamente assente; nessuna risorsa disponibile offline in modo garantito.
- Home desktop fatta di hotspot su una singola immagine, con scala ridotta e pulsanti piccoli in orizzontale. Home mobile ricavata da ritagli della stessa immagine; navigazione incompleta e duplicazione CSS.
- Tutti i giochi nello stesso render; timeout non sempre annullati, gestione del focus/Escape assente. Record con lettura numerica non validata e accesso a localStorage non protetto nelle impostazioni.
- Cucaracha: ogni boss scompare al primo colpo, il contatore somma boss diversi; non è un singolo boss da cinque colpi.
- Runner: gatto SVG intero già presente, touch e ostacoli variabili già implementati. Da conservare e verificare.
- Frutta: swipe con intersezione segmento, gravità, bombe e scia già implementati. Da conservare e verificare.
- Memory: una sola difficoltà, tentativi visibili solo al termine, record non separati per difficoltà.
- Bolle: partita temporizzata, nessun livello, difficoltà costante.
- Mini Town, Foresta, Bebè: scelta di pulsanti, senza esplorazione o percorso.
- Palla: quattro pulsanti di forza, nessuna gesture o fisica.
- Labirinto: una sola mappa fissa, senza progressione.
- Chameleon: dodici scelte di colore senza tempo o livelli.
- La Macchina: corsa semplificata a tre corsie. Non è il gioco originale OutRun. Integrazione sospesa in attesa dei sorgenti; chiesto dove reperirli.
- Profilo/preferiti sono placeholder; nessun account richiesto e nessuna dipendenza Internet nel codice trovato. I riferimenti immagine coincidono con i file nell'albero remoto.

## Piano di correzione

1. Manifest, icone locali, precache generato e aggiornamento su richiesta; URL relativi alla sottocartella GitHub Pages.
2. Navigazione HTML con tessere leggibili, immagine originale preservata, safe area e focus del dialogo.
3. Estrarre CSS/JS, conservare runner/frutta; migliorare Cucaracha e implementare gli altri giochi in moduli con cleanup.
4. Verifiche statiche e browser Chromium mobile/desktop, controlli offline e regressioni. Separare esplicitamente ciò che non è verificabile senza asset originali o dispositivi reali.

## Accesso al repository

Letture consentite dal connettore GitHub. Creazione branch rifiutata con HTTP 403 `Resource not accessible by integration`. Nessuna modifica remota effettuata. Consegnare patch/pacchetto e descrizione PR se il permesso non viene ripristinato.

## Risoluzione dei limiti di accesso durante il lavoro

Con l’esecuzione di rete autorizzata è stato completato il clone pubblico in sola lettura. La home è stata recuperata e il suo hash confermato; lo ZIP contiene solo home.png, index.html e README.md e non contiene Corsa su Strada. L’utente ha indicato il repository pubblico di Andrea: il gioco originale è ora integrato, come descritto in ANDREA.md. Il limite iniziale sui download è risolto. Il rifiuto di scrittura GitHub rimane una questione distinta, da verificare a fine collaudo.
