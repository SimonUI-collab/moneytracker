/**
 * MONEY TRACKER APPLICATION
 * Vanilla JavaScript implementation with LocalStorage persistence.
 * Zero external libraries or frameworks required.
 */

// --- CONFIGURATION & CATEGORY DEFINITIONS ---
const CATEGORIES = {
  expense: [
    { id: 'Food & Dining', name: 'Food & Dining', icon: '🍔' },
    { id: 'Housing & Rent', name: 'Housing & Rent', icon: '🏠' },
    { id: 'Transportation', name: 'Transportation', icon: '🚗' },
    { id: 'Shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'Entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'Bills & Utilities', name: 'Bills & Utilities', icon: '💡' },
    { id: 'Healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'Education', name: 'Education', icon: '📚' },
    { id: 'Personal Care', name: 'Personal Care', icon: '💅' },
    { id: 'Travel', name: 'Travel', icon: '✈️' },
    { id: 'Other Expense', name: 'Other Expense', icon: '📦' },
    { id: '__custom__', name: '✏️ Custom Category...', icon: '🏷️' }
  ],
  income: [
    { id: 'Salary', name: 'Salary', icon: '💼' },
    { id: 'Freelance & Side Hustle', name: 'Freelance & Side Hustle', icon: '💻' },
    { id: 'Investments', name: 'Investments', icon: '📈' },
    { id: 'Business', name: 'Business', icon: '🏢' },
    { id: 'Gift & Bonus', name: 'Gift & Bonus', icon: '🎁' },
    { id: 'Rental Income', name: 'Rental Income', icon: '🔑' },
    { id: 'Other Income', name: 'Other Income', icon: '💰' },
    { id: '__custom__', name: '✏️ Custom Category...', icon: '🏷️' }
  ]
};

// Distinct colors for category charts
const CHART_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
  '#84cc16', '#64748b'
];

const STORAGE_KEY = 'money_tracker_txns_v2';

// --- APPLICATION STATE ---
let transactions = [];
let currentFilter = 'all'; // 'all' | 'expense' | 'income'
let searchQuery = '';
let currentView = 'list';  // 'list' | 'info'
let pendingDeleteId = null;

// --- DOM ELEMENTS ---
const elements = {
  // Stats
  headerTxnCount: document.getElementById('headerTxnCount'),
  netBalance: document.getElementById('netBalance'),
  totalIncome: document.getElementById('totalIncome'),
  totalExpense: document.getElementById('totalExpense'),
  filteredCountText: document.getElementById('filteredCountText'),
  savingsRate: document.getElementById('savingsRate'),
  topExpenseCat: document.getElementById('topExpenseCat'),

  // Views & Tabs
  tabListBtn: document.getElementById('tabListBtn'),
  tabInfoBtn: document.getElementById('tabInfoBtn'),
  listView: document.getElementById('listView'),
  infoView: document.getElementById('infoView'),

  // Add Form
  addForm: document.getElementById('addTxnForm'),
  txnTypeRadios: document.querySelectorAll('input[name="txnType"]'),
  txnAmount: document.getElementById('txnAmount'),
  txnCategory: document.getElementById('txnCategory'),
  customCategoryContainer: document.getElementById('customCategoryContainer'),
  txnCustomCategory: document.getElementById('txnCustomCategory'),
  txnNote: document.getElementById('txnNote'),
  txnDate: document.getElementById('txnDate'),

  // Filter & Search
  filterPills: document.querySelectorAll('.filter-pill'),
  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  transactionsContainer: document.getElementById('transactionsContainer'),

  // Charts
  barChartContainer: document.getElementById('barChartContainer'),
  pieChartContainer: document.getElementById('pieChartContainer'),

  // Edit Modal
  editModal: document.getElementById('editModal'),
  closeEditModalBtn: document.getElementById('closeEditModalBtn'),
  cancelEditBtn: document.getElementById('cancelEditBtn'),
  editForm: document.getElementById('editTxnForm'),
  editTxnId: document.getElementById('editTxnId'),
  editTypeExpenseLabel: document.getElementById('editTypeExpenseLabel'),
  editTypeIncomeLabel: document.getElementById('editTypeIncomeLabel'),
  editTypeRadios: document.querySelectorAll('input[name="editTxnType"]'),
  editAmount: document.getElementById('editAmount'),
  editCategory: document.getElementById('editCategory'),
  editCustomCategoryContainer: document.getElementById('editCustomCategoryContainer'),
  editCustomCategory: document.getElementById('editCustomCategory'),
  editNote: document.getElementById('editNote'),
  editDate: document.getElementById('editDate'),

  // Delete Modal
  deleteModal: document.getElementById('deleteModal'),
  cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
  confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
  deleteModalMessage: document.getElementById('deleteModalMessage')
};

