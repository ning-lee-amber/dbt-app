// 情緒調節：情緒紀錄（作業單 2、4a）、每日打卡（作業單 14）、改變情緒流程（作業單 1、5、6、7、8）.
import { h, put, saveButton, card, pageHead, back, chips, textField, inputField, yesNo, slider, uid, fmtDate, toast, go, confirmBar } from './dom.js';
import { EMOTIONS, OTHER_WORDS, emotionByKey, SHAME_GUILT } from './emotions.js';
import * as store from './store.js';

const VULN = ['身體疾病。', '睡眠不足。', '受傷。', '使用藥物或酒精。', '生活中的壓力事件。', '強烈的情緒（悲傷、憤怒、恐懼、孤單）。', '先前的問題行為。'];
export const emotionName = (k, word) => (k === 'other' ? word || '其他情緒' : emotionByKey(k)?.name || '');

function sleepHours(c) {
  if (!c.bed || !c.wake) return null;
  const [bh, bm] = c.bed.split(':').map(Number);
  const [wh, wm] = c.wake.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

function checkinSummary(key) {
  const c = store.checkin(key);
  const parts = [];
  const hrs = sleepHours(c);
  if (hrs != null) parts.push(`睡 ${hrs} 小時`);
  if (c.exMin) parts.push(`運動 ${c.exMin} 分鐘`);
  if (c.sub) parts.push(`物質：${c.sub}`);
  return parts.join('・');
}

// ---------- 情緒紀錄 ----------

export function emotionForm(id, full) {
  const existing = id ? store.item('emotionLogs', id) : null;
  if (id && !existing) return null;
  const log = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), emotion: null, word: '', intensity: null, event: '', full: !!full,
    vuln: [], vulnText: '', interp: [], interpText: '', body: [], bodyText: '', urge: '', face: '', said: '', did: [], didText: '',
    after: [], afterText: '', fnAct: '', fnOthers: '', fnSelf: '',
  };
  const root = h('div', {});
  const actions = h('div', {});

  const save = (next) => {
    if (!log.emotion) { toast('先選一個情緒'); return; }
    store.saveItem('emotionLogs', log);
    toast('已儲存');
    go(next || '#/records');
  };

  const draw = () => {
    const e = emotionByKey(log.emotion);
    const today = checkinSummary(store.dayKey(new Date(log.at)));
    put(root, 
      back('#/records', '記錄'),
      pageHead(existing ? '情緒紀錄' : '記錄情緒', existing ? fmtDate(log.at) : '情緒調節作業單 4a'),
      card(
        h('h3', { text: '這是什麼情緒？' }),
        chips([...EMOTIONS.map((x) => ({ value: x.key, label: x.name })), { value: 'other', label: '其他' }], log.emotion,
          (v) => { log.emotion = v; log.word = ''; draw(); }, { single: true }),
        log.emotion ? [
          h('p', { class: 'field-label top', text: '更貼切的詞（可不選）' }),
          chips(log.emotion === 'other' ? OTHER_WORDS : e.words, log.word || null, (v) => { log.word = v || ''; }, { single: true }),
        ] : null,
        slider('強度（0–100）', log.intensity, (v) => { log.intensity = v; }),
        textField('情緒的促發事件（人、事、時、地）：是什麼促發了這個情緒？', log.event, (v) => { log.event = v; }),
      ),
      log.full ? fullSections(log, e, today) : h('button', { class: 'btn ghost block', type: 'button', text: '填寫完整版（觀察與描述情緒）',
        onclick: () => { log.full = true; draw(); } }),
      h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => save() }),
      h('button', { class: 'btn ghost block', type: 'button', text: '儲存，並開始改變這個情緒', onclick: () => save(`#/change/new?log=${log.id}`) }),
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄',
        onclick: () => actions.replaceChildren(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => {
          store.deleteItem('emotionLogs', log.id); toast('已刪除'); go('#/records');
        })) }) : null,
      actions,
    );
  };

  function fullSections(log, e, today) {
    const pick = (opts, arr, key) => (opts?.length ? chips(opts, arr, (v) => { log[key] = v; }) : null);
    return [
      card(
        h('h3', { text: '脆弱因子：在這之前，發生了什麼事使我對促發事件的反應變得脆弱？' }),
        today ? h('p', { class: 'muted small', text: `今天的打卡：${today}` }) : null,
        pick(VULN, log.vuln, 'vuln'),
        textField('', log.vulnText, (v) => { log.vulnText = v; }, { rows: 2, placeholder: '其他' }),
      ),
      card(
        h('h3', { text: '對此情境的詮釋（信念、假設、評價）' }),
        pick(e?.interp, log.interp, 'interp'),
        textField('', log.interpText, (v) => { log.interpText = v; }, { rows: 2, placeholder: '我當時怎麼想？' }),
      ),
      card(
        h('h3', { text: '臉部和身體改變與經驗：我的臉部和身體有何感受？' }),
        pick(e?.body, log.body, 'body'),
        textField('', log.bodyText, (v) => { log.bodyText = v; }, { rows: 2, placeholder: '其他' }),
        textField('行動衝動：我想做什麼？想說什麼？', log.urge, (v) => { log.urge = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '表達' }),
        textField('臉部和肢體語言：我的臉部表情、姿勢、手勢如何？', log.face, (v) => { log.face = v; }, { rows: 2 }),
        textField('在此情境下我說了什麼（要具體明確）：', log.said, (v) => { log.said = v; }, { rows: 2 }),
        h('p', { class: 'field-label', text: '在此情境下我做了什麼（要具體明確）：' }),
        pick(e?.acts, log.did, 'did'),
        textField('', log.didText, (v) => { log.didText = v; }, { rows: 2, placeholder: '其他' }),
      ),
      card(
        h('h3', { text: '後續影響：這個情緒帶給我什麼影響（心的狀態、其他情緒、行為、想法、記憶、身體狀態等）？' }),
        pick(e?.after, log.after, 'after'),
        textField('', log.afterText, (v) => { log.afterText = v; }, { rows: 2, placeholder: '其他' }),
      ),
      card(
        h('h3', { text: '情緒可以為我做什麼（作業單 2）' }),
        textField('行為動機：情緒引發或預備讓我去做什麼行動？它的功能或目標是什麼？', log.fnAct, (v) => { log.fnAct = v; }, { rows: 2 }),
        textField('與他人溝通：我的情緒傳達出什麼訊息給他人？如何影響他人？', log.fnOthers, (v) => { log.fnOthers = v; }, { rows: 2 }),
        textField('與自己溝通：我的情緒對我說了什麼？要核對哪些事實？', log.fnSelf, (v) => { log.fnSelf = v; }, { rows: 2 }),
      ),
    ];
  }

  draw();
  return { tab: 'records', title: '', node: root };
}

