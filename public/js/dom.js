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

// Replace an element's children, flattening arrays and skipping null/false.
export const put = (el, ...children) =>
  el.replaceChildren(...children.flat(Infinity).filter((c) => c != null && c !== false));

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

// Tap-to-select chips. `selected` is an array that is mutated in place (multi) or a value (single).
export function chips(options, selected, onchange, { single = false } = {}) {
  const wrap = h('div', { class: 'chips' });
  let cur = single ? selected : [...(selected || [])];
  const draw = () => {
    wrap.replaceChildren(...options.map((o) => {
      const val = typeof o === 'string' ? o : o.value;
      const label = typeof o === 'string' ? o : o.label;
      const on = single ? cur === val : cur.includes(val);
      return h('button', {
        type: 'button', class: `chip${on ? ' on' : ''}`, text: label,
        onclick: () => {
          if (single) cur = cur === val ? null : val;
          else cur = on ? cur.filter((x) => x !== val) : [...cur, val];
          draw();
          onchange(cur);
        },
      });
    }));
  };
  draw();
  return wrap;
}

// Labelled textarea / input.
export const textField = (label, value, onchange, { rows = 3, placeholder = '' } = {}) =>
  h('label', { class: 'field' }, label ? h('span', { text: label }) : null,
    h('textarea', { rows, placeholder, value: value || '', oninput: (e) => onchange(e.target.value) }));

export const inputField = (label, value, onchange, { type = 'text', placeholder = '', ...rest } = {}) =>
  h('label', { class: 'field' }, label ? h('span', { text: label }) : null,
    h('input', { type, placeholder, value: value ?? '', ...rest, oninput: (e) => onchange(e.target.value) }));

// Yes / no pair of buttons.
export function yesNo(value, onchange, labels = ['是', '否']) {
  const btns = ['yes', 'no'].map((v, i) => h('button', {
    type: 'button', class: value === v ? 'on' : '', text: labels[i],
    onclick: () => { btns.forEach((b) => b.classList.toggle('on', b === btns[i])); onchange(v); },
  }));
  return h('div', { class: 'yn' }, btns);
}

// Save button for pages that already save as you type: blur the field so its last input lands, confirm, go back.
export const saveButton = (to, label = '儲存') => h('button', { class: 'btn block', type: 'button', text: label, onclick: () => {
  document.activeElement?.blur?.();
  setTimeout(() => { toast('已儲存'); go(to); }, 50);
} });

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
