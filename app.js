'use strict';

/* ------------- Keys & defaults ------------- */
const STORAGE_KEY = 'money_tracker_v3';
const USER_KEY = 'money_tracker_user_v3';
const CUSTOM_KEY = 'money_tracker_custom_v3';

const DEFAULTS = {
  settings: {
    categories: ['Food','Travel','Bills','Shopping','Salary','Other'],
    upiApps: ['GPay','PhonePe','Paytm'],
    cards: ['Canara','HDFC','SBI','Credit Card'],
    banks: ['Canara','HDFC','SBI']
  },
  custom: {
    accent: '#2563eb',
    currency: '₹'
  }
};

/* ------------- Storage helpers ------------- */
function loadStore(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { version:1, days:{}, settings: DEFAULTS.settings };
  }catch(e){ console.error(e); return { version:1, days:{}, settings: DEFAULTS.settings }; }
}
function saveStore(store){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

function loadUser(){ try{ const r=localStorage.getItem(USER_KEY); return r?JSON.parse(r):null;}catch{return null;} }
function saveUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); }

function loadCustom(){ try{ const r=localStorage.getItem(CUSTOM_KEY); return r?JSON.parse(r):DEFAULTS.custom;}catch{return DEFAULTS.custom;} }
function saveCustom(c){ localStorage.setItem(CUSTOM_KEY, JSON.stringify(c)); applyCustom(); }

/* ------------- DOM refs ------------- */
const authScreen = document.getElementById('authScreen');
const authForm = document.getElementById('authForm');
const authNameRow = document.getElementById('authNameRow');
const authNameInput = document.getElementById('authName');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const forgotBtn = document.getElementById('forgotBtn');
const authHint = document.getElementById('authHint');

const appRoot = document.getElementById('appRoot');
const navItems = document.querySelectorAll('.nav-item');
const mainMenu = document.getElementById('mainMenu');
const menuToggle = document.getElementById('menuToggle');
const themeToggleTop = document.getElementById('themeToggleTop');

const dateInput = document.getElementById('date');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const sumExpenseEl = document.getElementById('sumExpense');
const sumIncomeEl = document.getElementById('sumIncome');
const sumNetEl = document.getElementById('sumNet');

const form = document.getElementById('money-form');
const typeEl = document.getElementById('type');
const amountEl = document.getElementById('amount');
const descriptionEl = document.getElementById('description');
const categoryEl = document.getElementById('category');
const categoryPillsRow = document.getElementById('category-pills');
const payMethodSelect = document.getElementById('payMethod');
const paySubTypeWrap = document.getElementById('paySubTypeWrap');
const paySubTypeLabel = document.getElementById('paySubTypeLabel');
const paySubTypeSelect = document.getElementById('paySubType');
const noteInput = document.getElementById('note');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clear-btn');
const statusEl = document.getElementById('status');
const entriesListEl = document.getElementById('entriesList');

const isGroupCheckbox = document.getElementById('isGroup');
const splitOptions = document.getElementById('splitOptions');
const splitNamesInput = document.getElementById('splitNames');
const splitModeSelect = document.getElementById('splitMode');
const myShareInput = document.getElementById('myShare');
const customSplitsDiv = document.getElementById('customSplits');
const splitAmountsInput = document.getElementById('splitAmounts');
const myShareWrap = document.getElementById('myShareWrap');

const dateModeSelect = document.getElementById('dateMode');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');
const monthPickerWrap = document.getElementById('monthPickerWrap');
const yearPickerWrap = document.getElementById('yearPickerWrap');
const filterPaymentSelect = document.getElementById('filterPayment');
const filterCategorySelect = document.getElementById('filterCategory');
const typeFilterSelect = document.getElementById('typeFilter');

const categoryPieCanvas = document.getElementById('categoryPie');
const categoryLegendEl = document.getElementById('categoryLegend');
const summaryHistoryEl = document.getElementById('summaryHistory');
const monthSumExpenseEl = document.getElementById('monthSumExpense');
const monthSumIncomeEl = document.getElementById('monthSumIncome');
const splitOutstandingEl = document.getElementById('splitOutstanding');

const settingsUpiEl = document.getElementById('settingsUpi');
const settingsCardsEl = document.getElementById('settingsCards');
const settingsBanksEl = document.getElementById('settingsBanks');
const newUpiInput = document.getElementById('newUpi');
const addUpiBtn = document.getElementById('addUpiBtn');
const newCardInput = document.getElementById('newCard');
const addCardBtn = document.getElementById('addCardBtn');
const newBankInput = document.getElementById('newBank');
const addBankBtn = document.getElementById('addBankBtn');

const accentColorInput = document.getElementById('accentColor');
const currencySymbolInput = document.getElementById('currencySymbol');
const settingCategoriesInput = document.getElementById('settingCategories');
const saveCustomizationBtn = document.getElementById('saveCustomization');
const resetCustomizationBtn = document.getElementById('resetCustomization');
const themeSelect = document.getElementById('themeSelect');

