// 第三階段：了了分明練習紀錄、平衡（中庸之道）、正向活動、價值觀 → 目標 → 步驟、ABC（自我掌控、預先因應）.
import { h, put, card, pageHead, back, chips, textField, inputField, yesNo, slider, uid, fmtDate, toast, go, confirmBar, checkRow } from './dom.js';
import { MF_SKILLS, MF_EFFECTS, LOVING_EFFECTS, WISE_ANCHORS, LOVING_TARGETS, BALANCE_PAIRS } from './content-mf.js';
import { POSITIVE_ACTIVITIES, VALUES } from './content-er.js';
import * as store from './store.js';

const today = () => store.dayKey();
const delButton = (actions, coll, id, next) => h('button', { class: 'btn ghost block', type: 'button', text: '刪除',
  onclick: () => put(actions, confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => { store.deleteItem(coll, id); toast('已刪除'); go(next); })) });

function scale(n, value, onchange, anchors) {
  const anchor = h('p', { class: 'anchor', text: anchors?.[value] || '' });
  const start = n === 5 ? 1 : 0;
  const btns = [];
  for (let k = start; k <= n; k++) {
    btns.push(h('button', { type: 'button', class: value === k ? 'on' : '', text: String(k), onclick: () => {
      btns.forEach((b) => b.classList.toggle('on', b.textContent === String(k)));
      anchor.textContent = anchors?.[k] || '';
      onchange(k);
    } }));
  }
  return h('div', {}, h('div', { class: 'rating' }, btns), anchors ? anchor : null);
}

// ---------- 了了分明練習紀錄（作業單 4、5、6、7、10） ----------

export function practiceForm(id, skill) {
  const existing = id ? store.item('practices', id) : null;
  if (id && !existing) return null;
  const p = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), skills: skill && MF_SKILLS.includes(skill) ? [skill] : [], targets: [],
    wishes: '', situation: '', effects: [], rating: null, note: '',
  };
  const root = h('div', {});
  const actions = h('div', {});
  const draw = () => {
    const loving = p.skills.includes('仁慈關愛');
    put(root,
      back('#/records', '記錄'),
      pageHead(existing ? '了了分明練習' : '記錄一次練習', existing ? fmtDate(p.at) : '了了分明作業單 4、5、6、7、10'),
      card(h('h3', { text: '我練習了哪些技巧？' }), chips(MF_SKILLS, p.skills, (v) => { p.skills = v; draw(); })),
      loving ? card(
        h('h3', { text: '仁慈關愛的對象' }), chips(LOVING_TARGETS, p.targets, (v) => { p.targets = v; }),
        textField('說了哪些祝福？', p.wishes, (v) => { p.wishes = v; }, { rows: 2, placeholder: '願我快樂。願我平安。' }),
      ) : null,
      card(textField('描述情境，以及你如何練習：', p.situation, (v) => { p.situation = v; })),
      card(
        h('h3', { text: '練習後，對下列任一項是否有所影響？即使只有一點點：' }),
        chips(loving ? [...new Set([...LOVING_EFFECTS, ...MF_EFFECTS])] : MF_EFFECTS, p.effects, (v) => { p.effects = v; }),
        h('p', { class: 'field-label top', text: '這個練習有多有效？' }),
        scale(5, p.rating, (v) => { p.rating = v; }, WISE_ANCHORS),
        textField('這個技巧如何（或沒有）幫助你變得更了了分明？', p.note, (v) => { p.note = v; }, { rows: 2 }),
      ),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => {
        if (!p.skills.length) { toast('先選一個技巧'); return; }
        store.saveItem('practices', p); toast('已儲存'); go('#/records');
      } }),
      existing ? delButton(actions, 'practices', p.id, '#/records') : null,
      actions,
    );
  };
  draw();
  return { tab: 'records', title: '', node: root };
}

// ---------- 平衡（了了分明講義 10、作業單 10a） ----------

