'use strict';

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
  if (which === 'login') screenLogin.classList.add('active');
  if (which === 'dashboard') screenDashboard.classList.add('active');
  if (which === 'objective') screenObjective.classList.add('active');
  if (which === 'stub') document.getElementById('screen-stub').classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.go = go; // used by the stub button

/* ===== Login form ===== */
const username = el('username');
const password = el('password');
const loginErr  = el('login-error');

document.querySelector('.toggle-eye').addEventListener('click', () => {
  password.type = password.type === 'password' ? 'text' : 'password';
});

document.querySelector('.hint-row a').addEventListener('click', (e) => {
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

/* ===== Data ===== */
const leads = [
  { name: 'Anan Chaiyakul', gender: 'M', age: 40, income: 48000, offers: ['Car for Cash', 'Credit Life Insurance'], win: 78, approve: 'High' },
  { name: 'Pimchanok S.',  gender: 'F', age: 36, income: 62000, offers: ['Car for Cash'], win: 62, approve: 'Medium' },
  { name: 'Somsak T.',     gender: 'M', age: 45, income: 41000, offers: ['Refinance'], win: 35, approve: 'Low' },
  { name: 'Nattaporn K.',  gender: 'F', age: 29, income: 52000, offers: ['Car for Cash', 'Credit Life Insurance'], win: 84, approve: 'High' },
];

const OFFER_OPTIONS = [
  'Car for Cash',
  'Refinance',
  'Personal Loan',
  'Credit Life Insurance'
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
    const key = th.dataset.key;
    let aria = 'none';
    if (key === sortState.key) aria = sortState.dir === 'asc' ? 'ascending' : (sortState.dir === 'desc' ? 'descending' : 'none');
    th.setAttribute('aria-sort', aria);
  });
}

