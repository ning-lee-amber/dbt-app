import { h, put, card, pageHead, checkRow, back, todayLabel, fmtDate, confirmBar, toast, slider } from './dom.js';
import { UNITS, HANDOUTS, handoutById, ACCEPTS, SENSES, IMPROVE, SOURCE } from './content.js';
import * as store from './store.js';
import { todayABC } from './phase3.js';

// ---------- shared: my picked items from the crisis handouts ----------

const PICK_SOURCES = [
  { hid: 'dt-7', name: '轉移注意力（ACCEPTS）', groups: ACCEPTS },
  { hid: 'dt-8', name: '五感自我撫慰', groups: SENSES },
  { hid: 'dt-9', name: '改善當下（IMPROVE）', groups: IMPROVE.concat([{ key: 'rethink', title: '我的重新思考陳述' }]) },
  { hid: 'dt-6c', name: '有效的自我陳述', groups: [{ key: 'mine', title: '我的有效自我陳述' }] },
];

// [{ hid, name, groups:[{ key, title, items:[text] }] }] — only non-empty.
export function pickedGroups() {
  return PICK_SOURCES.map((src) => {
    const got = store.picked(src.hid);
    const groups = src.groups
      .filter((g) => got[g.key]?.length)
      .map((g) => ({ key: g.key, title: g.title, items: got[g.key] }));
    return { hid: src.hid, name: src.name, groups };
  }).filter((s) => s.groups.length);
}

// Encouraging sentences the user picked or wrote.
export function myPhrases() {
  const p9 = store.picked('dt-9');
  const p6c = store.picked('dt-6c');
  return [...(p9.E || []), ...(p9.rethink || []), ...(p6c.mine || [])];
}

const rowLink = (to, title, sub, badge) =>
  h('a', { class: 'rowlink', href: to },
    h('div', {}, h('b', { text: title }), sub ? h('small', { text: sub }) : null),
    badge != null ? h('span', { class: 'badge', text: badge }) : h('span', { class: 'chev', text: '›' }));

// ---------- 今天 ----------

export function today() {
  const phrases = myPhrases();
  const phrase = phrases.length ? phrases[Math.floor(Math.random() * phrases.length)] : '「這件事也一樣會過去。」';
  const { cards, logs } = store.counts();
  const latest = store.crisisLogs()[0];
  const st = store.getState();
  const needBackup = (cards || logs) && (!st.lastExport || Date.now() - new Date(st.lastExport) > 30 * 864e5);

  const key = store.dayKey();
  const ci = store.checkin(key);
  const done = (f) => ci[f] != null && ci[f] !== '';
  const please = [['PL', 'pl'], ['E 飲食', 'eat'], ['A 物質', 'sub'], ['S 睡眠', 'wake'], ['E 運動', 'exMin']];

  return {
    tab: 'today', title: '',
    node: h('div', {},
      pageHead('今天', todayLabel()),
      card(h('p', { class: 'quote', text: phrase })),
      h('a', { class: 'opp-cta', href: '#/opposite' }, h('b', { text: '相反行動' }), h('small', { text: '情緒不符合事實，或跟著做沒有幫助時：反過來做' })),
      card(
        h('div', { class: 'row' }, h('h3', { text: '每日打卡' }), h('a', { class: 'small', href: '#/checkin', text: '填寫 ›' })),
        slider(new Date().getHours() < 15 ? '早上的心情' : '晚上的心情', new Date().getHours() < 15 ? ci.moodAM : ci.moodPM,
          (v) => store.setCheckin(key, new Date().getHours() < 15 ? 'moodAM' : 'moodPM', v)),
        h('a', { class: 'please', href: '#/checkin' }, please.map(([label, f]) => h('span', { class: done(f) ? 'on' : '', text: label }))),
      ),
      todayABC(rowLink),
      card(
        h('h3', { text: '情緒' }),
        rowLink('#/emotion/new', '記錄一個情緒', '選情緒、評強度、寫下發生什麼事'),
        rowLink('#/change/new', '我想改變一個情緒', '核對事實 → 相反行動或問題解決'),
      ),
      card(
        h('h3', { text: '危機時用的工具' }),
        rowLink('#/urge', '我的衝動卡', '衝動來之前先寫好', cards),
        rowLink('#/me/toolbox', '我的工具箱', '轉移注意力、自我撫慰、改善當下'),
        rowLink('#/records/new', '寫一筆危機紀錄', '痛苦耐受作業單 1'),
      ),
      latest ? card(
        h('h3', { text: '最近一次危機紀錄' }),
        h('a', { class: 'rowlink', href: `#/records/${latest.id}` },
          h('div', {}, h('b', { text: latest.event || '（未填寫事件）' }), h('small', { text: fmtDate(latest.at) })),
          h('span', { class: 'chev', text: `${latest.pre ?? '—'} → ${latest.post ?? '—'}` })),
      ) : null,
      needBackup ? card(
        h('p', { class: 'muted', text: '你的紀錄只存在這支手機上，記得定期備份。' }),
        h('a', { class: 'btn ghost', href: '#/me/backup', text: '去備份' }),
      ) : null,
      store.saveFailed ? card(h('p', { class: 'warn', text: '這支手機的瀏覽器目前無法儲存資料（可能是無痕模式）。' })) : null,
    ),
  };
}

