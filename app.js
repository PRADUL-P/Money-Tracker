'use strict';

/* ================== KEYS & DATA MODEL ================== */

const STORAGE_KEY = 'money_tracker_v1';
const USER_KEY = 'money_tracker_user';

/*
Store structure:

{
  version: 1,
  days: {
    "2025-12-02": [
      {
        id,
        type: "Expense" | "Income",
        description,
        category,
        payMethod: "Cash" | "UPI" | "Card" | "Bank",
        paySubType: string,  // e.g. "GPay", "SBI"
        amount: number,
        note: string
      }
    ],
    ...
  },
  settings: {
    categories: [],
    upiApps: [],
    cards: [],
    banks: []
  }
}

User structure:

{
  name: string,
  password: string  // stored as plain string (for simplicity)
}
*/

/* ================== STORAGE HELPERS ================== */

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const base = raw ? JSON.parse(raw) : {};
    if (!base.version) base.version = 1;
    if (!base.days) base.days = {};
    if (!base.settings) {
      base.settings = {
        categories: ['Food', 'Travel', 'Bills', 'Shopping', 'Salary', 'Other'],
        upiApps: ['GPay', 'PhonePe', 'Paytm', 'HDFC UPI', 'SBI UPI'],
        cards: ['Canara', 'HDFC', 'SBI', 'Credit Card'],
        banks: ['Canara', 'HDFC', 'SBI']
      };
    }
    return base;
  } catch (e) {
    console.error('Error reading storage', e);
    return {
      version: 1,
      days: {},
      settings: {
        categories: ['Food', 'Travel', 'Bills', 'Shopping', 'Salary', 'Other'],
        upiApps: ['GPay', 'PhonePe', 'Paytm', 'HDFC UPI', 'SBI UPI'],
        cards: ['Canara', 'HDFC', 'SBI', 'Credit Card'],
        banks: ['Canara', 'HDFC', 'SBI']
      }
    };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Error saving storage', e);
  }
}

function getEntriesForDate(store, dateStr) {
  return store.days[dateStr] || [];
}

function addEntry(dateStr, entry) {
  const store = loadStore();
  if (!store.days[dateStr]) store.days[dateStr] = [];
  store.days[dateStr].push(entry);
  saveStore(store);
}

function updateEntry(oldDateStr, newDateStr, updatedEntry) {
  const store = loadStore();
  if (!store.days[oldDateStr]) return;

  store.days[oldDateStr] = store.days[oldDateStr].filter(e => e.id !== updatedEntry.id);
  if (store.days[oldDateStr].length === 0) delete store.days[oldDateStr];

  if (!store.days[newDateStr]) store.days[newDateStr] = [];
  store.days[newDateStr].push(updatedEntry);

  saveStore(store);
}

function deleteEntry(dateStr, id) {
  const store = loadStore();
  if (!store.days[dateStr]) return;
  store.days[dateStr] = store.days[dateStr].filter(e => e.id !== id);
  if (store.days[dateStr].length === 0) delete store.days[dateStr];
  saveStore(store);
}

/* Settings helpers */

function loadSettings() {
  const store = loadStore();
  return store.settings;
}

function saveSettings(settings) {
  const store = loadStore();
  store.settings = settings;
  saveStore(store);
}

/* User helpers */

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* Password gate for export */

function checkPasswordGate() {
  const user = loadUser();
  if (!user) {
    alert('No user found. Please create an account first.');
    return false;
  }
  const pw = prompt('Enter your app password to export data:');
  if (pw === null) return false;
  if (pw !== user.password) {
    alert('Incorrect password.');
    return false;
  }
  return true;
}

/* ================== DOM ELEMENTS ================== */

// Auth
const authScreen = document.getElementById('authScreen');
const appRoot = document.getElementById('appRoot');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const authNameRow = document.getElementById('authNameRow');
const authNameInput = document.getElementById('authName');
const authPasswordInput = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');

// App nav
const viewEntry = document.getElementById('view-entry');
const viewSummary = document.getElementById('view-summary');
const navTabs = document.querySelectorAll('.nav-tab');

