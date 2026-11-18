import { h, card, pageHead, checkRow, slider, back, fmtDate, uid, confirmBar, toast, go } from './dom.js';
import { CRISIS_SKILLS, EFFECT_ANCHORS } from './content.js';
import * as store from './store.js';

// ---------- 記錄（危機紀錄，痛苦耐受作業單 1） ----------

export function records() {
  const logs = store.crisisLogs();
  return {
    tab: 'records', title: '',
    node: h('div', {},
      pageHead('記錄'),
      h('a', { class: 'btn block', href: '#/records/new', text: '＋ 新增危機紀錄' }),
      logs.length
        ? card(h('h3', { text: '危機紀錄' }), logs.map((l) =>
          h('a', { class: 'rowlink', href: `#/records/${l.id}` },
            h('div', {}, h('b', { text: l.event || '（未填寫事件）' }),
              h('small', { text: `${fmtDate(l.at)}${l.skills?.length ? '・' + l.skills.length + ' 個技巧' : ''}` })),
            h('span', { class: 'chev', text: `${l.pre ?? '—'} → ${l.post ?? '—'}` }))))
        : card(h('p', { class: 'muted', text: '還沒有紀錄。危機過後，可以在這裡記下發生了什麼、用了哪些技巧。' })),
      h('p', { class: 'muted small center', text: '情緒紀錄、每日打卡等會在第二階段加入。' }),
    ),
  };
}

function ratingPicker(value, onchange) {
  const anchor = h('p', { class: 'anchor', text: EFFECT_ANCHORS[value] || '' });
  const btns = [1, 2, 3, 4, 5].map((n) => h('button', {
    type: 'button', class: n === value ? 'on' : '', text: String(n),
    onclick: () => {
      btns.forEach((b, i) => b.classList.toggle('on', i + 1 === n));
      anchor.textContent = EFFECT_ANCHORS[n] || '';
      onchange(n);
    },
  }));
  return h('div', {}, h('div', { class: 'rating' }, btns),
    h('div', { class: 'row ends' }, h('span', { text: '沒有效' }), h('span', { text: '很有效' })), anchor);
}

const area = (label, value, onchange, rows = 3) =>
  h('label', { class: 'field' }, h('span', { text: label }),
    h('textarea', { rows, value: value || '', oninput: (e) => onchange(e.target.value) }));

export function logForm(id) {
  const existing = id ? store.crisisLog(id) : null;
  if (id && !existing) return null;
  const log = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), event: '', pre: null, post: null, skills: [], how: '', result: '', rating: null,
  };
  if (!existing) {
    try {
      const pending = JSON.parse(sessionStorage.getItem('dbt-crisis-skills') || 'null');
      if (pending) { log.skills = pending; sessionStorage.removeItem('dbt-crisis-skills'); }
    } catch {}
  }
  const actions = h('div', {});

  const save = () => {
    store.saveCrisisLog(log);
    toast('已儲存');
    go('#/records');
  };

  return {
    tab: 'records', title: '',
    node: h('div', {},
      back('#/records', '記錄'),
      pageHead(existing ? '危機紀錄' : '新增危機紀錄', existing ? fmtDate(log.at) : '痛苦耐受作業單 1'),
      card(
        area('痛苦情緒的促發事件（人、事、時、地）：是什麼引發了危機狀態？', log.event, (v) => { log.event = v; }),
        slider('痛苦程度：練習前', log.pre, (v) => { log.pre = v; }),
      ),
      card(
        h('h3', { text: '勾選你嘗試的技巧' }),
        CRISIS_SKILLS.map((s) => checkRow(s, log.skills.includes(s), (on) => {
          log.skills = on ? [...new Set([...log.skills, s])] : log.skills.filter((x) => x !== s);
        })),
        area('在此描述你怎麼做：', log.how, (v) => { log.how = v; }),
      ),
      card(
        area('描述使用技巧的結果：', log.result, (v) => { log.result = v; }),
        slider('痛苦程度：練習後', log.post, (v) => { log.post = v; }),
        h('p', { class: 'field-label', text: '使用技巧後，幫助你忍受痛苦與因應情境（讓你不會去做些什麼而使情況更糟）的有效程度：' }),
        ratingPicker(log.rating, (n) => { log.rating = n; }),
      ),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: save }),
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄',
        onclick: () => actions.replaceChildren(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => {
          store.deleteCrisisLog(log.id); toast('已刪除'); go('#/records');
        })) }) : null,
      actions,
    ),
  };
}

// ---------- 衝動卡（痛苦耐受作業單 3：在受危機衝動影響前，分析優缺點） ----------

const QUADS = [
  ['actPro', '順著危機衝動行事', '優點'],
  ['actCon', '順著危機衝動行事', '缺點'],
  ['resPro', '抗拒危機衝動', '優點'],
  ['resCon', '抗拒危機衝動', '缺點'],
];

