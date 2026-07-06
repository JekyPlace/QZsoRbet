# QZsoRbet Frontend

Frontend React/TanStack Router per QZsoRbet.

La procedura completa di installazione e indicizzazione documenti e nel README della root del progetto.

## Requisiti

Prima di avviare il frontend devono essere attivi:

- backend su `http://localhost:8555`
- Ollama su `http://localhost:11434`
- almeno un modello chat installato in Ollama
- modello embeddings `embeddinggemma`
- Postgres e Qdrant, normalmente tramite Docker Compose dalla root

Il frontend legge dal backend:

- lista chat
- streaming risposte
- modelli Ollama installati
- upload documenti CSV/PDF
- lista dei file caricati come contesto

## Avvio

Dalla root del progetto:

```bash
npm run dev:frontend
```

Oppure da questa cartella:

```bash
npm install
npm run dev
```

Apri:

```txt
http://localhost:3000
```

## Backend URL

Di default il frontend usa:

```txt
http://localhost:8555
```

Per cambiare endpoint backend crea un file `.env` in questa cartella:

```env
VITE_API_BASE_URL=http://localhost:8555
```

## Modelli Ollama

La select "Modello" mostra i modelli installati in Ollama tramite l'endpoint backend `/models`.

Esempio:

```bash
ollama pull embeddinggemma
ollama pull gemma3:12b
ollama pull llama3.2:3b
```

`embeddinggemma` serve per indicizzare CSV/PDF.
I modelli chat vengono usati per generare le risposte.

## Documenti Supportati

Il frontend permette sia di interrogare i dati gia indicizzati sia di caricare nuovi documenti dalla pagina "Fornisci contesto".

I documenti supportati sono:

- CSV
- PDF

Dalla sidebar apri la pagina con icona cervello, poi trascina un file `.csv` o `.pdf`.

Il backend salva il file, lo indicizza subito e il frontend aggiorna la lista dei file caricati.

Per reindicizzare documenti presenti nella cartella sorgente, usa i comandi dalla root:

```bash
npm run docker:index
```

oppure:

```bash
npm run index:csv
npm run index:pdf
```

## Comandi Utili

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run test
```
