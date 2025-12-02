'use strict';

// ========== DATA LAYER (localStorage) ==========
const STORAGE_KEY = 'money_tracker_v1';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, days: {} };
    const data = JSON.parse(raw);
    if (!data.days) data.days = {};
    return data;
  } catch (e) {
    console.error('Error reading storage', e);
    return { version: 1, days: {} };
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

  // Remove from old date
  store.days[oldDateStr] = store.days[oldDateStr].filter((e) => e.id !== updatedEntry.id);
  if (store.days[oldDateStr].length === 0) delete store.days[oldDateStr];

  // Add to new date
  if (!store.days[newDateStr]) store.days[newDateStr] = [];
  store.days[newDateStr].push(updatedEntry);

  saveStore(store);
}

function deleteEntry(dateStr, id) {
  const store = loadStore();
  if (!store.days[dateStr]) return;
  store.days[dateStr] = store.days[dateStr].filter((e) => e.id !== id);
  if (store.days[dateStr].length === 0) delete store.days[dateStr];
  saveStore(store);
}

// ========== DOM ELEMENTS ==========
const viewEntry = document.getElementById('view-entry');
const viewSummary = document.getElementById('view-summary');
const navTabs = document.querySelectorAll('.nav-tab');

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

// Summary view
const monthPicker = document.getElementById('monthPicker');
const monthSumExpenseEl = document.getElementById('monthSumExpense');
const monthSumIncomeEl = document.getElementById('monthSumIncome');
const categoryPieCanvas = document.getElementById('categoryPie');
const categoryLegendEl = document.getElementById('categoryLegend');

// Backup
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFileInput = document.getElementById('importFile');
const importBtn = document.getElementById('importBtn');

// Edit state
let currentEdit = null; // { id, dateStr }

// ========== HELPERS ==========
function toLocalDateInputValue(date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function initDate() {
  const today = new Date();
  dateInput.value = toLocalDateInputValue(today);
  updateSelectedDateLabel();
  renderEntries();
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
    year: 'numeric',
  });
  selectedDateLabel.textContent = fmt;
}

// ========== NAVIGATION ==========
navTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    navTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const view = tab.dataset.view;
    if (view === 'entry') {
      viewEntry.classList.add('active');
      viewSummary.classList.remove('active');
    } else {
      viewSummary.classList.add('active');
      viewEntry.classList.remove('active');
      // Make sure summary view is up to date
      renderMonthlySummary();
    }
  });
});

// ========== ENTRY VIEW LOGIC ==========

// Category pills
document.querySelectorAll('#category-pills .pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    categoryInput.value = pill.dataset.value;
  });
});

clearBtn.addEventListener('click', () => {
  form.reset();
  statusEl.textContent = '';
  statusEl.className = 'status';
  currentEdit = null;
  formTitleEl.textContent = 'Add entry for this day';
  submitBtn.textContent = 'Save entry';
});

dateInput.addEventListener('change', () => {
  updateSelectedDateLabel();
  renderEntries();
});

