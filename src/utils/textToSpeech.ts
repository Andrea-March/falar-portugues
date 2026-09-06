export function speakPortuguese(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis non è supportata da questo browser.');
    return;
  }

  // Interrompe eventuali audio ancora in riproduzione
  window.speechSynthesis.cancel();

  // Rimuovi eventuali tratti di sottolineatura usati per la risposta vuota
  const cleanText = text.replace(/___/g, '').trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-PT'; // Imposta l'accento in Portoghese Europeo
  utterance.rate = 0.9;     // Velocità leggermente ridotta per facilitare l'ascolto

  window.speechSynthesis.speak(utterance);
}