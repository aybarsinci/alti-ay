// Küçük markdown çevirici.
//
// Neden hazır kütüphane değil: bu sitenin amacı yıllarca ayakta kalmak.
// Dışarıdan yüklenen bir CDN dosyası bir gün kaybolursa yazılar okunmaz hâle
// gelir. Buradaki alt küme (paragraf, başlık, liste, alıntı, bağlantı,
// görsel, kalın/italik) günlük yazmak için fazlasıyla yeterli ve hiçbir
// dış bağımlılığı yok.

import { escapeHtml } from "./utils.js";

/** "---\nbaslik: x\n---\n gövde" -> { meta, body } */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { meta: {}, body: text };

  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const value = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key) meta[key] = value;
  }
  return { meta, body: text.slice(m[0].length) };
}

function inline(raw) {
  // Kaçış burada yapılır: blok tespiti (">", "-", "#") ham metin üzerinde
  // çalışsın diye, escapeHtml'i en son bu aşamada uyguluyoruz.
  return (
    escapeHtml(raw)
      // görsel: ![alt](src)
      .replace(
        /!\[([^\]]*)\]\(([^)\s]+)\)/g,
        (_, alt, src) => `<img src="${src}" alt="${alt}" loading="lazy" />`
      )
      // bağlantı: [metin](url)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, href) => {
        const ext = /^https?:/i.test(href);
        const attrs = ext ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${href}"${attrs}>${txt}</a>`;
      })
      // kod: `x`
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // kalın: **x**
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // italik: *x*
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
  );
}

function renderBlock(block) {
  const lines = block.split(/\r?\n/);

  // Başlık
  const h = /^(#{2,3})\s+(.*)$/.exec(lines[0]);
  if (h && lines.length === 1) {
    return `<h3>${inline(h[2])}</h3>`;
  }

  // Alıntı
  if (lines.every((l) => /^>\s?/.test(l))) {
    const body = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
    return `<blockquote><p>${inline(body)}</p></blockquote>`;
  }

  // Sırasız liste
  if (lines.every((l) => /^[-*]\s+/.test(l))) {
    const items = lines
      .map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ""))}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  // Sıralı liste
  if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
    const items = lines
      .map((l) => `<li>${inline(l.replace(/^\d+[.)]\s+/, ""))}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  }

  // Tek başına görsel -> figure
  const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block.trim());
  if (img) {
    const caption = img[1]
      ? `<figcaption>${inline(img[1])}</figcaption>`
      : "";
    return `<figure><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" loading="lazy" />${caption}</figure>`;
  }

  return `<p>${lines.map(inline).join("<br />")}</p>`;
}

/** Markdown gövdesini HTML'e çevirir. */
export function renderMarkdown(md) {
  return md
    .split(/\r?\n\s*\r?\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map(renderBlock)
    .join("\n");
}
