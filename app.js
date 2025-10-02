'use strict';

/* ===== Helpers & screens ===== */
const el = (id) => document.getElementById(id);
const screenLogin = el('screen-login');
const screenDashboard = el('screen-dashboard');
const screenObjective = el('screen-objective');
const screenFit = el('screen-fit');

/* ===== Answers storage ===== */
const ANSWERS_KEY = 'pp-answers-v1';

/* ===== Gemini summarization (prototype) ===== */
// ⚠️ Pour du prototype UNIQUEMENT côté navigateur.
// En prod, utilise un proxy serveur (voir plus bas).
const GEMINI_API_KEY = 'AIzaSyCRTkDKpyfPPLZKq3iQSNx1xC1QR0mS2zs'; // ← remplace pour tester
const GEMINI_MODEL = 'gemini-2.5-flash'; // modèle rapide / bon pour résumé

function buildSummaryPrompt(answersObj) {
  // Transforme tes réponses en texte « matière première » pour l’IA
  const lines = [];
  const labels = {
    q1:'Card usage', q2:'Payment habit', q3:'Late/Overdue (card)', q4:'Total min pay (cards)',
    q5:'Other loans', q6:'Monthly debt pay', q7:'Income (THB)', q8:'Total credit limit',
    q9:'Post-expense situation', q10:'Main challenge', q11:'Regular income deposit',
    q12:'Bureau late (3y)', q13:'Employment type/tenure', q14:'Informal debt',
    q15:'Priority factor', q16:'Preferred collateral'
  };

  for (const [k,v] of Object.entries(answersObj)) {
    let val = '';
    if (Array.isArray(v)) val = v.join(', ');
    else if (v && typeof v === 'object' && v.choice) val = v.detail ? `${v.choice} — ${v.detail}` : v.choice;
    else val = String(v ?? '');
    lines.push(`- ${labels[k] || k}: ${val}`);
  }

  return [
    'You are a loan officer assistant. Summarize the client answers into a concise, helpful brief.',
    'Goals:',
    '1) 3–6 bullet points (clear, non-redundant)',
    '2) One-sentence recommendation (debt consolidation fit)',
    '3) Optional cautions/next steps',
    '',
    'Answers:',
    ...lines
  ].join('\n');
}

async function summarizeWithGemini(answersObj) {
  const body = {
    contents: [{
      role: 'user',
      parts: [{ text: buildSummaryPrompt(answersObj) }]
    }]
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) }
  );

  if (!res.ok) {
    const errTxt = await res.text().catch(()=>`${res.status} ${res.statusText}`);
    throw new Error(`Gemini API error: ${res.status} ${res.statusText}\n${errTxt}`);
  }

  const data = await res.json();
  // Format de réponse: data.candidates[0].content.parts[].text
  const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n').trim();
  return text || '(no summary)';
}

function renderGeminiSummary(text) {
  const host = document.getElementById('fit-gemini-body');
  if (host) host.textContent = text;
}


// Charge les réponses sauvegardées (si existantes)
let answers = {};
try {
  answers = JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}');
} catch { answers = {}; }

