// Günlük giriş ekranı.
//
// Tasarım kararı: kemoterapi gününde tek elle, telefonda doldurulacak.
// Her alan isteğe bağlı — yazacak hali yoksa enerjiye dokunup çıkabilsin.
// Yazdıkça taslak localStorage'a düşer; sekme kapansa bile kaybolmaz.
//
// Kaydet, yazıyı doğrudan git deposuna işler (js/github.js). Araya sunucu
// girmediği için burada saklanan "anahtar" bir parola değil, GitHub'ın
// ince ayarlı erişim jetonu; sadece bu telefonda durur.

import { DRAFT_KEY, TOKEN_KEY, IMAGE_MAX_PX, IMAGE_QUALITY, VIDEO_STORE } from "./config.js";
import { commitFiles, readText, verifyAccess } from "./github.js";
import { loadMeta } from "./entries.js";
import { today, formatDate } from "./utils.js";
import { treatmentDay, cycleAt } from "./treatment.js";

const $ = (id) => document.getElementById(id);

const state = {
  meta: null,
  started: false,
  enerji: null,
  rutin: new Set(),
  foto: null, // {blob, name}
  video: null,
};

/* ---------- anahtar ---------- */

function savedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function rememberToken(v) {
  try {
    localStorage.setItem(TOKEN_KEY, v);
  } catch {
    /* gizli sekmede yazamayabilir */
  }
}

function forgetToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* yoksay */
  }
}

function openForm() {
  $("gate").hidden = true;
  $("form").hidden = false;
}

function openGate(text) {
  $("form").hidden = true;
  $("gate").hidden = false;
  $("pw").value = "";
  setMsg($("gate-msg"), text || "", text ? "err" : "");
}

/* ---------- görsel küçültme ---------- */

/**
 * Telefon fotoğrafları 3-5 MB geliyor; siteye o boyutta gerek yok.
 * Uzun kenarı IMAGE_MAX_PX'e indirip JPEG'e çeviriyoruz — ~200 KB'a düşüyor.
 */
async function shrinkImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", IMAGE_QUALITY));
  return blob || file;
}

const mb = (bytes) => (bytes / 1048576).toFixed(1).replace(".", ",");

/* ---------- form kurulumu ---------- */

function buildEnergy() {
  const wrap = $("f-enerji");
  wrap.innerHTML = Array.from({ length: 10 }, (_, i) => i + 1)
    .map((n) => `<button type="button" data-en="${n}" aria-pressed="false">${n}</button>`)
    .join("");

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-en]");
    if (!btn) return;
    state.enerji = Number(btn.dataset.en);
    wrap.querySelectorAll("[data-en]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b === btn));
    });
    saveDraft();
  });
}

function buildRoutine(meta) {
  const wrap = $("f-rutin");
  wrap.innerHTML = (meta.routine || [])
    .map(
      (r) =>
        `<button type="button" data-r="${r.id}" aria-pressed="false"><span class="b">·</span>${r.label}</button>`
    )
    .join("");

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-r]");
    if (!btn) return;
    const id = btn.dataset.r;
    const on = !state.rutin.has(id);
    if (on) state.rutin.add(id);
    else state.rutin.delete(id);
    btn.setAttribute("aria-pressed", String(on));
    btn.querySelector(".b").textContent = on ? "✓" : "·";
    saveDraft();
  });
}

function updateDayTitle() {
  const d = $("f-date").value || today();
  if (!state.meta) return;
  const day = treatmentDay(d, state.meta);
  const cyc = cycleAt(d, state.meta);
  const label = state.meta.treatment.cycleLabel || "Kür";
  const bits = [formatDate(d)];
  if (day != null) bits.unshift(`Gün ${day}`);
  if (cyc) bits.push(`${label} ${cyc.n}`);
  $("w-daytitle").textContent = bits.join(" · ");
}

/* ---------- taslak ---------- */

let draftTimer = null;
function saveDraft() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          date: $("f-date").value,
          kilo: $("f-kilo").value,
          kitap: $("f-kitap").value,
          baslik: $("f-baslik").value,
          metin: $("f-metin").value,
          enerji: state.enerji,
          rutin: [...state.rutin],
        })
      );
    } catch {
      /* kota dolabilir — taslak kaybı ölümcül değil */
    }
  }, 400);
}

