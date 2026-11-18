// 第五階段：鏈鎖分析、遺漏環節分析、辯證式戒癮、趨勢圖表.
import { h, put, card, pageHead, back, chips, textField, inputField, yesNo, uid, fmtDate, toast, go, confirmBar } from './dom.js';
import { VULN_7A, LINK_TYPES, ADDICTIONS } from './content-gd.js';
import { emotionByKey } from './emotions.js';
import * as store from './store.js';

const delBtn = (coll, id, next) => h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄', onclick: (ev) => {
  ev.target.after(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => { store.deleteItem(coll, id); toast('已刪除'); go(next); }));
} });

// ---------- 鏈鎖分析（通用作業單 2） ----------

export function chainPage(id) {
  const existing = id !== 'new' ? store.item('chains', id) : null;
  if (id !== 'new' && !existing) return null;
  const c = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), behavior: '', trigger: '', triggerTime: '', vuln: [], vulnText: '', vulnSince: '',
    links: [{ type: null, text: '', skill: '', key: false }], consEnv: '', consSelf: '', harm: '', prevVuln: '', prevTrigger: '', repair: '',
  };
  const root = h('div', {});
  const draw = () => {
    const links = h('div', {}, c.links.map((l, i) => h('div', { class: `link${l.key ? ' key' : ''}` },
      h('div', { class: 'row' }, h('b', { text: `環節 ${i + 1}` }),
        h('div', { class: 'row gap' },
          h('button', { class: `chip${l.key ? ' on' : ''}`, type: 'button', text: '★ 關鍵', onclick: () => { l.key = !l.key; draw(); } }),
          h('button', { class: 'x', type: 'button', text: '×', onclick: () => { c.links.splice(i, 1); draw(); } }))),
      chips(LINK_TYPES, l.type, (v) => { l.type = v; }, { single: true }),
      h('textarea', { rows: 2, placeholder: '發生了什麼？（行動、身體感覺、想法、環境事件或感受）', value: l.text, oninput: (e) => { l.text = e.target.value; } }),
      h('textarea', { rows: 2, class: 'skill-in', placeholder: '6. 可以換成什麼有技巧的行為？', value: l.skill, oninput: (e) => { l.skill = e.target.value; } }))),
    h('button', { class: 'btn small ghost', type: 'button', text: '＋ 下一個環節', onclick: () => { c.links.push({ type: null, text: '', skill: '', key: false }); draw(); } }));

    put(root,
      back('#/records', '記錄'),
      pageHead(existing ? '鏈鎖分析' : '問題行為的鏈鎖分析', existing ? fmtDate(c.at) : '通用作業單 2'),
      card(textField('1. 我要分析的問題行為是什麼？（具體到演員能照著演出來）', c.behavior, (v) => { c.behavior = v; }, { rows: 2 }),
        h('p', { class: 'muted small', text: '如果是「沒做到的事」，而且是因為不知道或忘了，可以改用遺漏環節分析。' })),
      card(
        textField('2. 促發事件：在衝動或想法出現的前一刻，環境中發生了什麼？', c.trigger, (v) => { c.trigger = v; }, { rows: 2 }),
        inputField('什麼時候發生的？', c.triggerTime, (v) => { c.triggerTime = v; }, { placeholder: '例如：星期一晚上九點' }),
      ),
      card(
        h('h3', { text: '3. 脆弱性：自身和環境中，什麼讓我比較脆弱？' }),
        chips(VULN_7A, c.vuln, (v) => { c.vuln = v; }),
        textField('', c.vulnText, (v) => { c.vulnText = v; }, { rows: 2, placeholder: '描述' }),
        inputField('從什麼時候開始？', c.vulnSince, (v) => { c.vulnSince = v; }),
      ),
      card(
        h('h3', { text: '4. 事件鏈鎖（與 6. 技巧行為）' }),
        h('p', { class: 'muted small', text: '像寫劇本一樣，一環一環寫下去。每一環問自己：接下來發生了什麼？能不能拆得更細？最後把關鍵的環節標上 ★，並在下面寫出可以換成的技巧行為。' }),
        links,
      ),
      card(
        h('h3', { text: '5. 後果' }),
        textField('環境中的後果（別人當下和之後的反應）：', c.consEnv, (v) => { c.consEnv = v; }, { rows: 2 }),
        textField('自己的部分（當下和之後的感受、想法、行為）：', c.consSelf, (v) => { c.consSelf = v; }, { rows: 2 }),
        textField('造成了什麼傷害？', c.harm, (v) => { c.harm = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '7. 預防計畫' }),
        textField('我要如何降低脆弱性？', c.prevVuln, (v) => { c.prevVuln = v; }, { rows: 2 }),
        textField('我要如何預防促發事件再發生？', c.prevTrigger, (v) => { c.prevTrigger = v; }, { rows: 2 }),
      ),
      card(textField('8. 修復：對傷害的修復、矯正和過度矯正的計畫（修窗戶，不是送花）：', c.repair, (v) => { c.repair = v; }, { rows: 2 })),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => {
        c.links = c.links.filter((l) => l.text.trim() || l.skill.trim());
        store.saveItem('chains', c); toast('已儲存'); go('#/records');
      } }),
      existing ? delBtn('chains', c.id, '#/records') : null,
    );
  };
  draw();
  return { tab: 'records', title: '', node: root };
}