function bindHeaderSorting() {
  document.querySelectorAll('.th-sort').forEach(th => {
    th.addEventListener('click', () => cycleSort(th.dataset.key));
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycleSort(th.dataset.key); }
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
  rows.innerHTML = '';

  let ordered = leads.map((ld, i) => ({ ld, i }));
  if (sortState.key && sortState.dir) ordered.sort(compareItems);

  ordered.forEach(({ ld, i }) => {
    const row = document.createElement('div');
    row.className = 'trow';
    row.setAttribute('role','row');

    row.innerHTML = `
      <div class="cell">${ld.name}<div class="row-actions">
    <button class="btn-select btn-select-row" type="button" data-index="${i}">Select Prospect</button>
  </div></div>
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
    row.querySelector('.offer-cell').appendChild(renderOfferBadges(ld.offers, i));

row.querySelector('.btn-select-row').addEventListener('click', () => {
  // Open Objective screen in a NEW TAB with the selected lead index in the URL
  const url = new URL(window.location.href);
  url.searchParams.set('lead', String(i));  // pass which lead was selected
  url.hash = 'objective';                   // land on the Objective screen
  window.open(url.toString(), '_blank', 'noopener');
});


  });
}

/* ===== Buttons ===== */
el('btn-select-prospect').addEventListener('click', () => go('objective'));

/* ===== Screen 3 chips ===== */
const chips = new Set(['Car for Cash Loan']);
const chipWrap = el('objective-chips');

function drawChips(){
  chipWrap.innerHTML = '';
  chips.forEach(ch => {
    const b = document.createElement('button');
    b.className = 'text-btn';
    b.innerHTML = ch + ' ×';
    b.title = 'Remove objective';
    b.addEventListener('click', () => { chips.delete(ch); drawChips(); });
    chipWrap.appendChild(b);
  });
}
drawChips();

el('btn-add-objective').addEventListener('click', () => {
  const sel = document.createElement('select');
  sel.className = 'select';
  sel.innerHTML = `
    <option selected disabled>Choose objective…</option>
    <option>Car for Cash Loan</option>
    <option>Refinance</option>
    <option>Personal Loan</option>
    <option>Credit Life Insurance</option>`;
  sel.addEventListener('change', () => {
    const val = sel.value;
    if (val && !chips.has(val) && chips.size < 3) { chips.add(val); drawChips(); }
    sel.remove();
  });
  sel.style.marginTop = '8px';
  sel.setAttribute('aria-label','Add objective');
  document.querySelector('#screen-objective .section .row:nth-of-type(2)').after(sel);
});

el('btn-back-dashboard').addEventListener('click', () => go('dashboard'));

/* ===== Pics toggle ===== */
document.querySelectorAll('#pic-choices .pic').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#pic-choices .pic').forEach(x => x.setAttribute('aria-pressed','false'));
    btn.setAttribute('aria-pressed','true');
  });
});

/* ===== Drag & Drop ===== */
let dragged = null;
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('dragstart', () => { dragged = chip; });
  chip.addEventListener('dragend', () => { dragged = null; });
});
document.querySelectorAll('.dropzone').forEach(zone => {
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', () => {
    if (!dragged) return;
    zone.textContent = dragged.textContent;
    zone.classList.add('filled');
  });
});

/* ===== Validation ===== */
function isObjectiveValid(){ return chips.size >= 1; }
function isQ1Answered(){ return !!document.querySelector('input[name="q1"]:checked'); }
function isPicChosen(){ return !!document.querySelector('#pic-choices .pic[aria-pressed="true"]'); }
function isDndDone(){ return document.querySelectorAll('.dropzone.filled').length >= 1; }
function buildErrorMessage(errors){ return 'Please complete:\n- ' + errors.join('\n- '); }

el('btn-next').addEventListener('click', () => {
  const errors = [];
  if (!isObjectiveValid()) errors.push('Select at least one objective');
  if (!isQ1Answered()) errors.push('Answer how often car is used');
  if (!isPicChosen()) errors.push('Choose an installment range');
  if (!isDndDone()) errors.push('Complete the drag-and-drop action');
  if (errors.length) { alert(buildErrorMessage(errors)); return; }
  alert('Great! Proceeding to the next step (stubbed for prototype).');
  go('stub');
});

el('btn-reset').addEventListener('click', () => {
  document.querySelectorAll('input[name="q1"]').forEach(r => r.checked = false);
  document.querySelectorAll('#pic-choices .pic').forEach(x => x.setAttribute('aria-pressed','false'));
  document.querySelectorAll('.dropzone').forEach(z => { z.textContent = 'Drop here'; z.classList.remove('filled'); });
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
  editingIndex = index;
  chosenOffers = new Set(leads[index].offers || []);
  populateOfferOptions(chosenOffers);
  offerModal.classList.add('open');
  setTimeout(() => {
    const first = offerOptionsWrap.querySelector('input[type="checkbox"]');
    if (first) first.focus();
  }, 0);
}
function closeOfferModal() {
  offerModal.classList.remove('open');
  editingIndex = null;
  chosenOffers = new Set();
}
offerSave.addEventListener('click', () => {
  if (editingIndex == null) return closeOfferModal();
  leads[editingIndex].offers = Array.from(chosenOffers);
  document.querySelectorAll(`.offer-cell[data-index="${editingIndex}"]`).forEach(cell => {
    cell.innerHTML = '';
    cell.appendChild(renderOfferBadges(leads[editingIndex].offers, editingIndex));
  });
  closeOfferModal();
});
offerCancel.addEventListener('click', closeOfferModal);
offerClose.addEventListener('click', closeOfferModal);
offerModal.addEventListener('click', (e) => { if (e.target === offerModal) closeOfferModal(); });

offerSelectAll.addEventListener('click', () => {
  chosenOffers = new Set(OFFER_OPTIONS);
  offerOptionsWrap.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
});
offerClear.addEventListener('click', () => {
  chosenOffers.clear();
  offerOptionsWrap.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
});

/* ===== On load ===== */
function bindHeaderSortingAll(){
  bindHeaderSorting();
  updateHeaderIndicators();
  renderLeads();
}
bindHeaderSortingAll();

// If the URL has #objective (e.g., opened from a row), show that screen on load
(function openFromUrl(){
  if (window.location.hash === '#objective') {
    // Optionally read which lead was selected:
    // const leadIndex = new URLSearchParams(window.location.search).get('lead');
    // TODO: use leadIndex to prefill the prospect page if you want.
    go('objective');
  }
})();

// Enable "Other" text field only when "Other" is selected
const q2Radios = document.querySelectorAll('input[name="q2"]');
const q2OtherInput = document.getElementById('q2-other');

q2Radios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'other' && radio.checked) {
      q2OtherInput.disabled = false;
      q2OtherInput.focus();
    } else {
      q2OtherInput.disabled = true;
      q2OtherInput.value = '';
    }
  });
});