// ---------- 工具 ----------

export function tools() {
  return {
    tab: 'tools', title: '',
    node: h('div', {},
      pageHead('工具'),
      card(
        h('h3', { text: '了了分明' }),
        rowLink('#/practice/new', '記錄一次練習', '觀察、描述、參與、不評斷、專一、有效'),
        rowLink('#/guide/wise3', '三分鐘智慧心練習', '覺察・呼吸・擴展'),
        rowLink('#/guide/loving', '仁慈關愛', '從自己開始，擴展到所有眾生'),
        rowLink('#/balance', '行中庸之道', '今天的平衡（蹺蹺板）'),
        rowLink('#/handouts/mf-4a', '練習觀察的方法', '回歸感官'),
      ),
      card(
        h('h3', { text: '減少情緒心的脆弱性（ABC PLEASE）' }),
        rowLink('#/positive', '今天的一件好事', '累積正向情緒（短期）'),
        rowLink('#/values', '價值觀與目標', '累積正向情緒（長期）'),
        rowLink('#/abc', '建立自我掌控與預先因應', 'B 與 C'),
        rowLink('#/checkin', '每日打卡', 'PLEASE'),
      ),
      card(
        h('h3', { text: '人際效能' }),
        rowLink('#/talk/new', '準備一場對話', '目標 → 存錢遊戲 → DEAR MAN 腳本 → 小抄 → 回顧'),
        rowLink('#/handouts/ie-2a', '人際效能的迷思', '寫下你的挑戰'),
        rowLink('#/handouts/ie-18', '認可他人', '六個層次'),
        rowLink('#/handouts/ie-19', '從不被認可中恢復', '不防衛，核對事實'),
        rowLink('#/talk/new?type=end', '結束關係', '用智慧心決定，安全第一'),
        rowLink('#/handouts/ie-11a', '小測驗', '講義 11a、12a、13a、16c、18a、19a、22a'),
      ),
      card(
        h('h3', { text: '情緒調節' }),
        rowLink('#/opposite', '相反行動', '選情緒 → 看衝動 → 反過來做'),
        rowLink('#/change/new', '改變情緒', '核對事實 → 決定 → 相反行動或問題解決'),
        rowLink('#/emotion/new', '記錄情緒', '快速版，或完整的觀察與描述情緒'),
        rowLink('#/handouts/er-4a', '關於情緒的迷思', '寫下你的挑戰'),
        rowLink('#/handouts/er-22', '對當下情緒了了分明', '放下受苦情緒'),
      ),
      card(
        h('h3', { text: '危機生存技巧' }),
        rowLink('#/crisis/stop', 'STOP 立即停止', '停止動作・退後一步・客觀觀察・帶著覺察行事'),
        rowLink('#/urge', '優缺點分析', '我的衝動卡'),
        rowLink('#/crisis/tip', 'TIP 改變身體化學狀況', '冷水・激烈運動・調節呼吸・肌肉放鬆'),
        rowLink('#/handouts/dt-7', '轉移注意力（ACCEPTS）', '勾選對你有用的方法'),
        rowLink('#/handouts/dt-8', '以五感自我撫慰', '勾選對你有用的方法'),
        rowLink('#/handouts/dt-9', '改善當下（IMPROVE）', '勾選對你有用的方法'),
      ),
      card(
        h('h3', { text: '引導練習' }),
        rowLink('#/guide/muscle', '配對式肌肉放鬆', '16 個肌肉群，約 5 分鐘'),
        rowLink('#/guide/senses', '感官覺察', '29 個問題，約 4 分鐘'),
      ),
      h('p', { class: 'muted small center', text: '其他單元的工具會在之後的階段陸續加入。' }),
    ),
  };
}

