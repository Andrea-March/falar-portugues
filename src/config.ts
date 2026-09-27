/**
 * Dati dell'app da cambiare in un punto solo.
 * CONTACT_EMAIL: dove arrivano feedback e segnalazioni (va aggiornata anche in public/privacy.html).
 */
export const CONTACT_EMAIL = 'ciao@falaluso.com';
export const PRIVACY_URL = '/privacy.html';
/** Versione da package.json, inserita da next.config.mjs al momento della build */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