// ---------- 遺漏環節分析（通用作業單 3） ----------

const MISSING_Q = [
  ['q1', '你知道有效的行為是什麼嗎？', '是什麼阻礙了你去知道？', '描述問題解決（例如：去澄清、去請教）：'],
  ['q2', '你願意去做需要的有效行為嗎？', '是什麼阻礙了你的意願？', '描述問題解決（例如：全然接納、優缺點分析、相反行動）：'],
  ['q3', '你有想到要去做需要的有效行為嗎？', null, '描述問題解決（例如：寫進行事曆、設鬧鐘、放提醒物）：'],
  ['q4', '是什麼阻礙你立刻去做？', '描述阻礙：', '描述問題解決（例如：設立獎勵、相反行動、優缺點分析）：'],
];

export function missingPage(id) {
  const existing = id !== 'new' ? store.item('missing', id) : null;
  if (id !== 'new' && !existing) return null;
  const m = existing ? structuredClone(existing) : { id: uid(), at: new Date().toISOString(), task: '' };
  const root = h('div', {});
  const draw = () => {
    const blocks = [];
    for (const [k, q, block, solve] of MISSING_Q) {
      if (k === 'q4') {
        blocks.push(card(h('h3', { text: `4. ${q}` }),
          textField(block, m.block4, (v) => { m.block4 = v; }, { rows: 2 }),
          textField(solve, m.solve4, (v) => { m.solve4 = v; }, { rows: 2 })));
        break;
      }
      const n = k.slice(1);
      blocks.push(card(h('h3', { text: `${n}. ${q}` }),
        yesNo(m[k], (v) => { m[k] = v; draw(); }),
        m[k] === 'no' ? [
          block ? textField(block, m[`block${n}`], (v) => { m[`block${n}`] = v; }, { rows: 2 }) : null,
          textField(solve, m[`solve${n}`], (v) => { m[`solve${n}`] = v; }, { rows: 2 }),
          h('p', { class: 'muted small', text: '先處理這一關，分析到這裡就可以停了。' }),
        ] : null));
      if (m[k] !== 'yes') break;
    }
    put(root,
      back('#/records', '記錄'),
      pageHead('遺漏環節分析', existing ? fmtDate(m.at) : '通用作業單 3'),
      card(textField('我沒有做到的有效行為是什麼？', m.task, (v) => { m.task = v; }, { rows: 2 })),
      blocks,
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => { store.saveItem('missing', m); toast('已儲存'); go('#/records'); } }),
      existing ? delBtn('missing', m.id, '#/records') : null,
    );
  };
  draw();
  return { tab: 'records', title: '', node: root };
}

// ---------- 辯證式戒癮（痛苦耐受講義 16–21，作業單 14–18） ----------

