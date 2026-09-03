// Tema seçici. Seçim localStorage'da tutulur; ?tema=<id> ile de açılabilir.

import { dom } from "./dom.js";
import { THEMES, DEFAULT_THEME, THEME_KEY, SHOW_THEME_PICKER } from "./config.js";

function isValid(id) {
  return THEMES.some((t) => t.id === id);
}

function stored() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function remember(id) {
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {
    /* gizli sekmede yazamayabilir — sorun değil */
  }
}

export function currentTheme() {
  const fromUrl = new URLSearchParams(location.search).get("tema");
  if (isValid(fromUrl)) return fromUrl;

  const saved = stored();
  if (isValid(saved)) return saved;

  return DEFAULT_THEME;
}

export function applyTheme(id) {
  if (!isValid(id)) id = DEFAULT_THEME;
  dom.themeCss.href = `themes/${id}.css`;
  document.documentElement.dataset.tema = id;

  dom.themePills.querySelectorAll("[data-theme]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.theme === id));
  });
}

export function initTheme() {
  const active = currentTheme();

  if (!SHOW_THEME_PICKER) {
    applyTheme(active);
    return;
  }

  dom.themebar.hidden = false;
  dom.themePills.innerHTML = THEMES.map(
    (t) =>
      `<button type="button" class="themebar-pill" data-theme="${t.id}" aria-pressed="false">${t.name}</button>`
  ).join("");

  dom.themePills.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme]");
    if (!btn) return;
    const id = btn.dataset.theme;
    applyTheme(id);
    remember(id);
  });

  applyTheme(active);
}