export function balancePage(dateKey) {
  const key = dateKey || today();
  const c = store.checkin(key);
  const set = (f) => (v) => store.setCheckin(key, f, v);
  const seesaw = (i, [l, r]) => {
    const v = c[`bal${i}`] ?? 50;
    const input = h('input', { type: 'range', min: 0, max: 100, step: 5, value: v, oninput: (e) => set(`bal${i}`)(Number(e.target.value)) });
    return h('div', { class: 'seesaw' }, h('div', { class: 'row ends ink' }, h('span', { text: l }), h('span', { text: r })), input);
  };
  return {
    tab: 'tools', title: '',
    node: h('div', {},
      back('#/tools', '工具'),
      pageHead('行中庸之道', `了了分明作業單 10a・${key === today() ? '今天' : key}`),
      card(
        h('p', { class: 'muted', text: '大部分時間，你在每一條線上的哪裡？相當平衡就放在中間；失去平衡就移向太極端的那一頭。' }),
        BALANCE_PAIRS.map((pair, i) => seesaw(i, pair)),
      ),
      card(
        h('h3', { text: '選擇一個困境' }),
        textField('哪些部分你做得太多？', c.balMore, set('balMore'), { rows: 2 }),
        textField('哪些部分你做得太少？', c.balLess, set('balLess'), { rows: 2 }),
        h('p', { class: 'muted small', text: '核對事實：確認它們符合事實，是你自己的中庸之道而不是別人的。避免「好」、「壞」等評斷的言語。' }),
      ),
      card(
        h('h3', { text: '決定接下來兩星期要做的一、兩件事' }),
        textField('少做：', c.balDoLess, set('balDoLess'), { rows: 2 }),
        textField('多做：', c.balDoMore, set('balDoMore'), { rows: 2 }),
      ),
      h('p', { class: 'muted small center', text: '填寫後會自動儲存。' }),
    ),
  };
}

// ---------- 正向活動（情緒調節講義 15、16，作業單 10） ----------

function todayItem(coll) {
  return store.where(coll, (x) => x.date === today())[0];
}

export function positivePage() {
  let p = todayItem('positives');
  const root = h('div', {});
  const mine = Object.values(store.picked('er-16')).flat();
  const draw = () => {
    const recent = store.items('positives').filter((x) => x.date !== today()).slice(0, 14);
    put(root,
      back('#/today', '今天'),
      pageHead('今天的一件好事', '情緒調節講義 15、16・作業單 10'),
      card(
        h('h3', { text: '今天的正向活動計畫' }),
        inputField('', p?.text, (v) => { p ??= { id: uid(), at: new Date().toISOString(), date: today() }; p.text = v; store.saveItem('positives', p); }, { placeholder: '例如：傍晚出去散步十分鐘' }),
        mine.length ? [h('p', { class: 'field-label top', text: '從我勾選的清單挑一件：' }),
          chips(mine.slice(0, 30), null, (v) => { if (!v) return; p ??= { id: uid(), at: new Date().toISOString(), date: today() }; p.text = v; store.saveItem('positives', p); draw(); }, { single: true })] : null,
        h('button', { class: 'btn small ghost top', type: 'button', text: '隨機給我一個點子', onclick: () => {
          const pool = mine.length ? mine : POSITIVE_ACTIVITIES;
          p ??= { id: uid(), at: new Date().toISOString(), date: today() };
          p.text = pool[Math.floor(Math.random() * pool.length)];
          store.saveItem('positives', p); draw();
        } }),
        h('a', { class: 'small block-link', href: '#/handouts/er-16', text: '到正向活動清單（225 項）勾選我喜歡的 ›' }),
      ),
      p?.text ? card(
        checkRow('我做了', !!p.done, (on) => { p.done = on; store.saveItem('positives', p); draw(); }),
        p.done ? [
          h('p', { class: 'field-label top', text: '對正向活動了了分明的程度（0–5）' }), scale(5.1, p.mindful, (v) => { p.mindful = v; store.saveItem('positives', p); }),
          h('p', { class: 'field-label top', text: '放下擔憂的程度（0–5）' }), scale(5.1, p.letGo, (v) => { p.letGo = v; store.saveItem('positives', p); }),
          slider('感到愉快的程度（0–100）', p.pleasure, (v) => { p.pleasure = v; store.saveItem('positives', p); }),
          textField('感想：', p.note, (v) => { p.note = v; store.saveItem('positives', p); }, { rows: 2 }),
          h('p', { class: 'muted small', text: '把注意力專注在正向時刻；心思飄到擔憂時（它何時會結束、我配不配得到、還有什麼沒做完），再度專注回來。' }),
        ] : null,
      ) : null,
      recent.length ? card(h('h3', { text: '最近的正向活動' }), recent.map((x) =>
        h('div', { class: 'logrow' }, h('span', { text: `${x.date.slice(5)}　${x.text || ''}` }), h('small', { text: x.done ? `✓ 愉快 ${x.pleasure ?? '—'}` : '未做' })))) : null,
    );
  };
  draw();
  return { tab: 'today', title: '', node: root };
}