// Sauvegarder en localStorage
function persistAnswers() {
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

// Nettoyer tout
function clearAnswers() {
  answers = {};
  localStorage.removeItem(ANSWERS_KEY);
}

// Lit la valeur "other" si le contrôle pointe vers un input texte
function readOtherIfAny(ctrl) {
  const targetSel = ctrl.getAttribute('data-other-input');
  if (!targetSel) return null;
  const target = document.querySelector(targetSel);
  return target && !target.disabled ? target.value.trim() : null;
}

/**
 * Sérialise tous les formulaires (Q1–Q16) :
 * - checkboxes => tableau des valeurs cochées
 * - radios => valeur choisie (ou texte "other" si fourni)
 * - select / input => valeur simple
 */
function collectAnswers() {
  const forms = [
    el('form-lifestyle'),
    el('form-borrow'),
    el('form-qualification'),
    el('form-preference'),
  ].filter(Boolean);

  const next = {};

  forms.forEach((form) => {
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      const { name, type } = field;
      if (!name) return;

      // cases à cocher (multi)
      if (type === 'checkbox') {
        if (!next[name]) next[name] = [];
        if (field.checked) {
          if (field.value === 'other') {
            const txt = readOtherIfAny(field);
            if (txt) next[name].push(txt);
          } else {
            next[name].push(field.value);
          }
        }
        return;
      }

      // radios
      if (type === 'radio') {
        if (field.checked) {
          if (field.value === 'other') {
            const txt = readOtherIfAny(field);
            next[name] = txt || 'other';
          } else {
            // cas particulier Q13: "ft-gt1" déclenche une précision libre
            if (name === 'q13' && field.value === 'ft-gt1') {
              const extra = document.querySelector('#q13-ft-gt1')?.value?.trim() || '';
              next[name] = { choice: field.value, detail: extra };
            } else {
              next[name] = field.value;
            }
          }
        }
        return;
      }

      // select / input number / texte
      if (field.tagName === 'SELECT') {
        next[name] = field.value;
        return;
      }
      if (type === 'number' || type === 'text') {
        // garde les champs isolés (income, autres "other" explicites si jamais utiles)
        // on n’écrase pas s’ils sont déjà mémorisés via le radio/checkbox "other"
        if (!next[name]) next[name] = field.value.trim();
        return;
      }
    });
  });

  answers = next;
  persistAnswers();
}

/**
 * Recharge les formulaires depuis `answers` (pré-cochage / pré-remplissage)
 */
function loadAnswersIntoForms() {
  const forms = [
    el('form-lifestyle'),
    el('form-borrow'),
    el('form-qualification'),
    el('form-preference'),
  ].filter(Boolean);

  forms.forEach((form) => {
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      const { name, type, value } = field;
      if (!name) return;
      const saved = answers[name];

      // checkboxes
      if (type === 'checkbox') {
        if (Array.isArray(saved)) {
          if (value === 'other') {
            // on essaie d’associer le texte "other" si présent
            const targetSel = field.getAttribute('data-other-input');
            if (targetSel) {
              const target = document.querySelector(targetSel);
              if (target) {
                // Si 'saved' contient un texte qui ne fait pas partie des valeurs standards, on le met ici
                const standardVals = Array.from(form.querySelectorAll(`input[name="${name}"][type="checkbox"]`))
                  .map(cb => cb.value).filter(v => v !== 'other');
                const otherText = saved.find(s => !standardVals.includes(s));
                if (otherText) {
                  field.checked = true;
                  target.disabled = false;
                  target.value = otherText;
                }
              }
            }
          } else {
            field.checked = saved.includes(value);
          }
        }
        return;
      }

      // radios
      if (type === 'radio') {
        if (saved == null) return;
        if (typeof saved === 'object' && saved.choice) {
          // Cas Q13 avec détail
          field.checked = (saved.choice === value);
          if (saved.choice === 'ft-gt1') {
            const tgt = document.querySelector('#q13-ft-gt1');
            if (tgt) { tgt.disabled = false; tgt.value = saved.detail || ''; }
          }
        } else if (value === 'other') {
          // radio "other"
          const txt = readOtherIfAny(field);
          field.checked = (saved === 'other' || (txt && txt === saved));
          // si 'saved' est du texte, on le remet
          if (field.checked) {
            const targetSel = field.getAttribute('data-other-input');
            const target = targetSel ? document.querySelector(targetSel) : null;
            if (target) { target.disabled = false; target.value = typeof saved === 'string' ? saved : ''; }
          }
        } else {
          field.checked = (saved === value);
        }
        return;
      }

      // select
      if (field.tagName === 'SELECT') {
        if (saved != null) field.value = saved;
        return;
      }

      // number / text (pour income etc.)
      if (type === 'number' || type === 'text') {
        if (saved != null && typeof saved === 'string') field.value = saved;
        return;
      }
    });
  });
}

