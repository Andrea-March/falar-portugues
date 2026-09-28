import type { CourseConfig } from '../../course-config';
import { ui } from './ui';

/** Falaluso: portoghese europeo per chi parla italiano */
const config: CourseConfig = {
  id: 'pt',
  appName: 'Falaluso',
  appShortName: 'FalaLuso',
  appTitle: 'FalaLuso - Aprender Português',
  appDescription: 'Aprende português europeu de forma prática',
  targetLang: 'pt-PT',
  learnerLang: 'it-IT',
  targetName: 'Portoghese',
  learnerName: 'Italiano',
  // In PT-PT "você" si coniuga come ele/ela, e "vós" non si usa più
  persons: ['eu', 'tu', 'ele_ela_voce', 'nos', 'eles_elas_voces'],
  singular: ['eu', 'tu', 'ele_ela_voce'],
  plural: ['nos', 'eles_elas_voces'],
  personLabels: {
    eu: 'Eu',
    tu: 'Tu',
    ele_ela_voce: 'Ele / Ela / Você',
    nos: 'Nós',
    eles_elas_voces: 'Eles / Elas / Vocês',
  },
  spokenPronouns: { eu: 'eu', tu: 'tu', ele_ela_voce: 'ele', nos: 'nós', eles_elas_voces: 'eles' },
  verbGroups: ['ar', 'er', 'ir'],
  specialChars: ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
  learnerFlag: '🇮🇹',
  tenseLabels: {
    presente: 'Presente do Indicativo',
    preterito_perfeito: 'Pretérito Perfeito',
    preterito_imperfeito: 'Pretérito Imperfeito',
    futuro: 'Futuro do Indicativo',
  },
  ui,
};

export default config;