// ---------- 講義 ----------

export function handouts() {
  const list = h('div', {});
  const search = h('input', { class: 'search', type: 'search', placeholder: '搜尋講義，例如「冷水」' });

  function draw(q) {
    q = q.trim();
    put(list, ...UNITS.map((u) => {
      const items = HANDOUTS.filter((x) => x.unit === u.id && (!q || x.title.includes(q) || `${u.name}${x.no}`.includes(q)));
      if (q && !items.length) return null;
      const d = h('details', { class: 'unit' },
        h('summary', {}, h('span', { text: u.name }), h('small', { text: `${items.length} 份` })),
        h('ol', {}, items.map((x) =>
          h('li', {}, h('a', { href: `#/handouts/${x.id}` },
            h('em', { text: x.no }), h('span', { text: x.title }),
            x.blocks ? null : h('small', { class: 'tag', text: '整理中' }))))));
      if (q) d.open = true;
      return d;
    }));
  }
  search.addEventListener('input', () => draw(search.value));
  draw('');

  return {
    tab: 'handouts', title: '',
    node: h('div', {}, pageHead('講義', `五個單元・共 ${HANDOUTS.length} 份`), search, card(list),
      h('p', { class: 'muted small', text: SOURCE })),
  };
}

export function handout(id) {
  const x = handoutById(id);
  if (!x) return null;
  const body = x.blocks
    ? renderBlocks(x.id, x.blocks)
    : [card(h('p', { class: 'muted', text: '這份講義的內容整理中，會在之後的階段加入。' }))];
  return {
    tab: 'handouts', title: '',
    node: h('div', {},
      back('#/handouts', '講義'),
      pageHead(x.title, `${x.unitName}講義 ${x.no}`),
      body,
      h('p', { class: 'muted small', text: SOURCE })),
  };
}