/* Affiche les réponses sur l'écran Fit (résumé simple) */
function renderFitAnswers() {
  const host = document.getElementById('fit-answers-body');
  if (!host) return;

  const saved = answers && Object.keys(answers).length ? answers : JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}');
  host.innerHTML = '';

  if (!saved || !Object.keys(saved).length) {
    host.innerHTML = '<div style="color:var(--muted);">No answers yet.</div>';
    return;
  }

  // libellés lisibles
  const labels = {
    q1: 'Main credit card usage',
    q2: 'Monthly card payment habit',
    q3: 'Late payment history (card)',
    q4: 'Total minimum monthly payment (all cards)',
    q5: 'Other current loans',
    q6: 'Total monthly debt repayment',
    q7: 'Monthly income (THB)',
    q8: 'Total credit limit',
    q9: 'Post-expense cash position',
    q10:'Main debt challenge',
    q11:'Regular income deposit',
    q12:'Credit bureau late in last 3 years',
    q13:'Employment type (and tenure)',
    q14:'Informal (non-institutional) debt',
    q15:'Most important consolidation factor',
    q16:'Preferred collateral',
  };

  // transforme en liste <dl>
  const dl = document.createElement('dl');
  dl.style.display = 'grid';
  dl.style.gridTemplateColumns = '1fr 2fr';
  dl.style.columnGap = '16px';
  dl.style.rowGap = '8px';
  dl.style.margin = 0;

  Object.entries(saved).forEach(([k, v]) => {
    const dt = document.createElement('dt');
    dt.textContent = labels[k] || k.toUpperCase();
    dt.style.fontWeight = '600';

    const dd = document.createElement('dd');
    let valText = '';

    if (Array.isArray(v)) {
      valText = v.join(', ');
    } else if (typeof v === 'object' && v !== null) {
      // cas Q13: { choice, detail }
      if (v.choice) {
        valText = v.detail ? `${v.choice} — ${v.detail}` : v.choice;
      } else {
        valText = JSON.stringify(v);
      }
    } else {
      valText = String(v ?? '');
    }

    dd.textContent = valText || '—';
    dl.appendChild(dt); dl.appendChild(dd);
  });

  host.appendChild(dl);
}
// Collecte les réponses à chaque changement dans les formulaires


/* ===== Theme handling ===== */
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('pp-theme'); // 'light' | 'dark' | null

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  const isDark = mode === 'dark';
  const btn = el('theme-toggle');
  const lab = el('theme-label');
  const emo = el('theme-emoji');
  if (btn) btn.setAttribute('aria-pressed', String(isDark));
  if (lab) lab.textContent = isDark ? 'Light' : 'Dark';
  if (emo) emo.textContent = isDark ? '☀️' : '🌙';
}
function initTheme() {
  const mode = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
  applyTheme(mode);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || (prefersDark ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('pp-theme', next);
}
initTheme();
const themeToggleBtn = el('theme-toggle');
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

/* ===== Navigation ===== */
function go(which) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (which === 'login' && screenLogin) screenLogin.classList.add('active');
  if (which === 'dashboard' && screenDashboard) screenDashboard.classList.add('active');
  if (which === 'objective' && screenObjective) screenObjective.classList.add('active');
  if (which === 'fit' && screenFit) screenFit.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.go = go; // utilisé par des attributs inline éventuels

/* ===== Login form ===== */
const username = el('username');
const password = el('password');
const loginErr  = el('login-error');

document.querySelector('.toggle-eye')?.addEventListener('click', () => {
  if (!password) return;
  password.type = password.type === 'password' ? 'text' : 'password';
});

document.querySelector('.hint-row a')?.addEventListener('click', (e) => {
  e.preventDefault();
  alert('Website still in development');
});

function getInitials(str) {
  return str.trim().split(/[\s\.@_\-]+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');
}

el('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!username.value.trim() || !password.value.trim()) {
    loginErr.textContent = 'Fill your email and your password';
    return;
  }
  loginErr.textContent = '';
  el('salesperson-name').textContent = username.value.trim();
  el('avatar').textContent = getInitials(username.value) || 'PP';
  go('dashboard');
  renderLeads();
});


