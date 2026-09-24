/**
 * Controlla tutti i contenuti del corso e genera src/content/registry.generated.ts.
 *
 *   npm run content         → valida + rigenera il registro
 *   npm run content:check   → solo validazione (non scrive nulla)
 *
 * Gira in automatico prima di `npm run dev` e `npm run build`:
 * un errore nei contenuti blocca il build invece di rompere una lezione a runtime.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import type { z } from 'zod';
import { Course, NodeContent, Verb, VocabSet, Exercise, PERSONS } from '../src/content/schema';

const ROOT = join(__dirname, '..');
const DIR = join(ROOT, 'src', 'content');
const CHECK_ONLY = process.argv.includes('--check');

const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${relative(ROOT, file)}: ${msg}`);

function load<S extends z.ZodType>(file: string, schema: S): z.infer<S> | null {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    fail(file, `JSON non valido (${(e as Error).message})`);
    return null;
  }
  const res = schema.safeParse(raw);
  if (!res.success) {
    for (const issue of res.error.issues) fail(file, `${issue.path.join('.') || '(radice)'}: ${issue.message}`);
    return null;
  }
  return res.data;
}

const jsonFiles = (sub: string) =>
  readdirSync(join(DIR, sub))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => join(DIR, sub, f));

// ---------- Caricamento ----------

const courseFile = join(DIR, 'course.json');
const course = load(courseFile, Course);

const verbs = new Map<string, { file: string; data: Verb }>();
for (const f of jsonFiles('verbs')) {
  const v = load(f, Verb);
  if (!v) continue;
  if (v.id !== basename(f, '.json')) fail(f, `l'id "${v.id}" deve coincidere col nome del file`);
  verbs.set(v.id, { file: f, data: v });
}

const vocab = new Map<string, { file: string; set: string }>();
const vocabSets: { file: string; data: VocabSet }[] = [];
for (const f of jsonFiles('vocab')) {
  const s = load(f, VocabSet);
  if (!s) continue;
  if (s.id !== basename(f, '.json')) fail(f, `l'id "${s.id}" deve coincidere col nome del file`);
  vocabSets.push({ file: f, data: s });
  for (const item of s.items) {
    const dup = vocab.get(item.id);
    if (dup) fail(f, `voce "${item.id}" già definita in ${relative(ROOT, dup.file)}`);
    else vocab.set(item.id, { file: f, set: s.id });
  }
}

const nodes = new Map<string, { file: string; data: NodeContent }>();
/** Tutti i file di lezione presenti, anche quelli con errori (per non dire "manca il file" a torto) */
const nodeFiles = new Set(jsonFiles('nodes').map((f) => basename(f, '.json')));
for (const f of jsonFiles('nodes')) {
  const n = load(f, NodeContent);
  if (!n) continue;
  if (n.id !== basename(f, '.json')) fail(f, `l'id "${n.id}" deve coincidere col nome del file`);
  nodes.set(n.id, { file: f, data: n });
}

// ---------- Controlli incrociati ----------

const answerOf = (text: string) => text.match(/\{([^{}]+)\}/)![1];
const exerciseIds = new Map<string, string>();

function checkExercise(file: string, ex: Exercise) {
  const where = `esercizio "${ex.id}"`;

  const prev = exerciseIds.get(ex.id);
  if (prev) fail(file, `${where}: id già usato in ${prev}`);
  else exerciseIds.set(ex.id, relative(ROOT, file));

  const answer = answerOf(ex.text);
  const verbTargets: { verb: Verb; tense: string; person: string }[] = [];

  for (const ref of ex.trains) {
    const [kind, a, b, c] = ref.split(':');
    if (kind === 'vocab') {
      if (!vocab.has(a)) fail(file, `${where}: la voce "${a}" non esiste in nessun file di vocab/`);
      continue;
    }
    const verb = verbs.get(a)?.data;
    if (!verb) {
      fail(file, `${where}: il verbo "${a}" non esiste in verbs/`);
      continue;
    }
    if (!verb.conjugations[b]) fail(file, `${where}: il verbo "${a}" non ha il tempo "${b}"`);
    else if (!(PERSONS as readonly string[]).includes(c)) fail(file, `${where}: persona "${c}" sconosciuta (${PERSONS.join(', ')})`);
    else verbTargets.push({ verb, tense: b, person: c });
  }

  // Se l'esercizio allena una sola forma verbale, la risposta deve essere proprio quella forma
  if (verbTargets.length === 1) {
    const { verb, tense, person } = verbTargets[0];
    const form = verb.conjugations[tense][person as keyof (typeof verb.conjugations)[string]];
    if (form.toLowerCase() !== answer.toLowerCase())
      fail(file, `${where}: la risposta "${answer}" non è la forma di ${verb.infinitive} (${tense}, ${person}), che è "${form}"`);
  }

  if (ex.type === 'choose') {
    if (ex.wrongFrom === 'verb-forms') {
      if (verbTargets.length === 0) fail(file, `${where}: "wrongFrom": "verb-forms" richiede un "verb:…" in trains`);
      else {
        const { verb, tense } = verbTargets[0];
        const others = new Set(Object.values(verb.conjugations[tense]).filter((f) => f.toLowerCase() !== answer.toLowerCase()));
        if (others.size < 2) fail(file, `${where}: le altre forme del verbo sono troppo poche per generare le opzioni`);
      }
    }
    if (ex.wrong) {
      if (ex.wrong.some((w) => w.toLowerCase() === answer.toLowerCase()))
        fail(file, `${where}: la risposta giusta "${answer}" compare anche tra le opzioni sbagliate`);
      if (new Set(ex.wrong.map((w) => w.toLowerCase())).size !== ex.wrong.length) fail(file, `${where}: opzioni sbagliate duplicate`);
    }
  }
}

