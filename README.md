# QZsoRbet di ©QZR Studio

QZsoRbet e una web app full-stack per interrogare file CSV e PDF tramite una chat AI locale.

L'app legge CSV e PDF da una cartella configurabile, li indicizza in un vector database e usa quei dati come contesto per rispondere alle domande dell'utente.

In pratica:

```txt
CSV/PDF -> chunks -> embeddings -> Qdrant -> retrieval semantico -> Ollama -> risposta in chat
```

## Cosa Fa

- indicizza file `.csv`
- indicizza file `.pdf`
- estrae testo dai PDF e lo divide in chunk
- genera embeddings con Ollama
- salva gli embeddings in Qdrant
- recupera i contenuti piu rilevanti rispetto alla domanda
- usa il contesto recuperato per generare una risposta
- salva chat e messaggi in Postgres
- mostra le risposte in streaming nel frontend React

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

Scarica i modelli usati dall'app:

```bash
ollama pull embeddinggemma
ollama pull gemma3:12b
```

`embeddinggemma` serve per indicizzare CSV e PDF.
`gemma3:12b` serve per generare le risposte in chat.

Con 8 GB di RAM l'app puo partire, ma `gemma3:12b` puo essere lento o pesante. In quel caso conviene usare un modello piu piccolo e aggiornare il modello nel backend.

## Setup Documenti

Scelta semplice: metti CSV e PDF in:

```txt
data/csv
```

Oppure configura una cartella custom nel file `.env` della root:

```env
CSV_HOST_SOURCE_DIR=/Users/jacopo/Sources
```

Questa variabile mantiene il nome `CSV_HOST_SOURCE_DIR` per compatibilita, ma la cartella puo contenere sia `.csv` che `.pdf`.

Su Windows usa slash `/`, non backslash `\`:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/sources
```

Dentro Docker questa cartella viene montata come:

```txt
/app/data
```

Il backend Docker legge CSV e PDF da:

```env
CSV_SOURCE_DIR=/app/data
PDF_SOURCE_DIR=/app/data
```

In locale, il backend puo leggere gli stessi file da:

```env
CSV_SOURCE_DIR=/Users/jacopo/Sources
PDF_SOURCE_DIR=/Users/jacopo/Sources
```

## Primo Avvio

Dalla root del progetto:

```bash
npm run install:all
npm run docker:setup
npm run dev:frontend
```

Poi apri:

```txt
http://localhost:3000
```

`npm run docker:setup` fa automaticamente:

1. crea `.env` e `qzr-ai-be/.env.docker` dai template se mancano
2. avvia backend, Postgres e Qdrant
3. genera il Prisma Client
4. applica le migration Prisma
5. indicizza CSV e PDF in Qdrant

Prima di lanciarlo assicurati che:

- Ollama sia avviato
- i modelli Ollama siano installati
- la cartella sorgente esista e contenga almeno un file `.csv` o `.pdf`

## Uso Quotidiano

Dopo il primo setup:

```bash
npm run docker:up
npm run dev:frontend
```

Non serve reindicizzare ogni volta.

Reindicizza solo quando cambi CSV/PDF o quando Qdrant e vuoto:

```bash
npm run docker:index
```

Applica le migration solo quando il DB e nuovo o ci sono nuove migration:

```bash
npm run docker:migrate
```

## Comandi

Installa dipendenze backend e frontend:

```bash
npm run install:all
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
gemma3:12b
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

### Warning `standardFontDataUrl` durante `index:pdf`

Durante l'estrazione PDF potresti vedere:

```txt
Ensure that the `standardFontDataUrl` API parameter is provided
```

Se l'indicizzazione continua e stampa `PDF indexing completed`, il warning non e bloccante.
