// All personal data lives only in this phone's browser (localStorage). Nothing is sent anywhere.
const KEY = 'dbt-app:v1';

const empty = () => ({
  v: 1,
  checks: {},     // { handoutId: { blockKey: { itemText: true } } }
  custom: {},     // { handoutId: { blockKey: [text] } }  — 「其他」 items the user added
  urgeCards: [],  // 衝動卡（痛苦耐受作業單 3）
  crisisLogs: [], // 危機紀錄（痛苦耐受作業單 1）
  lastExport: null,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export let saveFailed = false;
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveFailed = false;
  } catch {
    saveFailed = true;
  }
}

export const getState = () => state;

// Ask the browser not to evict our data (best effort; Safari may ignore).
export function requestPersist() {
  try { navigator.storage?.persist?.(); } catch {}
}

// ---- handout checkboxes and 「其他」 items ----
export const isChecked = (hid, key, text) => !!state.checks[hid]?.[key]?.[text];

export function setChecked(hid, key, text, on) {
  state.checks[hid] ??= {};
  state.checks[hid][key] ??= {};
  if (on) state.checks[hid][key][text] = true;
  else delete state.checks[hid][key][text];
  save();
}

export const customItems = (hid, key) => state.custom[hid]?.[key] || [];

export function addCustom(hid, key, text) {
  state.custom[hid] ??= {};
  state.custom[hid][key] ??= [];
  if (!state.custom[hid][key].includes(text)) state.custom[hid][key].push(text);
  setChecked(hid, key, text, true);
}

export function removeCustom(hid, key, text) {
  const list = state.custom[hid]?.[key];
  if (!list) return;
  state.custom[hid][key] = list.filter((t) => t !== text);
  setChecked(hid, key, text, false);
}

// Everything checked in one handout, grouped by block key (includes custom items).
export function picked(hid) {
  const out = {};
  for (const [key, items] of Object.entries(state.checks[hid] || {})) {
    const list = Object.keys(items);
    if (list.length) out[key] = list;
  }
  return out;
}

// ---- urge cards ----
export const urgeCards = () => state.urgeCards;
export const urgeCard = (id) => state.urgeCards.find((c) => c.id === id);
export function saveUrgeCard(card) {
  const i = state.urgeCards.findIndex((c) => c.id === card.id);
  card.updated = new Date().toISOString();
  if (i >= 0) state.urgeCards[i] = card;
  else state.urgeCards.unshift(card);
  save();
}
export function deleteUrgeCard(id) {
  state.urgeCards = state.urgeCards.filter((c) => c.id !== id);
  save();
}

// ---- crisis logs ----
export const crisisLogs = () => [...state.crisisLogs].sort((a, b) => (a.at < b.at ? 1 : -1));
export const crisisLog = (id) => state.crisisLogs.find((c) => c.id === id);
export function saveCrisisLog(log) {
  const i = state.crisisLogs.findIndex((c) => c.id === log.id);
  if (i >= 0) state.crisisLogs[i] = log;
  else state.crisisLogs.push(log);
  save();
}
export function deleteCrisisLog(id) {
  state.crisisLogs = state.crisisLogs.filter((c) => c.id !== id);
  save();
}

// ---- backup ----
export function exportJSON() {
  state.lastExport = new Date().toISOString();
  save();
  return JSON.stringify({ app: 'dbt-app', exported: state.lastExport, data: state }, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  const data = parsed?.app === 'dbt-app' ? parsed.data : null;
  if (!data || typeof data !== 'object' || !Array.isArray(data.crisisLogs) || !Array.isArray(data.urgeCards)) {
    throw new Error('這不是本 APP 匯出的備份檔。');
  }
  state = { ...empty(), ...data };
  save();
}

export function counts() {
  return { cards: state.urgeCards.length, logs: state.crisisLogs.length };
}
