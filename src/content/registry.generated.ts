// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
// Corso: it
import type { Course, NodeContent, Recording, Skill, Verb, VocabSet } from './schema';
import config from './courses/it/config';
import courseJson from './courses/it/course.json';
import audioConfigJson from './courses/it/audio.config.json';
import verb_essere from './courses/it/verbs/essere.json';
import verb_stare from './courses/it/verbs/stare.json';
import vocab_bar from './courses/it/vocab/bar.json';
import vocab_saluti from './courses/it/vocab/saluti.json';
import vocab_strada from './courses/it/vocab/strada.json';
import skill_doppie from './courses/it/skills/doppie.json';
import skill_pronomi from './courses/it/skills/pronomi.json';
import skill_suoni from './courses/it/skills/suoni.json';
import recording_il_diluvio from './courses/it/recordings/il-diluvio.json';
import recording_un_caffe_al_volo from './courses/it/recordings/un-caffe-al-volo.json';

/** Configurazione, struttura e voci del corso */
export const courseConfig = config;
export const courseData = courseJson as unknown as Course;
export const audioConfig = audioConfigJson;

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [verb_essere, verb_stare] as unknown as Verb[];
export const vocabSetList = [vocab_bar, vocab_saluti, vocab_strada] as unknown as VocabSet[];
/** Punti difficili (tab della Grammatica) */
export const skillList = [skill_doppie, skill_pronomi, skill_suoni] as unknown as Skill[];
/** Registrazioni della tab Ascolto (anche le bozze: l'app le nasconde) */
export const recordingList = [recording_il_diluvio, recording_un_caffe_al_volo] as unknown as Recording[];

/** Nomi dei gruppi dello studio del vocabolario per nodo: la mappa li mostra nelle sessioni senza caricare la lezione */
export const vocabGroupLabels: Record<string, string[]> = {
  "node_1_1": [
    "Cumprimentos do dia",
    "Apresentar-se e despedir-se"
  ],
  "node_2_1": [
    "Como estás",
    "Onde fica"
  ]
};

/** Lezioni: ognuna è un file separato, scaricato solo quando la si apre */
export const nodeLoaders: Record<string, () => Promise<NodeContent>> = {
  "node_1_1": () => import('./courses/it/nodes/node_1_1.json').then((m) => m.default as unknown as NodeContent),
  "node_1_2": () => import('./courses/it/nodes/node_1_2.json').then((m) => m.default as unknown as NodeContent),
  "node_1_3": () => import('./courses/it/nodes/node_1_3.json').then((m) => m.default as unknown as NodeContent),
  "node_1_checkpoint": () => import('./courses/it/nodes/node_1_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_1_cultura": () => import('./courses/it/nodes/node_1_cultura.json').then((m) => m.default as unknown as NodeContent),
  "node_2_1": () => import('./courses/it/nodes/node_2_1.json').then((m) => m.default as unknown as NodeContent),
  "node_2_2": () => import('./courses/it/nodes/node_2_2.json').then((m) => m.default as unknown as NodeContent),
  "node_2_3": () => import('./courses/it/nodes/node_2_3.json').then((m) => m.default as unknown as NodeContent),
  "node_2_checkpoint": () => import('./courses/it/nodes/node_2_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_2_cultura": () => import('./courses/it/nodes/node_2_cultura.json').then((m) => m.default as unknown as NodeContent),
};
