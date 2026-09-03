// Ortak yardımcılar: tarih, kaçış, küçük biçimlendiriciler.

const TR_DATE = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const TR_SHORT = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
});

/** "2026-09-02" -> Date (yerel saat 12:00 — saat dilimi kaymasını önler) */
export function parseDay(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** "2026-09-02" -> "2 Eylül 2026" */
export function formatDate(s) {
  return TR_DATE.format(parseDay(s));
}

/** "2026-09-02" -> "2 Eyl" */
export function formatShort(s) {
  return TR_SHORT.format(parseDay(s));
}

/** Bugünün tarihi "YYYY-MM-DD" olarak (yerel) */
export function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(aStr, bStr) {
  return Math.round((parseDay(bStr) - parseDay(aStr)) / 86400000);
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Sayı biçimlendirme (tr-TR: 1.234,56) ---------- */

function nf(min, max) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
}

const NF2 = nf(2, 2);

/** Fiyat: büyüklüğe göre ondalık seçer (0,00004521 ile 68.420,50 aynı yerde) */
export function formatPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  let d = 2;
  if (a > 0 && a < 0.0001) d = 8;
  else if (a < 0.01) d = 6;
  else if (a < 1) d = 5;
  else if (a < 100) d = 4;
  return nf(d, d).format(n);
}

/** Para: her zaman 2 ondalık */
export function formatMoney(v) {
  const n = Number(v);
  return Number.isFinite(n) ? NF2.format(n) : "—";
}

/** İşaretli para: +1.234,50 / -98,20 */
export function formatSigned(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return (n > 0 ? "+" : "") + NF2.format(n);
}

/** Yüzde: +8,4% */
export function formatPercent(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return (n > 0 ? "+" : "") + nf(1, 2).format(n) + "%";
}

/** Sayının işaretine göre CSS sınıfı */
export function signClass(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "";
  return n > 0 ? "is-pos" : "is-neg";
}
