// Tedavi takvimi hesapları.
// Hiçbir şey elle güncellenmiyor: her şey meta.json'daki
// startDate + cycles listesinden ve bugünün tarihinden türetiliyor.

import { parseDay, daysBetween } from "./utils.js";

/** Tedavinin kaçıncı günü (1'den başlar). Başlamadan önceyse null. */
export function treatmentDay(dateStr, meta) {
  const n = daysBetween(meta.treatment.startDate, dateStr) + 1;
  return n >= 1 ? n : null;
}

/** O tarihte içinde bulunulan kür. Başlamadan önceyse null. */
export function cycleAt(dateStr, meta) {
  const d = parseDay(dateStr);
  let current = null;
  for (const c of meta.treatment.cycles) {
    if (parseDay(c.date) <= d) current = c;
  }
  return current;
}

/** O tarihten sonraki ilk kür. Hepsi bittiyse null. */
export function nextCycle(dateStr, meta) {
  const d = parseDay(dateStr);
  return meta.treatment.cycles.find((c) => parseDay(c.date) > d) || null;
}

/** Bir kürün durumu: "done" | "now" | "" */
export function cycleState(cycle, dateStr, meta) {
  const now = cycleAt(dateStr, meta);
  if (!now) return "";
  if (cycle.n === now.n) return "now";
  return cycle.n < now.n ? "done" : "";
}
