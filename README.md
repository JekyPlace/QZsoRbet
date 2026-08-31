# QZsoRbet di ©QZR Studio

QZsoRbet e una web app full-stack per interrogare file CSV e PDF tramite una chat AI locale.

L'app permette di caricare documenti CSV/PDF, li salva in locale, li indicizza in un vector database e usa quei dati come contesto per rispondere alle domande dell'utente.

In pratica:

```txt
upload CSV/PDF -> chunks -> embeddings -> Qdrant -> retrieval semantico -> Ollama -> risposta in chat
```

## Avvio Rapido

1. Installa Docker Desktop, Node.js e Ollama.

2. Avvia Ollama:

```bash
ollama serve
```

Se Ollama e gia avviato come servizio/app, puoi saltare questo comando.

3. Installa il modello embeddings e almeno un modello chat:

```bash
ollama pull embeddinggemma
ollama pull gemma3:12b
```

4. Se vuoi indicizzare documenti gia presenti al setup, metti i file `.csv` e `.pdf` in:

```txt
data/csv
```

Puoi anche saltare questo step e caricare i documenti dopo dall'app, dalla pagina "Fornisci contesto".

5. Dalla root del progetto esegui il setup completo:

```bash
npm run setup
```

6. Avvia il frontend:

```bash
npm run dev:frontend
```

7. Apri:

```txt
http://localhost:3000
```

Il comando `npm run setup` installa le dipendenze, crea gli env mancanti, avvia backend/Postgres/Qdrant, applica le migration e indicizza eventuali CSV/PDF gia presenti nella cartella sorgente.

## Cosa Fa

- carica file `.csv` e `.pdf` dalla UI
- salva i file caricati in una cartella locale
- mostra la lista dei file caricati nella pagina "Fornisci contesto"
- indicizza file `.csv`
- indicizza file `.pdf`
- estrae testo dai PDF e lo divide in chunk
- genera embeddings con Ollama
- salva gli embeddings in Qdrant
- recupera i contenuti piu rilevanti rispetto alla domanda
- mantiene una memoria conversazionale sintetica e strutturata delle chat lunghe
- usa il contesto recuperato per generare una risposta
- legge i modelli installati in Ollama e li rende selezionabili dalla UI
- salva chat e messaggi in Postgres
- mostra le risposte in streaming nel frontend React
- permette di copiare le risposte della chat

Lo use case tipico e un assistente AI privato che risponde usando dati aziendali locali, senza mandare CSV o PDF a servizi cloud.

## Stack

- Frontend: React, TanStack Router, TanStack Query, Vite
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Vector database: Qdrant
- AI locale: Ollama
- Orchestrazione: Docker Compose

Il repository e una monorepo:

```txt
.
├── docker-compose.yml
├── package.json
├── data/csv/
├── data/uploads/
├── qzr-ai-be/
└── qzr-ai-tanstack/
```

## Requisiti

Installa sulla tua macchina:

- Docker Desktop
- Node.js
- Ollama

Requisiti consigliati:

- 16 GB di RAM o piu
- 15-25 GB liberi su disco
- Ollama avviato sulla porta `11434`

Scarica almeno un modello chat e il modello embeddings:

```bash
ollama pull embeddinggemma
ollama pull gemma3:12b
```

`embeddinggemma` serve per indicizzare CSV e PDF.
`gemma3:12b` e un modello chat consigliato per generare le risposte.

L'app supporta i modelli gia installati in Ollama:

- il backend espone la lista dei modelli disponibili
- il frontend li mostra nella select "Modello"
- la scelta viene salvata nel browser
- se non scegli nulla, il backend usa `OLLAMA_DEFAULT_MODEL` oppure `gemma3:12b`

Puoi quindi installare anche modelli piu piccoli o piu leggeri:

```bash
ollama pull llama3.2:3b
ollama pull qwen2.5:7b
```

Poi selezionali direttamente dall'interfaccia.

Con 8 GB di RAM l'app puo partire, ma `gemma3:12b` puo essere lento o pesante. In quel caso conviene installare un modello piu piccolo e selezionarlo dalla UI.

## Documenti CSV/PDF

L'app supporta sia `.csv` che `.pdf`.

### Retrieval adaptive

Il retrieval recupera fino a 12 candidati da Qdrant con una soglia iniziale
bassa (`QDRANT_SCORE_THRESHOLD=0.2`). Il backend applica poi un filtro
adaptive: il risultato migliore deve superare `MIN_TOP_DOCUMENT_SCORE` e gli
altri chunk devono rimanere sopra una percentuale del suo score.

Parametri configurabili nel `.env` del backend:

```env
QDRANT_SEARCH_LIMIT=12
QDRANT_SCORE_THRESHOLD=0.2
MIN_TOP_DOCUMENT_SCORE=0.42
MIN_DOCUMENT_SCORE=0.25
MIN_RELATIVE_SCORE_RATIO=0.82
MAX_CONTEXT_DOCUMENTS=8
```

