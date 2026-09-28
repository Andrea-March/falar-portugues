import type { CourseConfig } from '../../course-config';
import { ui } from './ui';

/** Italiano per chi parla portoghese europeo (uso privato) */
const config: CourseConfig = {
  id: 'it',
  appName: 'Falaluso Italiano',
  appShortName: 'Italiano',
  appTitle: 'Falaluso - Imparare l’italiano',
  appDescription: 'Aprende italiano de forma prática',
  targetLang: 'it-IT',
  learnerLang: 'pt-PT',
  targetName: 'Italiano',
  learnerName: 'Portoghese',
  // In italiano "voi" è una persona a sé: sei forme invece delle cinque del portoghese europeo
  persons: ['io', 'tu', 'lui_lei', 'noi', 'voi', 'loro'],
  singular: ['io', 'tu', 'lui_lei'],
  plural: ['noi', 'voi', 'loro'],
  personLabels: {
    io: 'Io',
    tu: 'Tu',
    lui_lei: 'Lui / Lei',
    noi: 'Noi',
    voi: 'Voi',
    loro: 'Loro',
  },
  spokenPronouns: { io: 'io', tu: 'tu', lui_lei: 'lui', noi: 'noi', voi: 'voi', loro: 'loro' },
  verbGroups: ['are', 'ere', 'ire'],
  specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
  learnerFlag: '🇵🇹',
  tenseLabels: {
    presente: 'Presente indicativo',
    passato_prossimo: 'Passato prossimo',
    imperfetto: 'Imperfetto',
    futuro: 'Futuro semplice',
  },
  ui,
};

export default config;