/* ===== Data (generated from Excel) ===== */
const leads = [
  { name: 'ลูกค้า-10367656', gender: 'M', age: 30, income: 30000, offers: ['Car for Cash'], win: 60, approve: 'Low' },
  { name: 'ลูกค้า-00405606', gender: 'M', age: 31, income: 50000, offers: ['Car for Cash'], win: 80, approve: 'High' },
  { name: 'ลูกค้า-02083104', gender: 'F', age: 32, income: 80000, offers: ['Car for Cash'], win: 25, approve: 'Low' },
  { name: 'ลูกค้า-02305438', gender: 'F', age: 33, income: 50000, offers: ['Car for Cash'], win: 95, approve: 'High' },
  { name: 'ลูกค้า-02518333', gender: 'F', age: 34, income: 500000, offers: ['Car for Cash'], win: 65, approve: 'Medium' },
  { name: 'ลูกค้า-04188369', gender: 'F', age: 35, income: 500000, offers: ['Car for Cash'], win: 75, approve: 'Medium' },
  { name: 'ลูกค้า-04423583', gender: 'F', age: 36, income: 50000, offers: ['Car for Cash'], win: 90, approve: 'High' },
  { name: 'ลูกค้า-04666492', gender: 'F', age: 37, income: 80000, offers: ['Car for Cash'], win: 40, approve: 'Medium' },
  { name: 'ลูกค้า-05350772', gender: 'F', age: 38, income: 150000, offers: ['Car for Cash'], win: 95, approve: 'High' },
  { name: 'ลูกค้า-05788390', gender: 'F', age: 39, income: 80000, offers: ['Car for Cash'], win: 60, approve: 'Medium' },
  { name: 'ลูกค้า-05810695', gender: 'M', age: null, income: 30000, offers: ['Car for Cash'], win: 75, approve: 'Medium' },
  { name: 'ลูกค้า-05868036', gender: 'M', age: 30, income: 300000, offers: ['Car for Cash'], win: 40, approve: 'Low' },
  { name: 'ลูกค้า-05875799', gender: 'F', age: 31, income: 500000, offers: ['Car for Cash'], win: 95, approve: 'Medium' },
  { name: 'ลูกค้า-05918670', gender: 'F', age: 32, income: 120000, offers: ['Car for Cash'], win: 60, approve: 'Medium' },
  { name: 'ลูกค้า-05962888', gender: 'F', age: 33, income: 50000, offers: ['Car for Cash'], win: 70, approve: 'Medium' },
  { name: 'ลูกค้า-05963546', gender: 'F', age: 34, income: 150000, offers: ['Car for Cash'], win: 40, approve: 'Low' },
  { name: 'ลูกค้า-07051723', gender: 'F', age: 35, income: 50000, offers: ['Car for Cash'], win: 70, approve: 'Medium' },
  { name: 'ลูกค้า-07053935', gender: 'F', age: 36, income: 200000, offers: ['Car for Cash'], win: 55, approve: 'Medium' },
  { name: 'ลูกค้า-07176415', gender: 'F', age: 37, income: 500000, offers: ['Car for Cash'], win: 65, approve: 'Medium' },
  { name: 'ลูกค้า-07234928', gender: 'F', age: 38, income: 500000, offers: ['Car for Cash'], win: 95, approve: 'Medium' },
  { name: 'ลูกค้า-07237125', gender: 'M', age: 39, income: 50000, offers: ['Car for Cash'], win: 80, approve: 'Medium' },
  { name: 'ลูกค้า-07249758', gender: 'M', age: 30, income: 150000, offers: ['Car for Cash'], win: 85, approve: 'High' },
  { name: 'ลูกค้า-07260406', gender: 'F', age: 31, income: 200000, offers: ['Car for Cash'], win: 95, approve: 'High' },
];



const OFFER_OPTIONS = [
  'Car for Cash',
];

/* ===== Sorting ===== */
const approveRank = { 'Low': 0, 'Medium': 1, 'High': 2 };
const sortState = { key: '', dir: '' };

