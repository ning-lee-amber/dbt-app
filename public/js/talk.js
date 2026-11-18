// 準備一場對話（人際效能作業單 3、4、5、6、7）：目標 → 強度（存錢遊戲） → 腳本 → 小抄 → 回顧.
import { h, put, card, pageHead, back, chips, textField, yesNo, uid, toast, go, confirmBar } from './dom.js';
import { STRENGTH, MONEY_GAME } from './content-ie.js';
import * as store from './store.js';

const SITUATIONS = [
  { value: 'rights', label: '我的權利或期望不被尊重' },
  { value: 'ask', label: '要別人去做、改變某事或給我什麼' },
  { value: 'refuse', label: '我想要或需要拒絕，或抵抗壓力' },
  { value: 'heard', label: '要別人認真看待我的立場或觀點' },
  { value: 'conflict', label: '和其他人產生衝突' },
  { value: 'improve', label: '想要改善與某人的關係' },
  { value: 'end', label: '結束一段關係' },
];
const PRIORITIES = [['goal', '目標'], ['rel', '關係'], ['self', '自我尊重']];

// Words that often work against DEAR MAN / GIVE / FAST.
const WATCH = [
  [/你(應該|不應該|應當)/, '「你應該」→ 試著改成「我想要」、「我不想要」（E 清楚表達、G 不評斷）。'],
  [/你(總是|每次|從來|從不|老是)/, '「總是／每次／從不」比較像評斷，描述這一次的事實就好（D 描述情境）。'],
  [/你顯然|你根本|你就是/, '不要歸咎動機，只描述看到的行為（講義 5a）。'],
  [/對不起|抱歉|不好意思/, '這裡需要道歉嗎？不過度道歉（FAST 的 A）。'],
  [/我不確定|我不知道.*可不可以|可能.*吧/, '表現自信：不要說「我不確定……」（MAN 的 A）。'],
  [/不然|否則.*就/, '注意不要變成威脅（GIVE 的 G）。描述後果時平靜而不誇大。'],
];
const warnings = (text) => WATCH.filter(([re]) => re.test(text || '')).map(([, m]) => m);

const SCRIPT = [
  ['d', 'D　描述情境', '只講事實，告訴對方究竟是什麼引起你的反應。', '例如：「你說會在晚餐時間回來，但你到晚上十一點才回來。」'],
  ['e', 'E　清楚表達感受和意見', '用「我想要」取代「你應該」。', '例如：「你這麼晚回家，我很擔心你。」'],
  ['a', 'A　勇敢要求（或說不）', '清楚說出你要的或拒絕的。別人不會讀心術。', '例如：「如果你會比較晚回家，我希望你可以打電話跟我說一聲。」'],
  ['r', 'R　增強對方', '事先說明對方照做會有什麼好處；必要時說明不做的後果。', '例如：「如果你這麼做，我會覺得很放心。」'],
  ['n', 'N　協商妥協', '準備好退讓或替代方案；或把問題丟回給對方。', '例如：「如果打電話不方便，傳簡訊給我好嗎？」「你覺得我們應該怎麼辦？」'],
  ['v', 'V　認可對方（GIVE）', '說出你理解對方的地方。', '例如：「我知道你工作很忙，而且……」'],
  ['ez', 'E　態度輕鬆（GIVE）', '一句讓氣氛輕鬆一點的話。', '例如：「我知道我有點愛操心啦。」'],
];

const REVIEW = {
  'DEAR MAN': ['描述情境', '清楚表達感受／意見', '勇敢要求', '增強對方', '留心覺察', '「唱片跳針」', '忽視攻擊', '表現自信', '協商妥協'],
  GIVE: ['溫和有禮', '不威脅', '不攻擊', '不評斷', '用心傾聽', '認可他人（傳達理解）', '態度輕鬆'],
  FAST: ['是否公平', '不過度道歉', '堅守價值觀', '誠實至上'],
};

const STEPS = ['目標', '強度', '腳本', '小抄', '回顧'];

