// Günlüğün tamamını tek dosyaya çıkarır.
//
// Neden var: bu sitenin şartı sahibini aşarak ayakta kalmak. Depo, alan adı,
// GitHub, tarayıcılar — hepsi bir gün gidebilir. Bu düğme o gün gelmeden
// ailenin eline hiçbir şeye bağlı olmayan tek bir dosya bırakır: yazılar da
// fotoğraflar da dosyanın içine gömülür, açmak için internet gerekmez.
// Yazdırılabilir olması da bilerek — bir gün kâğıda basılmak istenirse diye.

import { loadEntry } from "./entries.js";
import { treatmentDay, cycleAt } from "./treatment.js";
import { escapeHtml, formatDate, today } from "./utils.js";

/** Sırayla değil, altışar altışar: 180 gün tek tek indirilirse çok bekletir. */
async function mapLimit(items, limit, fn, onStep) {
  const out = new Array(items.length);
  let i = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const at = i++;
        out[at] = await fn(items[at], at);
        onStep?.(++done, items.length);
      }
    })
  );
  return out;
}

/**
 * Fotoğrafı data URI'ye çevirir. Dosyanın kendi kendine yetmesinin bedeli bu:
 * ~200 KB'lık bir JPEG base64'te ~270 KB tutuyor. Bulunamayan fotoğraf
 * indirmeyi durdurmaz — eksik resimli bir arşiv, hiç arşivden iyidir.
 */