I valori iniziali sono euristici e vanno calibrati usando domande reali e
verificando quanti risultati corretti entrano nel contesto.

Ci sono due modi per fornire documenti.

### Upload dall'app

Dalla sidebar apri la pagina "Fornisci contesto" e trascina un file `.csv` o `.pdf`.

Il backend:

1. salva il file nella cartella upload
2. avvia subito l'indicizzazione
3. aggiorna la lista dei file caricati

Di default i file caricati vengono salvati in:

```txt
data/uploads
```

In Docker la cartella viene montata come:

```txt
/app/uploads
```

Puoi cambiare destinazione configurando:

```env
UPLOAD_SOURCE_DIR=/percorso/della/cartella/uploads
```

### Indicizzazione iniziale da cartella

Per indicizzare documenti gia presenti al setup, metti i file in:

```txt
data/csv
```

Oppure configura una cartella custom nel file `.env` della root:

```env
CSV_HOST_SOURCE_DIR=/Users/jacopo/Sources
```

Questa variabile mantiene il nome `CSV_HOST_SOURCE_DIR` per compatibilita, ma la cartella puo contenere sia CSV che PDF.

Su Windows usa slash `/`, non backslash `\`:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/sources
```

Dentro Docker questa cartella viene montata come:

```txt
/app/data
```

Il backend Docker legge entrambi i tipi di file da:

```env
CSV_SOURCE_DIR=/app/data
PDF_SOURCE_DIR=/app/data
```

In locale, il backend puo leggere gli stessi file da:

```env
CSV_SOURCE_DIR=/Users/jacopo/Sources
PDF_SOURCE_DIR=/Users/jacopo/Sources
```

I due indicizzatori sono separati:

- `index:csv` indicizza i CSV
- `index:pdf` indicizza i PDF
- `index:all` esegue entrambi

Nota: l'upload dall'app indicizza subito il singolo file caricato. I comandi `index:*` servono invece per indicizzare o reindicizzare documenti presenti nella cartella sorgente.

## Contesto WordPress

Il comando seguente legge oggetti, trasporti, percorsi e post dalle API
WordPress, li converte in testo e li salva nella stessa collection Qdrant
usata da CSV e PDF:

```bash
npm run index:wordpress
```

Configura l'indirizzo base nel file `.env` del backend:

```env
WORDPRESS_API_URL=http://localhost:8888/gestionaleQualityMade_REST_integration/wp-json
```

Lo script usa solo endpoint pubblici di lettura. Le richieste di trasporto e
gli altri dati personali non vengono indicizzati.

## Primo Avvio Completo

Dalla root del progetto:

```bash
npm run setup
npm run dev:frontend
```

Poi apri:

```txt
http://localhost:3000
```

`npm run setup` fa automaticamente:

1. installa dipendenze backend e frontend
2. genera il Prisma Client
3. crea `.env` e `qzr-ai-be/.env.docker` dai template se mancano
4. avvia backend, Postgres e Qdrant
5. applica le migration Prisma
6. indicizza CSV e PDF in Qdrant

Prima di lanciarlo assicurati che:

- Ollama sia avviato
- `embeddinggemma` sia installato
- almeno un modello chat Ollama sia installato
- la cartella sorgente esista e contenga almeno un file `.csv` o `.pdf`

Verifica rapida dei modelli installati:

```bash
ollama list
```

Se la select modelli nel frontend e vuota, controlla che Ollama sia attivo:

```bash
ollama serve
```

## Uso Quotidiano

Dopo il primo setup:

```bash
npm run docker:up
npm run dev:frontend
```

Non serve reindicizzare ogni volta.

Reindicizza solo quando cambi manualmente CSV/PDF nella cartella sorgente o quando Qdrant e vuoto:

```bash
npm run docker:index
```

Se aggiungi solo CSV:

```bash
npm run index:csv
```

Se aggiungi solo PDF:

```bash
npm run index:pdf
```

Se invece carichi file dalla pagina "Fornisci contesto", l'indicizzazione parte automaticamente dopo l'upload.

Applica le migration solo quando il DB e nuovo o ci sono nuove migration:

```bash
npm run docker:migrate
```

## Comandi

Installa dipendenze backend e frontend:

```bash
npm run install:all
```

Setup completo:

```bash
npm run setup
```

Avvia backend, Postgres e Qdrant:

```bash
npm run docker:up
```

Setup completo Docker:

```bash
npm run docker:setup
```

Indicizza CSV e PDF dentro Docker:

```bash
npm run docker:index
```

Indicizza solo i CSV in locale:

```bash
npm run index:csv
```

Indicizza solo i PDF in locale:

```bash
npm run index:pdf
```

Indicizza CSV e PDF in locale:

```bash
npm run index:all
```

Indicizza il contesto WordPress in locale:

```bash
npm run index:wordpress
```

Applica migration Prisma:

```bash
npm run docker:migrate
```

Avvia frontend:

