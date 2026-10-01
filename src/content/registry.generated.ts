// FILE GENERATO da scripts/content.ts: non modificarlo a mano (npm run content).
// Corso: pt
import type { Course, NodeContent, Recording, Skill, Verb, VocabSet } from './schema';
import config from './courses/pt/config';
import courseJson from './courses/pt/course.json';
import audioConfigJson from './courses/pt/audio.config.json';
import verb_estar from './courses/pt/verbs/estar.json';
import verb_ser from './courses/pt/verbs/ser.json';
import verb_ter from './courses/pt/verbs/ter.json';
import vocab_cafe from './courses/pt/vocab/cafe.json';
import vocab_cumprimentos from './courses/pt/vocab/cumprimentos.json';
import vocab_rotina from './courses/pt/vocab/rotina.json';
import vocab_rua from './courses/pt/vocab/rua.json';
import skill_falsi_amici from './courses/pt/skills/falsi-amici.json';
import skill_lh_nh from './courses/pt/skills/lh-nh.json';
import skill_nasali from './courses/pt/skills/nasali.json';
import skill_pronomi from './courses/pt/skills/pronomi.json';
import skill_ser_estar from './courses/pt/skills/ser-estar.json';
import skill_suono_sc from './courses/pt/skills/suono-sc.json';
import skill_vocali from './courses/pt/skills/vocali.json';


/** Configurazione, struttura e voci del corso */
export const courseConfig = config;
export const courseData = courseJson as unknown as Course;
export const audioConfig = audioConfigJson;

/** Verbi e vocabolario: piccoli e usati ovunque, caricati subito */
export const verbList = [verb_estar, verb_ser, verb_ter] as unknown as Verb[];
export const vocabSetList = [vocab_cafe, vocab_cumprimentos, vocab_rotina, vocab_rua] as unknown as VocabSet[];
/** Punti difficili (tab della Grammatica) */
export const skillList = [skill_falsi_amici, skill_lh_nh, skill_nasali, skill_pronomi, skill_ser_estar, skill_suono_sc, skill_vocali] as unknown as Skill[];
/** Registrazioni della tab Ascolto (anche le bozze: l'app le nasconde) */
export const recordingList = [] as unknown as Recording[];

/** Nomi dei gruppi dello studio del vocabolario per nodo: la mappa li mostra nelle sessioni senza caricare la lezione */
export const vocabGroupLabels: Record<string, string[]> = {
  "node_1_2": [
    "Saluti del giorno",
    "Presentarsi"
  ],
  "node_2_1": [
    "Come stai",
    "Dove si trova"
  ],
  "node_3_1": [
    "Che ore sono",
    "Che giorno è"
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
  "node_3_1": () => import('./courses/pt/nodes/node_3_1.json').then((m) => m.default as unknown as NodeContent),
  "node_3_2": () => import('./courses/pt/nodes/node_3_2.json').then((m) => m.default as unknown as NodeContent),
  "node_3_3": () => import('./courses/pt/nodes/node_3_3.json').then((m) => m.default as unknown as NodeContent),
  "node_3_checkpoint": () => import('./courses/pt/nodes/node_3_checkpoint.json').then((m) => m.default as unknown as NodeContent),
  "node_3_cultura": () => import('./courses/pt/nodes/node_3_cultura.json').then((m) => m.default as unknown as NodeContent),
};
