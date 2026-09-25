// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
import type { NodeContent, Verb, VocabSet } from './schema';
import verb_estar from './verbs/estar.json';
import verb_ser from './verbs/ser.json';
import verb_ter from './verbs/ter.json';
import vocab_cafe from './vocab/cafe.json';
import vocab_cumprimentos from './vocab/cumprimentos.json';

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [verb_estar, verb_ser, verb_ter] as unknown as Verb[];
export const vocabSetList = [vocab_cafe, vocab_cumprimentos] as unknown as VocabSet[];

/** Nomi dei gruppi dello studio del vocabolario per nodo: la mappa li mostra nelle sessioni senza caricare la lezione */
export const vocabGroupLabels: Record<string, string[]> = {
  "node_1_2": [
    "Saluti del giorno",
    "Presentarsi"
  ]
};

/** Lezioni: ognuna è un file separato, scaricato solo quando la si apre */
export const nodeLoaders: Record<string, () => Promise<NodeContent>> = {
  "node_1_1": () => import('./nodes/node_1_1.json').then((m) => m.default as unknown as NodeContent),
  "node_1_2": () => import('./nodes/node_1_2.json').then((m) => m.default as unknown as NodeContent),
  "node_1_3": () => import('./nodes/node_1_3.json').then((m) => m.default as unknown as NodeContent),
  "node_1_checkpoint": () => import('./nodes/node_1_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_1_cultura": () => import('./nodes/node_1_cultura.json').then((m) => m.default as unknown as NodeContent),
};
