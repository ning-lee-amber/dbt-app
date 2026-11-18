// Crisis mode: dark, few choices, big buttons. Also the guided practices (muscle relaxation, sensory awareness).
import { h, onLeave, go } from './dom.js';
import { STOP_STEPS, TIP_PARTS, TIP_CAUTION, MUSCLES, SENSE_QUESTIONS, CRISIS_SKILLS } from './content.js';
import * as store from './store.js';
import { pickedGroups } from './pages.js';

// ---------- session: which skills were used in this crisis (prefills the crisis record) ----------
const SKEY = 'dbt-crisis-session';
function ensureSession() {
  // Coming from a normal (light) screen starts a new crisis session.
  if (!document.body.classList.contains('dark')) sessionStorage.setItem(SKEY, '[]');
}
const sessionSkills = () => { try { return JSON.parse(sessionStorage.getItem(SKEY) || '[]'); } catch { return []; } };
function markSkill(name) {
  const s = sessionSkills();
  if (!s.includes(name)) { s.push(name); sessionStorage.setItem(SKEY, JSON.stringify(s)); }
}
const [SK_STOP, SK_PC, SK_TIP, SK_ACCEPTS, SK_SOOTHE, SK_IMPROVE] = CRISIS_SKILLS;

// ---------- shell ----------
function shell(...children) {
  return h('div', { class: 'crisis' },
    h('div', { class: 'crisis-top' },
      h('a', { href: '#/crisis', class: 'crisis-label', text: '危機模式' }),
      h('a', { href: '#/crisis/end', class: 'crisis-end', text: '結束' })),
    ...children);
}
const view = (node) => ({ dark: true, title: '', node });
const big = (to, title, sub) => h('a', { class: 'big-btn', href: to }, title, h('small', { text: sub }));
const menuLink = () => h('a', { class: 'crisis-back', href: '#/crisis', text: '‹ 回到選單' });

// Countdown timer element.
function timer(seconds, { startLabel = '開始計時', doneText = '時間到。', onDone = null } = {}) {
  let left = seconds, id = null;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const face = h('div', { class: 'timer-face', text: fmt(left) });
  const msg = h('p', { class: 'timer-msg' });
  const btn = h('button', { class: 'pill', type: 'button', text: startLabel });
  const stop = () => { clearInterval(id); id = null; };
  btn.addEventListener('click', () => {
    if (id) { stop(); btn.textContent = '繼續'; return; }
    if (left <= 0) { left = seconds; face.textContent = fmt(left); msg.textContent = ''; }
    btn.textContent = '暫停';
    id = setInterval(() => {
      left -= 1;
      face.textContent = fmt(Math.max(left, 0));
      if (left <= 0) { stop(); msg.textContent = doneText; onDone?.(); btn.textContent = '再一次'; try { navigator.vibrate?.(300); } catch {} }
    }, 1000);
  });
  onLeave(stop);
  return h('div', { class: 'timer' }, face, btn, msg);
}

// ---------- 入口 ----------
export function entry() {
  ensureSession();
  return view(shell(
    h('p', { class: 'crisis-lead' }, '先吸一口氣。', h('br'), '你現在比較像哪一種？'),
    big('#/crisis/stop', '我快要做出衝動的事', '先停下來 → 看我的衝動卡'),
    big('#/crisis/tip', '情緒太強烈，撐不住', '先讓身體降溫 → 冷水、激烈運動、調節呼吸、肌肉放鬆'),
    big('#/crisis/distract', '只想先轉移注意力', '打開我的工具箱'),
    h('a', { class: 'big-btn quiet', href: '#/crisis/hold' }, '再撐五分鐘', h('small', { text: '「我只要再忍耐五分鐘。」' })),
  ));
}