// Entry view
const dateInput = document.getElementById('date');
const selectedDateLabel = document.getElementById('selectedDateLabel');
const form = document.getElementById('money-form');
const statusEl = document.getElementById('status');
const clearBtn = document.getElementById('clear-btn');
const categoryInput = document.getElementById('category');
const noteInput = document.getElementById('note');
const entriesListEl = document.getElementById('entriesList');
const sumExpenseEl = document.getElementById('sumExpense');
const sumIncomeEl = document.getElementById('sumIncome');
const sumNetEl = document.getElementById('sumNet');
const formTitleEl = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const categoryPillsRow = document.getElementById('category-pills');

const payMethodSelect = document.getElementById('payMethod');
const paySubTypeWrap = document.getElementById('paySubTypeWrap');
const paySubTypeLabel = document.getElementById('paySubTypeLabel');
const paySubTypeSelect = document.getElementById('paySubType');

// Summary view
const dateModeSelect = document.getElementById('dateMode');
const monthPickerWrap = document.getElementById('monthPickerWrap');
const yearPickerWrap = document.getElementById('yearPickerWrap');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');
const monthSumExpenseEl = document.getElementById('monthSumExpense');
const monthSumIncomeEl = document.getElementById('monthSumIncome');
const filterPaymentSelect = document.getElementById('filterPayment');
const filterCategorySelect = document.getElementById('filterCategory');
const categoryPieCanvas = document.getElementById('categoryPie');
const categoryLegendEl = document.getElementById('categoryLegend');
const summaryHistoryEl = document.getElementById('summaryHistory');

// Settings elements
const settingsCategoriesEl = document.getElementById('settingsCategories');
const settingsUpiEl = document.getElementById('settingsUpi');
const settingsCardsEl = document.getElementById('settingsCards');
const settingsBanksEl = document.getElementById('settingsBanks');

const newCategoryInput = document.getElementById('newCategory');
const newUpiInput = document.getElementById('newUpi');
const newCardInput = document.getElementById('newCard');
const newBankInput = document.getElementById('newBank');

const addCategoryBtn = document.getElementById('addCategoryBtn');
const addUpiBtn = document.getElementById('addUpiBtn');
const addCardBtn = document.getElementById('addCardBtn');
const addBankBtn = document.getElementById('addBankBtn');

// Backup
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFileInput = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');

// Edit state
let currentEdit = null; // { id, dateStr }

/* ================== AUTH / LOGIN LOGIC ================== */

function setupAuth() {
  const user = loadUser();
  if (!user) {
    // First time: create account
    authTitle.textContent = 'Create your Money Tracker account';
    authSubtitle.textContent = 'Choose a password. It\'s used to unlock the app and export data.';
    authNameRow.style.display = 'block';
    authSubmitBtn.textContent = 'Create & Enter';
  } else {
    // Existing user: login
    authTitle.textContent = `Welcome back, ${user.name}`;
    authSubtitle.textContent = 'Enter your password to unlock LUDARP Money Tracker.';
    authNameRow.style.display = 'none';
    authSubmitBtn.textContent = 'Unlock';
  }

  authForm.addEventListener('submit', e => {
    e.preventDefault();
    const p = authPasswordInput.value.trim();
    if (!p) {
      alert('Password is required.');
      return;
    }

    const existing = loadUser();
    if (!existing) {
      const name = authNameInput.value.trim() || 'User';
      const newUser = { name, password: p };
      saveUser(newUser);
      enterApp();
    } else {
      if (p !== existing.password) {
        alert('Incorrect password.');
        return;
      }
      enterApp();
    }
  });
}

function enterApp() {
  authScreen.style.display = 'none';
  appRoot.style.display = 'block';
  initApp();
}

/* ================== GENERIC HELPERS ================== */

function toLocalDateInputValue(date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/* ================== INIT APP ================== */

function initApp() {
  initDate();
  initSummaryDateControls();
  initSettingsUI();
  initNav();
  initEntryHandlers();
  initSummaryHandlers();
  initBackupHandlers();

  // PWA: service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .catch(err => console.log('SW registration failed', err));
    });
  }
}

/* ================== NAVIGATION ================== */

