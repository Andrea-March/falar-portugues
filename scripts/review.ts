/**
 * Revisione dei contenuti da parte di una madrelingua, senza usare l'app.
 *
 *   npm run review:export            → revisione/revisione-AAAA-MM-GG.csv con le sole frasi da rivedere
 *   npm run review:approve <file>    → segna come approvate le righe con OK = "sì"
 *
 * Ogni riga ha un'impronta del suo contenuto (portoghese, traduzione, opzioni, note…).
 * Le impronte approvate stanno in src/content/review-approved.json: se una frase cambia,
 * cambia l'impronta e la frase torna nella revisione successiva. Le altre non si rivedono.
 *
 * Il CSV usa il punto e virgola e il BOM UTF-8, così Excel in italiano apre bene colonne e accenti.
 * L'approvazione accetta anche il CSV riesportato da Google Sheets (con le virgole).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chapters, loadNode } from '../src/content/index';
import { verbList, vocabSetList } from '../src/content/registry.generated';
import type { Exercise, NodeContent, TheoryItem } from '../src/content/schema';

const ROOT = join(__dirname, '..');
const APPROVED_FILE = join(ROOT, 'src', 'content', 'review-approved.json');
const OUT_DIR = join(ROOT, 'revisione');

const COLUMNS = [
  'Capitolo',
  'Lezione',
  'Tipo',
  'Portoghese',
  'Italiano',
  'Battuta prima',
  'Opzioni sbagliate',
  'Altre risposte accettate',
  'Nota per italiani',
  'Altro testo (istruzioni, uso)',
  'OK (sì/no)',
  'Correzione',
  'Commento',
  'ID',
  'Impronta',
] as const;
type Row = Partial<Record<(typeof COLUMNS)[number], string>>;

// ---------- Raccolta delle righe ----------

/** Frase completa: "{Estou} bem" → "Estou bem" */
const full = (text: string) => text.replace(/[{}]/g, '');
const answer = (text: string) => text.match(/\{(.*?)\}/)?.[1] ?? '';

function exerciseRow(ex: Exercise, where: Row): Row {
  const verbRef = ex.trains.find((t) => t.startsWith('verb:'));
  let wrong = ex.type === 'choose' ? ex.wrong?.join(' | ') : undefined;
  if (ex.type === 'choose' && ex.wrongFrom === 'verb-forms' && verbRef) {
    const [, verbId, tense] = verbRef.split(':');
    const forms = Object.values(verbList.find((v) => v.id === verbId)?.conjugations[tense] ?? {});
    wrong = `(altre forme di ${verbId}) ${forms.filter((f) => f.toLowerCase() !== answer(ex.text).toLowerCase()).join(' | ')}`;
  }
  return {
    ...where,
    Tipo: ex.type === 'choose' ? `Esercizio a scelta (risposta: ${answer(ex.text)})` : `Esercizio da scrivere (risposta: ${answer(ex.text)})`,
    Portoghese: full(ex.text),
    Italiano: ex.it,
    'Battuta prima': ex.context ? `${ex.context}  →  ${ex.contextIt ?? ''}` : undefined,
    'Opzioni sbagliate': wrong,
    'Altre risposte accettate': ex.accept?.join(' | '),
    'Nota per italiani': ex.italianNote,
    'Altro testo (istruzioni, uso)': ex.prompt,
    ID: ex.id,
  };
}

function theoryRows(theory: TheoryItem[], where: Row, id: string): Row[] {
  return theory.flatMap((card, i): Row[] => {
    if (!('text' in card) && !('examples' in card)) return []; // paradigmi e studio del vocabolario: righe a parte
    const c = card as { title?: string; text?: string; examples?: { pt: string; it: string; italianNote?: string }[] };
    const rows: Row[] = [];
    if (c.text) {
      rows.push({
        ...where,
        Tipo: 'Teoria (testo in italiano; in grassetto le parti in portoghese)',
        Portoghese: [...c.text.matchAll(/\*\*(.*?)\*\*/g)].map((m) => m[1]).join(' | '),
        Italiano: `${c.title ? c.title + ': ' : ''}${c.text.replace(/\*\*/g, '')}`,
        ID: `${id}:teoria${i}`,
      });
    }
    c.examples?.forEach((e, k) =>
      rows.push({ ...where, Tipo: 'Esempio', Portoghese: e.pt, Italiano: e.it, 'Nota per italiani': e.italianNote, ID: `${id}:teoria${i}:es${k}` })
    );
    return rows;
  });
}