// ---------- STOP ----------
export function stop() {
  ensureSession();
  markSkill(SK_STOP);
  let i = 0;
  const letter = h('div', { class: 'octagon' });
  const dots = h('div', { class: 'dots' }, STOP_STEPS.map((s) => h('b', { text: s.l })));
  const name = h('p', { class: 'step-name' });
  const en = h('p', { class: 'step-en' });
  const text = h('p', { class: 'step-text' });
  const next = h('button', { class: 'pill', type: 'button' });
  const after = h('div', { class: 'after hidden' },
    big('#/crisis/urge', '看我的衝動卡', '優缺點分析'),
    big('#/crisis/tip', '讓身體降溫', 'TIP'),
    big('#/crisis/distract', '轉移注意力', '我的工具箱'));

  const draw = () => {
    const s = STOP_STEPS[i];
    letter.textContent = s.l;
    letter.classList.toggle('go', i === 3);
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
    name.textContent = s.name;
    en.textContent = s.en;
    text.textContent = s.text;
    next.textContent = i < 3 ? '下一步' : '接下來';
    next.classList.toggle('hidden', false);
  };
  next.addEventListener('click', () => {
    if (i < 3) { i += 1; draw(); }
    else { next.classList.add('hidden'); after.classList.remove('hidden'); }
  });
  draw();
  return view(shell(menuLink(), h('div', { class: 'center' }, letter, dots, name, en, text, next), after));
}

// ---------- TIP ----------
export function tip() {
  ensureSession();
  markSkill(SK_TIP);
  const [T, I, P1, P2] = TIP_PARTS;
  const part = (p, ...extra) => h('section', { class: 'dcard' },
    h('div', { class: 'acro' }, h('span', { class: 'letter', text: p.l }),
      h('div', {}, h('b', { text: p.name }), h('small', { text: `${p.en}・${p.sub}` }))),
    h('ul', {}, p.items.map((t) => h('li', { text: t }))),
    ...extra);

  const minutes = h('div', { class: 'seg' });
  const exHolder = h('div', {});
  const setEx = (m) => {
    [...minutes.children].forEach((b) => b.classList.toggle('on', b.dataset.m === String(m)));
    exHolder.replaceChildren(timer(m * 60, { doneText: '時間到。注意身體現在的感覺。' }));
  };
  for (const m of [1, 3, 5]) minutes.append(h('button', { type: 'button', 'data-m': m, text: `${m} 分鐘`, onclick: () => setEx(m) }));
  setEx(1);

  return view(shell(menuLink(),
    h('p', { class: 'crisis-lead small' }, 'TIP 技巧：改變身體化學狀況', h('br'), h('span', { class: 'muted', text: '讓極端的情緒快速降低。' })),
    part(T, h('p', { class: 'dnote', text: TIP_CAUTION }), timer(30, { startLabel: '開始 30 秒', doneText: '30 秒到了。慢慢抬起頭，正常呼吸。' })),
    part(I, minutes, exHolder),
    part(P1),
    part(P2, h('a', { class: 'pill', href: '#/crisis/guide/muscle', text: '跟著引導放鬆' })),
  ));
}

// ---------- 衝動卡 ----------
const QUADS = [
  ['actPro', '順著危機衝動行事', '優點'],
  ['actCon', '順著危機衝動行事', '缺點'],
  ['resPro', '抗拒危機衝動', '優點'],
  ['resCon', '抗拒危機衝動', '缺點'],
];

