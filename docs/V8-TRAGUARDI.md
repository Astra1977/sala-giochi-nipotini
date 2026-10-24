# V8 — percorsi e Biscottini

Le dodici ricompense di gioco sono cinque medaglie permanenti per percorso, sessanta in totale. Non sono valuta e non vengono mai dedotte per errori o sconfitte. Il solo punteggio numerico non sblocca medaglie.

| Gioco | 1 Biscottino | 2 Biscottini | 3 Biscottini | 4 Biscottini | 5 Biscottini |
|---|---|---|---|---|---|
| Mini Town | Ritira la merenda | Consegna a scuola | Prendi il pallone | Portalo al parco | Ritira in ospedale e consegna alla spiaggia |
| La Macchina | Supera il checkpoint 1 | Supera il checkpoint 2 | Supera il checkpoint 3 | Supera il checkpoint 4 | Supera il checkpoint 5 |
| Acchiappa la Cucaracha | 8 catture, massimo 4 errori | 12 catture, massimo 3 errori | 16 catture, massimo 2 errori | 20 catture, massimo 1 errore | 24 catture, nessun errore e un boss sconfitto |
| Salta la Cacca | Sopravvivi 12 secondi | Sopravvivi 18 secondi | Sopravvivi 24 secondi | Sopravvivi 30 secondi | Sopravvivi 36 secondi |
| Avventura Foresta | Esplora la zona 1: 3 oggetti | Zona 2: 4 oggetti | Zona 3: 5 oggetti | Zona 4: 6 oggetti | Zona 5: 6 oggetti e ritorno alla partenza |
| Tetris — La Torre dei Colori | Completa 2 livelli: 10 righe | 4 livelli: 20 righe | 6 livelli: 30 righe | 8 livelli: 40 righe | 10 livelli: 50 righe |
| Taglia la Frutta | Taglia 8 frutti, massimo 3 bombe | 12 frutti, massimo 2 bombe, combo 2 | 16 frutti, massimo 1 bomba, combo 3 | 20 frutti, nessuna bomba, combo 4 | 24 frutti, nessuna bomba, combo 5 |
| Memory | Trova 4 coppie | Trova 6 coppie | Trova 8 coppie | Trova 10 coppie | Trova 12 coppie |
| Palla nel Cesto | 2 canestri in 5 tiri | 3 canestri in 6 tiri | 4 canestri in 7 tiri | 5 canestri in 8 tiri | 6 canestri in 9 tiri |
| Orchestra di Biscotto | Completa Alba di Biscotto | Completa Palme in festa | Completa Passi sulla sabbia | Completa Il coro del mare | Completa La grande orchestra |
| Labirinto | Risolvi la mappa 9×9 | Risolvi la mappa 11×11 | Risolvi la mappa 13×13 | Risolvi la mappa 15×15 | Risolvi la mappa 17×17 |
| Chameleon | Riconosci 5 colori, 14 s per risposta | 7 colori, 12 s | 9 colori, 10 s | 11 colori, 8 s | 13 colori, 6 s |

## Condizioni verificate dal motore

- Cucaracha: alla fine della partita di 35 s devono risultare catture sufficienti e massimo 4/3/2/1/0 errori; nell'ultima missione deve essere stato sconfitto almeno un boss, con cinque colpi sullo stesso bersaglio. Penalità numerica crescente, doppia per Biscotto.
- Runner: il gatto deve restare vivo per l'intera durata del percorso; collisioni interrompono la prova. Velocità iniziale crescente nei cinque percorsi.
- Frutta: alla fine dei 35 s il contatore di frutti tagliati, le bombe e la massima combo devono rispettare insieme i limiti. La combo richiede tagli distanti meno di 1,3 s.
- Memory: tutte le coppie della missione devono risultare abbinate, da 4 a 12. Record dei tentativi separati per missione, vecchi record conservati.
- Orchestra: ogni sequenza deve arrivare alla fine e almeno l'80% delle note deve essere eseguito entro ±240 ms. Perfetto entro ±110 ms, altrimenti Bene. Durata, densità e numero di note aumentano; nessuna medaglia premendo semplicemente Inizia o cambiando brano.
- Mini Town: le prime quattro consegne/raccolte costituiscono le missioni 1–4. La quinta richiede sia il ritiro della borsa in ospedale sia la successiva consegna alla spiaggia. Non basta raggiungere l'ospedale.
- Corsa su Strada: il motore originale comunica il livello solo dopo l'attraversamento fisico dei checkpoint. L'adattatore converte i primi cinque checkpoint in traguardi. Codice originale di Andrea intatto e verificato tramite hash.
- Foresta: tutti gli oggetti devono essere raccolti in ciascuna radura. Nell'ultima occorre anche tornare alla partenza, dopo la raccolta.
- Tetris: 5 righe completano un livello; 50 righe completano il decimo. Le medaglie sono assegnate ai livelli completati 2/4/6/8/10. Dopo il decimo si può continuare per il record.
- Palla: la sfida si conclude dopo 5/6/7/8/9 tiri, con almeno 2/3/4/5/6 canestri fisicamente validi. Il canestro diventa progressivamente più piccolo.
- Labirinto: il gatto deve attraversare il corridoio fino alla cella d'uscita. Mappe connesse generate da 9×9 a 17×17.
- Chameleon: occorrono tutte le risposte corrette della sfida, prima che scada il tempo per ciascun colore. Numero di colori crescente, tempo da 14 a 6 s.

## Dati e migrazione

Il modulo condiviso progress.js gestisce lo schema versione 8 nella chiave sala_progress_v8. Per ogni gioco conserva score (massimo), completed (massimo traguardo) e medals (0–5). Per Tetris completed è 0–10; negli altri giochi 0–5. La conversione usa le soglie 0/20/40/60/80/100%.

All'avvio i punteggi best_* preesistenti vengono importati senza eliminare le chiavi originali. I dati dei giochi ritirati vengono conservati in retired, senza apparire nei record o nella collezione attiva. Un record preesistente non inventa traguardi mai completati. I sette giochi con missioni selezionabili e gli altri percorsi non possono saltare traguardi non conquistati; le missioni già concluse sono ripetibili.

Il salvataggio resta sul dispositivo e non dipende dalla rete. Se il browser blocca il salvataggio o esaurisce lo spazio si usa un archivio temporaneo per la sessione, come spiegato nelle impostazioni. La persistenza fisica non può essere garantita se l'utente o il sistema cancella i dati del sito.