function valueFor(ld, key) {
  switch (key) {
    case 'name':   return ld.name;
    case 'gender': return ld.gender;
    case 'age':    return ld.age;
    case 'income': return ld.income;
    case 'offers': return (ld.offers || []).join(', ');
    case 'approve':return approveRank[ld.approve] ?? -1;
    case 'win':    return ld.win;
    default:       return null;
  }
}
function compareItems(a, b) {
  const va = valueFor(a.ld, sortState.key);
  const vb = valueFor(b.ld, sortState.key);
  let cmp = 0;
  if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
  else cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
  if (cmp === 0) cmp = a.i - b.i;
  return sortState.dir === 'asc' ? cmp : -cmp;
}
function cycleSort(key) {
  if (sortState.key !== key) {
    sortState.key = key; sortState.dir = 'desc';
  } else if (sortState.dir === 'desc') sortState.dir = 'asc';
  else if (sortState.dir === 'asc') { sortState.key = ''; sortState.dir = ''; }
  else sortState.dir = 'desc';
  updateHeaderIndicators();
  renderLeads();
}
function updateHeaderIndicators() {
  document.querySelectorAll('.th-sort').forEach(th => {
    const key = th.getAttribute('data-key');
    let aria = 'none';
    if (key === sortState.key) aria = sortState.dir === 'asc' ? 'ascending' : (sortState.dir === 'desc' ? 'descending' : 'none');
    th.setAttribute('aria-sort', aria);
  });
}
function bindHeaderSorting() {
  document.querySelectorAll('.th-sort').forEach(th => {
    th.addEventListener('click', () => cycleSort(th.getAttribute('data-key')));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycleSort(th.getAttribute('data-key')); }
    });
  });
}

/* ===== Rendering ===== */
function winClass(p){ if(p>=70) return 'p-high'; if(p>=40) return 'p-med'; return 'p-low'; }
function approveClass(a){ return a==='High'?'high':(a==='Medium'?'med':'low'); }

// Single clickable bubble with stacked lines
function renderOfferBadges(offers, index){
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'offer-bubble';
  button.setAttribute('data-index', String(index));

  const stack = document.createElement('div');
  stack.className = 'stack';

  if (offers && offers.length) {
    offers.forEach(txt => {
      const line = document.createElement('span');
      line.className = 'line';
      line.textContent = txt;
      stack.appendChild(line);
    });
  } else {
    const line = document.createElement('span');
    line.className = 'line muted';
    line.textContent = 'No offer selected';
    stack.appendChild(line);
  }

  const chevron = document.createElement('span');
  chevron.className = 'chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.textContent = '›';

  button.appendChild(stack);
  button.appendChild(chevron);
  button.addEventListener('click', () => openOfferModal(index));
  return button;
}

function renderLeads(){
  const rows = document.getElementById('lead-rows');
  if (!rows) return;
  rows.innerHTML = '';

  let ordered = leads.map((ld, i) => ({ ld, i }));
  if (sortState.key && sortState.dir) ordered.sort(compareItems);

  ordered.forEach(({ ld, i }) => {
    const row = document.createElement('div');
    row.className = 'trow';
    row.setAttribute('role','row');

    row.innerHTML = `
      <div class="cell">${ld.name}
        <div class="row-actions">
          <button class="btn-select btn-select-row" type="button" data-index="${i}">Select Prospect</button>
        </div>
      </div>
      <div class="cell">
  <img src="${ld.gender === 'M' ? './images/male.png' : './images/female.svg'}" 
       alt="${ld.gender === 'M' ? 'Male' : 'Female'}" 
       width="50" height="50">
</div>

      <div class="cell right">${ld.age}</div>
      <div class="cell right">${ld.income.toLocaleString('en-US')} THB</div>
      <div class="cell offer-cell" data-index="${i}"></div>
      <div class="cell">
        <div class="approve ${approveClass(ld.approve)}">
          <div class="approve-line">${ld.approve==='High'?'✓':ld.approve==='Medium'?'~':'✕'} <span>${ld.approve}</span></div>
        </div>
      </div>
      <div class="cell">
        <div class="approve ${winClass(ld.win)}">
          <div class="approve-line"><span>${ld.win}%</span></div>
        </div>
      </div>
    `;
    rows.appendChild(row);
    row.querySelector('.offer-cell')?.appendChild(renderOfferBadges(ld.offers, i));

    row.querySelector('.btn-select-row')?.addEventListener('click', () => {
      // Ouvrir l'écran 3 dans un nouvel onglet avec ancre
      const url = new URL(window.location.href);
      url.searchParams.set('lead', String(i));
      url.hash = 'objective';
      window.open(url.toString(), '_blank', 'noopener');
    });
  });
}