export function urge(cardId) {
  ensureSession();
  markSkill(SK_PC);
  const cards = store.urgeCards();
  const c = cardId ? store.urgeCard(cardId) : cards.length === 1 ? cards[0] : null;

  if (!cards.length) {
    return view(shell(menuLink(),
      h('p', { class: 'crisis-lead' }, '你還沒有寫衝動卡。'),
      h('p', { class: 'dtext', text: '現在先讓身體降溫或轉移注意力。等平靜下來，再為這個衝動寫一張卡，下次就能直接打開。' }),
      big('#/crisis/tip', '讓身體降溫', 'TIP'),
      big('#/crisis/distract', '轉移注意力', '我的工具箱'),
      big('#/crisis/hold', '再撐五分鐘', '「我只要再忍耐五分鐘。」')));
  }
  if (!c) {
    return view(shell(menuLink(),
      h('p', { class: 'crisis-lead' }, '是哪一個衝動？'),
      cards.map((x) => big(`#/crisis/urge?card=${x.id}`, x.behavior || '（未命名）', '打開這張卡'))));
  }

  const term = (t) => (t === 'day' ? '當天' : t === 'long' ? '長期' : null);
  return view(shell(menuLink(),
    h('p', { class: 'crisis-lead' }, c.behavior || '我的衝動卡'),
    QUADS.map(([k, side, kind]) => (c[k]?.length ? h('section', { class: 'dcard' },
      h('h3', {}, side, h('span', { class: kind === '優點' ? 'pro' : 'con', text: `・${kind}` })),
      h('ul', {}, c[k].map((it) => h('li', {}, it.text, term(it.term) ? h('span', { class: 'tag', text: term(it.term) }) : null)))) : null)),
    c.skills?.length || c.skillNote ? h('section', { class: 'dcard' },
      h('h3', { text: '我可以用的技巧' }),
      h('ul', {}, (c.skills || []).map((s) => h('li', { text: s }))),
      c.skillNote ? h('p', { class: 'dtext', text: c.skillNote }) : null) : null,
    h('p', { class: 'ask' }, '你要的是愉快的一天，', h('br'), '還是愉快的人生？'),
    big('#/crisis/hold', '再撐五分鐘', '「我只要再忍耐五分鐘。」'),
    big('#/crisis/tip', '讓身體降溫', 'TIP'),
  ));
}

// ---------- 轉移注意力 / 自我撫慰 / 改善當下 ----------
const SKILL_BY_SOURCE = { 'dt-7': SK_ACCEPTS, 'dt-8': SK_SOOTHE, 'dt-9': SK_IMPROVE, 'dt-6c': SK_IMPROVE };

const DEFAULT_PICKS = [
  { hid: 'dt-7', name: '轉移注意力（ACCEPTS）', groups: [
    { title: '替換想法', items: ['從 1 數到 10；數圖畫中、海報中或窗戶外的顏色；數任何東西。'] },
    { title: '其他感覺', items: ['手握冰塊或含在嘴中。', '洗熱水或冷水澡。'] },
  ] },
  { hid: 'dt-8', name: '五感自我撫慰', groups: [{ title: '觸覺', items: ['用毛毯裹住身體。'] }] },
  { hid: 'dt-9', name: '改善當下（IMPROVE）', groups: [{ title: '自我鼓勵', items: ['「這件事也一樣會過去。」', '「我承受得住。」'] }] },
];

export function distract() {
  ensureSession();
  const mine = pickedGroups();
  const sources = mine.length ? mine : DEFAULT_PICKS;
  return view(shell(menuLink(),
    h('p', { class: 'crisis-lead' }, '選一件事，現在就去做。'),
    mine.length ? null : h('p', { class: 'dtext', text: '你還沒有挑選自己的工具箱，先試試這些。平靜下來後，可以到「我的」→「我的工具箱」挑選。' }),
    sources.map((s) => h('section', { class: 'dcard' },
      h('h3', { text: s.name }),
      s.groups.map((g) => [
        h('p', { class: 'group-title', text: g.title }),
        g.items.map((t) => {
          const b = h('button', { class: 'pick', type: 'button', text: t });
          b.addEventListener('click', () => { b.classList.toggle('on'); markSkill(SKILL_BY_SOURCE[s.hid]); });
          return b;
        }),
      ]))),
    h('p', { class: 'dnote center', text: '點一下表示「我在做這個」，結束時會幫你記下來。' }),
  ));
}