// ---------- 價值觀 → 目標 → 步驟（情緒調節講義 17、18，作業單 11、11a、11b） ----------

function myValues() {
  const picked = store.picked('er-18');
  const list = Object.values(picked).flat();
  return list.length ? list : VALUES.map(([k, t]) => `${k}. ${t}`);
}

export function nextStep() {
  for (const g of store.items('goals')) {
    const s = (g.steps || []).find((x) => x.text && !x.done);
    if (s) return { goal: g, step: s };
  }
  return null;
}

export function valuesPage() {
  const goals = store.items('goals');
  const byValue = {};
  for (const g of goals) (byValue[g.value || '（未選價值觀）'] ??= []).push(g);
  return {
    tab: 'today', title: '',
    node: h('div', {},
      back('#/today', '今天'),
      pageHead('價值觀與目標', '情緒調節講義 17、18・作業單 11'),
      card(h('p', { class: 'muted', text: '確認對你重要的價值觀 → 選一個現在可努力的目標 → 拆成小行動步驟 → 現在就採取一步。' }),
        h('a', { class: 'small', href: '#/handouts/er-18', text: '到價值觀清單勾選對我重要的 ›' })),
      h('a', { class: 'btn block', href: '#/values/new', text: '＋ 新增目標' }),
      Object.entries(byValue).map(([v, gs]) => card(
        h('p', { class: 'group-title', text: v }),
        gs.map((g) => {
          const done = (g.steps || []).filter((s) => s.done).length;
          return h('a', { class: 'rowlink', href: `#/values/${g.id}` },
            h('div', {}, h('b', { text: g.goal || '（未命名目標）' }), h('small', { text: `${done} / ${(g.steps || []).filter((s) => s.text).length} 步完成` })),
            h('span', { class: 'chev', text: '›' }));
        }))),
    ),
  };
}

export function goalPage(id) {
  const existing = id !== 'new' ? store.item('goals', id) : null;
  if (id !== 'new' && !existing) return null;
  const g = existing ? structuredClone(existing) : { id: uid(), at: new Date().toISOString(), value: null, goal: '', steps: [{ id: uid(), text: '', done: false }] };
  const root = h('div', {});
  const actions = h('div', {});
  const draw = () => {
    const stepsBox = h('div', {}, g.steps.map((s, i) => h('div', { class: 'stepitem' },
      h('div', { class: 'item' },
        h('input', { type: 'checkbox', checked: s.done, onchange: (e) => { s.done = e.target.checked; s.doneAt = s.done ? new Date().toISOString() : null; } }),
        h('input', { type: 'text', value: s.text, placeholder: `行動步驟 ${i + 1}`, oninput: (e) => { s.text = e.target.value; } }),
        h('button', { class: 'x', type: 'button', text: '×', onclick: () => { g.steps.splice(i, 1); draw(); } })),
      h('input', { type: 'text', class: 'sub', value: s.what || '', placeholder: '做了之後發生了什麼？', oninput: (e) => { s.what = e.target.value; } }))),
    h('button', { class: 'btn small ghost', type: 'button', text: '＋ 再加一步', onclick: () => { g.steps.push({ id: uid(), text: '', done: false }); draw(); } }));
    put(root,
      back('#/values', '價值觀與目標'),
      pageHead(existing ? '目標' : '新增目標', '從價值觀展開特定行動步驟'),
      card(h('h3', { text: '1. 挑選一個你的價值觀' }), chips(myValues(), g.value, (v) => { g.value = v; }, { single: true })),
      card(textField('2. 跟此價值觀有關、現在可努力的目標（要具體明確）：', g.goal, (v) => { g.goal = v; }, { rows: 2 })),
      card(h('h3', { text: '3. 朝向目標的小行動步驟' }),
        h('p', { class: 'muted small', text: '如果一個步驟看起來太龐大而讓你感到無法負荷，把它分解成更小的步驟。步驟太多時，只聚焦在一個步驟上。' }),
        stepsBox),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => {
        g.steps = g.steps.filter((s) => s.text.trim() || s.done);
        store.saveItem('goals', g); toast('已儲存'); go('#/values');
      } }),
      existing ? delButton(actions, 'goals', g.id, '#/values') : null,
      actions,
    );
  };
  draw();
  return { tab: 'today', title: '', node: root };
}