function initNav() {
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const view = tab.dataset.view;
      if (view === 'entry') {
        viewEntry.classList.add('active');
        viewSummary.classList.remove('active');
      } else {
        viewSummary.classList.add('active');
        viewEntry.classList.remove('active');
        renderSummary();
      }
    });
  });
}

/* ================== ENTRY VIEW ================== */

function initDate() {
  const today = new Date();
  dateInput.value = toLocalDateInputValue(today);
  updateSelectedDateLabel();
  renderCategoryPills();
  renderEntries();
  updatePaySubTypeOptions();
}

function updateSelectedDateLabel() {
  const dateStr = dateInput.value;
  if (!dateStr) {
    selectedDateLabel.textContent = '';
    return;
  }
  const d = new Date(dateStr + 'T00:00:00');
  const fmt = d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  selectedDateLabel.textContent = fmt;
}

function renderCategoryPills() {
  const settings = loadSettings();
  categoryPillsRow.innerHTML = '';
  settings.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pill';
    btn.dataset.value = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      categoryInput.value = cat;
    });
    categoryPillsRow.appendChild(btn);
  });
}

function initEntryHandlers() {
  clearBtn.addEventListener('click', () => {
    form.reset();
    statusEl.textContent = '';
    statusEl.className = 'status';
    currentEdit = null;
    formTitleEl.textContent = 'Add entry for this day';
    submitBtn.textContent = 'Save entry';
    updatePaySubTypeOptions();
  });

  dateInput.addEventListener('change', () => {
    updateSelectedDateLabel();
    renderEntries();
  });

  payMethodSelect.addEventListener('change', updatePaySubTypeOptions);

  form.addEventListener('submit', e => {
    e.preventDefault();
    statusEl.textContent = 'Saving...';
    statusEl.className = 'status';

    const newDateStr = dateInput.value;
    if (!newDateStr) {
      statusEl.textContent = 'Invalid date.';
      statusEl.className = 'status error';
      return;
    }

    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const category = categoryInput.value.trim();
    const payMethod = payMethodSelect.value;
    const paySubType = paySubTypeWrap.style.display === 'none'
      ? ''
      : paySubTypeSelect.value === '__custom__'
        ? ''
        : paySubTypeSelect.value;
    const amountVal = parseFloat(document.getElementById('amount').value);
    const note = noteInput.value.trim();

    if (!description || isNaN(amountVal) || amountVal <= 0) {
      statusEl.textContent = 'Please enter a description and valid amount.';
      statusEl.className = 'status error';
      return;
    }

    if (currentEdit) {
      const updatedEntry = {
        id: currentEdit.id,
        type,
        description,
        category,
        payMethod,
        paySubType,
        amount: amountVal,
        note
      };
      updateEntry(currentEdit.dateStr, newDateStr, updatedEntry);
      statusEl.textContent = 'Updated ✔';
      statusEl.className = 'status ok';
      currentEdit = null;
      formTitleEl.textContent = 'Add entry for this day';
      submitBtn.textContent = 'Save entry';
    } else {
      const entry = {
        id: Date.now(),
        type,
        description,
        category,
        payMethod,
        paySubType,
        amount: amountVal,
        note
      };
      addEntry(newDateStr, entry);
      statusEl.textContent = 'Saved ✔';
      statusEl.className = 'status ok';
    }

    form.reset();
    updatePaySubTypeOptions();
    renderEntries();
    renderSummary();
  });
}

function updatePaySubTypeOptions() {
  const settings = loadSettings();
  const method = payMethodSelect.value;
  let list = [];
  let label = '';

  if (method === 'UPI') {
    list = settings.upiApps;
    label = 'UPI app';
  } else if (method === 'Card') {
    list = settings.cards;
    label = 'Card type';
  } else if (method === 'Bank') {
    list = settings.banks;
    label = 'Bank';
  } else {
    paySubTypeWrap.style.display = 'none';
    return;
  }

  paySubTypeLabel.textContent = label;
  paySubTypeSelect.innerHTML = '';

  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    paySubTypeSelect.appendChild(opt);
  });

  // Custom option
  const customOpt = document.createElement('option');
  customOpt.value = '__custom__';
  customOpt.textContent = '+ Custom...';
  paySubTypeSelect.appendChild(customOpt);

  paySubTypeWrap.style.display = 'block';

  paySubTypeSelect.onchange = () => {
    if (paySubTypeSelect.value === '__custom__') {
      const val = prompt(`Enter new ${label.toLowerCase()}:`);
      if (val && val.trim()) {
        const trimmed = val.trim();
        const s = loadSettings();
        if (method === 'UPI' && !s.upiApps.includes(trimmed)) s.upiApps.push(trimmed);
        if (method === 'Card' && !s.cards.includes(trimmed)) s.cards.push(trimmed);
        if (method === 'Bank' && !s.banks.includes(trimmed)) s.banks.push(trimmed);
        saveSettings(s);
        initSettingsUI();
        updatePaySubTypeOptions();
        paySubTypeSelect.value = trimmed;
      } else {
        paySubTypeSelect.value = list[0] || '';
      }
    }
  };
}

