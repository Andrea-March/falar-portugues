# Contenuti del corso

Tutto il materiale didattico vive qui. L'app lo legge solo tramite `index.ts`.

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

## Esercizi

La risposta va tra graffe dentro la frase. Lo stesso formato vale per tutti i tipi.

```json
{ "id": "ser_eu_roma", "type": "write",  "text": "Eu {sou} de Roma.", "it": "Io sono di Roma.",
  "trains": ["verb:ser:presente:eu"] }

{ "id": "bom_dia_1", "type": "choose", "text": "{Bom dia}! Tudo bem?",
  "wrong": ["Boa noite", "Boa tarde", "Adeus"], "trains": ["vocab:bom-dia"] }

{ "id": "ser_voce_pt", "type": "choose", "text": "Você {é} de Portugal?",
  "wrongFrom": "verb-forms", "trains": ["verb:ser:presente:ele_ela_voce"] }
```

- `write`: l'utente scrive. `choose`: sceglie tra opzioni.
- `wrong`: opzioni sbagliate scritte a mano. `wrongFrom: "verb-forms"`: generate dalle altre forme del verbo.
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
  "examples": [{ "pt": "Eu sou italiano.", "it": "Io sono italiano." }] }
```

`verb` mostra la tabella presa da `verbs/`, `vocab` mostra le voci prese da `vocab/`:
niente va ricopiato a mano.