// ---------- ABC：建立自我掌控、預先因應（情緒調節講義 19，作業單 12、13） ----------

export function abcPage() {
  let m = todayItem('mastery');
  const root = h('div', {});
  const draw = () => {
    const copes = store.items('copeAhead');
    const recent = store.items('mastery').filter((x) => x.date !== today()).slice(0, 10);
    put(root,
      back('#/today', '今天'),
      pageHead('建立自我掌控與預先因應', '情緒調節講義 19・作業單 12'),
      card(
        h('h3', { text: 'B　今天建立自我掌控的活動' }),
        h('p', { class: 'muted small', text: '每天至少做一件事來建立成就感。選困難但可能做到的事。' }),
        inputField('', m?.plan, (v) => { m ??= { id: uid(), at: new Date().toISOString(), date: today() }; m.plan = v; store.saveItem('mastery', m); }, { placeholder: '例如：把信件整理好' }),
        m?.plan ? [
          checkRow('我做到了', !!m.done, (on) => { m.done = on; store.saveItem('mastery', m); draw(); }),
          m.done ? [h('p', { class: 'field-label top', text: '難度如何？下一次會依此調整。' }),
            chips([{ value: 'hard', label: '太難了' }, { value: 'ok', label: '剛好' }, { value: 'easy', label: '太簡單' }], m.level || null,
              (v) => { m.level = v; store.saveItem('mastery', m); draw(); }, { single: true }),
            m.level === 'hard' ? h('p', { class: 'muted small', text: '下一次做較容易一些的事。' }) : m.level === 'easy' ? h('p', { class: 'muted small', text: '下一次嘗試難一點的事。' }) : null] : null,
        ] : null,
      ),
      recent.length ? card(h('h3', { text: '最近的自我掌控' }), recent.map((x) =>
        h('div', { class: 'logrow' }, h('span', { text: `${x.date.slice(5)}　${x.plan || ''}` }), h('small', { text: x.done ? '✓' : '未做' })))) : null,
      card(
        h('h3', { text: 'C　預先因應' }),
        h('p', { class: 'muted small', text: '描述可能促發問題行為的情境 → 決定因應的技巧 → 在心中生動地想像並演練 → 演練後練習放鬆。' }),
        h('button', { class: 'btn small', type: 'button', text: '＋ 新增預先因應', onclick: () => {
          store.saveItem('copeAhead', { id: uid(), at: new Date().toISOString(), situation: '', coping: '', newProblems: '', helped: null });
          draw();
        } }),
      ),
      copes.map((c) => card(
        textField('未來的問題情境：', c.situation, (v) => { c.situation = v; store.saveItem('copeAhead', c); }, { rows: 2 }),
        textField('想像我如何有效地因應（要具體）：', c.coping, (v) => { c.coping = v; store.saveItem('copeAhead', c); }, { rows: 2 }),
        textField('想像可能發生的新問題，以及因應方式：', c.newProblems, (v) => { c.newProblems = v; store.saveItem('copeAhead', c); }, { rows: 2 }),
        h('p', { class: 'field-label', text: '事情發生後：有幫助嗎？' }),
        yesNo(c.helped, (v) => { c.helped = v; store.saveItem('copeAhead', c); }, ['有', '沒有']),
        h('button', { class: 'btn small ghost', type: 'button', text: '刪除', onclick: () => { store.deleteItem('copeAhead', c.id); draw(); } }),
      )),
    );
  };
  draw();
  return { tab: 'today', title: '', node: root };
}

// ---------- 給「今天」用的 ABC 卡片 ----------
export function todayABC(rowLink) {
  const pos = todayItem('positives');
  const mas = todayItem('mastery');
  const ns = nextStep();
  return card(
    h('h3', { text: '今天的 ABC' }),
    rowLink('#/positive', '一件好事', pos?.text ? `${pos.done ? '✓ ' : ''}${pos.text}` : '選一件會帶來正向情緒的事'),
    rowLink('#/abc', '建立自我掌控', mas?.plan ? `${mas.done ? '✓ ' : ''}${mas.plan}` : '做一件困難但可能做到的事'),
    rowLink('#/values', '價值觀的下一步', ns ? ns.step.text : '從價值觀展開行動步驟'),
  );
}