for (const { file, data } of verbs.values()) data.exercises.forEach((e) => checkExercise(file, e));

for (const { file, data } of nodes.values()) {
  data.exercises.forEach((e) => checkExercise(file, e));
  data.theory?.forEach((card, i) => {
    const where = `teoria[${i}] "${card.title}"`;
    if (card.verb) {
      const v = verbs.get(card.verb.verb)?.data;
      if (!v) fail(file, `${where}: il verbo "${card.verb.verb}" non esiste`);
      else if (!v.conjugations[card.verb.tense]) fail(file, `${where}: il verbo "${card.verb.verb}" non ha il tempo "${card.verb.tense}"`);
    }
    card.vocab?.forEach((id) => {
      if (!vocab.has(id)) fail(file, `${where}: la voce "${id}" non esiste in vocab/`);
    });
  });
}

if (course) {
  const seen = new Set<string>();
  for (const ch of course.chapters) {
    for (const n of ch.nodes) {
      if (seen.has(n.id)) fail(courseFile, `nodo "${n.id}" presente due volte`);
      seen.add(n.id);
    }
  }
  for (const ch of course.chapters) {
    for (const n of ch.nodes) {
      if (!n.draft && !nodeFiles.has(n.id)) fail(courseFile, `nodo "${n.id}": manca il file nodes/${n.id}.json (oppure segnalo "draft": true)`);
      if (n.draft && nodeFiles.has(n.id)) fail(courseFile, `nodo "${n.id}": è segnato "draft" ma il file esiste già: togli "draft"`);
      n.requires?.forEach((r) => {
        if (!seen.has(r)) fail(courseFile, `nodo "${n.id}": richiede "${r}", che non esiste`);
      });
    }
  }
  for (const [id, { file }] of nodes) {
    if (!seen.has(id)) fail(file, `la lezione non è inserita in nessun capitolo di course.json`);
  }
}

// ---------- Esito ----------

if (errors.length) {
  console.error(`\n✗ Contenuti: ${errors.length} problema/i\n`);
  errors.forEach((e) => console.error('  • ' + e));
  console.error('');
  process.exit(1);
}

const count = `${nodes.size} lezioni, ${verbs.size} verbi, ${vocab.size} vocaboli, ${exerciseIds.size} esercizi`;

if (CHECK_ONLY) {
  console.log(`✓ Contenuti validi (${count})`);
  process.exit(0);
}

// ---------- Registro generato ----------

const ident = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
const verbIds = [...verbs.keys()];
const vocabIds = vocabSets.map((s) => s.data.id);
const out = `// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
import type { NodeContent, Verb, VocabSet } from './schema';
${verbIds.map((id) => `import verb_${ident(id)} from './verbs/${id}.json';`).join('\n')}
${vocabIds.map((id) => `import vocab_${ident(id)} from './vocab/${id}.json';`).join('\n')}

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [${verbIds.map((id) => `verb_${ident(id)}`).join(', ')}] as unknown as Verb[];
export const vocabSetList = [${vocabIds.map((id) => `vocab_${ident(id)}`).join(', ')}] as unknown as VocabSet[];

/** Lezioni: ognuna è un file separato, scaricato solo quando la si apre */
export const nodeLoaders: Record<string, () => Promise<NodeContent>> = {
${[...nodes.keys()].map((id) => `  ${JSON.stringify(id)}: () => import('./nodes/${id}.json').then((m) => m.default as unknown as NodeContent),`).join('\n')}
};
`;
const target = join(DIR, 'registry.generated.ts');
const previous = existsSync(target) ? readFileSync(target, 'utf8') : '';
if (previous !== out) writeFileSync(target, out);
console.log(`✓ Contenuti validi (${count})${previous !== out ? ', registro aggiornato' : ''}`);