export function urgeList() {
  const cards = store.urgeCards();
  return {
    tab: 'me', title: '',
    node: h('div', {},
      back('#/me', '我的'),
      pageHead('我的衝動卡', '在受危機衝動影響前，分析優缺點'),
      card(h('p', { class: 'muted', text: '平常先為每個想停止的問題行為寫一張卡：列出順著衝動和抗拒衝動的優點與缺點。衝動來的時候，在危機模式裡打開它再讀一次。' })),
      h('a', { class: 'btn block', href: '#/urge/new', text: '＋ 新增衝動卡' }),
      cards.length ? card(cards.map((c) =>
        h('a', { class: 'rowlink', href: `#/urge/${c.id}` },
          h('div', {}, h('b', { text: c.behavior || '（未命名）' }), h('small', { text: `更新於 ${fmtDate(c.updated)}` })),
          h('span', { class: 'chev', text: '›' })))) : null,
    ),
  };
}

function itemList(items) {
  const wrap = h('div', { class: 'items' });
  const draw = () => {
    wrap.replaceChildren(...items.map((it, i) => {
      const seg = ['day', 'long'].map((term) => h('button', {
        type: 'button', class: it.term === term ? 'on' : '', text: term === 'day' ? '當天' : '長期',
        onclick: () => { it.term = it.term === term ? null : term; draw(); },
      }));
      return h('div', { class: 'item' },
        h('input', { type: 'text', value: it.text, placeholder: `${i + 1}.`, oninput: (e) => { it.text = e.target.value; } }),
        h('div', { class: 'seg mini' }, seg),
        h('button', { class: 'x', type: 'button', text: '×', 'aria-label': '刪除', onclick: () => { items.splice(i, 1); draw(); } }));
    }), h('button', { class: 'btn small ghost', type: 'button', text: '＋ 再加一項', onclick: () => { items.push({ text: '', term: null }); draw(); } }));
  };
  draw();
  return wrap;
}

export function urgeForm(id) {
  const existing = id ? store.urgeCard(id) : null;
  if (id && !existing) return null;
  const c = existing ? structuredClone(existing) : {
    id: uid(), behavior: '', skills: [], skillNote: '',
    actPro: [{ text: '', term: null }], actCon: [{ text: '', term: null }],
    resPro: [{ text: '', term: null }], resCon: [{ text: '', term: null }],
  };
  const actions = h('div', {});

  const save = () => {
    for (const [k] of QUADS) c[k] = c[k].filter((it) => it.text.trim());
    store.saveUrgeCard(c);
    toast('已儲存');
    go('#/urge');
  };

  return {
    tab: 'me', title: '',
    node: h('div', {},
      back('#/urge', '我的衝動卡'),
      pageHead(existing ? '編輯衝動卡' : '新增衝動卡', '痛苦耐受作業單 3'),
      card(h('label', { class: 'field' }, h('span', { text: '1. 描述你想停止的問題行為：' }),
        h('input', { type: 'text', value: c.behavior, placeholder: '例如：喝酒、傷害自己、罵人', oninput: (e) => { c.behavior = e.target.value; } }))),
      h('p', { class: 'muted small', text: '2. 分析順著危機衝動和抗拒危機衝動的優缺點。每一項標記是短期的（當天）還是長期的（超過一天）。' }),
      QUADS.map(([k, side, kind]) => card(h('h3', {}, side, h('span', { class: kind === '優點' ? 'pro' : 'con', text: `・${kind}` })), itemList(c[k]))),
      card(
        h('h3', { text: '可用來抵抗危機行為的痛苦耐受技巧' }),
        CRISIS_SKILLS.map((s) => checkRow(s, c.skills.includes(s), (on) => {
          c.skills = on ? [...new Set([...c.skills, s])] : c.skills.filter((x) => x !== s);
        })),
        area('其他：', c.skillNote, (v) => { c.skillNote = v; }, 2),
      ),
      card(h('p', { class: 'muted', text: '確認優缺點是短期的（當天）或長期的（超過一天），接著問問智慧心：自己要的是愉快的一天或愉快的人生？對你的行為做出了了分明的抉擇。' }),
        h('p', { class: 'muted', text: '3. 當衝動引發問題行為時，讀一讀這些優缺點。' })),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: save }),
      existing ? h('a', { class: 'btn ghost block', href: `#/crisis/urge?card=${c.id}`, text: '在危機模式中打開' }) : null,
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這張卡',
        onclick: () => actions.replaceChildren(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => {
          store.deleteUrgeCard(c.id); toast('已刪除'); go('#/urge');
        })) }) : null,
      actions,
    ),
  };
}