const DAY = 864e5;
const daysBetween = (a, b) => Math.floor((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / DAY);

export function soberStats(s) {
  if (!s.start) return null;
  const today = store.dayKey();
  const relapses = [...(s.relapses || [])].map((r) => r.date).sort();
  const last = relapses.length ? relapses[relapses.length - 1] : null;
  const current = Math.max(0, daysBetween(last && last >= s.start ? last : s.start, today));
  // longest streak between start, relapses, today
  const marks = [s.start, ...relapses.filter((d) => d >= s.start), today];
  let longest = 0;
  for (let i = 1; i < marks.length; i++) longest = Math.max(longest, daysBetween(marks[i - 1], marks[i]));
  return { current, longest, relapses: relapses.length };
}

const EXTREME = [
  ['我還沒有完全戒掉，因此我注定會放棄！', '一次復發不代表我注定無法戒掉。'],
  ['我現在復發了，那就繼續這樣下去吧！', '雖然我復發了，但不代表我會持續在復發狀態裡，我可以即刻做些有效的事。'],
  ['我錯過一次晤談時間，我想我的治療就此結束了！', '我錯過了一次晤談時間，但我可以盡快地再與治療師約時間。'],
];

export function soberPage() {
  const s = store.obj('sober');
  s.behaviors ??= [];
  s.plan ??= {};
  s.relapses ??= [];
  s.extreme ??= EXTREME.map(([a, b]) => ({ a, b }));
  const save = () => store.persist();
  const root = h('div', {});
  const actions = h('div', {});
  const draw = () => {
    const st = soberStats(s);
    const p = s.plan;
    const f = (label, key, opts = {}) => textField(label, p[key], (v) => { p[key] = v; save(); }, { rows: 2, ...opts });
    put(root,
      back('#/tools', '工具'),
      pageHead('辯證式戒癮', '痛苦耐受講義 16–21・作業單 14'),
      card(
        h('h3', { text: '我想戒掉的' }),
        chips(ADDICTIONS, s.behaviors, (v) => { s.behaviors = v; save(); }),
        h('div', { class: 'two' },
          inputField('從哪一天開始', s.start, (v) => { s.start = v; save(); draw(); }, { type: 'date' }),
          inputField('承諾戒癮幾天', s.target, (v) => { s.target = v; save(); draw(); }, { type: 'number', min: 1, inputmode: 'numeric' })),
      ),
      st ? h('div', { class: 'sober-box' },
        h('p', { class: 'sober-label', text: '目前已經戒了' }),
        h('p', { class: 'sober-num' }, String(st.current), h('small', { text: ' 天' })),
        s.target ? h('p', { text: `承諾 ${s.target} 天${st.current >= Number(s.target) ? '・做到了！' : `・還有 ${Number(s.target) - st.current} 天`}` }) : null,
        h('p', { class: 'sober-sub', text: `最長 ${st.longest} 天・滑了 ${st.relapses} 次・撐過 ${s.holds || 0} 個五分鐘` }),
        h('p', { class: 'sober-sub', text: '你不是正在戒癮中，就是正在努力回到戒癮狀態。' }),
        h('div', { class: 'row gap' },
          h('a', { class: 'btn', href: '#/crisis/hold', text: '再撐五分鐘' }),
          h('button', { class: 'btn ghost', type: 'button', text: '我滑了一下', onclick: () => put(actions, confirmBar('記下今天滑了一下？天數會從今天重新累計，但最長紀錄會保留。', '記下', () => {
            s.relapses.push({ date: store.dayKey() });
            save();
            toast('勿讓一次失足變成一場災難');
            draw();
            root.querySelector('.harm')?.scrollIntoView({ behavior: 'smooth' });
          })) })),
      ) : card(h('p', { class: 'muted', text: '填上開始日期，就會開始累計戒癮天數。' })),
      actions,
      card(
        h('h3', { text: '戒癮計畫' }),
        f('為了提高達成戒癮這個目標的最大機會，我將停止：', 'stop'),
        f('計畫一些活動去替代問題行為（工作、興趣、支持性團體、志工等）：', 'activities'),
        f('花時間接觸能增強我不從事問題行為的人：', 'people'),
        f('提醒自己為何要堅持戒癮的理由：', 'reasons'),
        f('與代表誘惑的人們斬斷牽連（刪除電話、不再往來等）：', 'cut'),
        f('避開引發問題行為的線索：', 'cues'),
        f('對我最有用的技巧：', 'skills'),
        f('替代性叛逆：', 'rebel'),
      ),
      h('section', { class: 'card harm' },
        h('h3', { text: '減害計畫：滑了一下，也不要跌一大跤' }),
        h('div', { class: 'two' },
          inputField('治療師／支持者', p.helperName, (v) => { p.helperName = v; save(); }),
          inputField('電話', p.helperPhone, (v) => { p.helperPhone = v; save(); draw(); }, { type: 'tel' })),
        p.helperPhone ? h('a', { class: 'btn block', href: `tel:${p.helperPhone.replace(/[^\d+]/g, '')}`, text: `打給 ${p.helperName || '支持者'}` }) : null,
        f('能有效幫助我的親友（和聯絡方式）：', 'friends'),
        f('擺脫誘惑，讓自己被有效行為的線索包圍：', 'surround'),
        f('鼓勵自己的話（「一次失足不會造成大災難」、「不要放棄」、「我還是能爬回到戒癮狀態」）：', 'encourage'),
        h('p', { class: 'field-label top', text: '遠離極端想法，尋找中庸之道：' }),
        s.extreme.map((x, i) => h('div', { class: 'pcbox' },
          h('input', { type: 'text', value: x.a, placeholder: '極端想法', oninput: (e) => { s.extreme[i].a = e.target.value; save(); } }),
          h('p', { class: 'opp-arrow', text: '↓' }),
          h('input', { type: 'text', value: x.b, placeholder: '中庸之道', oninput: (e) => { s.extreme[i].b = e.target.value; save(); } }))),
        h('button', { class: 'btn small ghost', type: 'button', text: '＋ 再加一組', onclick: () => { s.extreme.push({ a: '', b: '' }); save(); draw(); } }),
        h('p', { class: 'muted small top', text: '也可以：做一次鏈鎖分析找出復發原因、用問題解決回到戒癮並修復傷害、再做一次優缺點分析，然後重新承諾要百分之百戒掉。' }),
        h('div', { class: 'row gap' },
          h('a', { class: 'btn small ghost', href: '#/chain/new', text: '鏈鎖分析' }),
          h('a', { class: 'btn small ghost', href: '#/urge', text: '衝動卡' })),
      ),
      s.relapses.length ? card(h('h3', { text: '紀錄' }), [...s.relapses].reverse().map((r) => h('div', { class: 'logrow' }, h('span', { text: r.date }), h('small', { text: '滑了一下，重新開始' })))) : null,
      h('p', { class: 'muted small center', text: '填寫後會自動儲存。' }),
    );
  };
  draw();
  return { tab: 'tools', title: '', node: root };
}

// ---------- 趨勢圖表 ----------

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  kids.flat().forEach((k) => k && el.append(k));
  return el;
};