const userNameField = document.getElementById('userNameField');
const securityHintInput = document.getElementById('securityHint');
const biometricEnabledCheckbox = document.getElementById('biometricEnabled');
const oldPasswordInput = document.getElementById('oldPassword');
const newPasswordInput = document.getElementById('newPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordStatusEl = document.getElementById('passwordStatus');

let currentEdit = null;
let store = loadStore();
let custom = loadCustom();

/* ---------- util ---------- */
function getTZOffsetMs(){ return new Date().getTimezoneOffset()*60000; }
function todayISO(){ const d=new Date(); return new Date(d - getTZOffsetMs()).toISOString().slice(0,10); }
function formatDateLabel(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'});
}
function currencyFmt(v){ return (custom.currency||'₹') + Number(v).toFixed(2); }

/* ------------- AUTH ------------- */
function setupAuth(){
  const user = loadUser();
  if(!user){
    authNameRow.style.display='block';
    document.getElementById('authTitle').textContent='Create account';
    document.getElementById('authSubtitle').textContent='Set a password to secure your data on this device.';
    authSubmitBtn.textContent='Create & Enter';
  } else {
    authNameRow.style.display='none';
    document.getElementById('authTitle').textContent=`Welcome back, ${user.name||'User'}`;
    document.getElementById('authSubtitle').textContent='Enter your password to continue.';
    authSubmitBtn.textContent='Unlock';
    authHint.textContent = user.securityHint ? `Hint: ${user.securityHint}` : '';
  }

  authForm.addEventListener('submit', e=>{
    e.preventDefault();
    const pw = authPasswordInput.value.trim();
    if(!pw){ alert('Password required'); return; }
    const existing = loadUser();
    if(!existing){
      const name = authNameInput.value.trim() || 'User';
      const u = { name, password: pw, biometricPreferred:false, securityHint:'' };
      saveUser(u);
      enterApp();
    } else {
      if(pw !== existing.password){ alert('Incorrect password'); return; }
      enterApp();
    }
  });

  forgotBtn.addEventListener('click', ()=>{
    const u = loadUser();
    if(!u){ alert('No account exists. Create one first.'); return; }
    const name = prompt('Enter your user name to reset password:');
    if(!name) return;
    if(name.trim() !== u.name){ alert('Name does not match. Cannot reset.'); return; }
    if(u.securityHint){
      const hintAns = prompt(`Security hint: ${u.securityHint}\nType anything to confirm:`);
      if(!hintAns){ alert('Reset cancelled'); return; }
    }
    const newPw = prompt('Enter a new password (will replace old):');
    if(!newPw) return;
    u.password = newPw;
    saveUser(u);
    alert('Password reset locally. Please login with new password.');
  });
}

function enterApp(){
  authScreen.style.display='none';
  appRoot.style.display='block';
  initApp();
}

/* ------------- THEME & CUSTOM ------------- */
function applyCustom(){
  custom = loadCustom();
  document.documentElement.style.setProperty('--accent', custom.accent||DEFAULTS.custom.accent);
  if(accentColorInput) accentColorInput.value = custom.accent || DEFAULTS.custom.accent;
  if(currencySymbolInput) currencySymbolInput.value = custom.currency || DEFAULTS.custom.currency;
}

function setupTheme(){
  const theme = localStorage.getItem('money_theme') || 'dark';
  document.body.dataset.theme = theme;
  themeToggleTop.textContent = theme === 'dark' ? '🌙' : '☀️';
  themeToggleTop.addEventListener('click', ()=>{
    const cur = document.body.dataset.theme || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = next;
    localStorage.setItem('money_theme', next);
    themeToggleTop.textContent = next === 'dark' ? '🌙' : '☀️';
    if(themeSelect) themeSelect.value = next;
  });

  if(themeSelect){
    themeSelect.value = document.body.dataset.theme || 'dark';
    themeSelect.addEventListener('change', ()=>{
      const v = themeSelect.value || 'dark';
      document.body.dataset.theme = v;
      localStorage.setItem('money_theme', v);
      themeToggleTop.textContent = v === 'dark' ? '🌙' : '☀️';
    });
  }
}

/* ------------- NAV ------------- */
function initNav(){
  navItems.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      navItems.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      showView(view);
      mainMenu.style.display='none';
    });
  });
  menuToggle.addEventListener('click', e=>{
    e.stopPropagation();
    mainMenu.style.display = mainMenu.style.display==='block' ? 'none' : 'block';
  });
  document.addEventListener('click', () => { mainMenu.style.display='none'; });
  mainMenu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=> {
      const to = b.dataset.to;
      if(to) showView(to);
      mainMenu.style.display='none';
    });
  });
}