// ---------- 再撐五分鐘 ----------
export function hold() {
  ensureSession();
  let rounds = 0;
  const count = h('p', { class: 'dnote center' });
  const holder = h('div', {});
  const start = () => {
    holder.replaceChildren(timer(300, { startLabel: '開始', doneText: '你撐過了五分鐘。', onDone: () => { const s = store.obj('sober'); s.holds = (s.holds || 0) + 1; store.persist(); } }));
    holder.querySelector('button').click();
  };
  const again = h('button', { class: 'pill', type: 'button', text: '再撐五分鐘',
    onclick: () => { rounds += 1; count.textContent = `已經撐過 ${rounds} 個五分鐘。`; start(); } });
  start();
  return view(shell(menuLink(),
    h('p', { class: 'crisis-lead' }, '我只要再忍耐五分鐘。'),
    holder,
    h('div', { class: 'center' }, again),
    count,
    h('p', { class: 'dtext center', text: '「不會永遠如此，我現在可以忍受。」' }),
  ));
}

// ---------- 引導練習 ----------
function muscleSteps() {
  const steps = [{ text: '找個舒適的姿勢，解開過緊的衣物。躺著或坐下，身體部位不交疊。', sub: '準備開始', sec: 8 }];
  MUSCLES.forEach(([name, how], i) => {
    steps.push({ text: how, sub: `${i + 1} / 16　${name}：吸氣，繃緊`, sec: 6 });
    steps.push({ text: '吐氣，心裡慢慢說「放～鬆～」。', sub: `${i + 1} / 16　${name}：放鬆，觀察身體的變化`, sec: 12 });
  });
  steps.push({ text: '注意全身放鬆的感覺。做得很好。', sub: '結束', sec: 0 });
  return steps;
}
function senseSteps() {
  const steps = [{ text: '找個舒適的姿勢坐好。聽每一個問題，然後傾聽你的反應。', sub: '準備開始', sec: 8 }];
  SENSE_QUESTIONS.forEach((q, i) => steps.push({ text: q, sub: `${i + 1} / ${SENSE_QUESTIONS.length}`, sec: 8 }));
  steps.push({ text: '慢慢回到當下。', sub: '結束', sec: 0 });
  return steps;
}

// 了了分明講義 9a 第 8 項：三分鐘智慧心練習
function wise3Steps() {
  return [
    { text: '找個舒適的姿勢，挺直但放鬆。', sub: '準備開始', sec: 6 },
    { text: '問自己：「我現在經驗到什麼？有什麼想法？」', sub: '第一分鐘　覺察', sec: 20 },
    { text: '問自己：「我的感受和身體感覺是什麼？」', sub: '第一分鐘　覺察', sec: 20 },
    { text: '告訴自己：「沒關係，現在就是這麼一回事。」', sub: '第一分鐘　覺察', sec: 20 },
    { text: '把注意力集中在呼吸上。吸氣……吐氣……', sub: '第二分鐘　呼吸', sec: 30 },
    { text: '讓呼吸像船錨，分心了就輕輕回到呼吸。', sub: '第二分鐘　呼吸', sec: 30 },
    { text: '把覺察擴展到整個身體，連同姿勢和臉部表情。', sub: '第三分鐘　擴展', sec: 30 },
    { text: '帶著這份覺察，回到你原本在做的事。', sub: '第三分鐘　擴展', sec: 30 },
    { text: '做完了。可以記錄這次練習。', sub: '結束', sec: 0 },
  ];
}

// 了了分明講義 8：仁慈關愛
function lovingSteps() {
  const steps = [{ text: '坐、站或躺都可以。深呼吸幾次，攤開手掌。', sub: '準備開始', sec: 10 }];
  const circles = [['自己', '我'], ['一個你愛的人', '你'], ['一位朋友', '你'], ['一個讓你生氣的人', '你'], ['一個難相處的人', '你'], ['所有的眾生', '你們']];
  for (const [who, p] of circles) {
    steps.push({ text: `讓${who}進到你的心裡。`, sub: who, sec: 8 });
    for (const w of ['快樂', '平安', '健康', '安全']) steps.push({ text: `願${p}${w}。`, sub: who, sec: 6 });
  }
  steps.push({ text: '分心了也沒關係，溫和地把心帶回來。做完了。', sub: '結束', sec: 0 });
  return steps;
}

