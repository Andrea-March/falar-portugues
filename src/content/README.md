# Contenuti dei corsi

Ogni corso ha la sua cartella in `courses/<corso>/` (oggi `pt`, il portoghese per italiani, e `it`,
l'italiano per chi parla portoghese). L'app ne contiene uno solo, scelto al build con la variabile
`COURSE` (predefinito `pt`): `COURSE=it npm run dev`, oppure `COURSE=it` nelle variabili di Vercel.
L'app legge i contenuti solo tramite `index.ts`; i percorsi qui sotto sono dentro la cartella del corso.

```
config.ts            lingue, persone grammaticali, tempi, accenti, nome dell'app
ui.ts                testi dell'interfaccia (stesse chiavi in ogni corso)
audio.config.json    servizio e voci dell'audio pregenerato
```

Nei file i campi sono neutri: `text` è nella lingua che si impara, `translation` e `learnerNote`
nella lingua di chi impara.

```
course.json          ordine di capitoli e lezioni + titolo, descrizione, icona di ogni lezione
nodes/<id>.json      una lezione: teoria ed esercizi
verbs/<id>.json      un verbo: coniugazioni + frasi per la pratica (sezione Gramática)
vocab/<id>.json      un gruppo di vocaboli
schema.ts            le regole che ogni file deve rispettare
registry.generated.ts  generato in automatico, non modificarlo
```

Dopo ogni modifica: `npm run content` (parte da solo anche con `npm run dev` e `npm run build`).
Se qualcosa non va, lo script dice file, esercizio e problema.

## Aggiungere una lezione

1. In `course.json`, aggiungi il nodo nel capitolo giusto (`id`, `kind`, `title`, `subtitle`, `icon`).
2. Crea `nodes/<id>.json` con lo stesso `id`.
3. `npm run content`.

Una lezione non ancora scritta può stare sulla mappa con `"draft": true` (mostra "Em breve").

Di norma un nodo si sblocca dopo la Prática del precedente. Con `"openWithPrevious": true` si apre
insieme al precedente: così, per esempio, i primi tre nodi del capitolo 1 sono aperti fin dall'inizio.

## Esercizi

La risposta va tra graffe dentro la frase. Lo stesso formato vale per tutti i tipi.

```json
{ "id": "ser_eu_roma", "type": "write",  "text": "Eu {sou} de Roma.", "translation": "Io sono di Roma.",
  "trains": ["verb:ser:presente:eu"] }

{ "id": "bom_dia_1", "type": "choose", "text": "{Bom dia}! Tudo bem?",
  "wrong": ["Boa noite", "Boa tarde", "Adeus"], "trains": ["vocab:bom-dia"] }

{ "id": "ser_voce_pt", "type": "choose", "text": "Você {é} de Portugal?",
  "wrongFrom": "verb-forms", "trains": ["verb:ser:presente:ele_ela_voce"] }
```

- `write`: l'utente scrive. `choose`: sceglie tra opzioni.
- `wrong`: opzioni sbagliate scritte a mano. `wrongFrom: "verb-forms"`: generate dalle altre forme del verbo.
  Nelle conversazioni servono anche nei `write`: in Prática tutti i turni sono a scelta.
- `trains` (obbligatorio): cosa allena l'esercizio, servirà per il ripasso.
  `verb:<verbo>:<tempo>:<persona>` oppure `vocab:<id voce>`.
  Persone: `eu`, `tu`, `ele_ela_voce`, `nos`, `eles_elas_voces`.
- `prompt` (facoltativo): consegna personalizzata. Se manca, la genera l'app.
- `id`: unico in tutto il corso e **stabile**: non cambiarlo dopo la pubblicazione,
  servirà a ricordare quali esercizi l'utente ha già fatto.

Controlli automatici utili: se un esercizio allena una sola forma verbale, la risposta
deve essere proprio quella forma (`"Ela {és}"` con `ele_ela_voce` viene segnalato).

## Teoria

```json
{ "title": "Il verbo ser", "text": "Si usa per **caratteristiche permanenti**.",
  "verb": { "verb": "ser", "tense": "presente" },
  "vocab": ["bom-dia", "boa-tarde"],
  "examples": [{ "text": "Eu sou italiano.", "translation": "Io sono italiano." }] }
```

`verb` mostra la tabella presa da `verbs/`, `vocab` mostra le voci prese da `vocab/`:
niente va ricopiato a mano.

## Studio guidato del vocabolario

```json
{ "vocabStudy": { "groups": [
    { "label": "Saluti del giorno", "items": ["bom-dia", "boa-tarde", "boa-noite"] },
    { "label": "Tra amici", "items": ["ola", "como-estas", "tudo-bem"] }
] } }
```

Ogni voce diventa una schermata: l'audio parte da solo, si vedono traduzione, `usage`
(quando si usa), `note` e `icon`, e si ricopia l'espressione sopra il modello.
La punteggiatura finale ("?", "!") si vede ma non si digita.
Alla fine c'è una schermata a memoria: per ogni voce si mostra la sua `situation`,
che quindi è obbligatoria (a meno di `"recall": false`). Scrivi situazioni che portino
a una sola espressione del gruppo: se l'utente scrive quella di un'altra riga, l'app
gli dice che esiste ma che ce n'è una più adatta.

```json
{ "id": "bom-dia", "text": "Bom dia!", "translation": "Buongiorno!", "icon": "☀️",
  "usage": "Dal mattino fino all'ora di pranzo.",
  "situation": "☀️ Sono le 9 del mattino ed entri al bar: saluti il barista." }
```

## Sessioni

Ogni nodo si fa in più sessioni (vedi `sessionsFor` in `index.ts`):
Descoberta (teoria), Prática (esercizi come sono scritti), Produção (tutto da scrivere,
più esercizi ricavati da teoria e vocabolario), Teste final (come Produção, mescolato,
serve l'80%). I checkpoint hanno solo il test.

Nelle conversazioni (`dialogue`) Prática ha tutti i turni a scelta, Produção tutti da
scrivere, e il Teste final usa una **conversazione nuova** nella stessa situazione,
scritta nel campo `test` (obbligatorio), così non si supera ricordando quella di Produção.
Riusa le espressioni di tutto il capitolo; `test.speaker` se l'interlocutore cambia.

Gli esercizi si scrivono **una volta sola**: le sessioni ne ricavano le modalità.
Poiché in Produção e Teste anche i `choose` si scrivono, se ci sono più risposte giuste
indicale in `accept`:

```json
{ "id": "ex_1_3_4", "type": "choose", "text": "Aqui tem. {Obrigado}!",
  "wrong": ["De nada", "Por favor"], "accept": ["Obrigada"], "trains": ["vocab:obrigado"] }
```

## Audio

L'app legge le frasi con audio pregenerati (voce pt-PT), e usa la voce del browser
solo se un file manca. Il servizio si sceglie in `audio.config.json` ("provider"):

- `piper` (attuale): open source, gira sul computer, gratis. Una volta sola:
  `pip install piper-tts lameenc`. Il modello della voce si scarica da solo in `.piper-voices/`.
- `azure`: voci neurali Azure Speech, serve `AZURE_SPEECH_KEY` e `AZURE_SPEECH_REGION` in `.env.local`.

Dopo aver aggiunto o modificato contenuti:

```
npm run audio:check   # quante frasi mancano, caratteri, peso stimato
npm run audio         # le genera in public/audio (da committare)
```

Un interlocutore può avere la sua voce:
`"speaker": { "name": "Sr. Manuel", "avatar": "👨🏻", "voice": "homem" }`.
L'elenco di ciò che si legge sta in `speech.ts`: se un componente inizia a leggere
un testo nuovo, va aggiunto lì, altrimenti per quel testo si sentirà la voce del browser.
