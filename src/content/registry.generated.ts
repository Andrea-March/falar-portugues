// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
// Corso: it
import type { Course, NodeContent, Verb, VocabSet } from './schema';
import config from './courses/it/config';
import courseJson from './courses/it/course.json';
import audioConfigJson from './courses/it/audio.config.json';
import verb_essere from './courses/it/verbs/essere.json';
import vocab_saluti from './courses/it/vocab/saluti.json';

/** Configurazione, struttura e voci del corso */
export const courseConfig = config;
export const courseData = courseJson as unknown as Course;
export const audioConfig = audioConfigJson;

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [verb_essere] as unknown as Verb[];
export const vocabSetList = [vocab_saluti] as unknown as VocabSet[];

/** Nomi dei gruppi dello studio del vocabolario per nodo: la mappa li mostra nelle sessioni senza caricare la lezione */
export const vocabGroupLabels: Record<string, string[]> = {
  "node_1_1": [
    "Cumprimentos do dia",
    "Apresentar-se"
  ]
};

/** Lezioni: ognuna è un file separato, scaricato solo quando la si apre */
export const nodeLoaders: Record<string, () => Promise<NodeContent>> = {
  "node_1_1": () => import('./courses/it/nodes/node_1_1.json').then((m) => m.default as unknown as NodeContent),
  "node_1_2": () => import('./courses/it/nodes/node_1_2.json').then((m) => m.default as unknown as NodeContent),
};