function daysBack(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) { const x = new Date(d); x.setDate(d.getDate() - i); out.push(store.dayKey(x)); }
  return out;
}

// Single-series chart: line (with dots) or bars. values: [{ day, v, label }]
function chart(days, values, { max = 100, bars = false, unit = '' } = {}) {
  const W = 320, H = 150, L = 28, R = 8, T = 10, B = 22;
  const x = (i) => L + (days.length === 1 ? 0 : (i * (W - L - R)) / (days.length - 1));
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const grid = [0, max / 2, max].map((g) => [
    svg('line', { x1: L, x2: W - R, y1: y(g), y2: y(g), class: 'c-grid' }),
    svg('text', { x: L - 4, y: y(g) + 4, class: 'c-axis', 'text-anchor': 'end' }, document.createTextNode(String(Math.round(g)))),
  ]);
  const labels = [0, Math.floor((days.length - 1) / 2), days.length - 1].map((i) =>
    svg('text', { x: x(i), y: H - 6, class: 'c-axis', 'text-anchor': i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle' }, document.createTextNode(days[i].slice(5).replace('-', '/'))));
  const idx = (d) => days.indexOf(d);
  const pts = values.filter((p) => idx(p.day) >= 0 && p.v != null).map((p) => ({ ...p, i: idx(p.day) }));
  let marks = [];
  if (bars) {
    const bw = Math.max(3, (W - L - R) / days.length - 3);
    marks = pts.map((p) => svg('rect', { x: x(p.i) - bw / 2, y: y(p.v), width: bw, height: Math.max(1, y(0) - y(p.v)), rx: 2, class: 'c-bar' },
      svg('title', {}, document.createTextNode(`${p.day.slice(5)}　${p.label ?? p.v}${unit}`))));
  } else {
    const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    marks = [
      pts.length > 1 ? svg('path', { d: path, class: 'c-line' }) : null,
      ...pts.map((p) => svg('circle', { cx: x(p.i), cy: y(p.v), r: 4, class: 'c-dot' },
        svg('title', {}, document.createTextNode(`${p.day.slice(5)}　${p.label ?? p.v}${unit}`)))),
    ];
  }
  return svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' }, grid, labels, marks);
}

const avg = (a) => (a.length ? Math.round(a.reduce((s, v) => s + v, 0) / a.length) : null);
const tile = (label, value, sub) => h('div', { class: 'tile' }, h('small', { text: label }), h('b', { text: value ?? '—' }), sub ? h('span', { text: sub }) : null);

let range = 14;
export function chartsPage() {
  const root = h('div', {});
  const draw = () => {
    const days = daysBack(range);
    const first = days[0];
    const inRange = (iso) => store.dayKey(new Date(iso)) >= first;
    const mood = days.map((d) => { const c = store.checkin(d); return { day: d, v: c.moodPM ?? c.moodAM ?? null }; });
    const sleep = days.map((d) => {
      const c = store.checkin(d);
      if (!c.bed || !c.wake) return { day: d, v: null };
      const [bh, bm] = c.bed.split(':').map(Number); const [wh, wm] = c.wake.split(':').map(Number);
      let m = wh * 60 + wm - (bh * 60 + bm); if (m <= 0) m += 1440;
      return { day: d, v: Math.round((m / 60) * 10) / 10 };
    });
    const emo = store.items('emotionLogs').filter((l) => inRange(l.at) && l.intensity != null)
      .map((l) => ({ day: store.dayKey(new Date(l.at)), v: l.intensity, label: `${emotionByKey(l.emotion)?.name || '情緒'} ${l.intensity}` }));
    const changes = store.items('changes').filter((c) => inRange(c.at) && c.pre != null && c.post != null);
    const crises = store.crisisLogs().filter((c) => inRange(c.at) && c.pre != null && c.post != null);
    const drop = (list) => avg(list.map((c) => c.pre - c.post));
    const count = (coll) => store.items(coll).filter((x) => inRange(x.at)).length;
    const hasMood = mood.some((p) => p.v != null);
    const hasSleep = sleep.some((p) => p.v != null);

    put(root,
      back('#/me', '我的'),
      pageHead('趨勢', `最近 ${range} 天`),
      chips([{ value: 7, label: '7 天' }, { value: 14, label: '14 天' }, { value: 30, label: '30 天' }], range, (v) => { range = v || 14; draw(); }, { single: true }),
      h('div', { class: 'tiles' },
        tile('改變情緒後平均下降', drop(changes) != null ? `${drop(changes)}` : null, `${changes.length} 次`),
        tile('危機技巧後痛苦下降', drop(crises) != null ? `${drop(crises)}` : null, `${crises.length} 次`),
        tile('了了分明練習', String(count('practices')), '次'),
        tile('情緒紀錄', String(count('emotionLogs')), '筆'),
      ),
      card(h('h3', { text: '每日心情（晚上，沒填就用早上）' }),
        hasMood ? chart(days, mood) : h('p', { class: 'muted', text: '還沒有心情打卡。' })),
      card(h('h3', { text: '睡眠時數' }),
        hasSleep ? chart(days, sleep, { max: 12, bars: true, unit: ' 小時' }) : h('p', { class: 'muted', text: '在每日打卡填上床和起床時間，就會出現在這裡。' }),
        hasSleep ? h('p', { class: 'muted small', text: `平均 ${avg(sleep.filter((p) => p.v != null).map((p) => p.v * 10)) / 10} 小時（建議 7～9 小時）` }) : null),
      card(h('h3', { text: '情緒紀錄的強度' }),
        emo.length ? chart(days, emo) : h('p', { class: 'muted', text: '還沒有情緒紀錄。' })),
      changes.length ? card(h('h3', { text: '改變情緒：練習前 → 練習後' }), changes.slice(0, 10).map((c) =>
        h('div', { class: 'logrow' }, h('span', { text: `${fmtDate(c.at).split('）')[0]}）${emotionByKey(c.emotion)?.name || ''}` }), h('small', { text: `${c.pre} → ${c.post}` })))) : null,
      h('p', { class: 'muted small center', text: '點圖上的點可以看數值。' }),
    );
  };
  draw();
  return { tab: 'me', title: '', node: root };
}