/* Robust showView implementation */
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  if(!name || name==='entry') document.getElementById('view-entry').classList.add('active');
  if(name==='summary') document.getElementById('view-summary').classList.add('active');
  if(name==='settings') document.getElementById('view-settings').classList.add('active');
  if(name==='user') document.getElementById('view-user').classList.add('active');
  if(name==='about') document.getElementById('view-about').classList.add('active');

  if(mainMenu) mainMenu.style.display='none';

  document.querySelectorAll('.nav-item').forEach(btn => {
    if(btn.dataset.view === name || (!name && btn.dataset.view === 'entry')) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // view-specific renders
  try { if(name === 'summary') renderSummary(); } catch(e){}
  try { if(name === 'entry' || !name) renderEntries(); } catch(e){}
  try { if(name === 'settings') renderSettingsUI(); } catch(e){}
  try { if(name === 'user') renderUserUI(); } catch(e){}
}

/* ------------- DATE & FORM UI ------------- */
function initDatePickers(){
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  monthPicker.value = `${y}-${m}`;
  yearPicker.value = y;
  dateInput.value = new Date(Date.now() - getTZOffsetMs()).toISOString().slice(0,10);
  updateSelectedDateLabel();
  dateInput.addEventListener('change', ()=> { updateSelectedDateLabel(); renderEntries(); });
}
function getTZOffsetMs(){ return new Date().getTimezoneOffset()*60000; }
function updateSelectedDateLabel(){ selectedDateLabel.textContent = formatDateLabel(dateInput.value); }

function renderCategoryPills(){
  const s = loadStore();
  const cats = s.settings && s.settings.categories ? s.settings.categories : DEFAULTS.settings.categories;
  categoryPillsRow.innerHTML='';
  cats.forEach(cat=>{
    const b = document.createElement('button'); b.type='button'; b.className='pill'; b.textContent=cat;
    b.addEventListener('click', ()=> { categoryEl.value = cat; });
    categoryPillsRow.appendChild(b);
  });
}

/* pay subtype */
function updatePaySubTypeOptions(){
  const s = loadStore();
  const method = payMethodSelect.value;
  let list = [], label='';
  if(method==='UPI'){ list = s.settings.upiApps; label='UPI app'; }
  else if(method==='Card'){ list = s.settings.cards; label='Card'; }
  else if(method==='Bank'){ list = s.settings.banks; label='Bank'; }
  else { paySubTypeWrap.style.display='none'; return; }
  paySubTypeLabel.textContent = label;
  paySubTypeSelect.innerHTML = '';
  list.forEach(i=>{ const o=document.createElement('option'); o.value=i; o.textContent=i; paySubTypeSelect.appendChild(o); });
  const customOpt = document.createElement('option'); customOpt.value='__custom__'; customOpt.textContent = '+ Custom...'; paySubTypeSelect.appendChild(customOpt);
  paySubTypeWrap.style.display='block';
  paySubTypeSelect.onchange = ()=>{
    if(paySubTypeSelect.value === '__custom__'){
      const val = prompt(`Enter new ${label}:`);
      if(val && val.trim()){
        const t = val.trim();
        const s2 = loadStore();
        if(method==='UPI' && !s2.settings.upiApps.includes(t)) s2.settings.upiApps.push(t);
        if(method==='Card' && !s2.settings.cards.includes(t)) s2.settings.cards.push(t);
        if(method==='Bank' && !s2.settings.banks.includes(t)) s2.settings.banks.push(t);
        saveStore(s2); renderSettingsUI(); updatePaySubTypeOptions();
        paySubTypeSelect.value = t;
      } else {
        paySubTypeSelect.value = list[0] || '';
      }
    }
  };
}

/* split UI behavior */
isGroupCheckbox.addEventListener('change', ()=> {
  splitOptions.style.display = isGroupCheckbox.checked ? 'block' : 'none';
});
splitModeSelect.addEventListener('change', ()=>{
  const isCustom = splitModeSelect.value === 'custom';
  customSplitsDiv.style.display = isCustom ? 'block' : 'none';
  myShareWrap.style.display = isCustom ? 'block' : 'none';
});

/* ------------- FORM submit (add/update) ------------- */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const dateStr = dateInput.value;
  if(!dateStr){ statusEl.textContent = 'Choose a date'; return; }
  const type = typeEl.value;
  const amount = parseFloat(amountEl.value) || 0;
  const description = descriptionEl.value.trim();
  const category = categoryEl.value.trim();
  const payMethod = payMethodSelect.value;
  const paySubType = (paySubTypeWrap.style.display==='none') ? '' : (paySubTypeSelect.value==='__custom__' ? '' : paySubTypeSelect.value);
  const note = noteInput.value.trim();

  if(!description || !amount){ statusEl.textContent = 'Enter description and amount'; return; }

  const entry = {
    id: currentEdit ? currentEdit.id : Date.now(),
    type, description, category, payMethod, paySubType,
    amount: 0, note, createdAt: new Date().toISOString(), split: null
  };

  if(isGroupCheckbox.checked){
    const participants = splitNamesInput.value.trim() ? splitNamesInput.value.split(',').map(s=>s.trim()).filter(Boolean) : [];
    if(participants.length === 0){ alert('Provide participants for split'); return; }

    if(splitModeSelect.value === 'equal'){
      const totalPeople = participants.length + 1;
      const per = +(amount / totalPeople).toFixed(2);
      const participantsSplit = participants.map(p => ({ name: p, amount: per, received: false }));
      const myShare = per;
      entry.amount = myShare;
      entry.split = { enabled: true, participants: participantsSplit, myShare: myShare, mode: 'equal', status: 'pending' };
    } else {
      const raw = splitAmountsInput.value.trim();
      if(!raw){ alert('Provide custom amounts for participants'); return; }
      const arr = raw.split(',').map(s => parseFloat(s.trim()) || 0);
      if(arr.length !== participants.length){ alert('Number of custom amounts must match participants'); return; }
      const participantsSplit = participants.map((p,i) => ({ name: p, amount: +arr[i].toFixed(2), received: false }));
      const sumOthers = arr.reduce((a,b)=>a+b,0);
      const myShare = +(amount - sumOthers).toFixed(2);
      if(myShare < 0){ alert('Custom amounts exceed total. Fix amounts.'); return; }
      entry.amount = myShare;
      entry.split = { enabled: true, participants: participantsSplit, myShare: myShare, mode: 'custom', status: (participantsSplit.every(p=>p.received)?'settled':'pending') };
    }
  } else {
    entry.amount = amount;
  }

  const s = loadStore();
  if(currentEdit){
    // remove old
    const dayArr = s.days[currentEdit.dateStr] || [];
    const idx = dayArr.findIndex(x => x.id === currentEdit.id);
    if(idx >= 0){
      dayArr.splice(idx, 1);
      if(dayArr.length === 0) delete s.days[currentEdit.dateStr];
    }
    if(!s.days[dateStr]) s.days[dateStr] = [];
    s.days[dateStr].push(entry);
    saveStore(s);
    currentEdit = null;
    submitBtn.textContent = 'Save entry';
    statusEl.textContent = 'Updated ✓';
  } else {
    if(!s.days[dateStr]) s.days[dateStr] = [];
    s.days[dateStr].push(entry);
    saveStore(s);
    statusEl.textContent = 'Saved ✓';
  }

  form.reset(); splitOptions.style.display='none'; customSplitsDiv.style.display='none'; myShareWrap.style.display='none';
  renderCategoryPills(); renderEntries(); renderSummary();
});

