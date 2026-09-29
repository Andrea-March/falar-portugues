/**
 * Genera gli audio pregenerati del corso (COURSE, predefinito "pt"), con il servizio scelto in
 * src/content/courses/<corso>/audio.config.json ("provider"):
 * - piper: open source, gira sul computer, gratis. Requisiti: Python e  pip install piper-tts lameenc
 * - azure: voci neurali Azure Speech. Serve AZURE_SPEECH_KEY e AZURE_SPEECH_REGION in .env.local
 * - elevenlabs: voci ElevenLabs (le voci sono ID, dalla Voice Library). Serve ELEVENLABS_API_KEY in .env.local
 *
 *   npm run audio            genera i file mancanti in public/audio/
 *   npm run audio:check      solo il resoconto: quanti file mancano, caratteri, peso
 *   npm run audio -- --prune genera e cancella i file che nessun contenuto usa più
 *   npm run audio:samples    un campione per ogni voce in audio-samples/ (per scegliere)
 *
 * Ogni file prende il nome dall'impronta del testo (src/utils/speechKey.ts): se una frase
 * cambia si genera solo quella, e l'app trova il file senza bisogno di un elenco.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, resolve } from 'node:path';
import { audioConfig, courseConfig } from '../src/content/registry.generated';
import { allSpeech } from '../src/content/speech';
import { activeProvider, audioPath, providerConfig, speechText, voiceName } from '../src/utils/speechKey';

const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'public', 'audio');
const SAMPLES = join(ROOT, 'audio-samples');
const args = new Set(process.argv.slice(2));

// .env.local, se c'è (Node ≥ 20.12)
for (const f of ['.env.local', '.env']) {
  const p = join(ROOT, f);
  if (existsSync(p)) {
    try {
      (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile(p);
    } catch {
      /* versione di Node senza loadEnvFile: si usano le variabili d'ambiente */
    }
  }
}

const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
/** Stima del peso: ~12 caratteri al secondo di parlato, più mezzo secondo di margine */
const estimateBytes = (text: string) => Math.round(((text.length / 12 + 0.5) * (audioConfig.bitrateKbps * 1000)) / 8);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Una frase da generare: testo, voce (nome nel servizio) e file di destinazione */
interface Job {
  text: string;
  voice: string;
  out: string;
}

// ---------- Piper ----------

const PYTHON = process.env.PYTHON ?? (process.platform === 'win32' ? 'py' : 'python3');