// ---------- 每日打卡 ----------

export function checkinPage(dateKey) {
  const key = dateKey || store.dayKey();
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const shift = (n) => { const x = new Date(d); x.setDate(x.getDate() + n); return store.dayKey(x); };
  const c = store.checkin(key);
  const set = (f) => (v) => store.setCheckin(key, f, v);
  const hours = h('p', { class: 'muted small' });
  const showHours = () => {
    const hrs = sleepHours(store.checkin(key));
    hours.textContent = hrs == null ? '填上床和起床時間，會自動算出睡了幾小時。' : `睡了 ${hrs} 小時${hrs >= 7 && hrs <= 9 ? '' : '（建議 7～9 小時）'}`;
  };
  showHours();
  const isToday = key === store.dayKey();
  const label = `${d.getMonth() + 1} 月 ${d.getDate()} 日 星期${'日一二三四五六'[d.getDay()]}`;

  return {
    tab: 'tools', title: '',
    node: h('div', {},
      back('#/tools', '工具'),
      h('div', { class: 'daynav' },
        h('a', { href: `#/checkin/${shift(-1)}`, text: '‹ 前一天' }),
        h('span', { text: isToday ? '今天' : label }),
        isToday ? h('span') : h('a', { href: `#/checkin/${shift(1)}`, text: '後一天 ›' })),
      pageHead('每日打卡', '情緒調節作業單 14：練習 PLEASE 技巧'),
      card(
        h('h3', { text: '心情' }),
        slider('早上（0 很糟－100 很好）', c.moodAM, set('moodAM')),
        slider('晚上（0 很糟－100 很好）', c.moodPM, set('moodPM')),
      ),
      card(
        h('h3', { text: 'PL　治療身體疾病' }),
        textField('描述治療身體疾病（看醫生、照處方服藥）：', c.pl, set('pl'), { rows: 2 }),
      ),
      card(h('h3', { text: 'E　均衡飲食' }), textField('描述對均衡飲食所做的努力：', c.eat, set('eat'), { rows: 2 })),
      card(h('h3', { text: 'A　避免改變情緒的物質' }), inputField('列出所使用會改變情緒的物質：', c.sub, set('sub'), { placeholder: '沒有就留空' })),
      card(
        h('h3', { text: 'S　均衡睡眠' }),
        h('div', { class: 'two' },
          inputField('上床時間', c.bed, (v) => { set('bed')(v); showHours(); }, { type: 'time' }),
          inputField('起床時間', c.wake, (v) => { set('wake')(v); showHours(); }, { type: 'time' })),
        hours,
      ),
      card(h('h3', { text: 'E　適當運動' }), inputField('運動了幾分鐘？（建議每天 20 分鐘）', c.exMin, set('exMin'), { type: 'number', min: 0, inputmode: 'numeric' })),
      saveButton('#/tools'),
    ),
  };
}