// --- INITIALIZATION ---
function init() {
  loadTransactions();
  setupTodayDate();
  populateCategorySelect(elements.txnCategory, 'expense');
  bindEvents();
  renderApp();
}

// --- LOCAL STORAGE HANDLING ---
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      transactions = JSON.parse(raw);
    } else {
      transactions = [];
    }
  } catch (err) {
    console.error('Failed to load transactions from localStorage:', err);
    transactions = [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage:', err);
    alert('Notice: Could not save data to browser storage. Your browser storage might be full or private browsing may restrict storage.');
  }
}

// --- CATEGORY HELPERS ---
function getSelectedType(radios) {
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return 'expense';
}

function populateCategorySelect(selectEl, type, selectedCategory = '') {
  selectEl.innerHTML = '';
  const list = CATEGORIES[type] || CATEGORIES.expense;

  list.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.icon} ${item.name}`;
    if (selectedCategory && selectedCategory === item.id) {
      opt.selected = true;
    }
    selectEl.appendChild(opt);
  });

  // If selectedCategory is a custom string not in standard list:
  if (selectedCategory && !list.some(item => item.id === selectedCategory)) {
    // Select __custom__
    selectEl.value = '__custom__';
  }
}

function getCategoryIcon(type, categoryName) {
  const list = CATEGORIES[type] || [];
  const found = list.find(item => item.id === categoryName || item.name === categoryName);
  if (found && found.icon) return found.icon;
  return type === 'income' ? '💵' : '💸';
}

function setupTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  if (elements.txnDate) elements.txnDate.value = today;
  if (elements.editDate) elements.editDate.value = today;
}

// --- EVENT BINDING ---
function bindEvents() {
  // View Switcher (Tabs)
  elements.tabListBtn.addEventListener('click', () => switchView('list'));
  elements.tabInfoBtn.addEventListener('click', () => switchView('info'));

  // Main Form: Type toggle styling & category update
  elements.txnTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const type = getSelectedType(elements.txnTypeRadios);
      updateTypeRadioStyles(elements.txnTypeRadios);
      populateCategorySelect(elements.txnCategory, type);
      elements.customCategoryContainer.classList.add('hidden');
      elements.txnCustomCategory.value = '';
    });
  });

  // Main Form: Custom category show/hide
  elements.txnCategory.addEventListener('change', () => {
    if (elements.txnCategory.value === '__custom__') {
      elements.customCategoryContainer.classList.remove('hidden');
      elements.txnCustomCategory.focus();
    } else {
      elements.customCategoryContainer.classList.add('hidden');
    }
  });

  // Main Form Submit
  elements.addForm.addEventListener('submit', handleAddTransaction);

  // Search Input
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    elements.clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
    renderTransactionsList();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.clearSearchBtn.classList.add('hidden');
    renderTransactionsList();
  });

  // Filter Pills
  elements.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderTransactionsList();
    });
  });

  // Edit Form: Type change
  elements.editTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const type = getSelectedType(elements.editTypeRadios);
      updateTypeRadioStyles(elements.editTypeRadios);
      populateCategorySelect(elements.editCategory, type);
      elements.editCustomCategoryContainer.classList.add('hidden');
      elements.editCustomCategory.value = '';
    });
  });

  // Edit Form: Custom category show/hide
  elements.editCategory.addEventListener('change', () => {
    if (elements.editCategory.value === '__custom__') {
      elements.editCustomCategoryContainer.classList.remove('hidden');
      elements.editCustomCategory.focus();
    } else {
      elements.editCustomCategoryContainer.classList.add('hidden');
    }
  });

  // Edit Form Submit
  elements.editForm.addEventListener('submit', handleEditTransaction);

  // Close Edit Modal
  elements.closeEditModalBtn.addEventListener('click', closeEditModal);
  elements.cancelEditBtn.addEventListener('click', closeEditModal);
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) closeEditModal();
  });

  // Delete Modal Actions
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  elements.confirmDeleteBtn.addEventListener('click', executeDeleteTransaction);
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // Keyboard accessibility (ESC closes modals)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeDeleteModal();
    }
  });
}

function updateTypeRadioStyles(radioNodes) {
  radioNodes.forEach(radio => {
    const parent = radio.closest('.type-radio-label');
    if (parent) {
      if (radio.checked) {
        parent.classList.add('active');
      } else {
        parent.classList.remove('active');
      }
    }
  });
}

// --- VIEW SWITCHING ---
function switchView(viewName) {
  currentView = viewName;

  if (viewName === 'list') {
    elements.tabListBtn.classList.add('active');
    elements.tabListBtn.setAttribute('aria-selected', 'true');
    elements.tabInfoBtn.classList.remove('active');
    elements.tabInfoBtn.setAttribute('aria-selected', 'false');

    elements.listView.classList.add('active');
    elements.infoView.classList.remove('active');
  } else {
    elements.tabInfoBtn.classList.add('active');
    elements.tabInfoBtn.setAttribute('aria-selected', 'true');
    elements.tabListBtn.classList.remove('active');
    elements.tabListBtn.setAttribute('aria-selected', 'false');

    elements.infoView.classList.add('active');
    elements.listView.classList.remove('active');

    renderInfographics();
  }
}

// --- ADD TRANSACTION ---
function handleAddTransaction(e) {
  e.preventDefault();

  const type = getSelectedType(elements.txnTypeRadios);
  const amount = parseFloat(elements.txnAmount.value);
  let category = elements.txnCategory.value;

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  // Handle custom category
  if (category === '__custom__') {
    const customVal = elements.txnCustomCategory.value.trim();
    if (!customVal) {
      alert('Please specify a custom category name.');
      elements.txnCustomCategory.focus();
      return;
    }
    category = customVal;
  }

  const note = elements.txnNote.value.trim();
  const date = elements.txnDate.value || new Date().toISOString().split('T')[0];

  const newTxn = {
    id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    type,
    amount: Math.round(amount * 100) / 100, // keep 2 decimals
    category,
    note,
    date,
    createdAt: Date.now()
  };

  transactions.unshift(newTxn);
  saveTransactions();

  // Reset form inputs
  elements.txnAmount.value = '';
  elements.txnNote.value = '';
  elements.txnCustomCategory.value = '';
  elements.customCategoryContainer.classList.add('hidden');
  setupTodayDate();

  renderApp();
}

// --- EDIT TRANSACTION ---
function openEditModal(id) {
  const txn = transactions.find(t => t.id === id);
  if (!txn) return;

  elements.editTxnId.value = txn.id;

  // Set type radio
  elements.editTypeRadios.forEach(r => {
    r.checked = (r.value === txn.type);
  });
  updateTypeRadioStyles(elements.editTypeRadios);

  // Populate categories according to type
  populateCategorySelect(elements.editCategory, txn.type, txn.category);

  // Check if custom category was used
  const list = CATEGORIES[txn.type] || [];
  const isStandard = list.some(item => item.id === txn.category);
  if (!isStandard) {
    elements.editCategory.value = '__custom__';
    elements.editCustomCategoryContainer.classList.remove('hidden');
    elements.editCustomCategory.value = txn.category;
  } else {
    elements.editCategory.value = txn.category;
    elements.editCustomCategoryContainer.classList.add('hidden');
    elements.editCustomCategory.value = '';
  }

  elements.editAmount.value = txn.amount.toFixed(2);
  elements.editNote.value = txn.note || '';
  elements.editDate.value = txn.date;

  elements.editModal.classList.remove('hidden');
  elements.editAmount.focus();
}

function closeEditModal() {
  elements.editModal.classList.add('hidden');
}

function handleEditTransaction(e) {
  e.preventDefault();
  const id = elements.editTxnId.value;
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) return;

  const type = getSelectedType(elements.editTypeRadios);
  const amount = parseFloat(elements.editAmount.value);
  let category = elements.editCategory.value;

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive amount.');
    return;
  }

  if (category === '__custom__') {
    const customVal = elements.editCustomCategory.value.trim();
    if (!customVal) {
      alert('Please specify a custom category name.');
      elements.editCustomCategory.focus();
      return;
    }
    category = customVal;
  }

  const note = elements.editNote.value.trim();
  const date = elements.editDate.value || new Date().toISOString().split('T')[0];

  transactions[index] = {
    ...transactions[index],
    type,
    amount: Math.round(amount * 100) / 100,
    category,
    note,
    date
  };

  saveTransactions();
  closeEditModal();
  renderApp();
}

// --- DELETE TRANSACTION WITH CONFIRMATION ---
function promptDeleteTransaction(id) {
  const txn = transactions.find(t => t.id === id);
  if (!txn) return;

  pendingDeleteId = id;
  const formattedAmt = formatCurrency(txn.amount);
  elements.deleteModalMessage.textContent = 
    `Are you sure you want to delete this ${txn.type} of ${formattedAmt} for "${txn.category}"? This action cannot be undone.`;

  elements.deleteModal.classList.remove('hidden');
  elements.confirmDeleteBtn.focus();
}

function closeDeleteModal() {
  pendingDeleteId = null;
  elements.deleteModal.classList.add('hidden');
}

function executeDeleteTransaction() {
  if (!pendingDeleteId) return;

  transactions = transactions.filter(t => t.id !== pendingDeleteId);
  saveTransactions();
  closeDeleteModal();
  renderApp();
}

// --- RENDER APP ---
function renderApp() {
  updateOverviewStats();
  renderTransactionsList();
  if (currentView === 'info') {
    renderInfographics();
  }
}

// --- OVERVIEW STATS ---
function updateOverviewStats() {
  // Total transaction count at top (User requirement: "See the total number of transactions at the top.")
  const totalCount = transactions.length;
  elements.headerTxnCount.textContent = totalCount;

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });

  const net = totalIncome - totalExpense;

  elements.netBalance.textContent = formatCurrency(net);
  if (net < 0) {
    elements.netBalance.style.color = 'var(--expense)';
  } else if (net > 0) {
    elements.netBalance.style.color = 'var(--income)';
  } else {
    elements.netBalance.style.color = 'var(--text-main)';
  }

  elements.totalIncome.textContent = formatCurrency(totalIncome);
  elements.totalExpense.textContent = formatCurrency(totalExpense);
}

// --- RENDER TRANSACTIONS LIST ---
function renderTransactionsList() {
  const container = elements.transactionsContainer;
  container.innerHTML = '';

  // Filter transactions
  let filtered = transactions.filter(t => {
    if (currentFilter !== 'all' && t.type !== currentFilter) {
      return false;
    }
    if (searchQuery) {
      const matchCategory = t.category.toLowerCase().includes(searchQuery);
      const matchNote = (t.note || '').toLowerCase().includes(searchQuery);
      const matchAmount = t.amount.toString().includes(searchQuery);
      const matchDate = (t.date || '').includes(searchQuery);
      return matchCategory || matchNote || matchAmount || matchDate;
    }
    return true;
  });

  // Update count text
  elements.filteredCountText.textContent = `${filtered.length} of ${transactions.length} ${transactions.length === 1 ? 'entry' : 'entries'}`;

  // Check empty state
  if (transactions.length === 0) {
    // Complete empty state
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍃</div>
        <h3 class="empty-title">Your list is completely empty</h3>
        <p class="empty-desc">You don't have any recorded transactions yet. Use the form above to add your first income or expense!</p>
        <button type="button" class="btn btn-secondary empty-action-btn" id="loadSampleDataBtn">
          ✨ Add sample data to test
        </button>
      </div>
    `;

    document.getElementById('loadSampleDataBtn')?.addEventListener('click', loadSampleDemoData);
    return;
  }

  if (filtered.length === 0) {
    // Search or filter returned 0 results
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3 class="empty-title">No transactions match your search</h3>
        <p class="empty-desc">Try searching for something else or clearing the search filter.</p>
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach(txn => {
    const item = document.createElement('div');
    item.className = `txn-item ${txn.type}`;
    item.setAttribute('role', 'listitem');

    const icon = getCategoryIcon(txn.type, txn.category);
    const formattedAmount = `${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}`;
    const formattedDate = formatDate(txn.date);

    item.innerHTML = `
      <div class="txn-left">
        <div class="txn-cat-badge" title="${escapeHtml(txn.category)}">
          ${icon}
        </div>
        <div class="txn-details">
          <span class="txn-category-name">${escapeHtml(txn.category)}</span>
          <div class="txn-meta">
            <span class="txn-date">${formattedDate}</span>
            ${txn.note ? `<span>&bull;</span><span class="txn-note-text" title="${escapeHtml(txn.note)}">${escapeHtml(txn.note)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="txn-right">
        <span class="txn-amount ${txn.type}">${formattedAmount}</span>
        <div class="txn-actions">
          <button type="button" class="btn-icon edit-btn" title="Edit transaction" aria-label="Edit transaction">
            ✏️
          </button>
          <button type="button" class="btn-icon delete-btn" title="Delete transaction" aria-label="Delete transaction">
            🗑️
          </button>
        </div>
      </div>
    `;

    // Hook buttons
    item.querySelector('.edit-btn').addEventListener('click', () => openEditModal(txn.id));
    item.querySelector('.delete-btn').addEventListener('click', () => promptDeleteTransaction(txn.id));

    container.appendChild(item);
  });
}

// --- INFOGRAPHICS VIEW RENDERING ---
function renderInfographics() {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryExpenses = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    }
  });

  // Calculate Savings Rate & Top Expense Category
  const savingsRateVal = totalIncome > 0 
    ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) 
    : 0;
  elements.savingsRate.textContent = `${savingsRateVal}%`;

  let topCat = '—';
  let topCatAmount = 0;
  for (const [cat, amt] of Object.entries(categoryExpenses)) {
    if (amt > topCatAmount) {
      topCatAmount = amt;
      topCat = cat;
    }
  }
  elements.topExpenseCat.textContent = topCat !== '—' 
    ? `${topCat} (${formatCurrency(topCatAmount)})` 
    : 'None';

  // Render Bar Chart (Income vs Expenses)
  renderBarChart(totalIncome, totalExpense);

  // Render Pie Chart (Expenses by Category)
  renderPieChart(categoryExpenses, totalExpense);
}

// 1. Bar Chart: Income vs Expenses
function renderBarChart(income, expense) {
  const container = elements.barChartContainer;
  container.innerHTML = '';

  const maxVal = Math.max(income, expense, 1);
  const incomePct = income > 0 ? Math.min(100, Math.max(8, Math.round((income / maxVal) * 100))) : 0;
  const expensePct = expense > 0 ? Math.min(100, Math.max(8, Math.round((expense / maxVal) * 100))) : 0;

  const net = income - expense;
  const isPositive = net >= 0;

  container.innerHTML = `
    <!-- Income Row -->
    <div class="bar-row">
      <div class="bar-info">
        <span class="bar-title">💵 Total Income</span>
        <span class="bar-amount text-income">${formatCurrency(income)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill income" style="width: ${incomePct}%;">
          ${income > 0 ? Math.round((income / (income + expense || 1)) * 100) + '%' : ''}
        </div>
      </div>
    </div>

    <!-- Expense Row -->
    <div class="bar-row">
      <div class="bar-info">
        <span class="bar-title">💸 Total Expenses</span>
        <span class="bar-amount text-expense">${formatCurrency(expense)}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill expense" style="width: ${expensePct}%;">
          ${expense > 0 ? Math.round((expense / (income + expense || 1)) * 100) + '%' : ''}
        </div>
      </div>
    </div>

    <!-- Cashflow Difference Box -->
    <div class="bar-delta-box">
      <span class="bar-delta-label">Net Difference (Income - Expense):</span>
      <span class="bar-delta-val" style="color: ${isPositive ? 'var(--income)' : 'var(--expense)'}">
        ${isPositive ? '+' : ''}${formatCurrency(net)} (${isPositive ? 'Surplus 🎉' : 'Deficit ⚠️'})
      </span>
    </div>
  `;
}

// 2. Pie Chart: Expenses by Category (Pure SVG Donut with Legend)
function renderPieChart(categoryExpenses, totalExpense) {
  const container = elements.pieChartContainer;
  container.innerHTML = '';

  const categories = Object.keys(categoryExpenses);

  if (categories.length === 0 || totalExpense === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <div class="empty-icon" style="font-size: 2.2rem;">🥧</div>
        <h3 class="empty-title">No expenses to display</h3>
        <p class="empty-desc">Add some expense transactions to see your spending breakdown by category.</p>
      </div>
    `;
    return;
  }

  // Sort categories by amount descending
  categories.sort((a, b) => categoryExpenses[b] - categoryExpenses[a]);

  // SVG Donut calculation
  // Circle circumference = 2 * PI * r
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let strokeDashOffset = 0;

  let svgCircles = '';
  let legendHtml = '';

  categories.forEach((cat, index) => {
    const amount = categoryExpenses[cat];
    const percentage = (amount / totalExpense);
    const sliceLength = percentage * circumference;
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const pctString = (percentage * 100).toFixed(1) + '%';
    const icon = getCategoryIcon('expense', cat);

    // SVG Circle slice
    svgCircles += `
      <circle
        cx="100"
        cy="100"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="26"
        stroke-dasharray="${sliceLength} ${circumference}"
        stroke-dashoffset="-${strokeDashOffset}"
        style="transition: stroke-dasharray 0.6s ease;"
      >
        <title>${cat}: ${formatCurrency(amount)} (${pctString})</title>
      </circle>
    `;

    strokeDashOffset += sliceLength;

    // Legend item
    legendHtml += `
      <div class="legend-item">
        <div class="legend-left">
          <span class="legend-color-dot" style="background: ${color};"></span>
          <span class="legend-name" title="${escapeHtml(cat)}">${icon} ${escapeHtml(cat)}</span>
        </div>
        <div class="legend-right">
          <span class="legend-pct">${pctString}</span>
          <span class="legend-amount">${formatCurrency(amount)}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="pie-visual-container">
      <svg class="pie-svg" viewBox="0 0 200 200" aria-label="Pie chart of expenses by category">
        ${svgCircles}
      </svg>
      <div class="pie-center-circle">
        <span class="pie-center-label">Total Exp.</span>
        <span class="pie-center-amount">${formatCurrency(totalExpense)}</span>
      </div>
    </div>
    <div class="pie-legend">
      ${legendHtml}
    </div>
  `;
}

// --- SAMPLE DATA LOADER ---
function loadSampleDemoData() {
  const today = new Date();
  const makeDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().split('T')[0];
  };

  transactions = [
    {
      id: 'txn_demo_1',
      type: 'income',
      amount: 3200.00,
      category: 'Salary',
      note: 'Bi-weekly paycheck',
      date: makeDate(1),
      createdAt: Date.now() - 100000
    },
    {
      id: 'txn_demo_2',
      type: 'expense',
      amount: 1100.00,
      category: 'Housing & Rent',
      note: 'Monthly apartment rent',
      date: makeDate(2),
      createdAt: Date.now() - 90000
    },
    {
      id: 'txn_demo_3',
      type: 'expense',
      amount: 165.50,
      category: 'Food & Dining',
      note: 'Supermarket weekly groceries',
      date: makeDate(3),
      createdAt: Date.now() - 80000
    },
    {
      id: 'txn_demo_4',
      type: 'income',
      amount: 450.00,
      category: 'Freelance & Side Hustle',
      note: 'Website design project',
      date: makeDate(4),
      createdAt: Date.now() - 70000
    },
    {
      id: 'txn_demo_5',
      type: 'expense',
      amount: 75.00,
      category: 'Bills & Utilities',
      note: 'High-speed internet',
      date: makeDate(5),
      createdAt: Date.now() - 60000
    },
    {
      id: 'txn_demo_6',
      type: 'expense',
      amount: 42.80,
      category: 'Transportation',
      note: 'Gas tank refill',
      date: makeDate(6),
      createdAt: Date.now() - 50000
    },
    {
      id: 'txn_demo_7',
      type: 'expense',
      amount: 29.99,
      category: 'Entertainment',
      note: 'Movie tickets & snacks',
      date: makeDate(7),
      createdAt: Date.now() - 40000
    }
  ];

  saveTransactions();
  renderApp();
}

// --- UTILITY FORMATTERS ---
function formatCurrency(val) {
  const num = Number(val) || 0;
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start application
document.addEventListener('DOMContentLoaded', init);