function renderEntries() {
  const dateStr = dateInput.value;
  const store = loadStore();
  const entries = getEntriesForDate(store, dateStr);

  entriesListEl.innerHTML = '';
  if (!entries.length) {
    entriesListEl.innerHTML = '<div class="info">No entries yet for this day.</div>';
  } else {
    entries.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'entry';

      const main = document.createElement('div');
      main.className = 'entry-main';

      const title = document.createElement('div');
      title.className = 'entry-title';
      title.textContent = entry.description || '(No description)';

      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const sub = entry.paySubType ? ` • ${entry.paySubType}` : '';
      meta.textContent =
        `${entry.type} • ${entry.category || 'No category'} • ${entry.payMethod}${sub}`;

      main.appendChild(title);
      main.appendChild(meta);

      if (entry.note) {
        const note = document.createElement('div');
        note.className = 'entry-note';
        note.textContent = entry.note;
        main.appendChild(note);
      }

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.flexDirection = 'column';
      right.style.alignItems = 'flex-end';
      right.style.gap = '0.25rem';

      const amount = document.createElement('div');
      amount.className =
        'entry-amount ' + (entry.type === 'Income' ? 'income' : 'expense');
      const sign = entry.type === 'Income' ? '+' : '-';
      amount.textContent = `${sign}₹${entry.amount.toFixed(2)}`;

      const buttonsRow = document.createElement('div');
      buttonsRow.style.display = 'flex';
      buttonsRow.style.gap = '0.25rem';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn-small';
      editBtn.style.border = '1px solid #1e293b';
      editBtn.style.background = '#0f172a';
      editBtn.addEventListener('click', () => {
        startEdit(dateStr, entry);
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn-small';
      delBtn.style.border = '1px solid #1e293b';
      delBtn.style.background = '#020617';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          deleteEntry(dateStr, entry.id);
          renderEntries();
          renderSummary();
        }
      });

      buttonsRow.appendChild(editBtn);
      buttonsRow.appendChild(delBtn);

      right.appendChild(amount);
      right.appendChild(buttonsRow);

      div.appendChild(main);
      div.appendChild(right);
      entriesListEl.appendChild(div);
    });
  }

  // Daily summary
  let totalExp = 0;
  let totalInc = 0;
  entries.forEach(e => {
    if (e.type === 'Income') totalInc += e.amount;
    else totalExp += e.amount;
  });
  const net = totalInc - totalExp;

  sumExpenseEl.textContent = '₹' + totalExp.toFixed(2);
  sumIncomeEl.textContent = '₹' + totalInc.toFixed(2);
  sumNetEl.textContent = '₹' + net.toFixed(2);
}

function startEdit(dateStr, entry) {
  currentEdit = { id: entry.id, dateStr };
  dateInput.value = dateStr;
  updateSelectedDateLabel();
  document.getElementById('type').value = entry.type;
  document.getElementById('description').value = entry.description;
  categoryInput.value = entry.category;
  payMethodSelect.value = entry.payMethod;
  document.getElementById('amount').value = entry.amount;
  noteInput.value = entry.note || '';
  updatePaySubTypeOptions();
  if (entry.paySubType) {
    paySubTypeSelect.value = entry.paySubType;
  }

  formTitleEl.textContent = 'Edit entry';
  submitBtn.textContent = 'Update entry';
  statusEl.textContent = 'Editing mode: change values and click Update entry.';
  statusEl.className = 'status';
}