```bash
npm run dev:frontend
```

Log backend:

```bash
npm run docker:logs
```

Spegni i container:

```bash
npm run docker:down
```

Typecheck:

```bash
npm run typecheck
```

## Servizi e Porte

Frontend:

```txt
http://localhost:3000
```

Backend:

```txt
http://localhost:8555
```

Postgres Docker dalla macchina host:

```txt
localhost:5475
```

Qdrant Docker dalla macchina host:

```txt
http://localhost:6335
```

Dentro Docker il backend usa:

```env
DATABASE_URL=postgresql://postgres:jacopoqzr@postgres:5432/qzr_ai
QDRANT_URL=http://qdrant:6333
OLLAMA_URL=http://host.docker.internal:11434
CSV_SOURCE_DIR=/app/data
PDF_SOURCE_DIR=/app/data
UPLOAD_SOURCE_DIR=/app/uploads
```

In locale, se Qdrant gira tramite questo `docker-compose.yml`, usa la porta host `6335`:

```env
QDRANT_URL=http://localhost:6335
```

## Windows

Su Windows usa Docker Desktop con backend WSL2.

Nel file `.env` della root, i path della cartella documenti devono usare slash `/`:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/sources
```

Evita:

```env
CSV_HOST_SOURCE_DIR=C:\Users\Mario\Documents\sources
```

Il backend Docker raggiunge Ollama locale tramite:

```env
OLLAMA_URL=http://host.docker.internal:11434
```

Se il backend non riesce a chiamare Ollama, verifica da Windows:

```bash
ollama list
```

## File da Non Committare

Non committare:

- `.env`
- `qzr-ai-be/.env`
- `qzr-ai-be/.env.docker`
- `qzr-ai-tanstack/.env`
- `node_modules`
- `dist`
- CSV/PDF reali dentro `data/csv`
- CSV/PDF caricati dentro `data/uploads`

I template da committare sono:

- `.env.example`
- `qzr-ai-be/.env.example`
- `qzr-ai-be/.env.docker.example`
- `qzr-ai-tanstack/.env.example`

## Troubleshooting

### `Failed to get chats`

Il DB Docker non ha ancora le tabelle Prisma.

Fix:

```bash
npm run docker:migrate
```

### `getaddrinfo ENOTFOUND qdrant`

Il backend non riesce a risolvere Qdrant nella rete Docker.

Fix:

```bash
docker compose down --remove-orphans
npm run docker:up
```

Se hai gia un altro Qdrant sulla porta `6333`, questo progetto espone Qdrant su `6335` per evitare conflitti.

### `fetch failed` durante `index:csv` o `index:pdf`

Controlla Ollama:

```bash
ollama list
```

Devono esserci:

```txt
embeddinggemma
almeno un modello chat, per esempio gemma3:12b
```

Controlla Qdrant dal backend:

```bash
docker compose exec backend node -e "fetch('http://qdrant:6333/collections').then(r => console.log(r.status)).catch(console.error)"
```

Se stampa `200`, Qdrant e raggiungibile.

Se lanci gli script in locale, controlla Qdrant dalla macchina host:

```bash
curl http://localhost:6335/collections
```

In locale `QDRANT_URL` deve essere:

```env
QDRANT_URL=http://localhost:6335
```

### I CSV o PDF non vengono trovati

Controlla `.env` nella root:

```env
CSV_HOST_SOURCE_DIR=./data/csv
```

Se usi una cartella custom, deve esistere sulla tua macchina e contenere file `.csv` o `.pdf`.

### Upload CSV/PDF non funziona

Controlla che il backend sia stato riavviato dopo le ultime modifiche:

```bash
npm --prefix qzr-ai-be run dev
```

oppure, se usi Docker:

```bash
docker compose up -d --build
```

Il frontend deve chiamare:

```txt
http://localhost:8555/context/upload
```

Se hai un file `qzr-ai-tanstack/.env`, verifica:

```env
VITE_API_BASE_URL=http://localhost:8555
```

### Vedere cosa viene mandato agli embeddings PDF

Per controllare il testo estratto dal PDF prima della creazione degli embeddings, abilita:

```env
DEBUG_INDEX_CHUNKS=true
DEBUG_INDEX_CHUNK_LIMIT=5
DEBUG_INDEX_CHARS=1600
DEBUG_INDEX_OUTPUT_DIR=/app/uploads/debug
```

Poi reindicizza i PDF:

```bash
npm run index:pdf
```

Il backend stampera in console i primi chunk che vengono inviati al modello embeddings.

Se usi Docker, viene scritto anche un file `.txt` leggibile dalla macchina host in:

```txt
data/uploads/debug
```

### Warning `standardFontDataUrl` durante `index:pdf`

Durante l'estrazione PDF potresti vedere:

```txt
Ensure that the `standardFontDataUrl` API parameter is provided
```

Se l'indicizzazione continua e stampa `PDF indexing completed`, il warning non e bloccante.
