// Kilo + enerji çizgi grafiği. Kütüphane yok; SVG elle çiziliyor.
// İki ayrı ölçek: enerji (1-10) solda, kilo (kg) sağda.

import { parseDay, formatShort } from "./utils.js";

const W = 620;
const H = 220;
const PAD = { t: 16, r: 46, b: 26, l: 40 };

function scale(vals, pad = 0.1) {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (min === max) return { min: min - 1, max: max + 1 };
  const m = (max - min) * pad;
  return { min: min - m, max: max + m };
}

function path(points, xOf, yOf) {
  return points.map((p, i) => `${i ? "L" : "M"}${xOf(p).toFixed(1)},${yOf(p).toFixed(1)}`).join("");
}

/**
 * @param {Array<{date,enerji,kilo}>} rows — eskiden yeniye sıralı
 * @returns {string} SVG
 */
export function progressChart(rows) {
  const pts = rows.filter((r) => r.enerji != null || r.kilo != null);
  if (pts.length < 2) {
    return `<p class="ch-empty">Grafik için en az iki gün gerekiyor.</p>`;
  }

  const t0 = parseDay(pts[0].date).getTime();
  const t1 = parseDay(pts[pts.length - 1].date).getTime();
  const span = t1 - t0 || 1;
  const xOf = (r) =>
    PAD.l + ((parseDay(r.date).getTime() - t0) / span) * (W - PAD.l - PAD.r);

  const eRows = pts.filter((r) => r.enerji != null);
  const kRows = pts.filter((r) => r.kilo != null);

  const eS = { min: 0, max: 10 };
  const kS = scale(kRows.map((r) => r.kilo), 0.35);

  const yOfE = (r) =>
    PAD.t + (1 - (r.enerji - eS.min) / (eS.max - eS.min)) * (H - PAD.t - PAD.b);
  const yOfK = (r) =>
    PAD.t + (1 - (r.kilo - kS.min) / (kS.max - kS.min)) * (H - PAD.t - PAD.b);

  const grid = [0, 0.5, 1]
    .map((f) => {
      const y = PAD.t + f * (H - PAD.t - PAD.b);
      return `<line class="ch-grid" x1="${PAD.l}" y1="${y.toFixed(1)}" x2="${W - PAD.r}" y2="${y.toFixed(1)}" />`;
    })
    .join("");

  // sol eksen: enerji 10 / 5 / 0 — sağ eksen: kilo
  const yLabels =
    [10, 5, 0]
      .map((v, i) => {
        const y = PAD.t + (i / 2) * (H - PAD.t - PAD.b);
        return `<text class="ch-yl" x="${PAD.l - 7}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${v}</text>`;
      })
      .join("") +
    [kS.max, (kS.max + kS.min) / 2, kS.min]
      .map((v, i) => {
        const y = PAD.t + (i / 2) * (H - PAD.t - PAD.b);
        return `<text class="ch-yl ch-yr" x="${W - PAD.r + 7}" y="${(y + 3.5).toFixed(1)}">${v.toFixed(1)}</text>`;
      })
      .join("");

  const xLabels = [0, 0.5, 1]
    .map((f) => {
      const row = pts[Math.round(f * (pts.length - 1))];
      const x = xOf(row);
      const anchor = f === 0 ? "start" : f === 1 ? "end" : "middle";
      return `<text class="ch-xl" x="${x.toFixed(1)}" y="${H - 7}" text-anchor="${anchor}">${formatShort(row.date)}</text>`;
    })
    .join("");

  const area =
    kRows.length > 1
      ? `<path class="ch-area" d="${path(kRows, xOf, yOfK)}L${xOf(kRows[kRows.length - 1]).toFixed(1)},${H - PAD.b}L${xOf(kRows[0]).toFixed(1)},${H - PAD.b}Z" />`
      : "";

  const last = eRows[eRows.length - 1];

  return `<svg class="ch-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Enerji ve kilo değişimi">
  ${grid}
  ${area}
  ${kRows.length > 1 ? `<path class="ch-kilo" d="${path(kRows, xOf, yOfK)}" />` : ""}
  ${eRows.length > 1 ? `<path class="ch-enerji" d="${path(eRows, xOf, yOfE)}" />` : ""}
  ${last ? `<circle class="ch-dot" cx="${xOf(last).toFixed(1)}" cy="${yOfE(last).toFixed(1)}" r="4" />` : ""}
  ${yLabels}
  ${xLabels}
</svg>`;
}