/* ===== Dashboard button -> Objective ===== */
el('btn-select-prospect')?.addEventListener('click', () => go('objective'));

/* ===== Back button ===== */
el('btn-back-dashboard')?.addEventListener('click', () => go('dashboard'));

/* ===== Fit button (collect + save + go) ===== */
el('btn-fit')?.addEventListener('click', () => {
  collectAnswers();     // 1) collecte dans `answers`
  persistAnswers();     // 2) persiste dans localStorage
  go('fit');            // 3) navigue
  renderFitAnswers();   // 4) affiche le résumé
});


/* ===== Generic "Other:" inputs enable/disable =====
   Active tous les inputs texte pointés par data-other-input
   quand la case/radio "Other" correspondante est cochée. */
function bindOtherInputs() {
  document.querySelectorAll('input[data-other-input]').forEach(ctrl => {
    const targetSel = ctrl.getAttribute('data-other-input');
    const target = targetSel ? document.querySelector(targetSel) : null;
    if (!target) return;
    const sync = () => { target.disabled = !ctrl.checked; if (ctrl.checked) target.focus(); else target.value = ''; };
    ctrl.addEventListener('change', sync);
    // état initial
    sync();
  });
}
bindOtherInputs();

/* ===== Next / Reset actions (validation allégée) ===== */
// Ici on ne force plus la sélection d’un objectif, ni les anciens Q1/Pics/DnD (qui n’existent plus).
el('btn-next')?.addEventListener('click', () => {
  alert('Great! Proceeding to the next step (stubbed for prototype).');
  go('stub');
});

el('btn-reset')?.addEventListener('click', () => {
  // Reset des contrôles
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);

  // Réinitialiser et désactiver tous les champs "Other"
  document.querySelectorAll('input[data-other-input]').forEach(ctrl => {
    const targetSel = ctrl.getAttribute('data-other-input');
    const target = targetSel ? document.querySelector(targetSel) : null;
    if (target) { target.value = ''; target.disabled = true; }
  });

  // Réinitialiser les selects
  document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);

  // Vider le stockage des réponses
  clearAnswers();

  // Effacer l’aperçu Fit si présent
  const host = document.getElementById('fit-answers-body');
  if (host) host.innerHTML = '<div style="color:var(--muted);">No answers yet.</div>';
});


/* ===== Modal logic ===== */
const offerModal = el('offer-modal');
const offerOptionsWrap = el('offer-options');
const offerSave = el('offer-save');
const offerCancel = el('offer-cancel');
const offerClose = el('offer-close');
const offerSelectAll = el('offer-select-all');
const offerClear = el('offer-clear');

let editingIndex = null;
let chosenOffers = new Set();

function populateOfferOptions(currentOffers) {
  if (!offerOptionsWrap) return;
  offerOptionsWrap.innerHTML = '';
  OFFER_OPTIONS.forEach(opt => {
    const row = document.createElement('label');
    row.className = 'option';
    row.innerHTML = `
      <input type="checkbox" value="${opt}">
      <span>${opt}</span>
    `;
    const cb = row.querySelector('input');
    cb.checked = currentOffers.has(opt);
    row.addEventListener('change', () => {
      cb.checked ? chosenOffers.add(opt) : chosenOffers.delete(opt);
    });
    offerOptionsWrap.appendChild(row);
  });
}

function openOfferModal(index) {
  if (!offerModal) return;
  editingIndex = index;
  chosenOffers = new Set(leads[index].offers || []);
  populateOfferOptions(chosenOffers);
  offerModal.classList.add('open');
  setTimeout(() => {
    const first = offerOptionsWrap?.querySelector('input[type="checkbox"]');
    if (first) first.focus();
  }, 0);
}
function closeOfferModal() {
  if (!offerModal) return;
  offerModal.classList.remove('open');
  editingIndex = null;
  chosenOffers = new Set();
}
offerSave?.addEventListener('click', () => {
  if (editingIndex == null) return closeOfferModal();
  leads[editingIndex].offers = Array.from(chosenOffers);
  document.querySelectorAll(`.offer-cell[data-index="${editingIndex}"]`).forEach(cell => {
    cell.innerHTML = '';
    cell.appendChild(renderOfferBadges(leads[editingIndex].offers, editingIndex));
  });
  closeOfferModal();
});
offerCancel?.addEventListener('click', closeOfferModal);
offerClose?.addEventListener('click', closeOfferModal);
offerModal?.addEventListener('click', (e) => { if (e.target === offerModal) closeOfferModal(); });

