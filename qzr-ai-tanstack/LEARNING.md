# Percorso di apprendimento TanStack

Questo file tiene traccia di cosa e gia solido, cosa approfondire e quale task
affrontare dopo. Va aggiornato dopo ogni review o modifica significativa.

## Obiettivo attuale

Imparare TanStack Router costruendo una piccola applicazione chat, prima di
aggiungere TanStack Query o passare a TanStack Start.

## Mappa dello stack

- React 19: rendering dei componenti.
- Vite 8: sviluppo e build della SPA.
- TanStack Router: routing type-safe e file-based.
- Router plugin: genera `src/routeTree.gen.ts` e abilita il code splitting.
- Tailwind CSS 4: styling.
- Vitest: test runner, ancora senza test.

> Nota: questo progetto non usa ancora TanStack Start. Il README iniziale lo
> nomina, ma `@tanstack/react-start` non e installato.

## Cose gia ben impostate

- Le route sono separate in `src/routes`.
- La root route usa `<Outlet />` per renderizzare la route figlia.
- `defaultPreload: "intent"` precarica una route quando l'utente mostra
  intenzione di visitarla.
- `scrollRestoration` e abilitato.
- Il plugin del router genera un route tree type-safe.
- Il code splitting automatico produce un chunk separato per `/chat`.
- TypeScript usa opzioni strict.
- La build di produzione passa.

## Punti critici da imparare

- Distinguere TanStack Router, TanStack Query e TanStack Start.
- Avere una sola istanza del router e una sola dichiarazione `Register`.
- Non modificare manualmente `src/routeTree.gen.ts`: e codice generato.
- Usare `<Link>` invece di un normale `<a>` per la navigazione SPA type-safe.
- Capire root route, route figlie, `<Outlet />` e layout.
- Capire che una route dinamica annidata richiede l'`<Outlet />` nel suo parent.
- Modellare loading, error e empty state con markup HTML valido.
- Scrivere test per navigazione e componenti.

## Debito tecnico osservato

- `src/main.tsx` e `src/router.tsx` creano entrambi un router. Quello in
  `src/router.tsx` al momento non viene usato.
- `README.md` descrive TanStack Start, ma il progetto e una SPA con TanStack
  Router.
- `src/main.tsx` importa `TanStackRouterDevtools` senza usarlo; per questo il
  type-check attualmente fallisce.
- `SelectModel` usa testo libero come figlio di `<select>` negli stati loading
  ed error: dentro un select dovrebbe essere renderizzata una `<option>`.
- I tipi di `SelectModel` hanno molti `undefined` opzionali che rendono il
  componente piu difficile da usare e verificare.
- Non ci sono ancora test.

## Task 1 - Una sola istanza del router

**Stato: quasi completato**

Hai centralizzato correttamente il router in `src/router.tsx`, ripulito
`src/main.tsx` e aggiunto lo script `typecheck`. Manca ancora la navigazione
Home/Chat con `<Link>` nella root route.

### Problema

La configurazione del router e duplicata. Questo rende facile cambiare
un'opzione nel file sbagliato e crea due fonti di verita.

### Passi

1. In `src/main.tsx`, importa `getRouter` da `src/router.tsx`.
2. Rimuovi da `src/main.tsx` la creazione locale del router, l'import del route
   tree, l'import inutilizzato di `TanStackRouterDevtools` e la dichiarazione
   del modulo.
3. Crea il router una volta con `const router = getRouter()`.
4. Aggiungi nella root route una piccola navigazione con due `<Link>`:
   `/` e `/chat`.
5. Verifica la navigazione dal browser senza ricaricamento completo.
6. Aggiungi a `package.json` lo script `"typecheck": "tsc --noEmit"`.
7. Esegui `npm run typecheck` e `npm run build`.

### Risultato atteso

`src/router.tsx` e l'unico posto che configura il router. `src/main.tsx` si
limita ad avviare React e passare il router a `<RouterProvider>`.

### Concetti da saper spiegare

- Perche il type registration di TanStack Router serve a rendere type-safe
  link, navigazione e hook.
- Perche `defaultPreload: "intent"` migliora la navigazione.
- Perche `<Link to="/chat">` e preferibile a `<a href="/chat">`.

### Definition of done

- Esiste una sola chiamata a `createRouter` o `createTanStackRouter`.
- Esiste una sola dichiarazione `interface Register`.
- I link Home e Chat funzionano.
- `npm run typecheck` passa.
- `npm run build` passa.

## Prossimi task

1. Completare il Task 1 aggiungendo i link Home e Chat nella root route.
2. Sistemare `SelectModel` usando stati espliciti e HTML valido.
3. Aggiungere search params type-safe alla route `/chat`.
4. Introdurre un loader della route e gestire pending/error state.
5. Aggiungere i primi test con Vitest e Testing Library.
6. Valutare TanStack Query quando serviranno cache, refetch e mutation.
7. Valutare TanStack Start solo quando serviranno server function o SSR.

## Registro verifiche

- 2026-06-09: `npm run build` passa.
- 2026-06-09: `npx tsc --noEmit` fallisce per l'import inutilizzato di
  `TanStackRouterDevtools` in `src/main.tsx`.
- 2026-06-09: `npm test -- --passWithNoTests` passa, ma non trova test.
- 2026-06-09: review Task 1: esiste una sola istanza del router e una sola
  dichiarazione `Register`; `npm run typecheck` e `npm run build` passano.
  Mancano ancora i `<Link>` Home e Chat richiesti dalla Definition of Done.
- 2026-06-09: `/chat/$chatId` era generata correttamente, ma non appariva
  perche la route parent `/chat` non renderizzava `<Outlet />`. Aggiunti
  outlet, link type-safe di esempio e lettura del parametro con
  `Route.useParams()`.
- 2026-06-09: dopo la correzione della route dinamica, `npm run typecheck`,
  `npm run build` e il test runner passano. La verifica automatica nel browser
  locale non e disponibile nelle preferenze correnti.
