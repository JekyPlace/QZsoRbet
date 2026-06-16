# QZR AI TanStack

App composta da:

- frontend React/TanStack in `qzr-ai-tanstack`
- backend Express/Prisma in `qzr-ai-be`
- Postgres e Qdrant via Docker Compose
- Ollama locale sul Mac, usato dal backend Docker tramite `host.docker.internal`

## Requisiti

Installa:

- Docker Desktop
- Node.js
- Ollama

## Requisiti di Sistema

Consigliati:

- macOS con Docker Desktop attivo
- almeno 16 GB di RAM
- almeno 15-25 GB liberi su disco
- CPU Apple Silicon o Intel recente
- Ollama avviato in locale sulla porta `11434`

Spazio indicativo:

- `embeddinggemma`: circa 600 MB
- `gemma3:12b`: circa 8 GB
- volumi Docker per Postgres e Qdrant: dipendono da chat, CSV e embeddings indicizzati

Con 8 GB di RAM l'app puo partire, ma `gemma3:12b` puo essere lento o pesante. In quel caso usa un modello piu piccolo e aggiorna il modello nel backend.

### Windows

L'app puo funzionare anche su Windows, usando Docker Desktop con backend WSL2.

Requisiti specifici:

- Docker Desktop con WSL2 attivo
- Node.js installato su Windows o dentro WSL
- Ollama installato e avviato su Windows
- modelli Ollama scaricati localmente

Nel file `.env` della root, i path dei CSV devono usare gli slash `/`, non le backslash `\`.

Esempio corretto:

```env
CSV_HOST_SOURCE_DIR=C:/Users/Mario/Documents/csv
```

Esempio da evitare:

```env
CSV_HOST_SOURCE_DIR=C:\Users\Mario\Documents\csv
```

Il backend Docker raggiunge Ollama locale tramite:

```env
OLLAMA_URL=http://host.docker.internal:11434
```

Su Docker Desktop per Windows questo host di solito funziona automaticamente. Se il backend non riesce a chiamare Ollama, verifica prima che Ollama risponda da Windows:

```bash
ollama list
```

Poi scarica i modelli Ollama usati dall'app:

```bash
ollama pull embeddinggemma
ollama pull gemma3:12b
```

`embeddinggemma` serve per indicizzare i CSV in Qdrant.
`gemma3:12b` serve per generare le risposte in chat.

## CSV

L'app indicizza file `.csv` letti da una cartella del tuo computer.

Scelta semplice: metti i CSV qui:

```txt
data/csv
```

Oppure specifica una cartella custom nel file `.env` della root:

```env
CSV_HOST_SOURCE_DIR=/Users/jacopo/Sources
```

Nel container backend questa cartella viene montata come:

```txt
/app/data
```

Il backend usa infatti:

```env
CSV_SOURCE_DIR=/app/data
```

## Primo Setup Docker

Dalla root del progetto:

```bash
npm run install:all
```

Poi:

```bash
npm run docker:setup
```

Questo comando fa:

1. crea `.env` e `qzr-ai-be/.env.docker` dai rispettivi template se mancano
2. avvia `backend`, `postgres` e `qdrant`
3. genera il Prisma Client
4. applica le migration Prisma
5. indicizza i CSV in Qdrant

Poi avvia il frontend:

```bash
npm run dev:frontend
```

Apri:

```txt
http://localhost:3000
```

## Uso Quotidiano

Se hai gia fatto il setup:

```bash
npm run docker:up
npm run dev:frontend
```

Non serve reindicizzare ogni volta.

Rifai l'indicizzazione solo quando cambi i CSV o quando Qdrant e vuoto:

```bash
npm run docker:index
```

Rifai le migration solo quando il DB e nuovo o ci sono nuove migration:

```bash
npm run docker:migrate
```

## Comandi Utili

Avvia backend, Postgres e Qdrant:

```bash
npm run docker:up
```

Spegni i container:

```bash
npm run docker:down
```

Guarda i log backend:

```bash
npm run docker:logs
```

Applica migration Prisma nel DB Docker:

```bash
npm run docker:migrate
```

Indicizza i CSV:

```bash
npm run docker:index
```

Typecheck backend e frontend:

```bash
npm run typecheck
```

## Porte

Frontend:

```txt
http://localhost:3000
```

Backend:

```txt
http://localhost:8555
```

Postgres Docker dal Mac:

```txt
localhost:5475
```

Qdrant Docker dal Mac:

```txt
http://localhost:6335
```

Dentro Docker il backend usa invece:

```env
DATABASE_URL=postgresql://postgres:jacopoqzr@postgres:5432/qzr_ai
QDRANT_URL=http://qdrant:6333
OLLAMA_URL=http://host.docker.internal:11434
```

## Errori Comuni

### `Failed to get chats`

Cause probabile: le tabelle Prisma non esistono ancora nel DB Docker.

Fix:

```bash
npm run docker:migrate
```

### `getaddrinfo ENOTFOUND qdrant`

Cause probabile: container Qdrant non ricreato correttamente o conflitto porte.

Fix:

```bash
docker compose down --remove-orphans
npm run docker:up
```

### `fetch failed` durante `index:csv`

Verifica prima Ollama:

```bash
ollama list
```

Devono esserci almeno:

```txt
embeddinggemma
gemma3:12b
```

Poi verifica Qdrant:

```bash
docker compose exec backend node -e "fetch('http://qdrant:6333/collections').then(r => console.log(r.status)).catch(console.error)"
```

Se stampa `200`, Qdrant e raggiungibile.

### I CSV non vengono trovati

Controlla `.env` nella root:

```env
CSV_HOST_SOURCE_DIR=./data/csv
```

Se usi una cartella custom, deve esistere sul tuo Mac.