/* ================== SUMMARY VIEW & FILTERS ================== */

function initSummaryDateControls() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  monthPicker.value = `${y}-${m}`;
  yearPicker.value = y;

  dateModeSelect.addEventListener('change', () => {
    const mode = dateModeSelect.value;
    if (mode === 'month') {
      monthPickerWrap.style.display = 'block';
      yearPickerWrap.style.display = 'none';
    } else if (mode === 'year') {
      monthPickerWrap.style.display = 'none';
      yearPickerWrap.style.display = 'block';
    } else {
      monthPickerWrap.style.display = 'none';
      yearPickerWrap.style.display = 'none';
    }
    renderSummary();
  });

  monthPicker.addEventListener('change', renderSummary);
  yearPicker.addEventListener('change', renderSummary);
}

function initSummaryHandlers() {
  filterPaymentSelect.addEventListener('change', renderSummary);
  filterCategorySelect.addEventListener('change', renderSummary);
}

function renderSummary() {
  const store = loadStore();
  const mode = dateModeSelect.value;
  const monthVal = monthPicker.value; // "YYYY-MM"
  const yearVal = yearPicker.value;   // "YYYY"
  const paymentFilter = filterPaymentSelect.value;
  const categoryFilter = filterCategorySelect.value;

  // Collect all entries with date info
  let allEntries = [];
  Object.keys(store.days).forEach(dateStr => {
    const entries = store.days[dateStr] || [];
    entries.forEach(e => {
      allEntries.push({ dateStr, ...e });
    });
  });

  // Time filter
  let filtered = allEntries.filter(e => {
    if (mode === 'month' && monthVal) {
      return e.dateStr.startsWith(monthVal);
    } else if (mode === 'year' && yearVal) {
      return e.dateStr.startsWith(yearVal + '-');
    } else {
      return true; // all time
    }
  });

  // Payment filter
  if (paymentFilter !== 'All') {
    filtered = filtered.filter(e => e.payMethod === paymentFilter);
  }

  // Category options (build from filtered data)
  const cats = new Set();
  filtered.forEach(e => {
    const c = e.category || 'Uncategorized';
    cats.add(c);
  });

  // Rebuild category filter options
  const currentSelected = categoryFilter;
  filterCategorySelect.innerHTML = '';
  const allOpt = document.createElement('option');
  allOpt.value = 'All';
  allOpt.textContent = 'All';
  filterCategorySelect.appendChild(allOpt);
  Array.from(cats).sort().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    filterCategorySelect.appendChild(opt);
  });
  // restore selection if possible
  if (currentSelected && currentSelected !== 'All') {
    const found = Array.from(filterCategorySelect.options)
      .some(o => o.value === currentSelected);
    if (found) filterCategorySelect.value = currentSelected;
  }

  const categoryNow = filterCategorySelect.value;
  if (categoryNow !== 'All') {
    filtered = filtered.filter(e => (e.category || 'Uncategorized') === categoryNow);
  }

  // Totals
  let totalExp = 0;
  let totalInc = 0;
  const categoryTotals = {}; // for pie

  filtered.forEach(e => {
    if (e.type === 'Income') {
      totalInc += e.amount;
    } else {
      totalExp += e.amount;
      const c = e.category || 'Uncategorized';
      if (!categoryTotals[c]) categoryTotals[c] = 0;
      categoryTotals[c] += e.amount;
    }
  });

  monthSumExpenseEl.textContent = '₹' + totalExp.toFixed(2);
  monthSumIncomeEl.textContent = '₹' + totalInc.toFixed(2);

  drawCategoryPie(categoryTotals);
  renderHistoryList(filtered);
}