function renderEntries() {
  const dateStr = dateInput.value;
  const store = loadStore();
  const entries = getEntriesForDate(store, dateStr);

  entriesListEl.innerHTML = '';
  if (!entries.length) {
    entriesListEl.innerHTML = '<div class="info">No entries yet for this day.</div>';
  } else {
    entries.forEach((entry) => {
      const div = document.createElement('div');
      div.className = 'entry';

      const main = document.createElement('div');
      main.className = 'entry-main';

      const title = document.createElement('div');
      title.className = 'entry-title';
      title.textContent = entry.description || '(No description)';

      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      meta.textContent = `${entry.type} • ${entry.category || 'No category'} • ${entry.payMethod}`;

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
      editBtn.style.border = '1px solid #e5e7eb';
      editBtn.style.background = '#e0f2fe';
      editBtn.addEventListener('click', () => {
        startEdit(dateStr, entry);
      });

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn-small';
      delBtn.style.border = '1px solid #e5e7eb';
      delBtn.style.background = '#ffffff';
      delBtn.addEventListener('click', () => {
        if (confirm('Delete this entry?')) {
          deleteEntry(dateStr, entry.id);
          renderEntries();
          renderMonthlySummary();
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
  entries.forEach((e) => {
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
  document.getElementById('payMethod').value = entry.payMethod;
  document.getElementById('amount').value = entry.amount;
  noteInput.value = entry.note || '';
  formTitleEl.textContent = 'Edit entry';
  submitBtn.textContent = 'Update entry';
  statusEl.textContent = 'Editing mode: change values and click Update entry.';
  statusEl.className = 'status';
}

form.addEventListener('submit', (e) => {
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
  const payMethod = document.getElementById('payMethod').value;
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
      amount: amountVal,
      note,
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
      amount: amountVal,
      note,
    };
    addEntry(newDateStr, entry);
    statusEl.textContent = 'Saved ✔';
    statusEl.className = 'status ok';
  }

  form.reset();
  renderEntries();
  renderMonthlySummary();
});

// ========== SUMMARY VIEW: MONTH + PIE CHART ==========

function initMonthPicker() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  monthPicker.value = `${y}-${m}`;
  renderMonthlySummary();
}

monthPicker.addEventListener('change', renderMonthlySummary);

function renderMonthlySummary() {
  const monthVal = monthPicker.value; // "YYYY-MM"
  if (!monthVal) return;

  const store = loadStore();
  const categoryTotals = {}; // category -> expense
  let monthExp = 0;
  let monthInc = 0;

  Object.keys(store.days).forEach((dateStr) => {
    if (!dateStr.startsWith(monthVal)) return;
    const entries = store.days[dateStr];
    entries.forEach((e) => {
      if (e.type === 'Income') {
        monthInc += e.amount;
      } else {
        monthExp += e.amount;
        const cat = e.category || 'Uncategorized';
        if (!categoryTotals[cat]) categoryTotals[cat] = 0;
        categoryTotals[cat] += e.amount;
      }
    });
  });

  monthSumExpenseEl.textContent = '₹' + monthExp.toFixed(2);
  monthSumIncomeEl.textContent = '₹' + monthInc.toFixed(2);

  drawCategoryPie(categoryTotals);
}

// PIE CHART (Canvas, per category)
function drawCategoryPie(categoryTotals) {
  const ctx = categoryPieCanvas.getContext('2d');
  // Handle HiDPI
  const rect = categoryPieCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  categoryPieCanvas.width = rect.width * dpr;
  categoryPieCanvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  const categories = Object.keys(categoryTotals);
  const total = categories.reduce((sum, cat) => sum + categoryTotals[cat], 0);

  if (!categories.length || total === 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.fillText('No expense data for this month.', 10, height / 2);
    categoryLegendEl.innerHTML = '';
    return;
  }

  // Generate colors
  const colors = {};
  categories.forEach((cat, i) => {
    const hue = (i * 65) % 360;
    colors[cat] = `hsl(${hue}, 70%, 55%)`;
  });

  // Draw pie
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;

  let startAngle = -Math.PI / 2;

  categories.forEach((cat) => {
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

  // Legend
  categoryLegendEl.innerHTML = '';
  categories.forEach((cat) => {
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

// ========== BACKUP & RESTORE ==========

function escapeCsvField(field) {
  if (field == null) return '';
  const s = String(field);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

exportCsvBtn.addEventListener('click', () => {
  const store = loadStore();
  const rows = [];
  rows.push(['date', 'type', 'description', 'category', 'payMethod', 'amount', 'note']);

  Object.keys(store.days).forEach((dateStr) => {
    store.days[dateStr].forEach((e) => {
      rows.push([
        dateStr,
        e.type,
        e.description || '',
        e.category || '',
        e.payMethod || '',
        e.amount,
        e.note || '',
      ]);
    });
  });

  const csvLines = rows.map((r) => r.map(escapeCsvField).join(',')).join('\n');
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
  const store = loadStore();
  const blob = new Blob([JSON.stringify(store, null, 2)], {
    type: 'application/json',
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
  reader.onload = (e) => {
    const text = e.target.result;
    try {
      if (
        file.name.toLowerCase().endsWith('.json') ||
        text.trim().startsWith('{')
      ) {
        // JSON import
        const data = JSON.parse(text);
        if (!data.days) throw new Error('Invalid JSON backup');
        saveStore(data);
      } else {
        // CSV import
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const header = parseCsvLine(lines[0]);
        const idx = {
          date: header.indexOf('date'),
          type: header.indexOf('type'),
          description: header.indexOf('description'),
          category: header.indexOf('category'),
          payMethod: header.indexOf('payMethod'),
          amount: header.indexOf('amount'),
          note: header.indexOf('note'),
        };
        if (idx.date < 0 || idx.type < 0 || idx.amount < 0) {
          throw new Error('CSV missing required columns');
        }
        const newStore = { version: 1, days: {} };
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          if (!cols || cols.length === 0) continue;
          const dateStr = cols[idx.date];
          if (!dateStr) continue;
          const type = cols[idx.type] || 'Expense';
          const description = cols[idx.description] || '';
          const category = cols[idx.category] || '';
          const payMethod = cols[idx.payMethod] || '';
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
            amount,
            note,
          });
        }
        saveStore(newStore);
      }
      alert('Import successful.');
      renderEntries();
      renderMonthlySummary();
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
});

// Simple CSV line parser
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

// ========== PWA: SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((err) => console.log('SW registration failed', err));
  });
}

// ========== INIT ==========
initDate();
initMonthPicker();
