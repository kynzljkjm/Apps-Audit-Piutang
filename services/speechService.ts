
export const startListening = (
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: any) => void
) => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    onError("Browser tidak mendukung pengenalan suara.");
    return null;
  }

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = 'id-ID'; // Indonesian
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: any) => {
    onError(event.error);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
  return recognition;
};

export const speakText = (text: string, onEnd?: () => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Browser tidak mendukung Text-to-Speech.");
    return;
  }

  // Hentikan suara sebelumnya jika ada
  window.speechSynthesis.cancel();

  // Bersihkan format markdown agar lebih enak didengar
  // 1. Hapus bold/italic (**text**, *text*)
  // 2. Hapus header (## text)
  // 3. Ambil text dari link ([text](url))
  // 4. Ganti newline dengan titik agar ada jeda
  const cleanText = text
    .replace(/[*#_`]/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/^- /gm, '') // Hapus dash pada list item
    .replace(/\n+/g, '. ');

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'id-ID';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Coba cari suara bahasa Indonesia yang natural
  const loadVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => 
        v.lang === 'id-ID' || 
        v.lang === 'id_ID' || 
        v.name.includes('Indonesia') ||
        v.lang.startsWith('id')
    );
    if (idVoice) utterance.voice = idVoice;
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    loadVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error("TTS Error:", event);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};