/* ------------- Clear handler ------------- */
clearBtn.addEventListener('click', ()=>{
  form.reset(); splitOptions.style.display='none'; customSplitsDiv.style.display='none'; myShareWrap.style.display='none';
  statusEl.textContent = ''; currentEdit = null; submitBtn.textContent = 'Save entry';
});

/* ------------- Render entries (Entry view) ------------- */
function renderEntries(){
  entriesListEl.innerHTML = '';
  const dateStr = dateInput.value;
  const s = loadStore();
  const entries = s.days[dateStr] || [];
  if(entries.length === 0){ entriesListEl.innerHTML = '<div class="info">No entries for this day.</div>'; updateDailySummary(entries); return; }

  entries.forEach(entry => {
    const row = document.createElement('div'); row.className = 'entry';
    const main = document.createElement('div'); main.className = 'entry-main';
    const title = document.createElement('div'); title.className = 'entry-title'; title.textContent = (entry.description || '').toUpperCase();
    const meta = document.createElement('div'); meta.className = 'entry-meta'; meta.textContent = `${entry.type} • ${entry.category || 'No category'} • ${entry.payMethod}${entry.paySubType ? (' • ' + entry.paySubType) : ''}`;
    main.appendChild(title); main.appendChild(meta);
    if(entry.note){ const n = document.createElement('div'); n.className = 'entry-note'; n.textContent = entry.note; main.appendChild(n); }
    if(entry.split && entry.split.enabled){
      const sdiv = document.createElement('div'); sdiv.className = 'entry-note'; sdiv.textContent = `Split: your share ${currencyFmt(entry.split.myShare)}, to receive ${currencyFmt(entry.split.participants.reduce((a,p)=>a+p.amount,0))}`;
      main.appendChild(sdiv);
      const pList = document.createElement('div'); pList.className = 'entry-note';
      pList.textContent = entry.split.participants.map(p => `${p.name}${p.received ? ' ✓' : ''} (${currencyFmt(p.amount)})`).join(' · ');
      main.appendChild(pList);
    }

    const right = document.createElement('div'); right.className = 'entry-right';
    const amt = document.createElement('div'); amt.className = 'entry-amount ' + (entry.type==='Income' ? 'income' : 'expense'); amt.textContent = (entry.type==='Income'?'+':'-') + currencyFmt(entry.amount);
    const actions = document.createElement('div'); actions.className = 'entry-actions';
    const editBtn = document.createElement('button'); editBtn.className = 'btn-small'; editBtn.innerHTML = '✏ Edit'; editBtn.addEventListener('click', ()=> startEdit(dateInput.value, entry));
    const delBtn = document.createElement('button'); delBtn.className = 'btn-small'; delBtn.innerHTML = '🗑 Delete'; delBtn.addEventListener('click', ()=> { if(confirm('Delete this entry?')) { deleteEntry(dateInput.value, entry.id); }});
    actions.appendChild(editBtn); actions.appendChild(delBtn);
    right.appendChild(amt); right.appendChild(actions);

    row.appendChild(main); row.appendChild(right);
    entriesListEl.appendChild(row);
  });

  updateDailySummary(entries);
}

