// Site ayarları. Kod değiştirmeden ayarlanabilecek her şey burada.

export const CONTENT_BASE = "content";

// Tema listesi. Yeni tema = themes/<id>.css dosyası + buraya bir satır.
export const THEMES = [
  { id: "terminal", name: "Terminal" },
  { id: "defter", name: "Defter" },
  { id: "sakin", name: "Sakin" },
  { id: "yolculuk", name: "Yolculuk" },
  { id: "mektup", name: "Mektup" },
  { id: "gece", name: "Gece" },
];

export const DEFAULT_THEME = "terminal";
export const THEME_KEY = "gunluk.tema";

// Tema seçici sağ altta görünsün mü?
// Tema kesinleştikten sonra false yap; site tek temayla açılır.
export const SHOW_THEME_PICKER = true;

// Ana sayfada kaç yazı tam metin gösterilsin? Gerisi arşiv listesine düşer.
export const RECENT_FULL = 10;