offerSelectAll?.addEventListener('click', () => {
  chosenOffers = new Set(OFFER_OPTIONS);
  offerOptionsWrap?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
});
offerClear?.addEventListener('click', () => {
  chosenOffers.clear();
  offerOptionsWrap?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
});

/* ===== Header sorting & first render ===== */
function bindHeaderSortingAll(){
  bindHeaderSorting();
  updateHeaderIndicators();
  renderLeads();
}
bindHeaderSortingAll();

/* ===== Hash handling (open Objective directly) ===== */
(function openFromUrl(){
  if (window.location.hash === '#objective') {
    // const leadIndex = new URLSearchParams(window.location.search).get('lead');
    go('objective');
  }
})();

let currentLeadIndex = null;

function renderSelectedProspect(i) {
  const nameEl = el('prospect-name');
  const avEl   = el('prospect-avatar');
  const extra  = el('prospect-extra');
  if (i == null || !leads[i]) {
    if (nameEl) nameEl.textContent = 'No prospect selected';
    if (avEl)   avEl.textContent = '?';
    if (extra)  extra.textContent = '';
    currentLeadIndex = null;
    return;
  }
  const ld = leads[i];
  currentLeadIndex = i;
  if (nameEl) nameEl.textContent = ld.name;
  if (avEl)   avEl.textContent   = getInitials(ld.name);
  if (extra)  extra.textContent  = `${ld.gender === 'M' ? 'Male' : 'Female'} • ${ld.age} • ${ld.income.toLocaleString('en-US')} THB/month`;
}


(function openFromUrl(){
  if (window.location.hash === '#objective') {
    const idxStr = new URLSearchParams(window.location.search).get('lead');
    const idx = idxStr != null ? Number(idxStr) : NaN;
    if (!Number.isNaN(idx)) renderSelectedProspect(idx);
    go('objective');
  }
})();

// --- util: calc answered/total pour un conteneur donné
function calcAnsweredIn(container) {
  let total = 0, answered = 0;

  // groupés par "name" (radios/checkboxes)
  const groups = new Map();
  container.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(inp => {
    const name = inp.name || inp.getAttribute('name');
    if (!name) return;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(inp);
  });
  groups.forEach(arr => {
    total += 1;
    if (arr.some(i => i.checked)) answered += 1;
  });

  // selects (chaque select compte pour 1)
  const selects = container.querySelectorAll('select');
  total += selects.length;
  selects.forEach(sel => { if (sel.selectedIndex > 0) answered += 1; });

  return { answered, total };
}

// --- met à jour le badge d'une section <details>
function updateSectionProgress(detailsId, badgeId) {
  const details = document.getElementById(detailsId);
  const badge = document.getElementById(badgeId);
  if (!details || !badge) return;
  const body = details.querySelector('.accordion__body');
  const { answered, total } = calcAnsweredIn(body || details);
  badge.textContent = `${answered}/${total} answered`;
}

// --- met à jour toutes les sections
function updateAllSectionProgress() {
  updateSectionProgress('accord-lifestyle',   'progress-lifestyle');
  updateSectionProgress('accord-borrow',   'progress-borrow');
  updateSectionProgress('accord-qualification',  'progress-qualification');
  updateSectionProgress('accord-preference', 'progress-preference');
}

// --- écouter les changements du formulaire
document.getElementById('form-lifestyle')?.addEventListener('change', updateAllSectionProgress);
document.getElementById('form-borrow')?.addEventListener('change', updateAllSectionProgress);
document.getElementById('form-qualification')?.addEventListener('change', updateAllSectionProgress);
document.getElementById('form-preference')?.addEventListener('change', updateAllSectionProgress);

// --- init au chargement (après que le DOM de la page 3 est rendu)
updateAllSectionProgress();

