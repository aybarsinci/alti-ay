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

/* ---------- Giriş ekranı (yaz.html) ---------- */

// Yazılar doğrudan bu depoya işleniyor; araya sunucu girmiyor. Gerekçe
// js/github.js başında. Depo taşınırsa burayı değiştirmek yeterli.
export const REPO_OWNER = "aybarsinci";
export const REPO_NAME = "alti-ay";
export const REPO_BRANCH = "main";

export const DRAFT_KEY = "gunluk.taslak";
export const TOKEN_KEY = "gunluk.anahtar";

// Telefon fotoğrafları 3-5 MB geliyor; uzun kenarı bu piksele indirip
// JPEG'e çeviriyoruz (~200 KB). Depolama da yükleme süresi de düşüyor.
export const IMAGE_MAX_PX = 1600;
export const IMAGE_QUALITY = 0.82;

// Video depolama henüz kurulmadı. 180 gün x 1-2 dk yaklaşık 5-6 GB eder;
// git deposu bunu kaldırmaz (GitHub tek dosyada 100 MB'ı reddediyor). R2
// bağlanınca burası adresi tutacak ve yaz.html'deki alan açılacak.
export const VIDEO_STORE = "";