function drawCategoryPie(categoryTotals) {
  const ctx = categoryPieCanvas.getContext('2d');
  const rect = categoryPieCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const fallbackW = 300;
  const fallbackH = 220;

  let width = rect.width || fallbackW;
  let height = rect.height || fallbackH;

  categoryPieCanvas.width = width * dpr;
  categoryPieCanvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, width, height);

  const categories = Object.keys(categoryTotals);
  const total = categories.reduce((sum, cat) => sum + categoryTotals[cat], 0);

  if (!categories.length || total === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px system-ui';
    ctx.fillText('No expense data for this filter.', 10, height / 2);
    categoryLegendEl.innerHTML = '';
    return;
  }

  const colors = {};
  categories.forEach((cat, i) => {
    const hue = (i * 60) % 360;
    colors[cat] = `hsl(${hue}, 70%, 55%)`;
  });

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 15;

  let startAngle = -Math.PI / 2;

  categories.forEach(cat => {
    const value = categoryTotals[cat];
    const sliceAngle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[cat];
    ctx.fill();

    startAngle = endAngle;
  });

  categoryLegendEl.innerHTML = '';
  categories.forEach(cat => {
    const value = categoryTotals[cat];
    const percent = (value / total) * 100;

    const item = document.createElement('div');
    item.className = 'legend-item';

    const left = document.createElement('div');
    left.className = 'legend-left';

    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color';
    colorBox.style.backgroundColor = colors[cat];

    const label = document.createElement('div');
    label.className = 'legend-label';
    label.textContent = cat;

    left.appendChild(colorBox);
    left.appendChild(label);

    const right = document.createElement('div');
    right.className = 'legend-value';
    right.textContent = `₹${value.toFixed(0)} (${percent.toFixed(1)}%)`;

    item.appendChild(left);
    item.appendChild(right);
    categoryLegendEl.appendChild(item);
  });
}

function renderHistoryList(entries) {
  summaryHistoryEl.innerHTML = '';
  if (!entries.length) {
    summaryHistoryEl.innerHTML = '<div class="info">No entries for this filter.</div>';
    return;
  }

  // Sort by date descending, then by id
  const sorted = [...entries].sort((a, b) => {
    if (a.dateStr === b.dateStr) return b.id - a.id;
    return a.dateStr < b.dateStr ? 1 : -1;
  });

  let currentDate = null;
  sorted.forEach(e => {
    if (e.dateStr !== currentDate) {
      currentDate = e.dateStr;
      const dLabel = document.createElement('div');
      dLabel.className = 'summary-history-date';
      const d = new Date(e.dateStr + 'T00:00:00');
      const fmt = d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      dLabel.textContent = fmt;
      summaryHistoryEl.appendChild(dLabel);
    }

    const row = document.createElement('div');
    row.className = 'summary-history-entry';

    const left = document.createElement('div');
    left.textContent = `${e.description} (${e.category || 'No category'})`;

    const right = document.createElement('div');
    const sign = e.type === 'Income' ? '+' : '-';
    right.textContent = `${sign}₹${e.amount.toFixed(2)}`;

    row.appendChild(left);
    row.appendChild(right);
    summaryHistoryEl.appendChild(row);
  });
}

/* ================== SETTINGS UI ================== */

function initSettingsUI() {
  const s = loadSettings();

  function renderList(container, arr, type) {
    container.innerHTML = '';
    arr.forEach(item => {
      const pill = document.createElement('div');
      pill.className = 'settings-pill';
      pill.textContent = item;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.addEventListener('click', () => {
        const settings = loadSettings();
        let listRef = [];
        if (type === 'categories') listRef = settings.categories;
        if (type === 'upi') listRef = settings.upiApps;
        if (type === 'cards') listRef = settings.cards;
        if (type === 'banks') listRef = settings.banks;
        const idx = listRef.indexOf(item);
        if (idx >= 0) {
          listRef.splice(idx, 1);
          saveSettings(settings);
          initSettingsUI();
          renderCategoryPills();
          updatePaySubTypeOptions();
          renderSummary();
        }
      });
      pill.appendChild(btn);
      container.appendChild(pill);
    });
  }

  renderList(settingsCategoriesEl, s.categories, 'categories');
  renderList(settingsUpiEl, s.upiApps, 'upi');
  renderList(settingsCardsEl, s.cards, 'cards');
  renderList(settingsBanksEl, s.banks, 'banks');

  addCategoryBtn.onclick = () => {
    const val = newCategoryInput.value.trim();
    if (!val) return;
    const settings = loadSettings();
    if (!settings.categories.includes(val)) {
      settings.categories.push(val);
      saveSettings(settings);
      newCategoryInput.value = '';
      initSettingsUI();
      renderCategoryPills();
      renderSummary();
    }
  };

  addUpiBtn.onclick = () => {
    const val = newUpiInput.value.trim();
    if (!val) return;
    const settings = loadSettings();
    if (!settings.upiApps.includes(val)) {
      settings.upiApps.push(val);
      saveSettings(settings);
      newUpiInput.value = '';
      initSettingsUI();
      updatePaySubTypeOptions();
    }
  };

  addCardBtn.onclick = () => {
    const val = newCardInput.value.trim();
    if (!val) return;
    const settings = loadSettings();
    if (!settings.cards.includes(val)) {
      settings.cards.push(val);
      saveSettings(settings);
      newCardInput.value = '';
      initSettingsUI();
      updatePaySubTypeOptions();
    }
  };

  addBankBtn.onclick = () => {
    const val = newBankInput.value.trim();
    if (!val) return;
    const settings = loadSettings();
    if (!settings.banks.includes(val)) {
      settings.banks.push(val);
      saveSettings(settings);
      newBankInput.value = '';
      initSettingsUI();
      updatePaySubTypeOptions();
    }
  };
}