function restoreDraft() {
  let d;
  try {
    d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch {
    return;
  }
  if (!d) return;

  $("f-date").value = d.date || today();
  $("f-kilo").value = d.kilo || "";
  $("f-kitap").value = d.kitap || "";
  $("f-baslik").value = d.baslik || "";
  $("f-metin").value = d.metin || "";

  if (d.enerji) {
    state.enerji = d.enerji;
    const b = $("f-enerji").querySelector(`[data-en="${d.enerji}"]`);
    if (b) b.setAttribute("aria-pressed", "true");
  }
  (d.rutin || []).forEach((id) => {
    state.rutin.add(id);
    const b = $("f-rutin").querySelector(`[data-r="${id}"]`);
    if (b) {
      b.setAttribute("aria-pressed", "true");
      b.querySelector(".b").textContent = "✓";
    }
  });

  if (d.baslik || d.metin || d.enerji) $("draft-note").hidden = false;
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* yoksay */
  }
}

/* ---------- kaydedilecek içerik ---------- */

function slugify(s) {
  const tr = { ı: "i", ğ: "g", ü: "u", ş: "s", ö: "o", ç: "c", İ: "i" };
  return s
    .toLowerCase()
    .replace(/[ığüşöçİ]/g, (c) => tr[c] || c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 44);
}

/**
 * "70,8" ve "70.8" aynı şey. Alan bilerek type="text": type="number" Türkçe
 * klavyeden gelen virgülü sessizce siliyordu, kilo hiç kaydedilmiyordu.
 */