function updateDailySummary(entries){
  let exp = 0, inc = 0;
  entries.forEach(e => {
    if(e.type === 'Income') inc += e.amount;
    else exp += e.amount;
  });
  sumExpenseEl.textContent = currencyFmt(exp);
  sumIncomeEl.textContent = currencyFmt(inc);
  sumNetEl.textContent = currencyFmt(inc - exp);
}

/* ------------- Edit & Delete ------------- */
function startEdit(dateStr, entry){
  currentEdit = { id: entry.id, dateStr };
  showView('entry');
  dateInput.value = dateStr; updateSelectedDateLabel();
  typeEl.value = entry.type || 'Expense';
  amountEl.value = entry.amount || '';
  descriptionEl.value = entry.description || '';
  categoryEl.value = entry.category || '';
  payMethodSelect.value = entry.payMethod || 'Cash';
  updatePaySubTypeOptions();
  if(entry.paySubType) paySubTypeSelect.value = entry.paySubType;
  noteInput.value = entry.note || '';
  if(entry.split && entry.split.enabled){
    isGroupCheckbox.checked = true; splitOptions.style.display='block';
    splitNamesInput.value = entry.split.participants.map(p => p.name).join(',');
    if(entry.split.mode === 'equal'){
      splitModeSelect.value = 'equal'; customSplitsDiv.style.display='none'; myShareWrap.style.display='none';
    } else {
      splitModeSelect.value = 'custom'; customSplitsDiv.style.display='block'; myShareWrap.style.display='block';
      splitAmountsInput.value = entry.split.participants.map(p => p.amount).join(',');
      myShareInput.value = entry.split.myShare || '';
    }
  } else {
    isGroupCheckbox.checked = false; splitOptions.style.display='none'; customSplitsDiv.style.display='none'; myShareWrap.style.display='none';
  }
  submitBtn.textContent = 'Update entry';
  statusEl.textContent = 'Editing...';
}

function deleteEntry(dateStr, id){
  const s = loadStore();
  if(!s.days[dateStr]) return;
  s.days[dateStr] = s.days[dateStr].filter(e => e.id !== id);
  if(s.days[dateStr].length === 0) delete s.days[dateStr];
  saveStore(s);
  renderEntries(); renderSummary();
}

/* ------------- SUMMARY ------------- */
function initSummaryControls(){
  dateModeSelect.addEventListener('change', ()=>{
    const mode = dateModeSelect.value;
    monthPickerWrap.style.display = mode === 'month' ? 'block' : 'none';
    yearPickerWrap.style.display = mode === 'year' ? 'block' : 'none';
    renderSummary();
  });
  monthPicker.addEventListener('change', renderSummary);
  yearPicker.addEventListener('change', renderSummary);
  filterPaymentSelect.addEventListener('change', renderSummary);
  filterCategorySelect.addEventListener('change', renderSummary);
  typeFilterSelect.addEventListener('change', renderSummary);
}

/* get flat array of entries */
function allEntriesArray(){
  const s = loadStore(); const arr = [];
  Object.keys(s.days || {}).forEach(d=>{
    (s.days[d] || []).forEach(e => arr.push({ ...e, dateStr: d }));
  });
  return arr;
}

