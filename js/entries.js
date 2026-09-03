// İçerik yükleme. Yazılar content/entries/*.md içinde düz metin olarak durur;
// content/index.json onları sıralar.

import { CONTENT_BASE } from "./config.js";
import { parseFrontmatter, renderMarkdown } from "./markdown.js";

const cache = new Map();

async function getJson(path) {
  const res = await fetch(`${CONTENT_BASE}/${path}`, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

export function loadMeta() {
  return getJson("meta.json");
}

/** [{ slug, title, date }] — en yeni önce */
export async function loadIndex() {
  const list = await getJson("index.json");
  return list.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Tek bir yazının tam metnini getirir (oturum içinde önbelleklenir). */
export async function loadEntry(slug) {
  if (cache.has(slug)) return cache.get(slug);

  const promise = (async () => {
    const res = await fetch(`${CONTENT_BASE}/entries/${slug}.md`, {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
    const text = await res.text();
    const { meta, body } = parseFrontmatter(text);
    return { slug, meta, html: renderMarkdown(body) };
  })();

  cache.set(slug, promise);
  return promise;
}