export function guide(name, inCrisis) {
  if (inCrisis) {
    ensureSession();
    markSkill(name === 'muscle' ? SK_TIP : SK_IMPROVE);
  }
  const G = {
    muscle: ['配對式肌肉放鬆', muscleSteps, '#/tools'],
    senses: ['感官覺察', senseSteps, '#/tools'],
    wise3: ['三分鐘智慧心練習', wise3Steps, '#/practice/new?skill=智慧心'],
    loving: ['仁慈關愛', lovingSteps, '#/practice/new?skill=仁慈關愛'],
  }[name];
  const steps = G[1]();
  const title = G[0];
  const doneLink = name === 'wise3' || name === 'loving' ? G[2] : null;
  let i = 0, id = null, left = 0;
  const sub = h('p', { class: 'guide-sub' });
  const text = h('p', { class: 'guide-text' });
  const bar = h('div', { class: 'guide-bar' }, h('i'));
  const play = h('button', { class: 'pill', type: 'button', text: '開始' });
  const prev = h('button', { class: 'pill ghost', type: 'button', text: '上一步' });
  const nextB = h('button', { class: 'pill ghost', type: 'button', text: '下一步' });

  const show = () => {
    const s = steps[i];
    sub.textContent = s.sub;
    text.textContent = s.text;
    bar.firstChild.style.width = `${Math.round((i / (steps.length - 1)) * 100)}%`;
    left = s.sec;
  };
  const pause = () => { clearInterval(id); id = null; play.textContent = '繼續'; };
  const tick = () => {
    left -= 1;
    if (left <= 0) {
      if (i >= steps.length - 1) { pause(); play.textContent = '重新開始'; return; }
      i += 1; show();
    }
  };
  play.addEventListener('click', () => {
    if (id) { pause(); return; }
    if (i >= steps.length - 1) { i = 0; show(); }
    id = setInterval(tick, 1000);
    play.textContent = '暫停';
  });
  prev.addEventListener('click', () => { if (i > 0) { i -= 1; show(); } });
  nextB.addEventListener('click', () => { if (i < steps.length - 1) { i += 1; show(); } });
  onLeave(() => clearInterval(id));
  show();

  const body = h('div', { class: 'guide' },
    h('p', { class: 'guide-title', text: title }), bar, sub, text,
    h('div', { class: 'guide-ctrl' }, prev, play, nextB),
    doneLink ? h('a', { class: 'pill ghost', href: doneLink, text: '記錄這次練習' }) : null);

  if (inCrisis) return view(shell(menuLink(), body));
  return {
    tab: 'tools', title: '', dark: true,
    node: h('div', { class: 'crisis' },
      h('div', { class: 'crisis-top' }, h('a', { href: '#/tools', class: 'crisis-label', text: '‹ 工具' }), h('span')),
      body),
  };
}

// ---------- 結束 ----------
export function end() {
  const used = sessionSkills();
  const write = () => {
    sessionStorage.setItem('dbt-crisis-skills', JSON.stringify(used));
    sessionStorage.removeItem(SKEY);
    go('#/records/new');
  };
  const leave = () => { sessionStorage.removeItem(SKEY); go('#/today'); };
  return view(h('div', { class: 'crisis' },
    h('p', { class: 'crisis-lead' }, '辛苦了。'),
    h('p', { class: 'dtext', text: '要記下這次的經過嗎？寫下發生了什麼、用了哪些技巧，之後就能看出哪些方法對你最有用。' }),
    used.length ? h('section', { class: 'dcard' }, h('h3', { text: '這次用過的技巧' }), h('ul', {}, used.map((s) => h('li', { text: s })))) : null,
    h('button', { class: 'big-btn', type: 'button', onclick: write }, '寫危機紀錄', h('small', { text: '痛苦耐受作業單 1' })),
    h('button', { class: 'big-btn quiet', type: 'button', onclick: leave }, '先不用', h('small', { text: '回到今天' })),
  ));
}