function renderSummary(){
  const arr = allEntriesArray();
  const mode = dateModeSelect.value;
  const monthVal = monthPicker.value;
  const yearVal = yearPicker.value;
  let filtered = arr.filter(e => {
    if(mode === 'month' && monthVal) return e.dateStr.startsWith(monthVal);
    if(mode === 'year' && yearVal) return e.dateStr.startsWith(String(yearVal) + '-');
    return true;
  });

  const typeF = typeFilterSelect.value;
  if(typeF === 'Expense') filtered = filtered.filter(e => !e.split || !e.split.enabled).filter(e => e.type === 'Expense');
  if(typeF === 'Income') filtered = filtered.filter(e => e.type === 'Income');
  if(typeF === 'Split') filtered = filtered.filter(e => e.split && e.split.enabled);

  const payFilter = filterPaymentSelect.value;
  if(payFilter !== 'All') filtered = filtered.filter(e => e.payMethod === payFilter);

  const cats = new Set(filtered.map(e => e.category || 'Uncategorized'));
  filterCategorySelect.innerHTML = '<option>All</option>';
  Array.from(cats).sort().forEach(c => {
    const o = document.createElement('option'); o.value = c; o.textContent = c; filterCategorySelect.appendChild(o);
  });
  const catNow = filterCategorySelect.value;
  if(catNow && catNow !== 'All') filtered = filtered.filter(e => (e.category || 'Uncategorized') === catNow);

  let totalExp = 0, totalInc = 0, splitOutstanding = 0;
  const categoryTotals = {};
  filtered.forEach(e=>{
    if(e.type === 'Income') totalInc += e.amount;
    else totalExp += e.amount;
    if(e.split && e.split.enabled){
      const othersSum = e.split.participants.reduce((a,p)=>a+p.amount,0);
      const notReceived = e.split.participants.filter(p => !p.received).reduce((a,p)=>a+p.amount,0);
      splitOutstanding += notReceived;
    }
    const cat = e.category || 'Uncategorized';
    if(e.type !== 'Income') categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  monthSumExpenseEl.textContent = currencyFmt(totalExp);
  monthSumIncomeEl.textContent = currencyFmt(totalInc);
  splitOutstandingEl.textContent = currencyFmt(splitOutstanding);

  drawCategoryPie(categoryTotals);
  renderHistoryList(filtered);
}

/* draw pie */
function drawCategoryPie(categoryTotals){
  const canvas = categoryPieCanvas;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = (rect.width || 300) * dpr, h = (rect.height || 200) * dpr;
  canvas.width = w; canvas.height = h;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const lw = w/dpr, lh = h/dpr;
  ctx.clearRect(0,0,lw,lh);
  const cats = Object.keys(categoryTotals);
  const total = cats.reduce((s,c) => s + categoryTotals[c], 0);
  if(!cats.length || total===0){ ctx.fillStyle = '#9ca3af'; ctx.font = '12px system-ui'; ctx.fillText('No expense data for this filter.', 10, lh/2); categoryLegendEl.innerHTML = ''; return; }
  const colors = {};
  cats.forEach((c,i)=> colors[c] = `hsl(${(i*60)%360} 70% 55%)`);
  const cx = lw/2, cy = lh/2, radius = Math.min(lw,lh)/2 - 20;
  let start = -Math.PI/2;
  cats.forEach(cat=>{
    const val = categoryTotals[cat];
    const angle = (val/total) * Math.PI * 2;
    const end = start + angle;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,radius,start,end); ctx.closePath(); ctx.fillStyle = colors[cat]; ctx.fill();
    start = end;
  });
  categoryLegendEl.innerHTML = '';
  cats.forEach(cat => {
    const it = document.createElement('div'); it.className = 'legend-item';
    const left = document.createElement('div'); left.className = 'legend-left';
    const col = document.createElement('div'); col.style.width='12px'; col.style.height='12px'; col.style.backgroundColor = colors[cat]; col.style.borderRadius='3px';
    const lab = document.createElement('div'); lab.textContent = cat; lab.style.marginLeft='8px'; lab.style.color = getComputedStyle(document.body).getPropertyValue('--text');
    left.appendChild(col); left.appendChild(lab);
    const right = document.createElement('div'); right.textContent = currencyFmt(categoryTotals[cat]) + ` (${((categoryTotals[cat]/total)*100).toFixed(1)}%)`; right.style.fontWeight='600';
    it.appendChild(left); it.appendChild(right); categoryLegendEl.appendChild(it);
  });
}

/* render history list */
function renderHistoryList(entries){
  summaryHistoryEl.innerHTML = '';
  if(!entries.length){ summaryHistoryEl.innerHTML = '<div class="info">No entries for this filter.</div>'; return; }
  const sorted = [...entries].sort((a,b) => a.dateStr === b.dateStr ? b.id - a.id : (a.dateStr < b.dateStr ? 1 : -1));
  let cur = null;
  sorted.forEach(e=>{
    if(e.dateStr !== cur){
      cur = e.dateStr;
      const dl = document.createElement('div'); dl.className = 'summary-history-date'; dl.textContent = formatDateLabel(cur);
      summaryHistoryEl.appendChild(dl);
    }

    const row = document.createElement('div'); row.className = 'entry';
    const left = document.createElement('div'); left.className = 'entry-main';
    const title = document.createElement('div'); title.className = 'entry-title'; title.textContent = e.description;
    const meta = document.createElement('div'); meta.className = 'entry-meta'; meta.textContent = `${e.type} • ${e.category || 'No category'} • ${e.payMethod}${e.paySubType?(' • '+e.paySubType):''}`;
    left.appendChild(title); left.appendChild(meta);
    if(e.note){ const n = document.createElement('div'); n.className = 'entry-note'; n.textContent = e.note; left.appendChild(n); }

    if(e.split && e.split.enabled){
      const sp = document.createElement('div'); sp.className = 'entry-note';
      sp.textContent = `Split: your ${currencyFmt(e.split.myShare)} · to receive ${currencyFmt(e.split.participants.reduce((a,p)=>a+p.amount,0))}`;
      left.appendChild(sp);

      e.split.participants.forEach((p, idx)=>{
        const prow = document.createElement('div'); prow.style.display='flex'; prow.style.justifyContent='space-between'; prow.style.alignItems='center'; prow.style.marginTop='6px';
        const pleft = document.createElement('div'); pleft.textContent = `${p.name} — ${currencyFmt(p.amount)}`; pleft.style.color = 'var(--muted)';
        const pright = document.createElement('div'); const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!p.received; cb.addEventListener('change', ()=>{
          toggleSplitReceived(e.id, e.dateStr, idx, cb.checked);
        });
        pright.appendChild(cb); prow.appendChild(pleft); prow.appendChild(pright); left.appendChild(prow);
      });

      const allRow = document.createElement('div'); allRow.style.marginTop='8px';
      const allChk = document.createElement('input'); allChk.type='checkbox';
      const allReceived = e.split.participants.every(p => p.received);
      allChk.checked = allReceived;
      allChk.addEventListener('change', ()=>{
        toggleAllSplit(e.id, e.dateStr, allChk.checked);
      });
      allRow.appendChild(allChk);
      const allLbl = document.createElement('span'); allLbl.style.marginLeft='8px'; allLbl.textContent = 'Mark all received';
      allRow.appendChild(allLbl);
      left.appendChild(allRow);
    }

    const right = document.createElement('div'); right.className = 'entry-right';
    const amt = document.createElement('div'); amt.className = 'entry-amount ' + (e.type==='Income' ? 'income' : 'expense'); amt.textContent = (e.type==='Income'?'+':'-') + currencyFmt(e.amount);
    const edit = document.createElement('button'); edit.className='btn-small'; edit.textContent='✏ Edit'; edit.addEventListener('click', ()=> startEdit(e.dateStr, e));
    right.appendChild(amt); right.appendChild(edit);

    row.appendChild(left); row.appendChild(right);
    summaryHistoryEl.appendChild(row);
  });
}

/* toggle one participant received */
function toggleSplitReceived(entryId, dateStr, participantIdx, checked){
  const s = loadStore();
  const day = s.days[dateStr] || [];
  const idx = day.findIndex(x => x.id === entryId);
  if(idx < 0) return;
  const entry = day[idx];
  if(!entry.split) return;
  entry.split.participants[participantIdx].received = checked;
  const allReceived = entry.split.participants.every(p => p.received);
  entry.split.status = allReceived ? 'settled' : (entry.split.participants.some(p => p.received) ? 'partially' : 'pending');
  s.days[dateStr][idx] = entry; saveStore(s);
  renderSummary(); renderEntries();
}

/* toggle all received */
function toggleAllSplit(entryId, dateStr, checked){
  const s = loadStore(); const day = s.days[dateStr] || []; const idx = day.findIndex(x => x.id === entryId); if(idx < 0) return;
  const entry = day[idx];
  if(!entry.split) return;
  entry.split.participants.forEach(p => p.received = checked);
  entry.split.status = checked ? 'settled' : 'pending';
  s.days[dateStr][idx] = entry; saveStore(s);
  renderSummary(); renderEntries();
}

/* ------------- SETTINGS UI ------------- */
function renderSettingsUI(){
  const s = loadStore();
  const st = s.settings || DEFAULTS.settings;
  settingsUpiEl.innerHTML=''; settingsCardsEl.innerHTML=''; settingsBanksEl.innerHTML='';
  st.upiApps.forEach(u => settingsUpiEl.appendChild(makeSettingsPill(u,'upi')));
  st.cards.forEach(c => settingsCardsEl.appendChild(makeSettingsPill(c,'cards')));
  st.banks.forEach(b => settingsBanksEl.appendChild(makeSettingsPill(b,'banks')));

  custom = loadCustom();
  accentColorInput.value = custom.accent || DEFAULTS.custom.accent;
  currencySymbolInput.value = custom.currency || DEFAULTS.custom.currency;
  settingCategoriesInput.value = (st.categories||[]).join(',');
}
function makeSettingsPill(text,type){
  const p = document.createElement('div'); p.className = 'settings-pill'; p.textContent = text;
  const btn = document.createElement('button'); btn.textContent = '×'; btn.addEventListener('click', ()=>{
    const s = loadStore(); let list;
    if(type==='upi') list = s.settings.upiApps;
    if(type==='cards') list = s.settings.cards;
    if(type==='banks') list = s.settings.banks;
    const idx = list.indexOf(text); if(idx >= 0) list.splice(idx,1); saveStore(s); renderSettingsUI(); updatePaySubTypeOptions();
  });
  p.appendChild(btn); return p;
}
addUpiBtn.addEventListener('click', ()=>{
  const v = newUpiInput.value.trim(); if(!v) return; const s = loadStore(); if(!s.settings.upiApps.includes(v)) s.settings.upiApps.push(v); saveStore(s); newUpiInput.value=''; renderSettingsUI(); updatePaySubTypeOptions();
});
addCardBtn.addEventListener('click', ()=>{
  const v = newCardInput.value.trim(); if(!v) return; const s = loadStore(); if(!s.settings.cards.includes(v)) s.settings.cards.push(v); saveStore(s); newCardInput.value=''; renderSettingsUI(); updatePaySubTypeOptions();
});
addBankBtn.addEventListener('click', ()=>{
  const v = newBankInput.value.trim(); if(!v) return; const s = loadStore(); if(!s.settings.banks.includes(v)) s.settings.banks.push(v); saveStore(s); newBankInput.value=''; renderSettingsUI(); updatePaySubTypeOptions();
});

saveCustomizationBtn.addEventListener('click', ()=>{
  const c = loadCustom();
  c.accent = accentColorInput.value || c.accent;
  c.currency = currencySymbolInput.value || c.currency;
  saveCustom(c);
  const cats = (settingCategoriesInput.value || DEFAULTS.settings.categories.join(',')).split(',').map(s => s.trim()).filter(Boolean);
  const s = loadStore(); s.settings.categories = cats; saveStore(s);
  renderCategoryPills(); renderSettingsUI(); alert('Customization saved.');
});
resetCustomizationBtn.addEventListener('click', ()=>{
  localStorage.removeItem(CUSTOM_KEY);
  saveCustom(DEFAULTS.custom);
  const s = loadStore(); s.settings = DEFAULTS.settings; saveStore(s);
  renderCategoryPills(); renderSettingsUI(); alert('Reset to defaults.');
});

/* USER view */
function renderUserUI(){
  const u = loadUser();
  if(u){ userNameField.value = u.name || ''; securityHintInput.value = u.securityHint || ''; biometricEnabledCheckbox.checked = !!u.biometricPreferred; }
}
changePasswordBtn.addEventListener('click', ()=>{
  const u = loadUser(); if(!u){ passwordStatusEl.textContent='No user'; passwordStatusEl.style.color='var(--danger)'; return; }
  const oldPw = oldPasswordInput.value.trim(); const newPw = newPasswordInput.value.trim();
  if(!oldPw || !newPw){ passwordStatusEl.textContent='Fill both'; passwordStatusEl.style.color='var(--danger)'; return; }
  if(oldPw !== u.password){ passwordStatusEl.textContent='Incorrect current password'; passwordStatusEl.style.color='var(--danger)'; return; }
  u.password = newPw; u.name = userNameField.value.trim() || u.name; u.securityHint = securityHintInput.value.trim() || '';
  u.biometricPreferred = biometricEnabledCheckbox.checked;
  saveUser(u); passwordStatusEl.textContent='Updated'; passwordStatusEl.style.color='var(--success)';
});

/* ------------- EXPORT helpers ------------- */
function exportCSV(filteredOnly=false, monthFilter=null){
  if(!confirm('Export CSV? This creates a file containing your data.')) return;
  const s = loadStore();
  const rows = [['date','type','description','category','payMethod','paySubType','amount','note','split']];
  Object.keys(s.days).sort().forEach(dateStr=>{
    if(filteredOnly && monthFilter && !dateStr.startsWith(monthFilter)) return;
    s.days[dateStr].forEach(e=>{
      rows.push([dateStr,e.type,e.description||'',e.category||'',e.payMethod||'',e.paySubType||'',e.amount||0,e.note||'', e.split?JSON.stringify(e.split):'']);
    });
  });
  const csv = rows.map(r=> r.map(cell=> {
    if(cell==null) return '';
    const s = String(cell).replace(/"/g,'""');
    return /,|\n|"/.test(s) ? `"${s}"` : s;
  }).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'money_tracker_export.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function exportJSON(filteredOnly=false, monthFilter=null){
  const s = loadStore();
  let out = {...s};
  if(filteredOnly && monthFilter){
    const days = {};
    Object.keys(s.days).forEach(k=>{ if(k.startsWith(monthFilter)) days[k]=s.days[k]; });
    out.days = days;
  }
  const blob = new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'money_tracker_backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* ------------- INIT APP ------------- */
function initApp(){
  store = loadStore(); custom = loadCustom();
  applyCustom(); setupTheme(); initNav(); initDatePickers(); renderCategoryPills(); updatePaySubTypeOptions();
  renderEntries(); initSummaryControls(); renderSettingsUI(); renderUserUI();

  payMethodSelect.addEventListener('change', updatePaySubTypeOptions);

  document.getElementById('exportMenuBtn').addEventListener('click', ()=>{
    showView('summary');
    setTimeout(()=> { alert('Use export functions in your console or I can add UI buttons — press Ctrl/Cmd+E for month CSV (choose month first).'); }, 100);
  });

  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === 'e'){ e.preventDefault(); const mon = monthPicker.value; if(!mon){ alert('Pick a month first'); return; } exportCSV(true, mon); }
  });
}

/* ------------- Helper storage wrappers used inside file ------------- */
function loadStore(){ return (function(){ try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { version:1, days:{}, settings: DEFAULTS.settings }; }catch(e){ console.error(e); return { version:1, days:{}, settings: DEFAULTS.settings }; } })(); }
function saveStore(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function loadUser(){ try{ const r=localStorage.getItem(USER_KEY); return r?JSON.parse(r):null;}catch{return null;} }
function saveUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function loadCustom(){ try{ const r=localStorage.getItem(CUSTOM_KEY); return r?JSON.parse(r):DEFAULTS.custom;}catch{return DEFAULTS.custom;} }
function saveCustom(c){ localStorage.setItem(CUSTOM_KEY, JSON.stringify(c)); applyCustom(); }

/* ------------- Start ------------- */
setupAuth();