function parseKilo(raw) {
  const v = String(raw).trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildPayload() {
  const date = $("f-date").value || today();
  const title = $("f-baslik").value.trim() || formatDate(date);
  const slug = `${date}-${slugify(title)}`;
  const kilo = parseKilo($("f-kilo").value);
  const kitap = $("f-kitap").value.trim();
  const rutin = [...state.rutin];
  const fotoPath = state.foto ? `content/media/${slug}.jpg` : null;

  const fm = [`title: ${title}`, `date: ${date}`];
  if (kilo != null) fm.push(`kilo: ${kilo}`);
  if (state.enerji) fm.push(`enerji: ${state.enerji}`);
  if (rutin.length) fm.push(`rutin: ${rutin.join(",")}`);
  if (kitap) fm.push(`kitap: ${kitap}`);
  // Fotoğrafın adı yazının kendi dosyasına da yazılıyor: klasörü kopyalayan
  // biri index.json'a bakmadan hangi resmin bu güne ait olduğunu görsün diye.
  if (fotoPath) fm.push(`foto: ../media/${slug}.jpg`);

  const markdown = `---\n${fm.join("\n")}\n---\n\n${$("f-metin").value.trim()}\n`;

  return {
    slug,
    date,
    title,
    markdown,
    fotoPath,
    // index.json satırı. Grafik 180 tane .md indirmeden çizilebilsin diye
    // enerji/kilo/rutin burada da duruyor — .md kaynak, index.json indeks.
    record: {
      slug,
      title,
      date,
      enerji: state.enerji ?? null,
      kilo,
      rutin,
      kitap: kitap || null,
      foto: fotoPath,
      video: null,
      videoSure: null,
    },
  };
}

/* ---------- gönderim ---------- */

function setMsg(el, text, kind) {
  el.textContent = text;
  el.className = "w-msg" + (kind ? ` is-${kind}` : "");
}

function isEmpty() {
  return (
    !state.enerji &&
    !$("f-metin").value.trim() &&
    !$("f-kilo").value.trim() &&
    !state.rutin.size &&
    !state.foto
  );
}

async function save() {
  const btn = $("save");
  const msg = $("msg");
  const token = savedToken();

  if (!token) {
    openGate("Anahtar bulunamadı, tekrar gir.");
    return;
  }
  if (isEmpty()) {
    setMsg(msg, "En azından bir şey doldur — enerji yeter.", "err");
    return;
  }
  if ($("f-kilo").value.trim() && parseKilo($("f-kilo").value) == null) {
    setMsg(msg, "Kiloyu anlayamadım. Örnek: 71,2", "err");
    return;
  }

  const payload = buildPayload();

  btn.disabled = true;
  setMsg(msg, "Kaydediliyor…");

  try {
    // index.json'u depodan taze okuyoruz. Sitedeki kopya CDN'de eski
    // kalabiliyor; onun üstüne yazarsak arada eklenmiş bir gün silinir.
    const list = JSON.parse(await readText(token, "content/index.json"));
    const next = list.filter((e) => e.slug !== payload.slug);
    next.unshift(payload.record);
    next.sort((a, b) => (a.date < b.date ? 1 : -1));

    const files = [{ path: `content/entries/${payload.slug}.md`, text: payload.markdown }];
    if (state.foto) files.push({ path: payload.fotoPath, blob: state.foto.blob });
    files.push({ path: "content/index.json", text: JSON.stringify(next, null, 2) + "\n" });

    await commitFiles(token, {
      message: `${payload.date} · ${payload.title}`,
      files,
    });

    clearDraft();
    setMsg(msg, "Kaydedildi. Site birkaç dakika içinde güncellenir.", "ok");
    setTimeout(() => location.assign("./"), 2500);
  } catch (err) {
    console.error(err);
    setMsg(msg, `Kaydedilemedi: ${err.message} Yazdıkların duruyor, tekrar dene.`, "err");
  } finally {
    btn.disabled = false;
  }
}

function showPreview(payload) {
  const pre = $("pre");
  pre.hidden = false;
  pre.textContent =
    `dosya: content/entries/${payload.slug}.md\n` +
    `fotoğraf: ${payload.fotoPath ? `${payload.fotoPath} (${mb(state.foto.blob.size)} MB)` : "yok"}\n` +
    `index.json: "${payload.slug}" satırı güncellenecek\n` +
    `\n${payload.markdown}`;
}

/* ---------- başlat ---------- */

async function start() {
  if (state.started) return;
  state.started = true;

  state.meta = await loadMeta();
  buildEnergy();
  buildRoutine(state.meta);

  $("f-date").value = today();
  restoreDraft();
  updateDayTitle();

  $("f-date").addEventListener("change", () => {
    updateDayTitle();
    saveDraft();
  });
  ["f-kilo", "f-kitap", "f-baslik", "f-metin"].forEach((id) =>
    $(id).addEventListener("input", saveDraft)
  );

  $("f-foto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const hint = $("foto-hint");
    hint.className = "w-hint";
    if (!file) {
      state.foto = null;
      hint.textContent = "Seçilmedi";
      return;
    }
    hint.textContent = "Küçültülüyor…";
    try {
      const blob = await shrinkImage(file);
      state.foto = { blob, name: file.name };
      hint.textContent = `Hazır — ${mb(file.size)} MB → ${mb(blob.size)} MB`;
    } catch (err) {
      console.error(err);
      state.foto = { blob: file, name: file.name };
      hint.textContent = `Hazır — ${mb(file.size)} MB (küçültülemedi)`;
    }
  });

  // Video depolama (R2) bağlanmadan bu alan açılmıyor: seçtirip
  // kaydetmemek, kötü bir günde kaydettiğini sanmasından beter.
  if (!VIDEO_STORE) {
    $("f-video").disabled = true;
    $("video-hint").className = "w-hint is-warn";
    $("video-hint").textContent = "Video depolama henüz bağlanmadı — bu alan kapalı.";
  }

  $("save").addEventListener("click", save);
  $("preview").addEventListener("click", () => showPreview(buildPayload()));
  $("relogin").addEventListener("click", () => {
    forgetToken();
    openGate("Yeni anahtarı yapıştır.");
  });
}

/* ---------- anahtar kapısı ---------- */

async function enter(token) {
  setMsg($("gate-msg"), "Anahtar kontrol ediliyor…");
  try {
    await verifyAccess(token);
  } catch (err) {
    setMsg($("gate-msg"), err.message, "err");
    return;
  }
  rememberToken(token);
  openForm();
  start();
}

const existing = savedToken();
if (existing) {
  // Formu hemen açıyoruz: sinyalin zayıf olduğu bir günde doğrulamayı
  // beklemek boş ekrana baktırır. Anahtar bozuksa arkadan haber veriyoruz.
  openForm();
  start();
  verifyAccess(existing).catch((err) => {
    setMsg($("msg"), `${err.message} "Anahtarı değiştir"e dokun.`, "err");
  });
}

$("gate-btn").addEventListener("click", () => {
  const v = $("pw").value.trim();
  if (!v) {
    setMsg($("gate-msg"), "Anahtarı yapıştır.", "err");
    return;
  }
  enter(v);
});

$("pw").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("gate-btn").click();
});
