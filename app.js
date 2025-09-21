'use strict';

/* ===== Helpers & screens ===== */
const el = (id) => document.getElementById(id);
const screenLogin = el('screen-login');
const screenDashboard = el('screen-dashboard');
const screenObjective = el('screen-objective');

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
  if (which === 'stub') el('screen-stub')?.classList.add('active');
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
  { name: 'ลูกค้า-10367656', gender: 'M', age: 30, income: 15000,  offers: ['Car for Cash'], win: 40, approve: 'Medium' },
  { name: 'ลูกค้า-00405606', gender: 'M', age: 31, income: 25000,  offers: ['Car for Cash'], win: 80, approve: 'High' },
  { name: 'ลูกค้า-02083104', gender: 'F', age: 32, income: 40000,  offers: ['Car for Cash'], win: 5,  approve: 'Low' },
  { name: 'ลูกค้า-02305438', gender: 'F', age: 33, income: 25000,  offers: ['Car for Cash'], win: 85, approve: 'High' },
  { name: 'ลูกค้า-02518333', gender: 'F', age: 34, income: 250000, offers: ['Car for Cash'], win: 40, approve: 'Medium' },
  { name: 'ลูกค้า-04188369', gender: 'F', age: 35, income: 250000, offers: ['Car for Cash'], win: 45, approve: 'Medium' },
  { name: 'ลูกค้า-04423583', gender: 'F', age: 36, income: 25000,  offers: ['Car for Cash'], win: 90, approve: 'High' },
  { name: 'ลูกค้า-04666492', gender: 'F', age: 37, income: 40000,  offers: ['Car for Cash'], win: 20, approve: 'Low' },
  { name: 'ลูกค้า-05350772', gender: 'F', age: 38, income: 75000,  offers: ['Car for Cash'], win: 80, approve: 'High' },
  { name: 'ลูกค้า-05788390', gender: 'F', age: 39, income: 40000,  offers: ['Car for Cash'], win: 45, approve: 'Medium' },
  { name: 'ลูกค้า-05810695', gender: 'M', age: 48, income: 15000,  offers: ['Car for Cash'], win: 30, approve: 'Low' },
  { name: 'ลูกค้า-05868036', gender: 'M', age: 30, income: 150000, offers: ['Car for Cash'], win: 30, approve: 'Low' },
  { name: 'ลูกค้า-05875799', gender: 'F', age: 31, income: 250000, offers: ['Car for Cash'], win: 60, approve: 'Medium' },
  { name: 'ลูกค้า-05918670', gender: 'F', age: 32, income: 60000,  offers: ['Car for Cash'], win: 5,  approve: 'Low' },
  { name: 'ลูกค้า-05962888', gender: 'F', age: 33, income: 25000,  offers: ['Car for Cash'], win: 35, approve: 'Low' },
  { name: 'ลูกค้า-05963546', gender: 'F', age: 34, income: 75000,  offers: ['Car for Cash'], win: 10, approve: 'Low' },
  { name: 'ลูกค้า-05965946', gender: 'F', age: 35, income: 60000,  offers: ['Car for Cash'], win: 65, approve: 'Medium' },
  { name: 'ลูกค้า-05971108', gender: 'F', age: 36, income: 150000, offers: ['Car for Cash'], win: 95, approve: 'High' },
  { name: 'ลูกค้า-05980093', gender: 'M', age: 37, income: 25000,  offers: ['Car for Cash'], win: 25, approve: 'Low' },
  { name: 'ลูกค้า-05984386', gender: 'M', age: 38, income: 75000,  offers: ['Car for Cash'], win: 55, approve: 'Medium' },
  { name: 'ลูกค้า-05985880', gender: 'M', age: 39, income: 75000,  offers: ['Car for Cash'], win: 35, approve: 'Low' },
  { name: 'ลูกค้า-05986844', gender: 'M', age: 40, income: 25000,  offers: ['Car for Cash'], win: 25, approve: 'Low' },
  { name: 'ลูกค้า-05990538', gender: 'F', age: 41, income: 15000,  offers: ['Car for Cash'], win: 65, approve: 'Medium' },
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
      <div class="cell">${ld.gender === 'M' ? '♂' : '♀'}</div>
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
  // Reset basique pour les groupes présents dans ta page 3 actuelle
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  // Réinitialiser les champs "Other" et les désactiver
  document.querySelectorAll('input[data-other-input]').forEach(ctrl => {
    const targetSel = ctrl.getAttribute('data-other-input');
    const target = targetSel ? document.querySelector(targetSel) : null;
    if (target) { target.value = ''; target.disabled = true; }
  });
  // Réinitialiser les selects
  document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
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