// --- mémoriser l'état open/close de chaque accordéon
['accord-lifestyle','accord-oblig','accord-income','accord-profile'].forEach(id => {
  const det = document.getElementById(id);
  if (!det) return;
  const key = `accordion-open:${id}`;
  const saved = localStorage.getItem(key);
  if (saved !== null) det.open = saved === '1';
  det.addEventListener('toggle', () => {
    localStorage.setItem(key, det.open ? '1' : '0');
  });
});


// ===== Voice Overlay (Siri-like) =====
(function(){
  const btn = document.getElementById('btn-record');
  const overlay = document.getElementById('voice-overlay');
  const closeBtn = document.getElementById('voice-close');

  if(!btn || !overlay) return;

  let audioCtx = null;
  let analyser = null;
  let rafId = null;
  let mediaStream = null;
  const bars = () => Array.from(overlay.querySelectorAll('.bar'));

  function activateOverlay(){
    overlay.classList.add('active');
  }
  function deactivateOverlay(){
    overlay.classList.remove('active');
  }

  async function startListening(){
    activateOverlay();

    try{
      // Web Audio setup
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      const src = audioCtx.createMediaStreamSource(mediaStream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const render = () => {
        analyser.getByteFrequencyData(data);
        // take a few buckets across the spectrum for the 7 bars
        const seg = Math.floor(data.length / 7);
        bars().forEach((bar, i) => {
          let slice = data.slice(i*seg, (i+1)*seg);
          let avg = slice.reduce((a,b)=>a+b,0) / slice.length || 0;
          let scale = Math.max(0.35, Math.min(1.8, avg / 90)); // normalize
          bar.style.transform = `scaleY(${scale})`;
        });
        rafId = requestAnimationFrame(render);
      };
      render();
    }catch(err){
      // Mic not granted or not available → keep idle animation
      console.warn('Mic unavailable, using idle animation:', err);
    }
  }

  function stopListening(){
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    if (mediaStream){
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
    if (audioCtx){
      // Close audio context to free resources (ignore errors on some browsers)
      try { audioCtx.close(); } catch(e){}
      audioCtx = null;
    }

    // Reset bars back to idle (remove inline transforms)
    bars().forEach(bar => bar.style.transform = '');

    deactivateOverlay();
  }

  // Toggle by button
  btn.addEventListener('click', () => {
    if (!overlay.classList.contains('active')){
      startListening();
    } else {
      stopListening();
    }
  });

  // Close button + Escape
  if (closeBtn) closeBtn.addEventListener('click', stopListening);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) stopListening();
  });

  // Safety: stop when navigating away from screen
  window.addEventListener('hashchange', stopListening);
  window.addEventListener('beforeunload', stopListening);
})();

// Recharge les réponses si l’utilisateur revient sur la page
window.addEventListener('DOMContentLoaded', () => {
  if (Object.keys(answers).length) {
    loadAnswersIntoForms();
  }

  // Si l’écran visible au chargement est "fit", on affiche le résumé
  if (document.getElementById('screen-fit')?.classList.contains('active')) {
    renderFitAnswers();
  }
});

// Quand on navigue vers Fit via go(), on peut re-afficher
const _go = go;
go = function(which) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (which === 'login' && screenLogin) screenLogin.classList.add('active');
  if (which === 'dashboard' && screenDashboard) screenDashboard.classList.add('active');
  if (which === 'objective' && screenObjective) screenObjective.classList.add('active');
  if (which === 'fit' && screenFit) {
    screenFit.classList.add('active');
    renderFitAnswers();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ===== Bouton Summarize (Fit) ===== */
el('btn-summarize')?.addEventListener('click', async () => {
  // 1) s’assurer d’avoir les dernières réponses
  collectAnswers();
  persistAnswers();

  const host = document.getElementById('fit-gemini-body');
  if (host) host.textContent = 'Summarizing…';

  try {
    const saved = answers && Object.keys(answers).length ? answers
                  : JSON.parse(localStorage.getItem('pp-answers-v1') || '{}');

    if (!saved || !Object.keys(saved).length) {
      renderGeminiSummary('No answers to summarize yet.');
      return;
    }

    const summary = await summarizeWithGemini(saved);
    renderGeminiSummary(summary);
  } catch (e) {
    renderGeminiSummary(`⚠️ ${e.message}`);
  }
});
