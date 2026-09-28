/**
 * Corso su cui lavorano gli script: variabile d'ambiente COURSE (predefinito "pt").
 *   COURSE=it npm run content
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = join(__dirname, '..');
export const COURSE = process.env.COURSE?.trim() || 'pt';
export const CONTENT_DIR = join(ROOT, 'src', 'content');
export const COURSE_DIR = join(CONTENT_DIR, 'courses', COURSE);

if (!/^[a-z]{2,10}$/.test(COURSE) || !existsSync(COURSE_DIR)) {
  console.error(`✗ Corso "${COURSE}" sconosciuto: manca la cartella src/content/courses/${COURSE}/`);
  process.exit(1);
}
