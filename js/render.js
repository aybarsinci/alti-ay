// Sayfayı çizen tek yer.

import { dom } from "./dom.js";
import { RECENT_FULL } from "./config.js";
import {
  escapeHtml,
  formatDate,
  formatShort,
  today,
  formatMoney,
  formatSigned,
} from "./utils.js";
import { treatmentDay, cycleAt, nextCycle, cycleState } from "./treatment.js";
import { loadEntry } from "./entries.js";
import { progressChart } from "./chart.js";
import { downloadArchive } from "./arsiv.js";

export function renderHead(meta, list) {
  dom.eyebrow.textContent = meta.eyebrow || "";
  dom.title.textContent = meta.title || "";
  dom.sub.textContent = meta.subtitle || "";
  document.title = meta.title || "Günlük";

  const day = treatmentDay(today(), meta);
  dom.live.textContent = day != null ? `GÜN ${day} · CANLI` : "CANLI";
}

/* ---------- [ ÖZET ] ---------- */

export function renderKpis(meta, list) {
  const now = today();
  const day = treatmentDay(now, meta) ?? 0;
  const total = meta.treatment.totalDays || 180;
  const pct = ((day / total) * 100).toFixed(1).replace(".", ",");

  const withKilo = list.filter((e) => e.kilo != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const first = withKilo[0];
  const lastK = withKilo[withKilo.length - 1];
  const delta = first && lastK ? lastK.kilo - first.kilo : null;

  const lastE = list.find((e) => e.enerji != null);
  const lastBook = list.find((e) => e.kitap);
  const cyc = cycleAt(now, meta);
  const label = meta.treatment.cycleLabel || "Kür";

  const stats = [
    { l: "Toplam Gün", v: `${day} <small>/ ${total} (%${pct})</small>` },
    {
      l: "Kilo",
      v: lastK
        ? `${formatMoney(lastK.kilo)} <small>kg${delta != null ? ` (${formatSigned(delta)})` : ""}</small>`
        : "—",
    },
    { l: "Enerji", v: lastE ? `${lastE.enerji} <small>/ 10</small>` : "—" },
    { l: label, v: cyc ? `${cyc.n} <small>/ ${meta.treatment.cycles.length}</small>` : "—" },
    { l: "Son Kitap", v: lastBook ? `<span class="kpi-sm">${escapeHtml(lastBook.kitap)}</span>` : "—" },
  ];

  dom.status.innerHTML = stats
    .map(
      (s) =>
        `<div class="j-stat"><p class="j-stat-l">${escapeHtml(s.l)}</p><p class="j-stat-v">${s.v}</p></div>`
    )
    .join("");
}

/* ---------- [ KİLO & ENERJİ ] ---------- */

export function renderProgress(meta, list) {
  const now = today();
  const day = treatmentDay(now, meta) ?? 0;
  const total = meta.treatment.totalDays || 180;
  const left = Math.max(total - day, 0);

  dom.progLine.textContent = `${day} gün geçti, ${left} gün kaldı`;

  const rows = list
    .filter((e) => e.enerji != null || e.kilo != null)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  dom.chart.innerHTML = progressChart(rows);
  dom.chartLegend.innerHTML =
    `<span class="ch-key"><i class="ch-sw ch-sw-e"></i>Enerji (1-10)</span>` +
    `<span class="ch-key"><i class="ch-sw ch-sw-k"></i>Kilo (kg)</span>`;
}

/* ---------- [ GÜNLÜK CHECKLIST ] ---------- */

export function renderChecklist(meta, list) {
  const latest = list.find((e) => Array.isArray(e.rutin));
  const done = new Set(latest ? latest.rutin : []);
  const items = meta.routine || [];

  if (!items.length) {
    dom.checklist.innerHTML = "";
    return;
  }

  dom.checklist.innerHTML =
    `<ul class="ck-list">${items
      .map((it) => {
        const ok = done.has(it.id);
        return `<li class="ck ${ok ? "is-on" : "is-off"}"><span class="ck-box">${ok ? "✓" : "·"}</span><span class="ck-l">${escapeHtml(it.label)}</span></li>`;
      })
      .join("")}</ul>` +
    (latest ? `<p class="ck-day">${escapeHtml(formatDate(latest.date))}</p>` : "");
}

/* ---------- [ KİTAPLAR & KURSLAR ] ---------- */

function listBlock(heading, rows, kind) {
  if (!rows || !rows.length) return "";
  return `<p class="lb-h">${escapeHtml(heading)}</p><ul class="lb-list">${rows
    .map((r) => {
      const done = Boolean(r.done);
      let note = "";
      if (done) note = formatShort(r.done);
      else if (kind === "book" && r.page) note = `s.${r.page}${r.pages ? `/${r.pages}` : ""}`;
      else if (kind === "course" && r.progress != null) note = `%${r.progress}`;
      return `<li class="lb ${done ? "is-done" : ""}"><span class="lb-box">${done ? "✓" : "·"}</span><span class="lb-t">${escapeHtml(r.title)}${r.author || r.source ? `<span class="lb-s"> — ${escapeHtml(r.author || r.source)}</span>` : ""}</span><span class="lb-n">${escapeHtml(note)}</span></li>`;
    })
    .join("")}</ul>`;
}

export function renderLists(meta) {
  dom.lists.innerHTML =
    listBlock("Kitaplar", meta.books, "book") + listBlock("Kurslar", meta.courses, "course");
}

/* ---------- [ KÜR TAKVİMİ ] ---------- */

export function renderCycles(meta) {
  const now = today();
  const label = meta.treatment.cycleLabel || "Kür";

  dom.cycles.innerHTML = meta.treatment.cycles
    .map((c) => {
      const state = cycleState(c, now, meta);
      const cls = state ? ` is-${state}` : "";
      return `<div class="j-cyc${cls}"><p class="j-cyc-n">${escapeHtml(label)} ${c.n}</p><p class="j-cyc-d">${escapeHtml(formatShort(c.date))}</p></div>`;
    })
    .join("");
}

/* ---------- [ GÜNLÜK & MEDYA ARŞİVİ ] ---------- */

function mediaBlock(item) {
  const bits = [];

  if (item.video) {
    bits.push(
      `<video class="j-mv" controls preload="metadata"${item.foto ? ` poster="${escapeHtml(item.foto)}"` : ""}><source src="${escapeHtml(item.video)}" /></video>`
    );
  } else if (item.videoSure) {
    bits.push(
      `<div class="j-mv is-ph"><span class="j-play"></span><span class="j-dur">${escapeHtml(item.videoSure)}</span><span class="j-ph-l">video</span></div>`
    );
  }

  if (item.foto) {
    bits.push(`<img class="j-mf" src="${escapeHtml(item.foto)}" alt="" loading="lazy" />`);
  } else {
    bits.push(`<div class="j-mf is-ph"><span class="j-ph-l">fotoğraf</span></div>`);
  }

  return `<div class="j-media">${bits.join("")}</div>`;
}

function metaLine(item, meta, linked) {
  const day = treatmentDay(item.date, meta);
  const cyc = cycleAt(item.date, meta);
  const label = meta.treatment.cycleLabel || "Kür";

  const parts = [];
  if (day != null) parts.push(`<span class="j-day">GÜN ${day}</span>`);
  if (cyc) parts.push(`<span class="j-badge">${escapeHtml(label)} ${cyc.n}</span>`);
  if (item.enerji != null)
    parts.push(`<span class="j-en">enerji ${item.enerji}/10</span>`);
  parts.push(
    `<span class="j-date">${linked ? `<a href="?yazi=${encodeURIComponent(item.slug)}">${escapeHtml(formatDate(item.date))}</a>` : escapeHtml(formatDate(item.date))}</span>`
  );
  return `<div class="j-meta">${parts.join("")}</div>`;
}

function entryHtml(item, entry, meta, { linked }) {
  const title = escapeHtml(item.title || entry.meta.title || "");
  const heading = linked
    ? `<h2 class="j-h"><a href="?yazi=${encodeURIComponent(item.slug)}">${title}</a></h2>`
    : `<h2 class="j-h">${title}</h2>`;

  return `<article class="j-entry">
  ${metaLine(item, meta, linked)}
  ${heading}
  ${mediaBlock(item)}
  <div class="j-body">${entry.html}</div>
</article>`;
}

export async function renderList(list, meta) {
  if (!list.length) {
    dom.entries.innerHTML = `<p class="j-empty">Henüz yazı yok.</p>`;
    dom.archive.hidden = true;
    return;
  }

  const recent = list.slice(0, RECENT_FULL);
  const older = list.slice(RECENT_FULL);

  const loaded = await Promise.all(
    recent.map(async (item) => {
      try {
        return { item, entry: await loadEntry(item.slug) };
      } catch (err) {
        console.error(err);
        return null;
      }
    })
  );

  dom.entries.innerHTML = loaded
    .filter(Boolean)
    .map(({ item, entry }) => entryHtml(item, entry, meta, { linked: true }))
    .join("\n");

  renderArchive(older);
}

function renderArchive(older) {
  if (!older.length) {
    dom.archive.hidden = true;
    dom.archive.innerHTML = "";
    return;
  }

  dom.archive.hidden = false;
  dom.archive.innerHTML = `<p class="j-arch-h">Önceki günler</p>
<ul class="j-arch-list">${older
    .map(
      (it) =>
        `<li class="j-arch-item"><a href="?yazi=${encodeURIComponent(it.slug)}"><span class="j-arch-d">${escapeHtml(formatDate(it.date))}</span><span class="j-arch-t">${escapeHtml(it.title)}</span></a></li>`
    )
    .join("")}</ul>`;
}

export async function renderSingle(slug, list, meta) {
  const i = list.findIndex((x) => x.slug === slug);
  if (i < 0) {
    dom.entries.innerHTML = `<p class="j-error">Bu gün bulunamadı. <a href="./">Günlüğe dön</a></p>`;
    dom.archive.hidden = true;
    return;
  }

  const item = list[i];
  dom.seclineLabel.textContent = "[ TEK GÜN ]";
  dom.archive.hidden = true;

  const newer = list[i - 1];
  const older = list[i + 1];
  const nav = `<nav class="j-nav">
  ${older ? `<a class="j-nav-a" href="?yazi=${encodeURIComponent(older.slug)}">← ${escapeHtml(older.title)}</a>` : "<span></span>"}
  ${newer ? `<a class="j-nav-a j-nav-r" href="?yazi=${encodeURIComponent(newer.slug)}">${escapeHtml(newer.title)} →</a>` : "<span></span>"}
</nav>`;

  try {
    const entry = await loadEntry(slug);
    dom.entries.innerHTML =
      `<a class="j-back" href="./">← Bütün günler</a>` +
      entryHtml(item, entry, meta, { linked: false }) +
      nav;
    document.title = `${item.title} · ${meta.title}`;
  } catch (err) {
    console.error(err);
    dom.entries.innerHTML = `<p class="j-error">Yüklenemedi. <a href="./">Günlüğe dön</a></p>`;
  }
}

export function renderFoot(meta, list) {
  dom.prompt.innerHTML = `günlük $ watch --gun --interval 1d<span class="blk"></span>`;
  dom.foot.innerHTML =
    `<p>${escapeHtml(meta.footer || "")}</p>` +
    `<p>${escapeHtml(meta.title || "")} · ${list.length} gün kayıtlı · ${new Date().getFullYear()}</p>`;
}

/**
 * "Günlüğün tamamını indir" düğmesini bağlar. Arşivin kendisi js/arsiv.js'te;
 * burada sadece düğmenin durumu ve ilerleme metni var.
 */
export function renderDownload(meta, list) {
  const say = (text) => {
    dom.downloadMsg.textContent = text;
  };

  dom.downloadBtn.addEventListener("click", async () => {
    dom.downloadBtn.disabled = true;
    try {
      await downloadArchive(meta, list, say);
    } catch (err) {
      console.error(err);
      say("İndirilemedi. Sayfayı yenileyip tekrar dene.");
    } finally {
      dom.downloadBtn.disabled = false;
    }
  });
}

export function renderError(message) {
  dom.entries.innerHTML = `<p class="j-error">${escapeHtml(message)}</p>`;
}