// ---------- 改變情緒（核對事實 → 決定 → 相反行動／問題解決） ----------

const STEP_NAMES = ['情緒', '核對事實', '決定', '去做', '結果'];

export function changeFlow(id, fromLog) {
  const existing = id ? store.item('changes', id) : null;
  if (id && !existing) return null;
  const log = fromLog ? store.item('emotionLogs', fromLog) : null;
  const c = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), status: 'draft', logId: log?.id || null,
    emotion: log && log.emotion !== 'joy' && log.emotion !== 'other' ? log.emotion : null,
    pre: log?.intensity ?? null, post: null, event: log?.event || '',
    pc: {}, facts: { alt: [] }, fit: null, eff: null, path: null, sg: {},
    opp: { urges: [], chosen: [], all: [] }, solve: { ideas: [], pick: [], steps: [] }, act: { chosen: [] },
  };
  let step = existing && existing.status === 'done' ? 4 : 0;
  const root = h('div', {});

  const persist = () => store.saveItem('changes', c);

  const draw = () => {
    const e = emotionByKey(c.emotion);
    const body = [stepEmotion, stepFacts, stepDecide, stepDo, stepResult][step](e);
    const canNext = step !== 0 || c.emotion;
    put(root, 
      back('#/records', '記錄'),
      pageHead('改變情緒', e ? `${e.name}${c.pre != null ? `・強度 ${c.pre}` : ''}` : '情緒調節作業單 5–8'),
      h('div', { class: 'stepper' }, STEP_NAMES.map((n, i) => h('span', { class: i === step ? 'on' : i < step ? 'done' : '', text: n }))),
      body,
      h('div', { class: 'wiz-nav' },
        step > 0 ? h('button', { class: 'btn ghost', type: 'button', text: '上一步', onclick: () => { step -= 1; persist(); draw(); window.scrollTo(0, 0); } }) : h('span'),
        step < 4 && step !== 2
          ? h('button', { class: 'btn', type: 'button', text: '下一步', onclick: () => {
            if (!canNext) { toast('先選一個情緒'); return; }
            step += 1; persist(); draw(); window.scrollTo(0, 0);
          } })
          : step === 4 ? h('button', { class: 'btn', type: 'button', text: '完成', onclick: () => {
            c.status = 'done'; persist(); toast('已儲存'); go('#/records');
          } }) : h('span')),
    );
  };

  // 1. 情緒
  function stepEmotion(e) {
    const pc = c.pc;
    return [
      card(
        h('h3', { text: '我想改變的情緒是什麼？' }),
        chips(EMOTIONS.filter((x) => x.key !== 'joy').map((x) => ({ value: x.key, label: x.name })), c.emotion,
          (v) => { c.emotion = v; draw(); }, { single: true }),
        slider('強度（0–100）：練習前', c.pre, (v) => { c.pre = v; }),
        textField('情緒的促發事件（人、事、時、地）：', c.event, (v) => { c.event = v; }),
      ),
      h('details', { class: 'card fold' },
        h('summary', { text: '還不確定要不要改變這個情緒？（作業單 1：優缺點分析）' }),
        h('p', { class: 'muted small', text: '依照情緒心生活符合你的最佳利益嗎？拒絕調節情緒會帶來新的問題嗎？執著於這個情緒在這情境下有用嗎？' }),
        textField('留在情緒心中，情緒化地行動——優點：', pc.stayPro, (v) => { pc.stayPro = v; }, { rows: 2 }),
        textField('留在情緒心中，情緒化地行動——缺點：', pc.stayCon, (v) => { pc.stayCon = v; }, { rows: 2 }),
        textField('調節情緒與情緒行為——優點：', pc.regPro, (v) => { pc.regPro = v; }, { rows: 2 }),
        textField('調節情緒與情緒行為——缺點：', pc.regCon, (v) => { pc.regCon = v; }, { rows: 2 }),
        textField('你決定如何處理你的情緒？這是符合智慧心的決定嗎？', pc.decision, (v) => { pc.decision = v; }, { rows: 2 }),
      ),
    ];
  }

  // 2. 核對事實（作業單 5）
  function stepFacts(e) {
    const f = c.facts;
    const altList = h('div', {});
    const drawAlt = () => altList.replaceChildren(...f.alt.map((t, i) => h('div', { class: 'item' },
      h('input', { type: 'text', value: t, oninput: (ev) => { f.alt[i] = ev.target.value; } }),
      h('button', { class: 'x', type: 'button', text: '×', onclick: () => { f.alt.splice(i, 1); drawAlt(); } }))),
    h('button', { class: 'btn small ghost', type: 'button', text: '＋ 另一個可能的詮釋', onclick: () => { f.alt.push(''); drawAlt(); } }));
    if (!f.alt.length) f.alt.push('');
    drawAlt();
    const hint = h('p', { class: 'anchor' });
    const showHint = () => {
      hint.textContent = f.score == null ? '' : f.score >= 4 ? '情緒大致符合事實。'
        : f.score <= 1 ? '情緒不太符合事實。' : '還不確定：繼續核對事實——發揮創意、問問別人的意見，或做個實驗來看看你的預測或詮釋是否正確。';
    };
    showHint();
    return [
      card(
        h('h3', { text: '步驟二　促發事件是什麼？' }),
        h('p', { class: 'muted small', text: '發生什麼事導致你有這樣的情緒？誰對誰做了什麼事？哪個部分對你造成困擾？' }),
        textField('核對事實！找出描述中極端和評斷的陳述，重新寫下更精確的事實：', f.eventFacts ?? c.event, (v) => { f.eventFacts = v; }),
      ),
      card(
        h('h3', { text: '步驟三　我對事實的詮釋（想法、信念等）是什麼？' }),
        textField('我有什麼假設？我有加油添醋嗎？', f.interp, (v) => { f.interp = v; }, { rows: 2 }),
        h('p', { class: 'field-label', text: '核對事實！盡你所能列出其他關於事實的可能詮釋：' }),
        altList,
        textField('重新寫下事實。如果無法核對事實，寫出一個可能的或有用（有效）的詮釋：', f.interpFacts, (v) => { f.interpFacts = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '步驟四　我假設有威脅嗎？' }),
        textField('是什麼威脅？我所預期令人擔憂的後果或結果是什麼？', f.threat, (v) => { f.threat = v; }, { rows: 2 }),
        textField('核對事實！基於事實，盡你所能列出其他可能的結果：', f.altOutcomes, (v) => { f.altOutcomes = v; }, { rows: 2 }),
        textField('如果無法確認可能的結果，寫出一個可能非災難化的結果：', f.nonCat, (v) => { f.nonCat = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '步驟五　假使發生我所擔心的結果，會是什麼災難？' }),
        textField('仔細描述我所能預期的最糟結果：', f.worst, (v) => { f.worst = v; }, { rows: 2 }),
        textField('描述發生最糟情況的因應方式：', f.coping, (v) => { f.coping = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '步驟六　我的情緒（或其強度或持續性）符合事實嗎？' }),
        e?.fits.length ? h('div', { class: 'ref' }, h('p', { class: 'field-label', text: `當……時，${e.name}符合事實（講義 8a）：` }), h('ul', {}, e.fits.map((t) => h('li', { text: t })))) : null,
        h('div', { class: 'rating six' }, [0, 1, 2, 3, 4, 5].map((n) => h('button', {
          type: 'button', class: f.score === n ? 'on' : '', text: String(n),
          onclick: (ev) => { f.score = n; [...ev.target.parentNode.children].forEach((b, i) => b.classList.toggle('on', i === n)); showHint(); },
        }))),
        h('div', { class: 'row ends' }, h('span', { text: '一點也不' }), h('span', { text: '非常符合' })),
        hint,
        textField('我的情緒合理之處：', f.reasonable, (v) => { f.reasonable = v; }, { rows: 2 }),
        textField('我的情緒不合理之處：', f.unreasonable, (v) => { f.unreasonable = v; }, { rows: 2 }),
        textField('描述你做了什麼來核對事實：', f.checked, (v) => { f.checked = v; }, { rows: 2 }),
      ),
    ];
  }

  // 3. 決定（作業單 6 / 講義 9）
  function stepDecide(e) {
    if (c.fit == null && c.facts.score != null) c.fit = c.facts.score >= 4 ? 'yes' : c.facts.score <= 1 ? 'no' : null;
    const out = h('div', {});
    const choose = (path) => { c.path = path; step = 3; persist(); draw(); window.scrollTo(0, 0); };
    const opt = (path, title, sub) => h('button', { class: 'choice', type: 'button', onclick: () => choose(path) }, h('b', { text: title }), h('small', { text: sub }));
    const drawOut = () => {
      if (!c.fit || !c.eff) { out.replaceChildren(h('p', { class: 'muted', text: '回答上面兩題，看看下一步該做什麼。' })); return; }
      const k = `${c.fit}-${c.eff}`;
      const map = {
        'yes-yes': ['情緒符合事實，跟著情緒行動也有效', '對當下情緒了了分明；採取符合情緒的行動；用問題解決處理不想要的情緒。',
          [opt('solve', '問題解決', '情緒調節作業單 8'), opt('act', '依情緒行動', '講義 13：符合事實時可以做的事')]],
        'yes-no': ['情緒符合事實，但跟著情緒行動無效', '不採取符合情緒／行動衝動的行動。考慮相反行動。',
          [opt('opposite', '相反行動', '情緒調節作業單 7'), opt('solve', '問題解決', '情緒調節作業單 8')]],
        'no-no': ['情緒不符合事實，跟著情緒行動也無效', '不採取符合情緒／行動衝動的行動。改變想法以符合事實，採取相反行動。',
          [opt('opposite', '相反行動', '情緒調節作業單 7')]],
        'no-yes': ['情緒不符合事實，但跟著情緒行動有效', '對當下情緒了了分明；採取行動，但得體地接受後果；重新考慮相反行動。',
          [opt('opposite', '相反行動', '情緒調節作業單 7'), opt('act', '依情緒行動', '並得體地接受後果')]],
      };
      const [title, text, buttons] = map[k];
      out.replaceChildren(h('div', { class: 'outcome' }, h('b', { text: title }), h('p', { text: text })), ...buttons);
    };
    drawOut();
    return [
      card(
        h('h3', { text: '這個情緒符合事實嗎？（核對事實）' }),
        c.facts.score != null ? h('p', { class: 'muted small', text: `你在核對事實時評了 ${c.facts.score} 分（0–5）。` }) : null,
        yesNo(c.fit, (v) => { c.fit = v; drawOut(); }, ['符合', '不符合']),
        h('h3', { text: '對你的目標而言，採取符合情緒的行動是有效的嗎？（核對智慧心）' }),
        yesNo(c.eff, (v) => { c.eff = v; drawOut(); }, ['有效', '無效']),
      ),
      card(out),
    ];
  }

  // 4. 去做
  function stepDo(e) {
    if (!c.path) return [card(h('p', { class: 'muted', text: '回到上一步，先決定要用哪一個技巧。' }))];
    if (c.path === 'opposite') return stepOpposite(e);
    if (c.path === 'solve') return stepSolve(e);
    return stepAct(e);
  }

  function stepOpposite(e) {
    const o = c.opp;
    const isSG = e && (e.key === 'shame' || e.key === 'guilt');
    let oppList = e?.opp || [];
    let allList = e?.all || [];
    let sgTitle = null;
    const sgBox = h('div', {});
    if (isSG) {
      const v = c.sg.q1 === 'yes' ? SHAME_GUILT.guiltFits : c.sg.q2 === 'yes' ? SHAME_GUILT.shameFits : SHAME_GUILT.neither;
      if (c.sg.q1 && (c.sg.q1 === 'yes' || c.sg.q2)) { oppList = v.opp; allList = v.all; sgTitle = v.title; }
      sgBox.append(card(
        h('h3', { text: '先分清楚是羞愧還是內疚' }),
        h('p', { class: 'field-label', text: SHAME_GUILT.q1 }),
        yesNo(c.sg.q1, (val) => { c.sg.q1 = val; draw(); }),
        c.sg.q1 === 'no' ? [h('p', { class: 'field-label top', text: SHAME_GUILT.q2 }), yesNo(c.sg.q2, (val) => { c.sg.q2 = val; draw(); })] : null,
        sgTitle ? h('div', { class: 'outcome' }, h('b', { text: sgTitle })) : null,
      ));
    }
    const ready = !isSG || sgTitle;
    return [
      sgBox,
      ready ? [
        card(
          h('h3', { text: '行動衝動：我想做什麼或說什麼？' }),
          chips(e?.acts || [], o.urges, (v) => { o.urges = v; }),
          textField('', o.urgeText, (v) => { o.urgeText = v; }, { rows: 2, placeholder: '其他' }),
        ),
        card(
          h('h3', { text: `相反行動${isSG ? '' : `：與${e?.name || '情緒'}相反的行動`}` }),
          h('p', { class: 'muted small', text: '我的衝動的相反行動是什麼？因為這個情緒，我不會去做什麼？' }),
          chips(oppList, o.chosen, (v) => { o.chosen = v; }),
          allList.length ? [h('p', { class: 'field-label top', text: '完全相反的行動（連表情、姿勢、想法一起）：' }), chips(allList, o.all, (v) => { o.all = v; })] : null,
          textField('我具體要做的事：', o.plan, (v) => { o.plan = v; }, { rows: 2 }),
        ),
        card(
          h('h3', { text: '做完之後' }),
          textField('我做了什麼（仔細描述）：', o.did, (v) => { o.did = v; }, { rows: 2 }),
          textField('我如何做（肢體語言、臉部表情、姿勢、手勢和想法）：', o.how, (v) => { o.how = v; }, { rows: 2 }),
          textField('相反行動帶來什麼後續影響（心的狀態、其他情緒、行為、想法、記憶、身體狀態等）？', o.after, (v) => { o.after = v; }, { rows: 2 }),
          h('p', { class: 'muted small', text: '持續做出與情緒衝動相反的行動，直到情緒改變。' }),
        ),
      ] : null,
    ];
  }

  function stepSolve(e) {
    const s = c.solve;
    if (s.problem == null) s.problem = c.event;
    const ideas = h('div', {});
    const compare = h('div', {});
    const drawCompare = () => {
      const picked = s.pick.map((i) => s.ideas[i]).filter(Boolean);
      if (!picked.length) { compare.replaceChildren(h('p', { class: 'muted small', text: '在上面的方法前勾選，最多選兩個來比較。' })); return; }
      s.pc ??= {};
      compare.replaceChildren(...picked.map((name, n) => h('div', { class: 'pcbox' },
        h('b', { text: `方法 ${n + 1}：${name}` }),
        textField('優點：', s.pc[`p${n}`], (v) => { s.pc[`p${n}`] = v; }, { rows: 2 }),
        textField('缺點：', s.pc[`c${n}`], (v) => { s.pc[`c${n}`] = v; }, { rows: 2 }))),
      h('p', { class: 'field-label', text: '選擇一個方法來嘗試：' }),
      chips(picked, s.chosen || null, (v) => { s.chosen = v; }, { single: true }));
    };
    const drawIdeas = () => {
      ideas.replaceChildren(...s.ideas.map((t, i) => h('div', { class: 'item' },
        h('input', { type: 'checkbox', checked: s.pick.includes(i), onchange: (ev) => {
          if (ev.target.checked) { if (s.pick.length >= 2) { ev.target.checked = false; toast('最多選兩個'); return; } s.pick.push(i); }
          else s.pick = s.pick.filter((x) => x !== i);
          drawCompare();
        } }),
        h('input', { type: 'text', value: t, oninput: (ev) => { s.ideas[i] = ev.target.value; } }),
        h('button', { class: 'x', type: 'button', text: '×', onclick: () => {
          s.ideas.splice(i, 1); s.pick = s.pick.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)); drawIdeas(); drawCompare();
        } }))),
      h('button', { class: 'btn small ghost', type: 'button', text: '＋ 再想一個', onclick: () => { s.ideas.push(''); drawIdeas(); } }));
    };
    if (!s.ideas.length) s.ideas.push('');
    drawIdeas();
    drawCompare();
    const stepsBox = h('div', {});
    const drawSteps = () => stepsBox.replaceChildren(...s.steps.map((st, i) => h('div', { class: 'stepitem' },
      h('div', { class: 'item' },
        h('input', { type: 'checkbox', checked: st.done, onchange: (ev) => { st.done = ev.target.checked; } }),
        h('input', { type: 'text', value: st.text, placeholder: `步驟 ${i + 1}`, oninput: (ev) => { st.text = ev.target.value; } }),
        h('button', { class: 'x', type: 'button', text: '×', onclick: () => { s.steps.splice(i, 1); drawSteps(); } })),
      h('input', { type: 'text', class: 'sub', value: st.what || '', placeholder: '發生了什麼？', oninput: (ev) => { st.what = ev.target.value; } }))),
    h('button', { class: 'btn small ghost', type: 'button', text: '＋ 下一個步驟', onclick: () => { s.steps.push({ text: '', done: false }); drawSteps(); } }));
    if (!s.steps.length) s.steps.push({ text: '', done: false });
    drawSteps();

    return [
      card(
        textField('1. 問題是什麼？描述促發情緒的問題。是什麼導致這個情境變成問題？', s.problem, (v) => { s.problem = v; }),
        textField('2. 核對事實以確認你正確定義問題。如果有需要，根據事實重新寫下問題：', s.facts, (v) => { s.facts = v; }, { rows: 2 }),
        textField('3. 務實的問題解決短期目標是什麼？如果要達到目標，你認為一定要做什麼？', s.goal, (v) => { s.goal = v; }, { rows: 2 }),
      ),
      card(
        h('h3', { text: '4. 腦力激盪解決方法：列出你想得到的所有解決方式及因應策略。不要評價！' }),
        e?.whenFits.length ? [h('p', { class: 'muted small', text: `點一下加入（講義 13：${e.name}符合事實時可以做的事）：` }),
          h('div', { class: 'chips' }, e.whenFits.map((t) => h('button', { type: 'button', class: 'chip', text: t, onclick: () => {
            const empty = s.ideas.findIndex((x) => !x.trim());
            if (empty >= 0) s.ideas[empty] = t; else s.ideas.push(t);
            drawIdeas();
          } })))] : null,
        ideas,
      ),
      card(h('h3', { text: '5. 哪兩個方法看起來最好？比較優缺點' }), compare),
      card(h('h3', { text: '6. 列出需要的步驟，檢查你的執行步驟及其有效性' }), stepsBox),
      card(
        h('h3', { text: '7. 是否達成你的目標？' }),
        yesNo(s.achieved, (v) => { s.achieved = v; }, ['有', '沒有']),
        textField('如果有，請描述。如果沒有，接下來你可以做什麼？', s.next, (v) => { s.next = v; }, { rows: 2 }),
        textField('現在有新的問題需要解決嗎？', s.newProblem, (v) => { s.newProblem = v; }, { rows: 2 }),
      ),
    ];
  }

  function stepAct(e) {
    const a = c.act;
    return [
      card(
        h('h3', { text: '對當下情緒了了分明' }),
        h('p', { class: 'muted', text: '退一步，只要注意到情緒的存在。像波浪一樣經驗它，不推開、不留住、不放大。' }),
        h('a', { class: 'btn ghost block', href: '#/handouts/er-22', text: '情緒調節講義 22' }),
      ),
      card(
        h('h3', { text: `${e?.name || '情緒'}符合事實時，可以做的事（講義 13）` }),
        chips(e?.whenFits || [], a.chosen, (v) => { a.chosen = v; }),
        c.fit === 'no' ? h('p', { class: 'muted small top', text: '情緒不符合事實但仍照著做時，要得體地接受後果，並重新考慮相反行動。' }) : null,
        textField('我做了什麼：', a.did, (v) => { a.did = v; }, { rows: 2 }),
      ),
    ];
  }

  // 5. 結果
  function stepResult() {
    const pre = c.pre;
    const postNum = h('b', { class: 'big', text: c.post ?? '—' });
    const tip = h('div', {});
    const showTip = () => put(tip, pre != null && c.post != null && c.post >= pre
      ? card(h('p', { text: '情緒沒有下降嗎？可以做一次疑難排解，看看哪裡卡住了。' }), h('a', { class: 'btn ghost block', href: '#/handouts/er-24', text: '情緒調節技巧的疑難排解' }))
      : null);
    showTip();
    return [
      card(
        h('h3', { text: '現在的強度' }),
        slider('強度（0–100）：練習後', c.post, (v) => { c.post = v; postNum.textContent = v; showTip(); }),
        h('div', { class: 'compare' }, h('b', { class: 'big', text: pre ?? '—' }), h('span', { text: '→' }), postNum),
        h('div', { class: 'row ends around' }, h('span', { text: '練習前' }), h('span', { text: '練習後' })),
      ),
      tip,
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄', onclick: (ev) => {
        ev.target.after(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => { store.deleteItem('changes', c.id); toast('已刪除'); go('#/records'); }));
      } }) : null,
    ];
  }

  draw();
  return { tab: 'records', title: '', node: root };
}