async function collectRows(): Promise<Row[]> {
  const rows: Row[] = [];

  for (const chapter of chapters) {
    for (const node of chapter.nodes) {
      if (node.draft) continue;
      const content = (await loadNode(node.id)) as NodeContent | null;
      if (!content) continue;
      const where: Row = { Capitolo: `${chapter.number}. ${chapter.title}`, Lezione: node.title };
      rows.push(...theoryRows(content.theory ?? [], where, node.id));
      content.warmup?.exercises.forEach((ex) => rows.push({ ...exerciseRow(ex, where), Tipo: `Assaggio con ${content.warmup!.speaker.name}` }));
      content.exercises.forEach((ex) => rows.push(exerciseRow(ex, where)));
    }
  }

  for (const set of vocabSetList) {
    for (const v of set.items) {
      rows.push({
        Capitolo: 'Vocabolario',
        Lezione: set.title,
        Tipo: 'Espressione',
        Portoghese: v.pt,
        Italiano: v.it,
        'Nota per italiani': v.italianNote,
        'Altro testo (istruzioni, uso)': [v.note, v.usage, v.situation].filter(Boolean).join(' · '),
        ID: `vocab:${v.id}`,
      });
    }
  }

  for (const verb of verbList) {
    for (const [tense, forms] of Object.entries(verb.conjugations)) {
      rows.push({
        Capitolo: 'Verbi',
        Lezione: verb.infinitive,
        Tipo: `Coniugazione (${tense})`,
        Portoghese: Object.values(forms).join(', '),
        Italiano: verb.it,
        ID: `verb:${verb.id}:${tense}`,
      });
    }
    verb.exercises.forEach((ex) => rows.push(exerciseRow(ex, { Capitolo: 'Verbi', Lezione: verb.infinitive })));
  }

  // Impronta: tutto ciò che la revisione controlla. Se cambia qualcosa, la riga torna da rivedere.
  const checked = ['Tipo', 'Portoghese', 'Italiano', 'Battuta prima', 'Opzioni sbagliate', 'Altre risposte accettate', 'Nota per italiani', 'Altro testo (istruzioni, uso)'] as const;
  for (const r of rows) {
    r.Impronta = createHash('sha1')
      .update(JSON.stringify(checked.map((k) => r[k] ?? '')))
      .digest('hex')
      .slice(0, 12);
  }
  return rows;
}

// ---------- CSV ----------

const cell = (s = '') => `"${s.replace(/"/g, '""')}"`;

/** Legge un CSV con ";" o "," (scelto dall'intestazione), campi tra virgolette e a capo nei campi */
function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, '');
  const firstLine = text.slice(0, text.indexOf('\n'));
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const loadApproved = (): Set<string> =>
  new Set(existsSync(APPROVED_FILE) ? (JSON.parse(readFileSync(APPROVED_FILE, 'utf8')).approved as string[]) : []);

const saveApproved = (set: Set<string>) =>
  writeFileSync(
    APPROVED_FILE,
    JSON.stringify(
      { $comment: 'Impronte delle frasi approvate dalla revisione madrelingua (npm run review:approve). Non modificare a mano.', approved: [...set].sort() },
      null,
      2
    ) + '\n'
  );

// ---------- Comandi ----------

async function exportCsv() {
  const approved = loadApproved();
  const all = await collectRows();
  const todo = all.filter((r) => !approved.has(r.Impronta!));
  if (todo.length === 0) {
    console.log(`✓ Niente da rivedere: tutte le ${all.length} righe sono già approvate.`);
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const file = join(OUT_DIR, `revisione-${new Date().toISOString().slice(0, 10)}.csv`);
  const lines = [COLUMNS.map((c) => cell(c)).join(';'), ...todo.map((r) => COLUMNS.map((c) => cell(r[c])).join(';'))];
  writeFileSync(file, '\uFEFF' + lines.join('\r\n') + '\r\n', 'utf8');
  console.log(`✓ ${todo.length} righe da rivedere (su ${all.length}) → ${relative(ROOT, file)}`);
  console.log('  Si apre con Excel o si importa in Google Sheets. Colonne da compilare: OK, Correzione, Commento.');
}

function approve(path?: string) {
  if (!path || !existsSync(path)) {
    console.error('✗ Indica il file revisionato: npm run review:approve revisione/revisione-AAAA-MM-GG.csv');
    process.exit(1);
  }
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'));
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const [iOk, iFix, iHash, iId, iPt] = ['OK (sì/no)', 'Correzione', 'Impronta', 'ID', 'Portoghese'].map(col);
  if (iOk < 0 || iHash < 0) {
    console.error('✗ Nel file mancano le colonne "OK (sì/no)" o "Impronta": è un file esportato da review:export?');
    process.exit(1);
  }

  const approved = loadApproved();
  const yes = /^(s[iì]|ok|x|yes|sim|1|✓)$/i;
  let added = 0;
  const toFix: string[] = [];
  for (const r of rows) {
    const ok = (r[iOk] ?? '').trim();
    const fix = iFix >= 0 ? (r[iFix] ?? '').trim() : '';
    if (yes.test(ok) && !fix) {
      if (!approved.has(r[iHash])) added++;
      approved.add(r[iHash]);
    } else if (ok || fix) toFix.push(`  • ${r[iId] ?? ''}: ${r[iPt] ?? ''}${fix ? `  →  ${fix}` : ''}`);
  }
  saveApproved(approved);
  console.log(`✓ ${added} righe approvate (totale ${approved.size}).`);
  if (toFix.length) {
    console.log(`\n${toFix.length} righe con una correzione o non approvate: vanno sistemate nei contenuti,`);
    console.log('poi torneranno da sole nella prossima revisione.\n');
    console.log(toFix.join('\n'));
  }
}

const [command, arg] = process.argv.slice(2);
if (command === 'export') exportCsv();
else if (command === 'approve') approve(arg);
else console.log('Uso: npm run review:export  |  npm run review:approve <file.csv>');
