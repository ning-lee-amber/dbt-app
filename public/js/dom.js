// Small DOM helpers. All user text goes through textContent (never innerHTML).

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const go = (hash) => {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
};

// Things to stop (timers) when leaving the current screen.
const leaveFns = [];
export const onLeave = (fn) => leaveFns.push(fn);
export function runLeave() {
  while (leaveFns.length) {
    try { leaveFns.pop()(); } catch {}
  }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function fmtDate(iso) {
  const d = new Date(iso);
  const w = '日一二三四五六'[d.getDay()];
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日（${w}）${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 星期${'日一二三四五六'[d.getDay()]}`;
}

// A card wrapper.
export const card = (...children) => h('section', { class: 'card' }, ...children);

// Page title block.
export const pageHead = (title, small) =>
  h('div', { class: 'page-head' }, small ? h('small', { text: small }) : null, h('h1', { text: title }));

// Checkbox row.
export function checkRow(label, checked, onchange, extra) {
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) });
  return h('label', { class: 'check' }, input, h('span', { text: label }), extra || null);
}

// 0–100 slider with a live number.
export function slider(label, value, onchange) {
  const num = h('b', { class: 'num', text: value ?? '—' });
  const input = h('input', {
    type: 'range', min: 0, max: 100, step: 5, value: value ?? 50,
    oninput: (e) => { num.textContent = e.target.value; onchange(Number(e.target.value)); },
  });
  return h('div', { class: 'slider' },
    h('div', { class: 'row' }, h('span', { text: label }), num),
    input,
    h('div', { class: 'row ends' }, h('span', { text: '0' }), h('span', { text: '100' })));
}

// Back link.
export const back = (to, label = '返回') => h('a', { class: 'back', href: to, text: `‹ ${label}` });

// Inline confirm (no browser dialogs).
export function confirmBar(message, yesLabel, onYes) {
  const bar = h('div', { class: 'confirm' },
    h('p', { text: message }),
    h('div', { class: 'row gap' },
      h('button', { class: 'btn danger', type: 'button', text: yesLabel, onclick: () => { bar.remove(); onYes(); } }),
      h('button', { class: 'btn ghost', type: 'button', text: '取消', onclick: () => bar.remove() })));
  return bar;
}

export function toast(msg) {
  const t = h('div', { class: 'toast', text: msg });
  document.body.append(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}
