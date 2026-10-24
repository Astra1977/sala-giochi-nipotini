# Trasferimento e accesso GitHub

## Stato reale

Branch locale: `codex/pwa-offline-games`, basato su `main` commit `b0b0897d33040991c596ba489d43fbfc12dc37a3` del repository Astra1977/sala-giochi-nipotini.

La creazione remota del branch con il connettore è stata rifiutata due volte: HTTP 403 `Resource not accessible by integration`. Anche il push Git autenticato è stato rifiutato: `Permission to Astra1977/sala-giochi-nipotini.git denied to Astra1977` (HTTP 403).

**Nessun branch remoto o pull request è stato creato da questo lavoro. Nessun merge, nessuna modifica al sito pubblico e nessuna modifica al repository di Andrea.**

Il connettore risulta installato e consente le letture. Il fatto che i metadati del repository indichino il proprietario come admin non dimostra che il token dell'integrazione abbia i permessi di scrittura. Questo errore riguarda l'autorizzazione dell'integrazione, non il codice del progetto.

## Verificare o ripristinare l'autorizzazione

1. Accedere a GitHub con **Astra1977** e aprire https://github.com/settings/installations.
2. Individuare l'installazione usata dalla connessione ChatGPT/Codex e premere **Configure**. Il nome visualizzato può variare secondo la connessione.
3. In **Repository access**, se è selezionato **Only select repositories**, includere **Astra1977/sala-giochi-nipotini** e salvare. Non serve autorizzare il repository di Andrea in scrittura.
4. Se GitHub mostra una richiesta di nuovi permessi per l'app, controllare che comprenda **Contents: Read and write** e **Pull requests: Read and write** e accettarla per questa installazione. La sola voce **Metadata: Read** non basta. I permessi richiesti sono stabiliti dall'app: se sono solo in lettura, non si possono trasformare arbitrariamente in scrittura dalla selezione dei repository.
5. Tornare alle impostazioni Apps/connettori di ChatGPT/Codex, aprire **GitHub**, usare il comando per gestire o riconnettere l'account se presente e selezionare l'account/installazione aggiornati. I nomi dei pulsanti dipendono dal client: questo ambiente non può verificare la tua schermata né i permessi OAuth dell'installazione.
6. Dopo la riconnessione, chiedere di riprovare la pubblicazione del branch e la creazione della PR. Non occorre reinviare il codice se la sessione e la consegna sono ancora disponibili.

Se l'app continua a consentire solo letture, usare il trasferimento locale sotto. **Non incollare token o password nella chat.**

## Trasferire i commit dal bundle (metodo consigliato)

Scaricare `sala-giochi-offline.bundle`. Sul proprio computer, con Git autenticato per il repository:

```sh
git clone https://github.com/Astra1977/sala-giochi-nipotini.git
cd sala-giochi-nipotini
git fetch /percorso/sala-giochi-offline.bundle refs/heads/codex/pwa-offline-games:refs/heads/codex/pwa-offline-games
git switch codex/pwa-offline-games
git diff origin/main -- home.png
python3 scripts/build-offline.py
npm test
git push -u origin codex/pwa-offline-games
```

Sostituire `/percorso/sala-giochi-offline.bundle` con il file scaricato. Il diff di home.png deve essere vuoto. Il bundle contiene i commit nuovi e richiede il commit base, presente nel clone. `git bundle verify /percorso/sala-giochi-offline.bundle` controlla i prerequisiti. Se main è avanzato, conservare il branch importato e valutare un rebase prima del push.

Per creare la pull request con GitHub CLI già autenticata:

```sh
gh pr create --repo Astra1977/sala-giochi-nipotini --base main --head codex/pwa-offline-games --title "PWA offline, dodici giochi touch e Corsa su Strada originale" --body-file docs/PULL_REQUEST.md
```

In alternativa aprire https://github.com/Astra1977/sala-giochi-nipotini/compare/main...codex/pwa-offline-games dopo il push, premere **Create pull request** e copiare il testo di docs/PULL_REQUEST.md. **Non effettuare il merge prima della revisione.**

## Alternativa: patch o progetto completo

`sala-giochi-offline.patch` contiene gli stessi commit con le icone binarie. In un clone pulito:

```sh
git switch -c codex/pwa-offline-games origin/main
git am /percorso/sala-giochi-offline.patch
```

Poi usare build, test, push e PR come sopra. Non applicare sia patch sia bundle allo stesso branch.

`sala-giochi-completa.zip` è una copia pronta da servire del progetto finale, senza la directory .git e senza lo ZIP storico. Include home.png originale, invariata. Il bundle/patch è preferibile per conservare la cronologia e lasciare intatti i file storici già presenti nel repository.
