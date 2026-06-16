# QZsoRbet di ©QZR Studio

QZsoRbet e una web app full-stack per interrogare file CSV tramite una chat AI locale.

L'app legge i CSV da una cartella configurabile, li indicizza in un vector database e usa quei dati come contesto per rispondere alle domande dell'utente.

In pratica:

```txt
CSV -> embeddings -> Qdrant -> retrieval semantico -> Ollama -> risposta in chat
```

## Cosa Fa

- indicizza file `.csv`
- genera embeddings con Ollama
- salva gli embeddings in Qdrant
- recupera i contenuti piu rilevanti rispetto alla domanda
- usa il contesto recuperato per generare una risposta
- salva chat e messaggi in Postgres
- mostra le risposte in streaming nel frontend React

Lo use case tipico e un assistente AI privato che risponde usando dati aziendali locali, senza mandare i CSV a servizi cloud.

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

`embeddinggemma` serve per indicizzare i CSV.
`gemma3:12b` serve per generare le risposte in chat.

Con 8 GB di RAM l'app puo partire, ma `gemma3:12b` puo essere lento o pesante. In quel caso conviene usare un modello piu piccolo e aggiornare il modello nel backend.

## Setup CSV

Scelta semplice: metti i CSV in:

```txt
data/csv
```

Oppure configura una cartella custom nel file `.env` della root:

```env
CSV_HOST_SOURCE_DIR=/Users/jacopo/Sources
```

Su Windows usa slash `/`, non backslash `\`:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/csv
```

Dentro Docker questa cartella viene montata come:

```txt
/app/data
```

Il backend legge i CSV da:

```env
CSV_SOURCE_DIR=/app/data
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
5. indicizza i CSV in Qdrant

Prima di lanciarlo assicurati che:

- Ollama sia avviato
- i modelli Ollama siano installati
- la cartella CSV esista e contenga almeno un file `.csv`

## Uso Quotidiano

Dopo il primo setup:

```bash
npm run docker:up
npm run dev:frontend
```

Non serve reindicizzare ogni volta.

Reindicizza solo quando cambi i CSV o quando Qdrant e vuoto:

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

Indicizza i CSV:

```bash
npm run docker:index
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
```

## Windows

Su Windows usa Docker Desktop con backend WSL2.

Nel file `.env` della root, i path dei CSV devono usare slash `/`:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/csv
```

Evita:

```env
CSV_HOST_SOURCE_DIR=C:\Users\Mario\Documents\csv
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
- CSV reali dentro `data/csv`

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

### `fetch failed` durante `index:csv`

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

### I CSV non vengono trovati

Controlla `.env` nella root:

```env
CSV_HOST_SOURCE_DIR=./data/csv
```

Se usi una cartella custom, deve esistere sulla tua macchina.