async function embedImage(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function statLine(item, meta) {
  const labels = new Map((meta.routine || []).map((r) => [r.id, r.label]));
  const bits = [];

  const cyc = cycleAt(item.date, meta);
  if (cyc) bits.push(`${meta.treatment.cycleLabel || "Kür"} ${cyc.n}`);
  if (item.enerji != null) bits.push(`Enerji ${item.enerji}/10`);
  if (item.kilo != null) bits.push(`${String(item.kilo).replace(".", ",")} kg`);
  if (item.kitap) bits.push(item.kitap);

  const rutin = (item.rutin || []).map((id) => labels.get(id) || id);
  if (rutin.length) bits.push(rutin.join(", "));

  return bits.map(escapeHtml).join(" · ");
}

const STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 48px 20px 80px;
    background: #faf8f4;
    color: #24211d;
    font: 16px/1.72 Georgia, "Iowan Old Style", "Times New Roman", serif;
  }
  .wrap { max-width: 40rem; margin: 0 auto; }
  header { border-bottom: 1px solid #d9d2c6; padding-bottom: 28px; margin-bottom: 8px; }
  h1 { margin: 0 0 10px; font-size: 30px; letter-spacing: -0.01em; }
  .sub { margin: 0; color: #6b6459; }
  .note {
    margin: 26px 0 0;
    padding: 14px 16px;
    background: #f1ece2;
    border-left: 3px solid #c9bfae;
    font-size: 13.5px;
    line-height: 1.6;
    color: #5b544a;
  }
  article { padding: 34px 0; border-bottom: 1px solid #e7e0d4; }
  h2 { margin: 0 0 4px; font-size: 20px; }
  .stat {
    margin: 0 0 18px;
    font-size: 12.5px;
    letter-spacing: 0.02em;
    color: #7a7266;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }
  p { margin: 0 0 15px; }
  blockquote {
    margin: 18px 0;
    padding-left: 16px;
    border-left: 3px solid #d9d2c6;
    color: #58524a;
    font-style: italic;
  }
  ul, ol { margin: 0 0 15px; padding-left: 22px; }
  img { max-width: 100%; height: auto; border-radius: 3px; display: block; }
  figure { margin: 0 0 18px; }
  figcaption { margin-top: 6px; font-size: 13px; color: #7a7266; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 0.9em; }
  footer { margin-top: 40px; font-size: 13px; color: #7a7266; }
  a { color: #6b5b3e; }

  @media print {
    body { background: #fff; padding: 0; font-size: 11.5pt; }
    .note { background: none; }
    article { break-inside: avoid-page; border-bottom: 0; padding: 20px 0; }
    h2 { break-after: avoid-page; }
  }
`;

function buildHtml(meta, entries) {
  const first = entries[0];
  const last = entries[entries.length - 1];
  const span =
    first && last ? `${formatDate(first.item.date)} — ${formatDate(last.item.date)}` : "";

  const body = entries
    .map(({ item, html, photo }) => {
      const day = treatmentDay(item.date, meta);
      const heading = [day != null ? `Gün ${day}` : null, formatDate(item.date)]
        .filter(Boolean)
        .join(" · ");
      const stat = statLine(item, meta);
      const img = photo
        ? `<figure><img src="${photo}" alt="${escapeHtml(item.title || "")}" /></figure>`
        : "";

      return (
        `<article>\n<h2>${escapeHtml(item.title || heading)}</h2>\n` +
        `<p class="stat">${escapeHtml(heading)}${stat ? ` · ${stat}` : ""}</p>\n` +
        `${img}${html}\n</article>`
      );
    })
    .join("\n\n");

  const missing = entries.filter((e) => e.item.foto && !e.photo).length;

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(meta.title || "Günlük")}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="wrap">
<header>
  <h1>${escapeHtml(meta.title || "Günlük")}</h1>
  <p class="sub">${escapeHtml(meta.subtitle || "")}</p>
  <p class="note">
    Bu dosya günlüğün tamamıdır: ${entries.length} gün, yazıların kendisi ve
    fotoğraflar dosyanın içine gömülü. Açmak için internet gerekmez, bir yere
    bağlı değildir. Kopyalayıp saklayabilir, yazdırabilirsin.${
      missing ? ` (${missing} fotoğraf indirilemedi.)` : ""
    }
  </p>
</header>

${body}

<footer>
  <p>${escapeHtml(meta.footer || "")}</p>
  <p>${escapeHtml(span)} · ${entries.length} gün · ${formatDate(today())} tarihinde indirildi.</p>
</footer>
</div>
</body>
</html>
`;
}

/**
 * Tüm yazıları toplar, tek HTML dosyası üretir ve indirmeyi başlatır.
 * onProgress(metin) her adımda çağrılır.
 */
export async function downloadArchive(meta, list, onProgress) {
  // Kitap gibi okunsun diye eskiden yeniye. Sitedeki sıra tersi.
  const items = list.slice().sort((a, b) => (a.date < b.date ? -1 : 1));

  const loaded = await mapLimit(
    items,
    6,
    async (item) => {
      try {
        const entry = await loadEntry(item.slug);
        return { item, html: entry.html };
      } catch {
        // Tek bir yazı okunamadıysa arşivi iptal etmiyoruz.
        return { item, html: `<p><em>(Bu günün metni okunamadı: ${escapeHtml(item.slug)})</em></p>` };
      }
    },
    (done, total) => onProgress?.(`Yazılar toplanıyor… ${done}/${total}`)
  );

  const withPhotos = items.filter((i) => i.foto);
  if (withPhotos.length) {
    onProgress?.(`Fotoğraflar gömülüyor… 0/${withPhotos.length}`);
    const photos = await mapLimit(
      withPhotos,
      4,
      (item) => embedImage(item.foto),
      (done, total) => onProgress?.(`Fotoğraflar gömülüyor… ${done}/${total}`)
    );
    const bySlug = new Map(withPhotos.map((item, i) => [item.slug, photos[i]]));
    loaded.forEach((e) => {
      e.photo = bySlug.get(e.item.slug) || null;
    });
  }

  onProgress?.("Dosya hazırlanıyor…");
  const html = buildHtml(meta, loaded);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `gunluk-${today()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  const kb = Math.round(blob.size / 1024);
  onProgress?.(`İndirildi — ${kb >= 1024 ? `${(kb / 1024).toFixed(1).replace(".", ",")} MB` : `${kb} KB`}`);
}
