// 相反行動專用介面（情緒調節講義 10、11，作業單 7）。存在 changes 集合，標記 quick:true。
import { h, put, card, pageHead, back, chips, textField, yesNo, slider, uid, toast, go, confirmBar, linkify } from './dom.js';
import { EMOTIONS, emotionByKey, SHAME_GUILT } from './emotions.js';
import * as store from './store.js';

export function oppositePage(id) {
  const existing = id ? store.item('changes', id) : null;
  if (id && !existing) return null;
  const c = existing ? structuredClone(existing) : {
    id: uid(), at: new Date().toISOString(), quick: true, status: 'draft', path: 'opposite',
    emotion: null, pre: null, post: null, event: '', fit: null, eff: null, sg: {},
    opp: { urges: [], chosen: [], all: [] },
  };
  let mode = existing?.status === 'done' ? 'after' : 'plan'; // plan → doing → after
  const root = h('div', {});
  const post = h('b', { class: 'big', text: c.post ?? '—' });
  const save = () => { if (c.emotion) store.saveItem('changes', c); };

  const lists = (e) => {
    if (!e) return { opp: [], all: [], title: null, ready: false };
    if (e.key !== 'shame' && e.key !== 'guilt') return { opp: e.opp, all: e.all, title: null, ready: true };
    if (!c.sg.q1 || (c.sg.q1 === 'no' && !c.sg.q2)) return { opp: [], all: [], title: null, ready: false };
    const v = c.sg.q1 === 'yes' ? SHAME_GUILT.guiltFits : c.sg.q2 === 'yes' ? SHAME_GUILT.shameFits : SHAME_GUILT.neither;
    return { opp: v.opp, all: v.all, title: v.title, ready: true };
  };

  const draw = () => {
    const e = emotionByKey(c.emotion);
    const L = lists(e);
    const o = c.opp;
    const chosen = [...o.chosen, ...o.all, ...(o.plan ? [o.plan] : [])];
    const isSG = e && (e.key === 'shame' || e.key === 'guilt');

    if (mode === 'doing') {
      put(root, h('div', { class: 'opp-doing' },
        h('p', { class: 'opp-label', text: `${e?.name || ''}的相反行動` }),
        h('p', { class: 'opp-big', text: '現在，完全相反地去做。' }),
        chosen.length ? h('ul', {}, chosen.map((t) => h('li', { text: t }))) : h('p', { class: 'opp-hint', text: '（還沒有勾選要做的事）' }),
        h('p', { class: 'opp-hint', text: '持續做出與情緒衝動相反的行動，直到情緒改變。連表情、姿勢、語調、想法都一起相反。' }),
        h('button', { class: 'btn block', type: 'button', text: '做完了', onclick: () => { mode = 'after'; save(); draw(); window.scrollTo(0, 0); } }),
        h('button', { class: 'btn ghost block', type: 'button', text: '回去修改', onclick: () => { mode = 'plan'; draw(); } })));
      return;
    }

    put(root,
      id ? back('#/records', '記錄') : null,
      pageHead('相反行動', '情緒調節講義 10、11・作業單 7'),
      h('p', { class: 'quote', text: '當你的情緒不符合事實\n或者隨著情緒的行動是無效時\n採取相反行動' }),
      card(
        h('h3', { text: '1. 我想改變的情緒' }),
        chips(EMOTIONS.filter((x) => x.opp.length || x.key === 'shame' || x.key === 'guilt').map((x) => ({ value: x.key, label: x.name })),
          c.emotion, (v) => { c.emotion = v; c.sg = {}; c.opp = { urges: [], chosen: [], all: [] }; draw(); }, { single: true }),
        slider('強度（0–100）：練習前', c.pre, (v) => { c.pre = v; }),
        textField('促發事件（人、事、時、地）：', c.event, (v) => { c.event = v; }, { rows: 2 }),
      ),
      e ? card(
        h('h3', { text: '2. 核對一下' }),
        e.fits.length ? h('div', { class: 'ref' }, h('p', { class: 'field-label', text: `當……時，${e.name}符合事實：` }), h('ul', {}, e.fits.map((t) => h('li', { text: t })))) : null,
        h('p', { class: 'field-label', text: '這個情緒（和它的強度）符合事實嗎？' }),
        yesNo(c.fit, (v) => { c.fit = v; draw(); }, ['符合', '不符合']),
        h('p', { class: 'field-label', text: '跟著情緒去做，對我的目標有效嗎？' }),
        yesNo(c.eff, (v) => { c.eff = v; draw(); }, ['有效', '無效']),
        c.fit === 'yes' && c.eff === 'yes'
          ? h('div', { class: 'outcome' }, h('b', { text: '情緒合理，跟著做也有效' }), h('p', { text: '這時不一定要相反行動，可以改用問題解決。' }), h('a', { class: 'small', href: '#/change/new', text: '改用完整的改變情緒流程 ›' }))
          : c.fit && c.eff ? h('div', { class: 'outcome' }, h('b', { text: '適合做相反行動' })) : null,
      ) : null,
      isSG ? card(
        h('h3', { text: '先分清楚是羞愧還是內疚' }),
        h('p', { class: 'field-label', text: SHAME_GUILT.q1 }),
        yesNo(c.sg.q1, (v) => { c.sg.q1 = v; draw(); }),
        c.sg.q1 === 'no' ? [h('p', { class: 'field-label top', text: SHAME_GUILT.q2 }), yesNo(c.sg.q2, (v) => { c.sg.q2 = v; draw(); })] : null,
        L.title ? h('div', { class: 'outcome' }, h('b', { text: L.title })) : null,
      ) : null,
      e && L.ready ? [
        h('section', { class: 'card opp-urge' },
          h('h3', { text: '情緒叫我做的' }),
          chips(e.acts, c.opp.urges, (v) => { c.opp.urges = v; }),
          textField('', c.opp.urgeText, (v) => { c.opp.urgeText = v; }, { rows: 2, placeholder: '其他衝動' })),
        h('div', { class: 'opp-arrow', text: '↓　反過來做' }),
        h('section', { class: 'card opp-do' },
          h('h3', { text: '相反行動' }),
          chips(L.opp, c.opp.chosen, (v) => { c.opp.chosen = v; }),
          L.all.length ? [h('h3', { class: 'top', text: '完全相反：身體、表情、想法也一起' }), chips(L.all, c.opp.all, (v) => { c.opp.all = v; })] : null,
          textField('我具體要做的事：', c.opp.plan, (v) => { c.opp.plan = v; }, { rows: 2, placeholder: '例如：傳訊息約朋友明天吃午餐' })),
        mode === 'plan' ? h('button', { class: 'btn block', type: 'button', text: '開始做', onclick: () => { mode = 'doing'; save(); draw(); window.scrollTo(0, 0); } }) : null,
      ] : null,
      mode === 'after' ? [
        card(
          h('h3', { text: '做完之後' }),
          textField('我做了什麼（仔細描述）：', c.opp.did, (v) => { c.opp.did = v; }, { rows: 2 }),
          textField('我如何做（肢體語言、臉部表情、姿勢、手勢和想法）：', c.opp.how, (v) => { c.opp.how = v; }, { rows: 2 }),
          textField('相反行動帶來什麼後續影響？', c.opp.after, (v) => { c.opp.after = v; }, { rows: 2 }),
        ),
        card(
          h('h3', { text: '現在的強度' }),
          slider('強度（0–100）：練習後', c.post, (v) => { c.post = v; post.textContent = v; }),
          h('div', { class: 'compare' }, h('b', { class: 'big', text: c.pre ?? '—' }), h('span', { text: '→' }), post),
          h('p', { class: 'muted small' }, linkify('情緒還沒改變？相反行動要持續做、做得「完全」，才會見效。也可以做一次疑難排解（情緒調節講義 24）。')),
        ),
        h('button', { class: 'btn block', type: 'button', text: '儲存', onclick: () => { c.status = 'done'; save(); toast('已儲存'); go('#/records'); } }),
      ] : null,
      existing ? h('button', { class: 'btn ghost block', type: 'button', text: '刪除這筆紀錄', onclick: (ev) => {
        ev.target.after(confirmBar('刪除後無法復原。確定要刪除嗎？', '刪除', () => { store.deleteItem('changes', c.id); toast('已刪除'); go('#/records'); }));
      } }) : null,
    );
  };
  draw();
  return { tab: 'today', title: '', node: root };
}