function checkBlock(hid, b) {
  const box = card(b.title ? h('h3', { text: b.title }) : null);
  const listEl = h('div', {});
  const draw = () => {
    const custom = store.customItems(hid, b.key);
    listEl.replaceChildren(
      ...b.items.map((t) => checkRow(t, store.isChecked(hid, b.key, t), (on) => store.setChecked(hid, b.key, t, on))),
      ...custom.map((t) => checkRow(t, store.isChecked(hid, b.key, t), (on) => store.setChecked(hid, b.key, t, on),
        h('button', { class: 'x', type: 'button', 'aria-label': '刪除', text: '×',
          onclick: (e) => { e.preventDefault(); store.removeCustom(hid, b.key, t); draw(); } }))),
    );
  };
  draw();
  box.append(listEl);
  if (b.other) {
    const input = h('input', { type: 'text', placeholder: b.items.length ? '其他：新增我自己的方法' : '寫下一句，按新增' });
    const add = () => {
      const t = input.value.trim();
      if (!t) return;
      store.addCustom(hid, b.key, t);
      input.value = '';
      draw();
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    box.append(h('div', { class: 'addrow' }, input, h('button', { class: 'btn small', type: 'button', text: '新增', onclick: add })));
  }
  return box;
}

// Inside a collapsible card, nested cards become plain sections.
const unwrapCard = (el) => {
  if (el.classList?.contains('card')) el.className = 'sub-block';
  return el;
};

export function renderBlocks(hid, blocks) {
  const out = [];
  let loose = null; // consecutive text blocks share one card
  const flush = () => { if (loose) { out.push(loose); loose = null; } };
  const put = (el) => { loose ??= card(); loose.append(el); };

  for (const b of blocks) {
    switch (b.t) {
      case 'p': put(h('p', { text: b.text })); break;
      case 'h': put(h('h3', { text: b.text })); break;
      case 'quote': put(h('p', { class: 'quote', text: b.text })); break;
      case 'note': put(h('p', { class: 'note', text: b.text })); break;
      case 'list': put(h('ul', {}, b.items.map((t) => h('li', { text: t })))); break;
      case 'steps': put(h('ol', {}, b.items.map((t) => h('li', { text: t })))); break;
      case 'link': flush(); out.push(h('a', { class: 'btn block', href: b.to, text: b.label })); break;
      case 'check': flush(); out.push(checkBlock(hid, b)); break;
      case 'acro':
        flush();
        out.push(card(...b.items.map((it) =>
          h('div', { class: 'acro' }, h('span', { class: 'letter', text: it.l }),
            h('div', {}, h('b', { text: it.name }), h('small', { text: it.en }), h('p', { text: it.text }))))));
        break;
      case 'details':
        flush();
        out.push(h('details', { class: 'card fold' }, h('summary', { text: b.title }), renderBlocks(hid, b.blocks).map(unwrapCard)));
        break;
      case 'myths':
        flush();
        out.push(...b.items.map(([myth, sample], i) => card(
          h('p', { class: 'myth', text: `${i + 1}. ${myth}` }),
          sample ? h('p', { class: 'muted small', text: `範例挑戰：${sample}` }) : null,
          h('textarea', { rows: 2, placeholder: '我的挑戰：', value: store.fill(hid, b.key, i),
            oninput: (e) => store.setFill(hid, b.key, i, e.target.value) }))));
        break;
      case 'quiz':
        flush();
        out.push(...b.items.map((q, i) => {
          const fb = h('p', { class: 'quiz-fb' });
          const btns = q.opts.map((o, k) => h('button', {
            type: 'button', class: 'quiz-opt',
            onclick: () => {
              btns.forEach((x, j) => x.classList.toggle('picked', j === k));
              if (q.ans == null) { fb.textContent = '這一題兩個選項都有道理，原書沒有附答案。'; return; }
              btns.forEach((x, j) => x.classList.toggle('right', j === q.ans));
              fb.textContent = k === q.ans ? '✓ 這是比較有效的做法。' : '這是很常見的想法。比較有效的做法是標出來的那一個。';
            },
          }, h('b', { text: `${String.fromCharCode(65 + k)}　` }), o));
          return card(h('p', { class: 'myth', text: `第 ${i + 1} 題` }), btns, fb);
        }));
        out.push(h('p', { class: 'muted small', text: '參考答案依講義內容判斷，原書未附答案。' }));
        break;
      case 'table':
        flush();
        out.push(card(...b.rows.map((r) =>
          h('div', { class: 'trow' }, h('h4', { text: r[0] }),
            r.slice(1).map((cell, i) => h('p', {}, h('b', { text: `${b.head[i + 1]}：` }), cell))))));
        break;
    }
  }
  flush();
  return out;
}

// ---------- 我的 ----------

export function me() {
  const { cards } = store.counts();
  return {
    tab: 'me', title: '',
    node: h('div', {},
      pageHead('我的'),
      card(
        rowLink('#/me/toolbox', '我的工具箱', '危機模式會列出這裡的項目'),
        rowLink('#/urge', '我的衝動卡', '痛苦耐受作業單 3', cards),
        rowLink('#/me/backup', '備份與還原', '匯出或匯入你的紀錄'),
        rowLink('#/me/about', '關於這個 APP'),
      ),
      card(h('p', { class: 'muted', text: '你的所有紀錄只存在這支手機上，不會上傳到任何地方。' })),
    ),
  };
}

export function toolbox() {
  const groups = pickedGroups();
  const empty = !groups.length;
  return {
    tab: 'me', title: '',
    node: h('div', {},
      back('#/me', '我的'),
      pageHead('我的工具箱', '平常先準備好'),
      empty ? card(h('p', { class: 'muted', text: '還沒有勾選任何項目。到下面的講義勾選對你有用的方法，危機模式就會列出來。' })) : null,
      groups.map((s) => card(
        h('div', { class: 'row' }, h('h3', { text: s.name }), h('a', { class: 'small', href: `#/handouts/${s.hid}`, text: '編輯' })),
        s.groups.map((g) => [h('p', { class: 'group-title', text: g.title }), h('ul', {}, g.items.map((t) => h('li', { text: t })))]),
      )),
      card(
        h('h3', { text: '去勾選' }),
        PICK_SOURCES.map((s) => rowLink(`#/handouts/${s.hid}`, s.name)),
      ),
    ),
  };
}

export function backup() {
  const st = store.getState();
  const status = h('p', { class: 'muted', text: st.lastExport ? `上次匯出：${fmtDate(st.lastExport)}` : '還沒有匯出過。' });
  const area = h('div', {});

  async function doExport() {
    const text = store.exportJSON();
    const name = `dbt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'DBT 技巧備份' });
      } else {
        const a = h('a', { href: URL.createObjectURL(file), download: name });
        document.body.append(a);
        a.click();
        a.remove();
      }
      status.textContent = `上次匯出：${fmtDate(store.getState().lastExport)}`;
    } catch {
      // user cancelled the share sheet
    }
  }

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    fileInput.value = '';
    if (!f) return;
    const text = await f.text();
    area.replaceChildren(confirmBar('匯入會用備份檔取代這支手機上目前所有的紀錄。確定要匯入嗎？', '匯入', () => {
      try {
        store.importJSON(text);
        toast('已匯入');
        location.hash = '#/me';
      } catch (e) {
        area.replaceChildren(h('p', { class: 'warn', text: e.message || '無法讀取這個檔案。' }));
      }
    }));
  });

  return {
    tab: 'me', title: '',
    node: h('div', {},
      back('#/me', '我的'),
      pageHead('備份與還原'),
      card(
        h('p', { text: '你的紀錄只存在這支手機的瀏覽器裡。換手機、刪掉 APP 或清除 Safari 資料時，紀錄會消失，所以請定期匯出備份檔，存到檔案 App、雲端硬碟或寄給自己。' }),
        h('p', { class: 'muted small', text: '小提醒：把 APP「加入主畫面」來使用，比較不會被 Safari 自動清除資料。' }),
        status,
        h('button', { class: 'btn block', type: 'button', text: '匯出備份檔', onclick: doExport }),
      ),
      card(
        h('h3', { text: '從備份還原' }),
        h('p', { class: 'muted', text: '選擇之前匯出的 .json 備份檔。' }),
        h('button', { class: 'btn ghost block', type: 'button', text: '選擇備份檔', onclick: () => fileInput.click() }),
        fileInput,
        area,
      ),
    ),
  };
}

export function about() {
  return {
    tab: 'me', title: '',
    node: h('div', {},
      back('#/me', '我的'),
      pageHead('關於這個 APP'),
      card(
        h('p', { text: SOURCE }),
        h('p', { text: '這個 APP 是學習和練習 DBT 技巧的輔助工具，不能取代專業的治療。' }),
        h('p', { text: '你填寫的所有內容只存在這支手機上，不會上傳到任何伺服器，也沒有任何追蹤或分析程式。' }),
      ),
      card(h('p', { class: 'muted small', text: '版本：第四階段（危機生存技巧、情緒調節、了了分明、人際效能）' })),
    ),
  };
}