/* ================== BACKUP / RESTORE ================== */

function escapeCsvField(field) {
  if (field == null) return '';
  const s = String(field);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function initBackupHandlers() {
  exportCsvBtn.addEventListener('click', () => {
    if (!checkPasswordGate()) return;

    const store = loadStore();
    const rows = [];
    rows.push([
      'date',
      'type',
      'description',
      'category',
      'payMethod',
      'paySubType',
      'amount',
      'note'
    ]);

    Object.keys(store.days).forEach(dateStr => {
      store.days[dateStr].forEach(e => {
        rows.push([
          dateStr,
          e.type,
          e.description || '',
          e.category || '',
          e.payMethod || '',
          e.paySubType || '',
          e.amount,
          e.note || ''
        ]);
      });
    });

    const csvLines = rows.map(r => r.map(escapeCsvField).join(',')).join('\n');
    const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'money_tracker_backup.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  exportJsonBtn.addEventListener('click', () => {
    if (!checkPasswordGate()) return;

    const store = loadStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'money_tracker_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => {
    const file = importFileInput.files[0];
    if (!file) {
      alert('Choose a CSV or JSON file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target.result;
      try {
        let newStore;
        if (
          file.name.toLowerCase().endsWith('.json') ||
          text.trim().startsWith('{')
        ) {
          newStore = JSON.parse(text);
          if (!newStore.days) throw new Error('Invalid JSON backup');
        } else {
          // CSV import
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          const header = parseCsvLine(lines[0]);
          const idx = {
            date: header.indexOf('date'),
            type: header.indexOf('type'),
            description: header.indexOf('description'),
            category: header.indexOf('category'),
            payMethod: header.indexOf('payMethod'),
            paySubType: header.indexOf('paySubType'),
            amount: header.indexOf('amount'),
            note: header.indexOf('note')
          };
          if (idx.date < 0 || idx.type < 0 || idx.amount < 0) {
            throw new Error('CSV missing required columns');
          }
          newStore = {
            version: 1,
            days: {},
            settings: loadSettings()
          };
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (!cols || cols.length === 0) continue;
            const dateStr = cols[idx.date];
            if (!dateStr) continue;
            const type = cols[idx.type] || 'Expense';
            const description = cols[idx.description] || '';
            const category = cols[idx.category] || '';
            const payMethod = cols[idx.payMethod] || '';
            const paySubType =
              idx.paySubType >= 0 ? cols[idx.paySubType] || '' : '';
            const amount = parseFloat(cols[idx.amount] || '0');
            const note = idx.note >= 0 ? cols[idx.note] || '' : '';
            if (isNaN(amount) || amount <= 0) continue;

            if (!newStore.days[dateStr]) newStore.days[dateStr] = [];
            newStore.days[dateStr].push({
              id: Date.now() + i,
              type,
              description,
              category,
              payMethod,
              paySubType,
              amount,
              note
            });
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStore));
        alert('Import successful.');
        renderEntries();
        renderSummary();
      } catch (err) {
        console.error(err);
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

/* ================== STARTUP ================== */

setupAuth();
