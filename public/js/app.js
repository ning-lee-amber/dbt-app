import { runLeave } from './dom.js';
import { requestPersist } from './store.js';
import * as pages from './pages.js';
import * as forms from './forms.js';
import * as crisis from './crisis.js';
import * as emo from './emotion.js';

const routes = [
  [/^#\/today$/, pages.today],
  [/^#\/records$/, forms.records],
  [/^#\/records\/new$/, () => forms.logForm(null)],
  [/^#\/records\/([\w-]+)$/, (m) => forms.logForm(m[1])],
  [/^#\/emotion\/new(\?full=1)?$/, (m) => emo.emotionForm(null, !!m[1])],
  [/^#\/emotion\/([\w-]+)$/, (m) => emo.emotionForm(m[1])],
  [/^#\/change\/new(?:\?log=([\w-]+))?$/, (m) => emo.changeFlow(null, m[1])],
  [/^#\/change\/([\w-]+)$/, (m) => emo.changeFlow(m[1])],
  [/^#\/checkin$/, () => emo.checkinPage(null)],
  [/^#\/checkin\/(\d{4}-\d{2}-\d{2})$/, (m) => emo.checkinPage(m[1])],
  [/^#\/tools$/, pages.tools],
  [/^#\/handouts$/, pages.handouts],
  [/^#\/handouts\/([\w-]+)$/, (m) => pages.handout(m[1])],
  [/^#\/me$/, pages.me],
  [/^#\/me\/toolbox$/, pages.toolbox],
  [/^#\/me\/backup$/, pages.backup],
  [/^#\/me\/about$/, pages.about],
  [/^#\/urge$/, forms.urgeList],
  [/^#\/urge\/new$/, () => forms.urgeForm(null)],
  [/^#\/urge\/([\w-]+)$/, (m) => forms.urgeForm(m[1])],
  [/^#\/guide\/(muscle|senses)$/, (m) => crisis.guide(m[1], false)],
  [/^#\/crisis$/, crisis.entry],
  [/^#\/crisis\/stop$/, crisis.stop],
  [/^#\/crisis\/tip$/, crisis.tip],
  [/^#\/crisis\/urge(?:\?card=([\w-]+))?$/, (m) => crisis.urge(m[1])],
  [/^#\/crisis\/distract$/, crisis.distract],
  [/^#\/crisis\/hold$/, crisis.hold],
  [/^#\/crisis\/guide\/(muscle|senses)$/, (m) => crisis.guide(m[1], true)],
  [/^#\/crisis\/end$/, crisis.end],
];

const app = document.getElementById('app');
const titleEl = document.getElementById('topbar-title');

function render() {
  runLeave();
  const hash = location.hash || '#/today';
  let view = null;
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) { view = fn(m); break; }
  }
  if (!view) { location.replace('#/today'); return; }

  document.body.classList.toggle('dark', !!view.dark);
  titleEl.textContent = view.title || '';
  app.replaceChildren(view.node);
  for (const a of document.querySelectorAll('#tabs a')) a.classList.toggle('on', a.dataset.tab === view.tab);
  window.scrollTo(0, 0);
}

document.getElementById('sos').addEventListener('click', () => { location.hash = '#/crisis'; });
window.addEventListener('hashchange', render);
render();
requestPersist();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
