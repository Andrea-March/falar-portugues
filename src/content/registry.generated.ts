// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
// Corso: pt
import type { Course, NodeContent, Verb, VocabSet } from './schema';
import config from './courses/pt/config';
import courseJson from './courses/pt/course.json';
import audioConfigJson from './courses/pt/audio.config.json';
import verb_estar from './courses/pt/verbs/estar.json';
import verb_ser from './courses/pt/verbs/ser.json';
import verb_ter from './courses/pt/verbs/ter.json';
import vocab_cafe from './courses/pt/vocab/cafe.json';
import vocab_cumprimentos from './courses/pt/vocab/cumprimentos.json';
import vocab_rua from './courses/pt/vocab/rua.json';

/** Configurazione, struttura e voci del corso */
export const courseConfig = config;
export const courseData = courseJson as unknown as Course;
export const audioConfig = audioConfigJson;

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [verb_estar, verb_ser, verb_ter] as unknown as Verb[];
export const vocabSetList = [vocab_cafe, vocab_cumprimentos, vocab_rua] as unknown as VocabSet[];

/** Nomi dei gruppi dello studio del vocabolario per nodo: la mappa li mostra nelle sessioni senza caricare la lezione */
export const vocabGroupLabels: Record<string, string[]> = {
  "node_1_2": [
    "Saluti del giorno",
    "Presentarsi"
  ],
  "node_2_1": [
    "Come stai",
    "Dove si trova"
  ]
};

/** Lezioni: ognuna è un file separato, scaricato solo quando la si apre */
export const nodeLoaders: Record<string, () => Promise<NodeContent>> = {
  "node_1_1": () => import('./courses/pt/nodes/node_1_1.json').then((m) => m.default as unknown as NodeContent),
  "node_1_2": () => import('./courses/pt/nodes/node_1_2.json').then((m) => m.default as unknown as NodeContent),
  "node_1_3": () => import('./courses/pt/nodes/node_1_3.json').then((m) => m.default as unknown as NodeContent),
  "node_1_checkpoint": () => import('./courses/pt/nodes/node_1_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_1_cultura": () => import('./courses/pt/nodes/node_1_cultura.json').then((m) => m.default as unknown as NodeContent),
  "node_2_1": () => import('./courses/pt/nodes/node_2_1.json').then((m) => m.default as unknown as NodeContent),
  "node_2_2": () => import('./courses/pt/nodes/node_2_2.json').then((m) => m.default as unknown as NodeContent),
  "node_2_3": () => import('./courses/pt/nodes/node_2_3.json').then((m) => m.default as unknown as NodeContent),
  "node_2_checkpoint": () => import('./courses/pt/nodes/node_2_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_2_cultura": () => import('./courses/pt/nodes/node_2_cultura.json').then((m) => m.default as unknown as NodeContent),
};