export function talkPage(id, type) {
  const existing = id ? store.item('talks', id) : null;
  if (id && !existing) return null;
  const t = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), type: type || null, who: '', event: '',
    goal: '', rel: '', self: '', pri: {}, conflict: '',
    mode: type === 'end' ? 'ask' : null, answers: {}, adjust: 0,
    script: {}, avoid: '', review: [], result: '',
  };
  let step = existing ? 3 : 0;
  const root = h('div', {});
  const persist = () => store.saveItem('talks', t);

  const total = () => {
    const qs = MONEY_GAME[t.mode] || [];
    const base = qs.reduce((s, q, i) => s + (t.answers[i] === q[2] ? 10 : 0), 0);
    return Math.max(0, Math.min(100, base + (t.adjust || 0)));
  };
  const strengthText = () => {
    const n = total();
    if (!t.mode) return '';
    if (n === 0) return t.mode === 'ask' ? '0 元：這次可能不提出要求。' : '0 元：這次可能照著對方的要求去做。';
    return `${n} 元：${STRENGTH[n / 10 - 1][t.mode === 'ask' ? 0 : 1]}`;
  };

  const draw = () => {
    put(root,
      back('#/records', '記錄'),
      pageHead('準備一場對話', t.who ? `和 ${t.who}` : '人際效能作業單 3–7'),
      h('div', { class: 'stepper' }, STEPS.map((n, i) => h('span', {
        class: i === step ? 'on' : i < step ? 'done' : '', text: n,
        onclick: () => { if (existing || i <= step) { step = i; persist(); draw(); } },
      }))),
      [stepGoals, stepStrength, stepScript, stepCard, stepReview][step](),
      h('div', { class: 'wiz-nav' },
        step > 0 ? h('button', { class: 'btn ghost', type: 'button', text: '上一步', onclick: () => { step -= 1; persist(); draw(); window.scrollTo(0, 0); } }) : h('span'),
        step < 4 ? h('button', { class: 'btn', type: 'button', text: step === 2 ? '產生小抄' : '下一步', onclick: () => { step += 1; persist(); draw(); window.scrollTo(0, 0); } })
          : h('button', { class: 'btn', type: 'button', text: '完成', onclick: () => { persist(); toast('已儲存'); go('#/records'); } })),
    );
  };

  // 1. 澄清目標（作業單 3）
  function stepGoals() {
    const priRow = (key, label) => h('div', { class: 'pri' }, h('span', { text: label }),
      h('div', { class: 'rating' }, [1, 2, 3].map((n) => h('button', {
        type: 'button', class: t.pri[key] === n ? 'on' : '', text: String(n),
        onclick: () => { for (const k of Object.keys(t.pri)) if (t.pri[k] === n) delete t.pri[k]; t.pri[key] = n; draw(); },
      }))));
    return [
      card(
        h('h3', { text: '這是什麼情境？' }),
        chips(SITUATIONS, t.type, (v) => { t.type = v; if (!t.mode) t.mode = v === 'refuse' ? 'refuse' : 'ask'; draw(); }, { single: true }),
        t.type === 'end' ? h('div', { class: 'outcome' }, h('b', { text: '結束關係（人際效能講義 13）' }),
          h('p', { text: '用智慧心做決定，不陷入情緒心。如果關係重要、不是破壞性的、還有改善的希望，先嘗試問題解決。要離開高度虐待或生命被威脅的關係時，請撥 113 求助，並找專業人員協助。' })) : null,
        h('label', { class: 'field' }, h('span', { text: '對象' }), h('input', { type: 'text', value: t.who, placeholder: '例如：媽媽、主管、室友', oninput: (e) => { t.who = e.target.value; } })),
        textField('問題的促發事件：誰對誰做了什麼？哪些部分對我造成困擾？（記住，要核對事實！）', t.event, (v) => { t.event = v; }),
      ),
      card(
        h('h3', { text: '在此情境下我想要與期待的' }),
        textField('目標：我想要達成什麼特定結果？想要別人做什麼？停止或接受什麼？', t.goal, (v) => { t.goal = v; }, { rows: 2 }),
        textField('關係：在這次互動之後，因為我處理互動的方式，我想要別人對我有什麼感受、認為我如何（不論是否得到我想要的）？', t.rel, (v) => { t.rel = v; }, { rows: 2 }),
        textField('自我尊重：在這次互動之後，因為我處理互動的方式，我想要怎麼感受或看待自己（不論是否得到我想要的）？', t.self, (v) => { t.self = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '評定優先順序：1 最重要，3 最不重要' }),
        PRIORITIES.map(([k, l]) => priRow(k, l)),
        textField('我設定的優先順序有什麼不平衡或衝突，以至於在這個情境下很難有效？', t.conflict, (v) => { t.conflict = v; }, { rows: 2 }),
      ),
    ];
  }

  // 2. 存錢遊戲（作業單 6）
  function stepStrength() {
    const qs = MONEY_GAME[t.mode] || [];
    const sum = h('div', { class: 'money' });
    const drawSum = () => put(sum, h('b', { class: 'big', text: `${total()} 元` }), h('p', { text: strengthText() }));
    drawSum();
    return [
      card(
        h('h3', { text: '我要……' }),
        chips([{ value: 'ask', label: '提出要求' }, { value: 'refuse', label: '拒絕對方' }], t.mode, (v) => { t.mode = v; t.answers = {}; t.adjust = 0; draw(); }, { single: true }),
        h('p', { class: 'muted small', text: t.mode === 'refuse' ? '每當一個問題得到「否」的答案時，就把 10 元放入銀行。存得愈多，就愈堅定地拒絕。' : '每當一個問題得到「是」的答案時，就把 10 元放入銀行。存得愈多，就愈堅定地去要求。' }),
      ),
      t.mode ? card(qs.map(([name, q], i) => h('div', { class: 'mq' },
        h('p', {}, h('b', { text: `${name}　` }), q),
        yesNo(t.answers[i], (v) => { t.answers[i] = v; drawSum(); })))) : null,
      t.mode ? card(
        h('h3', { text: '銀行裡的錢' }), sum,
        h('p', { class: 'muted small', text: '先用智慧心核對一下，需要的話調整：' }),
        h('div', { class: 'row gap' },
          h('button', { class: 'btn small ghost', type: 'button', text: '－10', onclick: () => { t.adjust = (t.adjust || 0) - 10; drawSum(); } }),
          h('button', { class: 'btn small ghost', type: 'button', text: '＋10', onclick: () => { t.adjust = (t.adjust || 0) + 10; drawSum(); } })),
      ) : null,
    ];
  }

  // 3. 腳本（作業單 4）
  function stepScript() {
    return [
      card(h('p', { class: 'muted', text: '先寫下你的「台詞」，之後可以大聲練習，或在心裡演練（預先因應）。' })),
      SCRIPT.map(([k, title, hint, ex]) => {
        const warn = h('div', {});
        const showWarn = () => put(warn, warnings(t.script[k]).map((m) => h('p', { class: 'warn small', text: `⚠ ${m}` })));
        showWarn();
        const ta = h('textarea', { rows: 2, placeholder: ex, value: t.script[k] || '', oninput: (e) => { t.script[k] = e.target.value; showWarn(); } });
        return card(h('h3', { text: title }), h('p', { class: 'muted small', text: hint }), ta, warn);
      }),
      card(
        h('h3', { text: 'M　留心覺察' }),
        textField('哪一句要用「唱片跳針」一再重複？', t.script.repeat, (v) => { t.script.repeat = v; }, { rows: 2, placeholder: '通常是 A 那一句' }),
      ),
      card(textField('我想避免做的事和說的話：', t.avoid, (v) => { t.avoid = v; }, { rows: 2, placeholder: '例如：翻舊帳、大聲吼、說「你每次都這樣」' })),
    ];
  }

  // 4. 小抄
  function stepCard() {
    const s = t.script;
    const line = (label, text) => (text ? h('div', { class: 'cue' }, h('small', { text: label }), h('p', { text })) : null);
    return [
      h('div', { class: 'cheat' },
        t.who ? h('p', { class: 'cheat-who', text: `對象：${t.who}` }) : null,
        t.mode ? h('p', { class: 'cheat-strength', text: `強度　${strengthText()}` }) : null,
        line('D 描述', s.d), line('E 表達', s.e), line('A 要求', s.a), line('R 增強', s.r),
        line('V 認可', s.v), line('E 輕鬆', s.ez), line('N 備案', s.n),
        s.repeat ? line('唱片跳針', s.repeat) : null,
      ),
      card(
        h('h3', { text: '說的時候記得' }),
        h('ul', {}, [
          '保持留心覺察：不離題；對方攻擊或轉移話題時，忽視它，繼續表達。',
          '表現自信：抬頭、眼神接觸、語調穩定，不說「我不確定……」。',
          '溫和有禮：不攻擊、不威脅、不評斷、不輕蔑。',
          '用心傾聽，認可對方；態度輕鬆、微笑。',
          '公平待人及律己；不過度道歉；堅守價值觀；誠實。',
        ].map((x) => h('li', { text: x }))),
        t.avoid ? [h('p', { class: 'field-label top', text: '我想避免的：' }), h('p', { text: t.avoid })] : null,
      ),
      card(
        h('h3', { text: '我的目標' }),
        PRIORITIES.filter(([k]) => t.pri[k]).sort((a, b) => t.pri[a[0]] - t.pri[b[0]]).map(([k, l]) => h('p', {}, h('b', { text: `${t.pri[k]}. ${l}：` }), t[k] || '')),
      ),
    ];
  }

  // 5. 回顧（作業單 5、7）
  function stepReview() {
    return [
      card(
        h('h3', { text: '在此情境下，我說了或做了什麼？（勾選）' }),
        Object.entries(REVIEW).map(([g, items]) => [h('p', { class: 'group-title', text: g }), chips(items, t.review, (v) => { t.review = v; })]),
      ),
      card(
        textField('這次互動的效果如何？', t.result, (v) => { t.result = v; }),
        h('p', { class: 'muted small', text: '沒有得到想要的結果？做一次疑難排解，看看卡在哪裡。' }),
        h('a', { class: 'btn ghost block', href: '#/handouts/ie-9', text: '人際效能技巧的疑難排解' }),
      ),
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄', onclick: (ev) => {
        ev.target.after(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => { store.deleteItem('talks', t.id); toast('已刪除'); go('#/records'); }));
      } }) : null,
    ];
  }

  draw();
  return { tab: 'records', title: '', node: root };
}