/** Genera con Piper: un solo processo per voce, che carica il modello una volta */
async function piperGenerate(jobs: Job[], onDone: (job: Job) => void): Promise<number> {
  const cfg = providerConfig as unknown as { lengthScale?: number };
  let failures = 0;
  const byVoice = new Map<string, Job[]>();
  for (const j of jobs) byVoice.set(j.voice, [...(byVoice.get(j.voice) ?? []), j]);
  for (const [voice, list] of byVoice) {
    const child = spawn(
      PYTHON,
      [
        join(ROOT, 'scripts', 'piper_batch.py'),
        '--voice', voice,
        '--length-scale', String(cfg.lengthScale ?? 1),
        '--bitrate', String(audioConfig.bitrateKbps),
        '--data-dir', join(ROOT, '.piper-voices'),
      ],
      // UTF-8 esplicito: su Windows Python userebbe la codifica di sistema e storpierebbe gli accenti (é → Ã©)
      { stdio: ['pipe', 'pipe', 'inherit'], env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } }
    );
    const pending = new Map(list.map((j) => [j.out, j]));
    const exited = new Promise<number>((res, rej) => {
      child.on('error', () => rej(new Error(`Python non trovato ("${PYTHON}"). Installalo, oppure indica il comando con PYTHON=...`)));
      child.on('close', (code) => res(code ?? 1));
    });
    createInterface({ input: child.stdout }).on('line', (line) => {
      const [kind, a, b] = line.split('\t');
      if (kind === 'ok' && pending.has(a)) onDone(pending.get(a)!);
      else if (kind === 'err') {
        failures++;
        console.log(`  ✗ ${pending.get(a)?.text ?? a}: ${b}`);
      } else if (kind === 'info') console.log(`  … ${a}`);
      else if (kind === 'fatal') console.error(`✗ ${a}`);
    });
    // Solo ASCII verso Python: ogni accento viaggia come codice (ã → \u00e3) e nessuna
    // codifica di sistema (es. Windows) può storpiarlo; json.loads lo ricostruisce.
    const asciiJson = (o: object) => JSON.stringify(o).replace(/[\u007f-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
    for (const j of list) child.stdin.write(asciiJson({ text: j.text, out: j.out }) + '\n');
    child.stdin.end();
    const code = await exited;
    if (code !== 0) throw new Error('Piper si è interrotto (vedi il messaggio sopra).');
  }
  return failures;
}

// ---------- Azure ----------

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
/** Facoltativo: indirizzo diverso da quello standard della regione */
const BASE = process.env.AZURE_SPEECH_ENDPOINT ?? `https://${REGION}.tts.speech.microsoft.com`;
const azureCfg = audioConfig.providers.azure;

function requireAzureKey() {
  if (!KEY || !REGION) {
    console.error("✗ Mancano AZURE_SPEECH_KEY e AZURE_SPEECH_REGION (in .env.local o nell'ambiente).");
    process.exit(1);
  }
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function azureSynthesize(text: string, voice: string): Promise<Buffer> {
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${courseConfig.targetLang}">` +
    `<voice name="${voice}"><prosody rate="${azureCfg.rate}">${escapeXml(text)}</prosody></voice></speak>`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${BASE}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY!,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': azureCfg.format,
        'User-Agent': 'falar-portugues-audio',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // Troppe richieste (il piano gratuito ha un limite al minuto): si aspetta e si riprova
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * attempt;
      console.log(`  … ${res.status}, riprovo tra ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`Azure ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

async function azureGenerate(jobs: Job[], onDone: (job: Job) => void): Promise<number> {
  requireAzureKey();
  for (const j of jobs) {
    mkdirSync(resolve(j.out, '..'), { recursive: true });
    writeFileSync(j.out, await azureSynthesize(j.text, j.voice));
    onDone(j);
    await sleep(200);
  }
  return 0;
}

// ---------- ElevenLabs ----------

const XI_KEY = process.env.ELEVENLABS_API_KEY;
const XI_BASE = 'https://api.elevenlabs.io/v1';
const xiCfg = providerConfig as unknown as {
  model: string;
  format: string;
  seed?: number;
  languageCode?: string;
  voiceSettings?: Record<string, number | boolean>;
};

function requireXiKey() {
  if (!XI_KEY) {
    console.error("✗ Manca ELEVENLABS_API_KEY (in .env.local o nell'ambiente).");
    process.exit(1);
  }
}

/** Crediti per carattere: i modelli Flash e Turbo ne consumano la metà */
const xiCreditsPerChar = () => (/flash|turbo/i.test(xiCfg.model) ? 0.5 : 1);

/** Crediti rimasti nel mese, o null se non si riesce a saperlo */
async function xiCreditsLeft(): Promise<number | null> {
  try {
    const res = await fetch(`${XI_BASE}/user/subscription`, { headers: { 'xi-api-key': XI_KEY! } });
    if (!res.ok) return null;
    const d = (await res.json()) as { character_count: number; character_limit: number };
    return d.character_limit - d.character_count;
  } catch {
    return null;
  }
}

async function xiSynthesize(text: string, voice: string): Promise<Buffer> {
  const body: Record<string, unknown> = { text, model_id: xiCfg.model };
  if (xiCfg.voiceSettings) body.voice_settings = xiCfg.voiceSettings;
  // Seme fisso: rigenerando la stessa frase si ottiene (quasi sempre) lo stesso audio
  if (xiCfg.seed !== undefined) body.seed = xiCfg.seed;
  // Solo alcuni modelli (Flash/Turbo v2.5, v3) accettano la lingua forzata; gli altri danno errore
  if (xiCfg.languageCode) body.language_code = xiCfg.languageCode;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${XI_BASE}/text-to-speech/${encodeURIComponent(voice)}?output_format=${xiCfg.format}`, {
      method: 'POST',
      headers: { 'xi-api-key': XI_KEY!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 3000 * attempt;
      console.log(`  … ${res.status}, riprovo tra ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

async function elevenlabsGenerate(jobs: Job[], onDone: (job: Job) => void): Promise<number> {
  requireXiKey();
  const bad = [...new Set(jobs.map((j) => j.voice))].filter((v) => !/^[A-Za-z0-9]{16,}$/.test(v));
  if (bad.length) throw new Error(`Voce non valida in audio.config.json: ${bad.join(', ')} (serve l'ID della voce ElevenLabs)`);

  // Controllo dei crediti prima di spendere: meglio fermarsi subito che a metà
  const needed = Math.ceil(jobs.reduce((n, j) => n + j.text.length, 0) * xiCreditsPerChar());
  const left = await xiCreditsLeft();
  if (left !== null) {
    console.log(`Crediti ElevenLabs: servono circa ${needed.toLocaleString('it-IT')}, ne restano ${left.toLocaleString('it-IT')}`);
    if (needed > left) throw new Error('Crediti insufficienti: nessun file generato.');
  }

  let failures = 0;
  for (const j of jobs) {
    try {
      mkdirSync(resolve(j.out, '..'), { recursive: true });
      writeFileSync(j.out, await xiSynthesize(j.text, j.voice));
      onDone(j);
    } catch (e) {
      failures++;
      console.log(`  ✗ ${j.text}: ${e instanceof Error ? e.message : e}`);
      // Chiave o voce sbagliata: inutile continuare con le altre frasi
      if (e instanceof Error && /ElevenLabs (401|403|404)/.test(e.message)) throw e;
    }
    await sleep(300);
  }
  return failures;
}

const generators: Record<string, (jobs: Job[], onDone: (job: Job) => void) => Promise<number>> = {
  piper: piperGenerate,
  azure: azureGenerate,
  elevenlabs: elevenlabsGenerate,
};

// ---------- Campioni per scegliere la voce ----------

const SAMPLE_TEXT =
  'Bom dia! Queria um café e um pastel de nata, por favor. ' +
  'Obrigado! Tenha um bom dia. Eles são de Coimbra, e nós somos portugueses.';

async function samples() {
  let voices: string[];
  if (activeProvider === 'azure') {
    requireAzureKey();
    const res = await fetch(`${BASE}/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': KEY! } });
    if (!res.ok) throw new Error(`Azure ${res.status}: elenco voci non disponibile`);
    voices = ((await res.json()) as { ShortName: string; Locale: string }[]).filter((v) => v.Locale === courseConfig.targetLang).map((v) => v.ShortName);
  } else {
    voices = [...new Set(Object.values(providerConfig.voices))];
  }
  const jobs = voices.map((v) => ({ text: SAMPLE_TEXT, voice: v, out: join(SAMPLES, `${activeProvider}-${v}.${audioConfig.extension}`) }));
  mkdirSync(SAMPLES, { recursive: true });
  await generators[activeProvider](jobs, (j) => console.log(`✓ ${j.voice} → audio-samples/${activeProvider}-${j.voice}.${audioConfig.extension}`));
  console.log(`\nAscoltali; la voce scelta va in src/content/courses/${courseConfig.id}/audio.config.json.`);
}

// ---------- Generazione ----------

async function generate() {
  const check = args.has('--check');
  const prune = args.has('--prune');
  if (!generators[activeProvider]) throw new Error(`Servizio "${activeProvider}" sconosciuto in audio.config.json (piper, azure o elevenlabs)`);

  // Testi unici per file
  const wanted = new Map<string, { text: string; voice: string }>(); // chiave: percorso relativo del file
  for (const item of await allSpeech()) {
    const text = speechText(item.text);
    if (text) wanted.set(audioPath(text, item.voice), { text, voice: voiceName(item.voice) });
  }

  const fileOf = (id: string) => join(OUT, id);
  const missing = [...wanted.entries()].filter(([id]) => !existsSync(fileOf(id)));
  const sizeOf = (ids: string[]) => ids.filter((id) => existsSync(fileOf(id))).reduce((n, id) => n + statSync(fileOf(id)).size, 0);
  const chars = missing.reduce((n, [, w]) => n + w.text.length, 0);

  console.log(`Servizio: ${activeProvider} · voci: ${[...new Set([...wanted.values()].map((w) => w.voice))].join(', ')}`);
  console.log(`Frasi nel corso: ${wanted.size} · già generate: ${wanted.size - missing.length} (${kb(sizeOf([...wanted.keys()]))})`);
  console.log(
    `Da generare: ${missing.length} · ${chars.toLocaleString('it-IT')} caratteri · circa ${kb(missing.reduce((n, [, w]) => n + estimateBytes(w.text), 0))}`
  );

  if (check) {
    if (activeProvider === 'elevenlabs' && XI_KEY) {
      const left = await xiCreditsLeft();
      const needed = Math.ceil(chars * xiCreditsPerChar());
      if (left !== null) console.log(`Crediti ElevenLabs: servono circa ${needed.toLocaleString('it-IT')}, ne restano ${left.toLocaleString('it-IT')}`);
    }
    if (missing.length) console.log('\nPer generarle: npm run audio');
    return;
  }

  let done = 0;
  const failures = missing.length
    ? await generators[activeProvider](
        missing.map(([id, w]) => ({ ...w, out: fileOf(id) })),
        (j) => console.log(`  ✓ [${++done}/${missing.length}] ${j.text}`)
      )
    : 0;

  if (prune && existsSync(OUT)) {
    let removed = 0;
    for (const dir of readdirSync(OUT)) {
      const full = join(OUT, dir);
      if (!statSync(full).isDirectory()) continue;
      for (const f of readdirSync(full)) {
        if (!wanted.has(`${dir}/${f}`)) {
          rmSync(join(full, f));
          removed++;
        }
      }
      if (readdirSync(full).length === 0) rmSync(full, { recursive: true });
    }
    console.log(`Rimossi ${removed} file non più usati.`);
  }

  console.log(`\n✓ Audio pronti: ${wanted.size - missing.length + done} di ${wanted.size}, ${kb(sizeOf([...wanted.keys()]))} in public/audio`);
  if (failures) {
    console.log(`✗ ${failures} frasi non generate (vedi sopra): per quelle l'app userà la voce del browser.`);
    process.exitCode = 1;
  }
}

(args.has('samples') ? samples() : generate()).catch((e) => {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
