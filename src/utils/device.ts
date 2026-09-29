/**
 * Vero se il dispositivo usa il tocco come puntatore principale (telefono, tablet):
 * lì dare il focus a un campo apre la tastiera, che copre metà dello schermo.
 * Su questi dispositivi i campi non prendono il focus da soli all'apertura di una
 * schermata: l'utente prima legge, poi tocca il campo.
 */
export function isTouchDevice() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}
