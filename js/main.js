// Giriş noktası: temayı uygula, içeriği yükle, sayfayı çiz.

import { loadMeta, loadIndex } from "./entries.js";
import {
  renderHead,
  renderKpis,
  renderProgress,
  renderChecklist,
  renderLists,
  renderCycles,
  renderList,
  renderSingle,
  renderFoot,
  renderError,
} from "./render.js";
import { initTheme } from "./theme.js";

async function start() {
  initTheme();

  let meta, list;
  try {
    [meta, list] = await Promise.all([loadMeta(), loadIndex()]);
  } catch (err) {
    console.error(err);
    renderError(
      "İçerik yüklenemedi. Siteyi bir web sunucusu üzerinden açtığından emin ol (dosyaya çift tıklayarak değil)."
    );
    return;
  }

  renderHead(meta, list);
  renderKpis(meta, list);
  renderProgress(meta, list);
  renderChecklist(meta, list);
  renderLists(meta);
  renderCycles(meta);
  renderFoot(meta, list);

  const slug = new URLSearchParams(location.search).get("yazi");
  if (slug) {
    await renderSingle(slug, list, meta);
  } else {
    await renderList(list, meta);
  }
}

start();
