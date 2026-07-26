/* ============================================
   BIZMANAGER PRO - Complete JavaScript
   All features: Products, Sales, Incoming Stock,
   Expenses, Capital, Reports, Charts, Calendar,
   Search, Notifications, Import/Export, Settings
   ============================================ */

// ============================================
// DATA STORE - LocalStorage Manager
// ============================================
class DataStore {
    constructor() {
        this.keys = {
            products: 'bm_products',
            incoming: 'bm_incoming',
            sales: 'bm_sales',
            expenses: 'bm_expenses',
            capital: 'bm_capital',
            settings: 'bm_settings',
            notifications: 'bm_notifications'
        };
    }

    get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || this._default(key); }
        catch { return this._default(key); }
    }
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        return data;
    }
    _default(key) {
        const d = {
            [this.keys.products]: [],
            [this.keys.incoming]: [],
            [this.keys.sales]: [],
            [this.keys.expenses]: [],
            [this.keys.capital]: [],
            [this.keys.settings]: {
                businessName: 'BizManager Pro',
                currency: 'Rp', currencyLocale: 'id-ID',
                taxPercentage: 11, theme: 'light', language: 'en', defaultProfitMargin: 30
            },
            [this.keys.notifications]: []
        };
        return d[key] || [];
    }

    // --- Products ---
    getProducts() { return this.get(this.keys.products); }
    saveProducts(p) { return this.set(this.keys.products, p); }
    addProduct(product) {
        const list = this.getProducts();
        product.id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        product.createdAt = new Date().toISOString();
        product.currentStock = product.currentStock ?? product.initialStock ?? 0;
        list.push(product);
        this.saveProducts(list);
        return product;
    }
    updateProduct(id, updates) {
        const list = this.getProducts();
        const idx = list.findIndex(p => p.id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...updates };
        this.saveProducts(list);
        return list[idx];
    }
    deleteProduct(id) { this.saveProducts(this.getProducts().filter(p => p.id !== id)); }
    getProduct(id) { return this.getProducts().find(p => p.id === id); }

    // --- Incoming Stock ---
    getIncoming() { return this.get(this.keys.incoming); }
    saveIncoming(d) { return this.set(this.keys.incoming, d); }
    addIncoming(record) {
        const list = this.getIncoming();
        record.id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        record.createdAt = new Date().toISOString();
        list.push(record);
        this.saveIncoming(list);
        const prod = this.getProduct(record.productId);
        if (prod) {
            prod.currentStock = (prod.currentStock || 0) + record.quantity;
            prod.purchasePrice = record.purchasePrice;
            prod.sellingPrice = record.sellingPrice;
            this.updateProduct(prod.id, prod);
        }
        return record;
    }

    // --- Sales ---
    getSales() { return this.get(this.keys.sales); }
    saveSales(d) { return this.set(this.keys.sales, d); }
    addSale(record) {
        const list = this.getSales();
        record.id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        record.createdAt = new Date().toISOString();
        list.push(record);
        this.saveSales(list);
        const prod = this.getProduct(record.productId);
        if (prod) {
            prod.currentStock = Math.max(0, (prod.currentStock || 0) - record.quantity);
            this.updateProduct(prod.id, prod);
        }
        return record;
    }

    // --- Expenses ---
    getExpenses() { return this.get(this.keys.expenses); }
    saveExpenses(d) { return this.set(this.keys.expenses, d); }
    addExpense(record) {
        const list = this.getExpenses();
        record.id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        record.createdAt = new Date().toISOString();
        list.push(record);
        this.saveExpenses(list);
        return record;
    }
    deleteExpense(id) { this.saveExpenses(this.getExpenses().filter(e => e.id !== id)); }

    // --- Capital ---
    getCapital() { return this.get(this.keys.capital); }
    saveCapital(d) { return this.set(this.keys.capital, d); }
    addCapital(record) {
        const list = this.getCapital();
        record.id = Date.now().toString(36) + Math.random().toString(36).substr(2,5);
        record.createdAt = new Date().toISOString();
        list.push(record);
        this.saveCapital(list);
        return record;
    }
    deleteCapital(id) { this.saveCapital(this.getCapital().filter(c => c.id !== id)); }

    // --- Settings ---
    getSettings() { return this.get(this.keys.settings); }
    saveSettings(s) { return this.set(this.keys.settings, s); }

    // --- Notifications ---
    getNotifications() { return this.get(this.keys.notifications); }
    saveNotifications(n) { return this.set(this.keys.notifications, n); }
    addNotification(n) {
        const list = this.getNotifications();
        n.id = Date.now().toString(36);
        n.date = new Date().toISOString();
        n.read = false;
        list.unshift(n);
        if (list.length > 50) list.length = 50;
        this.saveNotifications(list);
        App.updateBadge();
        return n;
    }
    markNotifRead(id) {
        const list = this.getNotifications();
        const n = list.find(x => x.id === id);
        if (n) n.read = true;
        this.saveNotifications(list);
        App.updateBadge();
    }
    clearNotifications() { this.saveNotifications([]); App.updateBadge(); }
    unreadCount() { return this.getNotifications().filter(n => !n.read).length; }

    // --- Computed Values ---
    getCurrentCapital() {
        let total = 0;
        for (const e of this.getCapital()) {
            if (e.type === 'initial' || e.type === 'additional' || e.type === 'investment') total += e.amount;
            else if (e.type === 'withdrawal') total -= e.amount;
        }
        return total;
    }
    getTotalExpenses(fn) { const e = this.getExpenses(); const f = fn ? e.filter(fn) : e; return f.reduce((s,x) => s+x.amount, 0); }
    getTotalSales(fn) { const s = this.getSales(); const f = fn ? s.filter(fn) : s; return f.reduce((s,x) => s+x.revenue, 0); }
    getTotalCogs(fn) { const s = this.getSales(); const f = fn ? s.filter(fn) : s; return f.reduce((s,x) => s+x.cogs, 0); }
    getGrossProfit(fn) { return this.getTotalSales(fn) - this.getTotalCogs(fn); }
    getNetProfit(fn) { return this.getGrossProfit(fn) - this.getTotalExpenses(fn); }
    getInventoryValue() { return this.getProducts().reduce((s,p) => s + ((p.currentStock||0)*(p.purchasePrice||0)), 0); }

    getBestSellingProduct() {
        const map = {};
        for (const s of this.getSales()) map[s.productName] = (map[s.productName]||0) + s.quantity;
        let best = { name: '-', qty: 0 };
for (const [n, q] of Object.entries(map)) if (q > best.qty) best = { name: n, qty: q };
        return best.name;
    }

    getLowStockProducts() { return this.getProducts().filter(p => (p.currentStock||0) <= (p.minStockAlert||0)); }
    getOutOfStockProducts() { return this.getProducts().filter(p => (p.currentStock||0) === 0); }

    getTodaySales() {
        const t = new Date().toDateString();
        return this.getSales().filter(s => new Date(s.date).toDateString() === t);
    }
    getTodayExpenses() {
        const t = new Date().toDateString();
        return this.getExpenses().filter(e => new Date(e.date).toDateString() === t);
    }

    getDateRangeSales(start, end) {
        const s = new Date(start).getTime(), e = new Date(end).getTime();
        return this.getSales().filter(x => { const t = new Date(x.date).getTime(); return t >= s && t <= e; });
    }
    getDateRangeExpenses(start, end) {
        const s = new Date(start).getTime(), e = new Date(end).getTime();
        return this.getExpenses().filter(x => { const t = new Date(x.date).getTime(); return t >= s && t <= e; });
    }

    getAllTransactions() {
        const all = [];
        for (const s of this.getSales()) all.push({ ...s, type: 'sale', display: `Sale: ${s.productName} x${s.quantity}` });
        for (const i of this.getIncoming()) all.push({ ...i, type: 'incoming', display: `Stock In: ${i.productName} x${i.quantity}` });
        for (const e of this.getExpenses()) all.push({ ...e, type: 'expense', display: `Expense: ${e.category}` });
        for (const c of this.getCapital()) all.push({ ...c, type: 'capital', display: `Capital: ${c.type}` });
        all.sort((a, b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
        return all;
    }

    exportAllData() {
        return {
            products: this.getProducts(), incoming: this.getIncoming(), sales: this.getSales(),
            expenses: this.getExpenses(), capital: this.getCapital(), settings: this.getSettings(),
            notifications: this.getNotifications(), exportedAt: new Date().toISOString()
        };
    }
    importAllData(data) {
        this.saveProducts(data.products||[]); this.saveIncoming(data.incoming||[]);
        this.saveSales(data.sales||[]); this.saveExpenses(data.expenses||[]);
        this.saveCapital(data.capital||[]);
        if (data.settings) this.saveSettings(data.settings);
        if (data.notifications) this.saveNotifications(data.notifications);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function $(id) { return document.getElementById(id); }
function qs(sel, ctx) { return (ctx||document).querySelector(sel); }
function qsa(sel, ctx) { return (ctx||document).querySelectorAll(sel); }

function formatCurrency(amount) {
    const s = App.store.getSettings();
    return s.currency + ' ' + Number(amount).toLocaleString(s.currencyLocale||'id-ID');
}
function formatDate(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(d) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type='success') {
    const c = $('toast-container');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
    t.innerHTML = `<i class="fas ${icons[type]||icons.success}"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function showModal(title, content, wide=false) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal ${wide ? 'modal-wide' : ''}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">${content}</div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    return overlay;
}

function showConfirm(title, msg, cb) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body"><p>${msg}</p></div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="confirm-no">Cancel</button>
                <button class="btn btn-danger" id="confirm-yes">Confirm</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
overlay.querySelector('#confirm-no').onclick = () => overlay.remove();
    overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); cb(); };
}

// ============================================
// APP CONTROLLER
// ============================================
const App = {
    store: new DataStore(),
    currentPage: 'dashboard',
    charts: {},
    calendarDate: new Date(),

    init() {
        this.loadSettings();
        this.setupListeners();
        this.navigate('dashboard');
        this.updateBadge();
        this.hideLoading();
        this.checkLowStock();
        // Auto-refresh dashboard every 30s
        setInterval(() => { if (this.currentPage === 'dashboard') this.renderDashboard(); }, 30000);
    },

    hideLoading() {
        setTimeout(() => {
            $('loading-screen').classList.add('hide');
            $('app').style.display = 'grid';
        }, 600);
    },

    loadSettings() {
        const s = this.store.getSettings();
        if (s.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            $('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
const brand = $('topbar-brand');
        if (brand) brand.innerHTML = (s.businessName || 'BizManager Pro') + ' <span class="watermark">— Akhdan Nur Syafi</span>';
    },

    setupListeners() {
        // Sidebar navigation
        qsa('.sidebar-nav a').forEach(a => {
            a.addEventListener('click', e => {
                e.preventDefault();
                const page = a.dataset.page;
                this.navigate(page);
                // Close mobile sidebar
                $('sidebar').classList.remove('open');
                $('sidebar-overlay').classList.remove('show');
            });
        });

        // Sidebar toggle
        $('sidebar-toggle').onclick = () => {
            $('sidebar').classList.toggle('open');
            $('sidebar-overlay').classList.toggle('show');
        };
        $('sidebar-overlay').onclick = () => {
            $('sidebar').classList.remove('open');
            $('sidebar-overlay').classList.remove('show');
        };

        // Theme toggle
        $('theme-toggle').onclick = () => this.toggleTheme();

        // Notifications
        $('notif-btn').onclick = () => {
            $('notif-panel').classList.toggle('show');
            this.renderNotifications();
        };
        $('notif-close').onclick = () => $('notif-panel').classList.remove('show');

        // FAB
        $('fab').onclick = () => $('fab-menu').classList.toggle('hidden');
        qsa('#fab-menu button').forEach(b => {
            b.onclick = () => {
                $('fab-menu').classList.add('hidden');
                const action = b.dataset.action;
                if (action === 'quick-product') this.showProductForm();
                else if (action === 'quick-sale') this.showSaleForm();
                else if (action === 'quick-expense') this.showExpenseForm();
            };
        });

        // Global search (Ctrl+K)
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showGlobalSearch();
            }
        });
    },

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-theme') === 'dark';
        if (isDark) {
            html.removeAttribute('data-theme');
            $('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
            this.store.saveSettings({ ...this.store.getSettings(), theme: 'light' });
        } else {
            html.setAttribute('data-theme', 'dark');
            $('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
            this.store.saveSettings({ ...this.store.getSettings(), theme: 'dark' });
        }
    },

    navigate(page) {
        this.currentPage = page;
        // Hide all pages
        qsa('.page').forEach(p => p.classList.remove('active-page'));
        // Show target page
        const target = $('page-' + page);
        if (target) target.classList.add('active-page');
        // Update sidebar active
        qsa('.sidebar-nav a').forEach(a => {
            a.classList.toggle('active', a.dataset.page === page);
        });
        // Render page
        const renderers = {
            dashboard: 'renderDashboard',
            products: 'renderProducts',
            incoming: 'renderIncoming',
            sales: 'renderSales',
            expenses: 'renderExpenses',
            capital: 'renderCapital',
            reports: 'renderReports',
            history: 'renderHistory',
            calendar: 'renderCalendar',
            settings: 'renderSettings',
            importexport: 'renderImportExport'
        };
        if (renderers[page]) this[renderers[page]]();
    },

    updateBadge() {
        const count = this.store.unreadCount();
        const badge = $('notif-badge');
        if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
    },

    checkLowStock() {
        for (const p of this.store.getLowStockProducts()) {
            this.store.addNotification({
                type: 'low_stock',
                message: `Low stock alert: ${p.name || p.productName} - only ${p.currentStock} remaining`,
                productId: p.id
            });
        }
        for (const p of this.store.getOutOfStockProducts()) {
            this.store.addNotification({
                type: 'out_of_stock',
                message: `OUT OF STOCK: ${p.name || p.productName}`,
                productId: p.id
            });
        }
    },

    // ============================================
    // DASHBOARD
    // ============================================
    renderDashboard() {
        const s = this.store;
        const today = new Date();
        const todaySales = s.getTodaySales();
        const todayExps = s.getTodayExpenses();
        const todayRevenue = todaySales.reduce((sum, x) => sum + x.revenue, 0);
        const todayProfit = todaySales.reduce((sum, x) => sum + x.grossProfit, 0) - todayExps.reduce((sum, x) => sum + x.amount, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthSales = s.getDateRangeSales(monthStart, today);
        const monthExps = s.getDateRangeExpenses(monthStart, today);
        const monthRevenue = monthSales.reduce((sum, x) => sum + x.revenue, 0);
        const monthProfit = monthSales.reduce((sum, x) => sum + x.grossProfit, 0) - monthExps.reduce((sum, x) => sum + x.amount, 0);
        const capital = s.getCurrentCapital();
        const invValue = s.getInventoryValue();
        const totalExps = s.getTotalExpenses();
        const lowStock = s.getLowStockProducts();
        const bestProduct = s.getBestSellingProduct();
        const recentTx = s.getAllTransactions().slice(0, 10);

        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-chart-pie text-primary"></i> Dashboard</h1>
                <div class="btn-group">
                    <button class="btn btn-outline btn-sm" onclick="App.renderDashboard()"><i class="fas fa-sync"></i> Refresh</button>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
                    <div class="stat-label">Today's Sales</div>
                    <div class="stat-value">${formatCurrency(todayRevenue)}</div>
                    <div class="stat-sub">${todaySales.length} transactions</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-chart-line"></i></div>
                    <div class="stat-label">Today's Profit</div>
                    <div class="stat-value">${formatCurrency(todayProfit)}</div>
                    <div class="stat-sub">${todaySales.length > 0 ? 'Active' : 'No sales'}</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-calendar"></i></div>
                    <div class="stat-label">Monthly Revenue</div>
                    <div class="stat-value">${formatCurrency(monthRevenue)}</div>
                    <div class="stat-sub">${monthSales.length} transactions</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-coins"></i></div>
                    <div class="stat-label">Monthly Profit</div>
                    <div class="stat-value">${formatCurrency(monthProfit)}</div>
                    <div class="stat-sub">Net after expenses</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-money-bill"></i></div>
                    <div class="stat-label">Current Capital</div>
                    <div class="stat-value">${formatCurrency(capital)}</div>
                    <div class="stat-sub">Total investment</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-warehouse"></i></div>
                    <div class="stat-label">Inventory Value</div>
                    <div class="stat-value">${formatCurrency(invValue)}</div>
                    <div class="stat-sub">${s.getProducts().length} products</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                    <div class="stat-label">Total Expenses</div>
                    <div class="stat-value">${formatCurrency(totalExps)}</div>
                    <div class="stat-sub">All time</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="stat-label">Low Stock Items</div>
                    <div class="stat-value">${lowStock.length}</div>
                    <div class="stat-sub">${lowStock.length > 0 ? 'Needs attention' : 'All good'}</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-trophy"></i></div>
                    <div class="stat-label">Best Seller</div>
                    <div class="stat-value" style="font-size:1rem;">${bestProduct}</div>
                    <div class="stat-sub">Top selling product</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-exchange-alt"></i></div>
                    <div class="stat-label">Transactions</div>
                    <div class="stat-value">${s.getAllTransactions().length}</div>
                    <div class="stat-sub">Total all time</div></div>
            </div>

            <div class="chart-grid mb-2">
                <div class="card"><div class="card-header"><h3>Daily Sales (7 days)</h3></div>
                    <div class="chart-container"><canvas id="chart-daily-sales"></canvas></div></div>
                <div class="card"><div class="card-header"><h3>Monthly Profit</h3></div>
                    <div class="chart-container"><canvas id="chart-monthly-profit"></canvas></div></div>
                <div class="card"><div class="card-header"><h3>Expense Breakdown</h3></div>
                    <div class="chart-container"><canvas id="chart-expense"></canvas></div></div>
                <div class="card"><div class="card-header"><h3>Inventory Movement</h3></div>
                    <div class="chart-container"><canvas id="chart-inventory"></canvas></div></div>
            </div>

            <div class="grid-2 mb-2">
                <div class="card">
                    <div class="card-header"><h3>Recent Transactions</h3></div>
                    <div class="table-container" style="max-height:300px;overflow-y:auto;">
                        <table>
                            <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                            <tbody>
                                ${recentTx.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No transactions yet</td></tr>' :
                                recentTx.map(t => `<tr>
                                    <td>${formatDate(t.date||t.createdAt)}</td>
                                    <td>${t.display || t.description || '-'}</td>
                                    <td>${t.amount ? formatCurrency(t.amount) : t.revenue ? formatCurrency(t.revenue) : '-'}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>Low Stock Warning</h3></div>
                    ${lowStock.length === 0 ? '<div class="empty-state"><i class="fas fa-check-circle text-success"></i><p>All products are well-stocked</p></div>' :
                    `<div class="table-container"><table>
                        <thead><tr><th>Product</th><th>Stock</th><th>Min</th></tr></thead>
                        <tbody>${lowStock.map(p => `<tr>
                            <td>${p.name||p.productName}</td>
                            <td class="text-danger">${p.currentStock}</td>
                            <td>${p.minStockAlert}</td>
                        </tr>`).join('')}</tbody>
                    </table></div>`}
                </div>
            </div>`;

        $('page-dashboard').innerHTML = html;
        // Render charts after DOM update
        setTimeout(() => this.renderDashboardCharts(), 100);
    },

    renderDashboardCharts() {
        this.destroyCharts();
        const s = this.store;
        // Daily sales (7 days)
        const days = [];
        const salesData = [];
        const profitData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = d.toDateString();
            days.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
            const daySales = s.getSales().filter(x => new Date(x.date).toDateString() === ds);
            salesData.push(daySales.reduce((sum, x) => sum + x.revenue, 0));
            profitData.push(daySales.reduce((sum, x) => sum + x.grossProfit, 0));
        }
        this.createChart('chart-daily-sales', 'line', {
            labels: days, datasets: [
                { label: 'Revenue', data: salesData, borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.1)', fill: true, tension: 0.4 },
                { label: 'Profit', data: profitData, borderColor: '#00b894', backgroundColor: 'rgba(0,184,148,0.1)', fill: true, tension: 0.4 }
            ]
        });

        // Monthly profit
        const months = [];
        const monthRev = [];
        const monthExp = [];
        const monthProf = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(); d.setMonth(d.getMonth() - i);
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            months.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));
            const ms = s.getDateRangeSales(mStart, mEnd);
            const me = s.getDateRangeExpenses(mStart, mEnd);
            monthRev.push(ms.reduce((sum, x) => sum + x.revenue, 0));
            monthExp.push(me.reduce((sum, x) => sum + x.amount, 0));
            monthProf.push(ms.reduce((sum, x) => sum + x.grossProfit, 0) - me.reduce((sum, x) => sum + x.amount, 0));
        }
        this.createChart('chart-monthly-profit', 'bar', {
            labels: months, datasets: [
                { label: 'Revenue', data: monthRev, backgroundColor: '#6c5ce7' },
                { label: 'Expenses', data: monthExp, backgroundColor: '#e17055' },
                { label: 'Net Profit', data: monthProf, backgroundColor: '#00b894' }
            ]
        });

        // Expense breakdown
        const expMap = {};
        for (const e of s.getExpenses()) expMap[e.category] = (expMap[e.category]||0) + e.amount;
        const expLabels = Object.keys(expMap);
        const expData = Object.values(expMap);
        const colors = ['#6c5ce7','#00b894','#e17055','#fdcb6e','#74b9ff','#fd79a8','#a29bfe','#55efc4','#fab1a0','#81ecec','#ff7675','#dfe6e9'];
        this.createChart('chart-expense', 'doughnut', {
            labels: expLabels.length ? expLabels : ['No Expenses'],
            datasets: [{ data: expData.length ? expData : [1], backgroundColor: colors.slice(0, Math.max(expLabels.length, 1)) }]
        });

        // Inventory movement (last 10 incoming vs sales)
        const incByDate = {};
        const salesByDate = {};
        const allInc = s.getIncoming().slice(-20);
        const allSales = s.getSales().slice(-20);
        for (const i of allInc) { const d = formatDate(i.date); incByDate[d] = (incByDate[d]||0) + i.quantity; }
        for (const sl of allSales) { const d = formatDate(sl.date); salesByDate[d] = (salesByDate[d]||0) + sl.quantity; }
        const labels = [...new Set([...Object.keys(incByDate), ...Object.keys(salesByDate)])].slice(-10);
        this.createChart('chart-inventory', 'bar', {
            labels, datasets: [
                { label: 'Stock In', data: labels.map(l => incByDate[l]||0), backgroundColor: '#00b894' },
                { label: 'Sales', data: labels.map(l => salesByDate[l]||0), backgroundColor: '#e17055' }
            ]
        });
    },

    createChart(id, type, data) {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#a0a0b0' : '#636e72';
        const gridColor = isDark ? '#2a2a3e' : '#e0e0e0';
        try {
            this.charts[id] = new Chart(ctx, {
                type, data,
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
                    scales: type !== 'doughnut' ? {
                        x: { ticks: { color: textColor }, grid: { color: gridColor } },
                        y: { ticks: { color: textColor }, grid: { color: gridColor } }
                    } : undefined
                }
            });
        } catch(e) { console.warn('Chart error:', e); }
    },

    destroyCharts() {
        for (const key of Object.keys(this.charts)) {
            try { this.charts[key].destroy(); } catch(e) {}
            delete this.charts[key];
        }
    },

    // ============================================
    // PRODUCTS
    // ============================================
    renderProducts() {
        const products = this.store.getProducts();
        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-boxes text-primary"></i> Products</h1>
                <div class="btn-group">
                    <div class="search-box"><i class="fas fa-search"></i>
                        <input type="text" id="product-search" placeholder="Search products..." oninput="App.filterProducts()">
                    </div>
                    <button class="btn btn-primary" onclick="App.showProductForm()"><i class="fas fa-plus"></i> Add Product</button>
                </div>
            </div>
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead><tr>
                            <th>Name</th><th>Category</th><th>Stock</th><th>Purchase</th><th>Selling</th><th>Min Stock</th><th>Supplier</th><th>Actions</th>
                        </tr></thead>
                        <tbody id="product-table-body">
                            ${products.length === 0 ? '<tr><td colspan="8" class="text-center text-muted">No products yet. Click "Add Product" to begin.</td></tr>' :
                            products.map(p => `<tr class="product-row" data-name="${(p.name||p.productName||'').toLowerCase()}">
                                <td><strong>${p.name||p.productName}</strong></td>
                                <td>${p.category||'-'}</td>
                                <td><span class="badge-status ${(p.currentStock||0) <= (p.minStockAlert||0) ? 'badge-danger' : 'badge-success'}">${p.currentStock||0} ${p.unit||'pcs'}</span></td>
                                <td>${formatCurrency(p.purchasePrice||0)}</td>
                                <td>${formatCurrency(p.sellingPrice||0)}</td>
                                <td>${p.minStockAlert||0}</td>
                                <td>${p.supplier||'-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline" onclick="App.showProductForm('${p.id}')"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-sm btn-danger" onclick="App.deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        $('page-products').innerHTML = html;
    },

    filterProducts() {
        const q = $('product-search').value.toLowerCase();
        qsa('.product-row').forEach(r => {
            r.style.display = r.dataset.name.includes(q) ? '' : 'none';
        });
    },

    showProductForm(id) {
        const p = id ? this.store.getProduct(id) : null;
        const isEdit = !!p;
        const html = `
            <form id="product-form" onsubmit="App.saveProduct(event, '${id||''}')">
                <div class="form-row">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" name="name" value="${p ? (p.name||p.productName||'') : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" name="category" value="${p?.category||''}" list="cat-list">
                        <datalist id="cat-list">
                            <option value="Food"><option value="Beverage"><option value="Snack"><option value="Household">
                            <option value="Personal Care"><option value="Electronics"><option value="Stationery">
                            <option value="Frozen Food"><option value="Dairy"><option value="Meat">
                        </datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Unit</label>
                        <select name="unit">
                            <option value="Pieces" ${p?.unit==='Pieces'?'selected':''}>Pieces</option>
                            <option value="Kg" ${p?.unit==='Kg'?'selected':''}>Kg</option>
                            <option value="Eggs" ${p?.unit==='Eggs'?'selected':''}>Eggs</option>
                            <option value="Bottles" ${p?.unit==='Bottles'?'selected':''}>Bottles</option>
                            <option value="Pack" ${p?.unit==='Pack'?'selected':''}>Pack</option>
                            <option value="Liter" ${p?.unit==='Liter'?'selected':''}>Liter</option>
                            <option value="Box" ${p?.unit==='Box'?'selected':''}>Box</option>
                            <option value="Sack" ${p?.unit==='Sack'?'selected':''}>Sack</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Supplier</label>
                        <input type="text" name="supplier" value="${p?.supplier||''}">
                    </div>
                </div>
                <div class="form-row-3">
                    <div class="form-group">
                        <label>Purchase Price *</label>
                        <input type="number" name="purchasePrice" value="${p?.purchasePrice||''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label>Selling Price *</label>
                        <input type="number" name="sellingPrice" value="${p?.sellingPrice||''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label>Min Stock Alert</label>
                        <input type="number" name="minStockAlert" value="${p?.minStockAlert||0}" min="0">
                    </div>
                </div>
                ${!isEdit ? `<div class="form-group">
                    <label>Initial Stock</label>
                    <input type="number" name="initialStock" value="0" min="0">
                </div>` : ''}
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes">${p?.notes||''}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Product</button>
                </div>
            </form>`;
        showModal(isEdit ? 'Edit Product' : 'Add Product', html);
    },

    saveProduct(e, id) {
        e.preventDefault();
        const form = e.target;
        const data = { name: form.name.value, category: form.category.value, unit: form.unit.value,
            purchasePrice: Number(form.purchasePrice.value), sellingPrice: Number(form.sellingPrice.value),
            minStockAlert: Number(form.minStockAlert.value), supplier: form.supplier.value, notes: form.notes.value };
        if (id) {
            this.store.updateProduct(id, data);
            showToast('Product updated!');
        } else {
            data.initialStock = Number(form.initialStock.value);
            data.currentStock = data.initialStock;
            this.store.addProduct(data);
            showToast('Product added!');
        }
        form.closest('.modal-overlay').remove();
        this.renderProducts();
    },

    deleteProduct(id) {
        showConfirm('Delete Product', 'Are you sure? This cannot be undone.', () => {
            this.store.deleteProduct(id);
            showToast('Product deleted', 'warning');
            this.renderProducts();
        });
    },

    // ============================================
    // INCOMING STOCK
    // ============================================
    renderIncoming() {
        const incoming = this.store.getIncoming();
        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-arrow-down text-success"></i> Incoming Stock</h1>
                <button class="btn btn-primary" onclick="App.showIncomingForm()"><i class="fas fa-plus"></i> Record Incoming</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Purchase Price</th><th>Selling Price</th><th>Total Cost</th><th>Potential Revenue</th><th>Potential Profit</th></tr></thead>
                        <tbody>
                            ${incoming.length === 0 ? '<tr><td colspan="8" class="text-center text-muted">No incoming stock recorded</td></tr>' :
                            incoming.slice().reverse().map(i => `<tr>
                                <td>${formatDate(i.date)}</td>
                                <td>${i.productName}</td>
                                <td>${i.quantity}</td>
                                <td>${formatCurrency(i.purchasePrice)}</td>
                                <td>${formatCurrency(i.sellingPrice)}</td>
                                <td>${formatCurrency(i.totalCost||i.quantity*i.purchasePrice)}</td>
                                <td>${formatCurrency(i.potentialRevenue||i.quantity*i.sellingPrice)}</td>
                                <td class="text-success">${formatCurrency(i.potentialProfit||(i.quantity*i.sellingPrice - i.quantity*i.purchasePrice))}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        $('page-incoming').innerHTML = html;
    },

    showIncomingForm() {
        const products = this.store.getProducts();
        const html = `
            <form id="incoming-form" onsubmit="App.saveIncoming(event)">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Product *</label>
                    <select name="productId" required onchange="App.prefillIncomingPrices(this)">
                        <option value="">Select Product</option>
                        ${products.map(p => `<option value="${p.id}" data-pp="${p.purchasePrice||0}" data-sp="${p.sellingPrice||0}">${p.name||p.productName} (Stock: ${p.currentStock||0})</option>`).join('')}
                    </select>
                    ${products.length === 0 ? '<p class="text-muted mt-1">No products yet. <a href="#" onclick="App.navigate(\'products\')">Add products first</a></p>' : ''}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Quantity *</label>
                        <input type="number" name="quantity" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Unit</label>
                        <input type="text" name="unit" readonly>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Purchase Price (per unit) *</label>
                        <input type="number" name="purchasePrice" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Selling Price (per unit) *</label>
                        <input type="number" name="sellingPrice" required min="0" step="0.01">
                    </div>
                </div>
                <div class="card glass mb-2" id="incoming-preview">
                    <p class="text-muted">Select a product and enter quantity to see calculation preview</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Record Incoming Stock</button>
                </div>
            </form>`;
        showModal('Record Incoming Stock', html, true);
        // Add live calculation
        const form = qs('#incoming-form');
        form.querySelector('[name="quantity"]').oninput = () => this.updateIncomingPreview(form);
        form.querySelector('[name="purchasePrice"]').oninput = () => this.updateIncomingPreview(form);
        form.querySelector('[name="sellingPrice"]').oninput = () => this.updateIncomingPreview(form);
    },

    prefillIncomingPrices(sel) {
        const opt = sel.options[sel.selectedIndex];
        if (opt && opt.value) {
            const form = sel.closest('form');
            form.querySelector('[name="purchasePrice"]').value = opt.dataset.pp;
            form.querySelector('[name="sellingPrice"]').value = opt.dataset.sp;
            form.querySelector('[name="unit"]').value = opt.textContent.includes('(') ? '' : '';
            this.updateIncomingPreview(form);
        }
    },

    updateIncomingPreview(form) {
        const qty = Number(form.querySelector('[name="quantity"]').value) || 0;
        const pp = Number(form.querySelector('[name="purchasePrice"]').value) || 0;
        const sp = Number(form.querySelector('[name="sellingPrice"]').value) || 0;
        const preview = form.querySelector('#incoming-preview');
        if (qty && pp && sp) {
            preview.innerHTML = `
                <div class="form-row-3 text-center">
                    <div><strong>Total Cost:</strong><br>${formatCurrency(qty * pp)}</div>
                    <div><strong>Potential Revenue:</strong><br>${formatCurrency(qty * sp)}</div>
                    <div><strong class="text-success">Potential Profit:</strong><br>${formatCurrency(qty * sp - qty * pp)}</div>
                </div>`;
        } else {
            preview.innerHTML = '<p class="text-muted">Enter quantity and prices to see calculation</p>';
        }
    },

    saveIncoming(e) {
        e.preventDefault();
        const form = e.target;
        const record = {
            date: form.date.value,
            productId: form.productId.value,
            productName: form.productId.options[form.productId.selectedIndex].text.split(' (')[0],
            quantity: Number(form.quantity.value),
            purchasePrice: Number(form.purchasePrice.value),
            sellingPrice: Number(form.sellingPrice.value),
            unit: form.unit.value || 'pcs',
            totalCost: Number(form.quantity.value) * Number(form.purchasePrice.value),
            potentialRevenue: Number(form.quantity.value) * Number(form.sellingPrice.value),
            potentialProfit: Number(form.quantity.value) * (Number(form.sellingPrice.value) - Number(form.purchasePrice.value))
        };
        this.store.addIncoming(record);
        showToast('Incoming stock recorded!');
        form.closest('.modal-overlay').remove();
        this.renderIncoming();
    },

    // ============================================
    // SALES
    // ============================================
    renderSales() {
        const sales = this.store.getSales();
        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-shopping-cart text-primary"></i> Sales</h1>
                <button class="btn btn-primary" onclick="App.showSaleForm()"><i class="fas fa-plus"></i> Record Sale</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Selling Price</th><th>Revenue</th><th>COGS</th><th>Gross Profit</th></tr></thead>
                        <tbody>
                            ${sales.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No sales recorded</td></tr>' :
                            sales.slice().reverse().map(s => `<tr>
                                <td>${formatDate(s.date)}</td>
                                <td>${s.productName}</td>
                                <td>${s.quantity}</td>
                                <td>${formatCurrency(s.sellingPrice)}</td>
                                <td>${formatCurrency(s.revenue)}</td>
                                <td>${formatCurrency(s.cogs)}</td>
                                <td class="text-success">${formatCurrency(s.grossProfit)}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        $('page-sales').innerHTML = html;
    },

    showSaleForm() {
        const products = this.store.getProducts().filter(p => p.currentStock > 0);
        const html = `
            <form id="sale-form" onsubmit="App.saveSale(event)">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Product *</label>
                    <select name="productId" required onchange="App.prefillSalePrices(this)">
                        <option value="">Select Product</option>
                        ${products.map(p => `<option value="${p.id}" data-pp="${p.purchasePrice||0}" data-sp="${p.sellingPrice||0}" data-stock="${p.currentStock||0}">${p.name||p.productName} (Stock: ${p.currentStock||0})</option>`).join('')}
                    </select>
                    ${products.length === 0 ? '<p class="text-muted mt-1">No products in stock. <a href="#" onclick="App.navigate(\'incoming\')">Add incoming stock first</a></p>' : ''}
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Quantity Sold *</label>
                        <input type="number" name="quantity" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Selling Price (per unit) *</label>
                        <input type="number" name="sellingPrice" required min="0" step="0.01">
                    </div>
                </div>
                <div class="card glass mb-2" id="sale-preview">
                    <p class="text-muted">Select product and enter quantity to see calculation</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Record Sale</button>
                </div>
            </form>`;
        showModal('Record Sale', html, true);
        const form = qs('#sale-form');
        form.querySelector('[name="quantity"]').oninput = () => this.updateSalePreview(form);
        form.querySelector('[name="sellingPrice"]').oninput = () => this.updateSalePreview(form);
    },

    prefillSalePrices(sel) {
        const opt = sel.options[sel.selectedIndex];
        if (opt && opt.value) {
            const form = sel.closest('form');
            form.querySelector('[name="sellingPrice"]').value = opt.dataset.sp;
            this.updateSalePreview(form);
        }
    },

    updateSalePreview(form) {
        const qty = Number(form.querySelector('[name="quantity"]').value) || 0;
        const sp = Number(form.querySelector('[name="sellingPrice"]').value) || 0;
        const sel = form.querySelector('[name="productId"]');
        const opt = sel.options[sel.selectedIndex];
        const pp = opt ? Number(opt.dataset.pp) : 0;
        const stock = opt ? Number(opt.dataset.stock) : 0;
        const preview = form.querySelector('#sale-preview');
        const revenue = qty * sp;
        const cogs = qty * pp;
        const profit = revenue - cogs;
        preview.innerHTML = `
            <div class="form-row-3 text-center">
                <div><strong>Revenue:</strong><br>${formatCurrency(revenue)}</div>
                <div><strong>COGS:</strong><br>${formatCurrency(cogs)}</div>
                <div><strong class="${profit >= 0 ? 'text-success' : 'text-danger'}">Gross Profit:</strong><br>${formatCurrency(profit)}</div>
            </div>
            ${qty > stock ? `<p class="text-danger mt-1"><i class="fas fa-exclamation-triangle"></i> Not enough stock! Only ${stock} available.</p>` : ''}`;
    },

    saveSale(e) {
        e.preventDefault();
        const form = e.target;
        const sel = form.productId;
        const opt = sel.options[sel.selectedIndex];
        const stock = Number(opt.dataset.stock);
        const qty = Number(form.quantity.value);
        if (qty > stock) {
            showToast('Not enough stock! Only ' + stock + ' available.', 'error');
            return;
        }
        const pp = Number(opt.dataset.pp);
        const sp = Number(form.sellingPrice.value);
        const record = {
            date: form.date.value,
            productId: sel.value,
            productName: opt.text.split(' (')[0],
            quantity: qty,
            sellingPrice: sp,
            revenue: qty * sp,
            cogs: qty * pp,
            grossProfit: qty * sp - qty * pp
        };
        this.store.addSale(record);
        showToast('Sale recorded!');
        form.closest('.modal-overlay').remove();
        this.renderSales();
    },

    // ============================================
    // EXPENSES
    // ============================================
    renderExpenses() {
        const expenses = this.store.getExpenses();
        const categories = ['Rent','Electricity','Water','Internet','Fuel','Transportation','Salary','Packaging','Tax','Marketing','Maintenance','Other'];
        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-money-bill-wave text-danger"></i> Expenses</h1>
                <button class="btn btn-danger" onclick="App.showExpenseForm()"><i class="fas fa-plus"></i> Add Expense</button>
            </div>
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${expenses.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No expenses recorded</td></tr>' :
                            expenses.slice().reverse().map(e => `<tr>
                                <td>${formatDate(e.date)}</td>
                                <td><span class="badge-status badge-info">${e.category}</span></td>
                                <td>${e.description||'-'}</td>
                                <td class="text-danger">${formatCurrency(e.amount)}</td>
                                <td><button class="btn btn-sm btn-danger" onclick="App.deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card mt-2">
                <div class="card-header"><h3>Expense Summary by Category</h3></div>
                <div class="table-container">
                    <table>
                        <thead><tr><th>Category</th><th>Total</th><th>% of Total</th></tr></thead>
                        <tbody>
                            ${categories.map(cat => {
                                const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                                const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
                                return total > 0 ? `<tr><td>${cat}</td><td class="text-danger">${formatCurrency(total)}</td><td>${grandTotal > 0 ? ((total/grandTotal)*100).toFixed(1) : 0}%</td></tr>` : '';
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        $('page-expenses').innerHTML = html;
    },

    showExpenseForm() {
        const categories = ['Rent','Electricity','Water','Internet','Fuel','Transportation','Salary','Packaging','Tax','Marketing','Maintenance','Other'];
        const html = `
            <form id="expense-form" onsubmit="App.saveExpense(event)">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select name="category" required>
                        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" name="description" placeholder="e.g., Monthly electricity bill">
                </div>
                <div class="form-group">
                    <label>Amount *</label>
                    <input type="number" name="amount" required min="0" step="0.01">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-danger">Add Expense</button>
                </div>
            </form>`;
        showModal('Add Expense', html);
    },

    saveExpense(e) {
        e.preventDefault();
        const form = e.target;
        const record = {
            date: form.date.value,
            category: form.category.value,
            description: form.description.value,
            amount: Number(form.amount.value)
        };
        this.store.addExpense(record);
        showToast('Expense added!');
        form.closest('.modal-overlay').remove();
        this.renderExpenses();
    },

    deleteExpense(id) {
        showConfirm('Delete Expense', 'Are you sure?', () => {
            this.store.deleteExpense(id);
            showToast('Expense deleted', 'warning');
            this.renderExpenses();
        });
    },

    // ============================================
    // CAPITAL
    // ============================================
    renderCapital() {
        const capital = this.store.getCapital();
        const currentCapital = this.store.getCurrentCapital();
        let html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-coins text-warning"></i> Capital Management</h1>
                <button class="btn btn-primary" onclick="App.showCapitalForm()"><i class="fas fa-plus"></i> Add Entry</button>
            </div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-coins"></i></div>
                    <div class="stat-label">Current Capital</div>
                    <div class="stat-value">${formatCurrency(currentCapital)}</div>
                    <div class="stat-sub">${capital.length} entries</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-arrow-up text-success"></i></div>
                    <div class="stat-label">Total Invested</div>
                    <div class="stat-value">${formatCurrency(capital.filter(c => c.type !== 'withdrawal').reduce((s,x) => s+x.amount, 0))}</div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-arrow-down text-danger"></i></div>
                    <div class="stat-label">Total Withdrawn</div>
                    <div class="stat-value">${formatCurrency(capital.filter(c => c.type === 'withdrawal').reduce((s,x) => s+x.amount, 0))}</div></div>
            </div>
            <div class="card">
                <div class="table-container">
                    <table>
                        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${capital.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No capital entries</td></tr>' :
                            capital.slice().reverse().map(c => `<tr>
                                <td>${formatDate(c.date)}</td>
                                <td><span class="badge-status ${c.type === 'withdrawal' ? 'badge-danger' : 'badge-success'}">${c.type}</span></td>
                                <td>${c.description||'-'}</td>
                                <td class="${c.type === 'withdrawal' ? 'text-danger' : 'text-success'}">${c.type === 'withdrawal' ? '-' : '+'}${formatCurrency(c.amount)}</td>
                                <td><button class="btn btn-sm btn-danger" onclick="App.deleteCapitalEntry('${c.id}')"><i class="fas fa-trash"></i></button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        $('page-capital').innerHTML = html;
    },

    showCapitalForm() {
        const html = `
            <form id="capital-form" onsubmit="App.saveCapitalEntry(event)">
                <div class="form-group">
                    <label>Date *</label>
                    <input type="date" name="date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label>Type *</label>
                    <select name="type" required>
                        <option value="initial">Initial Capital</option>
                        <option value="additional">Additional Capital</option>
                        <option value="investment">Business Investment</option>
                        <option value="withdrawal">Owner Withdrawal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" name="description" placeholder="e.g., Initial investment for business">
                </div>
                <div class="form-group">
                    <label>Amount *</label>
                    <input type="number" name="amount" required min="0" step="0.01">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Entry</button>
                </div>
            </form>`;
        showModal('Capital Entry', html);
    },

    saveCapitalEntry(e) {
        e.preventDefault();
        const form = e.target;
        const record = {
            date: form.date.value,
            type: form.type.value,
            description: form.description.value,
            amount: Number(form.amount.value)
        };
        this.store.addCapital(record);
        showToast('Capital entry saved!');
        form.closest('.modal-overlay').remove();
        this.renderCapital();
    },

    deleteCapitalEntry(id) {
        showConfirm('Delete Entry', 'Are you sure?', () => {
            this.store.deleteCapital(id);
            showToast('Entry deleted', 'warning');
            this.renderCapital();
        });
    },

    // ============================================
    // REPORTS
    // ============================================
    renderReports() {
        const html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-file-alt text-primary"></i> Reports</h1>
                <div class="btn-group">
                    <button class="btn btn-outline btn-sm" onclick="App.exportReport('pdf')"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn btn-outline btn-sm" onclick="App.exportReport('excel')"><i class="fas fa-file-excel"></i> Excel</button>
                    <button class="btn btn-outline btn-sm" onclick="App.exportReport('csv')"><i class="fas fa-file-csv"></i> CSV</button>
                    <button class="btn btn-outline btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
                </div>
            </div>
            <div class="tabs" id="report-tabs">
                <span class="tab active" data-report="sales" onclick="App.switchReportTab('sales')">Sales</span>
                <span class="tab" data-report="inventory" onclick="App.switchReportTab('inventory')">Inventory</span>
                <span class="tab" data-report="expense" onclick="App.switchReportTab('expense')">Expenses</span>
                <span class="tab" data-report="capital" onclick="App.switchReportTab('capital')">Capital</span>
                <span class="tab" data-report="profit" onclick="App.switchReportTab('profit')">Profit</span>
                <span class="tab" data-report="cashflow" onclick="App.switchReportTab('cashflow')">Cash Flow</span>
            </div>
            <div id="report-content" class="card mt-2"></div>`;
        $('page-reports').innerHTML = html;
        this.switchReportTab('sales');
    },

    switchReportTab(type) {
        qsa('#report-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.report === type));
        const s = this.store;
        const products = s.getProducts();
        const sales = s.getSales();
        const expenses = s.getExpenses();
        const capital = s.getCapital();
        let content = '';

        if (type === 'sales') {
            const totalRev = s.getTotalSales();
            const totalCogs = s.getTotalCogs();
            const grossProfit = totalRev - totalCogs;
            content = `
                <h3 class="mb-2">Sales Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatCurrency(totalRev)}</div></div>
                    <div class="stat-card"><div class="stat-label">Total COGS</div><div class="stat-value">${formatCurrency(totalCogs)}</div></div>
                    <div class="stat-card"><div class="stat-label">Gross Profit</div><div class="stat-value text-success">${formatCurrency(grossProfit)}</div></div>
                    <div class="stat-card"><div class="stat-label">Transactions</div><div class="stat-value">${sales.length}</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Revenue</th><th>COGS</th><th>Profit</th></tr></thead>
                    <tbody>${sales.length === 0 ? '<tr><td colspan="6" class="text-center text-muted">No sales data</td></tr>' :
                    sales.slice().reverse().map(s => `<tr>
                        <td>${formatDate(s.date)}</td><td>${s.productName}</td><td>${s.quantity}</td>
                        <td>${formatCurrency(s.revenue)}</td><td>${formatCurrency(s.cogs)}</td>
                        <td class="text-success">${formatCurrency(s.grossProfit)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;
        } else if (type === 'inventory') {
            const invValue = s.getInventoryValue();
            const totalStock = products.reduce((sum, p) => sum + (p.currentStock||0), 0);
            content = `
                <h3 class="mb-2">Inventory Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Total Products</div><div class="stat-value">${products.length}</div></div>
                    <div class="stat-card"><div class="stat-label">Inventory Value</div><div class="stat-value">${formatCurrency(invValue)}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Stock</div><div class="stat-value">${totalStock}</div></div>
                    <div class="stat-card"><div class="stat-label">Low Stock Items</div><div class="stat-value text-danger">${s.getLowStockProducts().length}</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Product</th><th>Stock</th><th>Purchase Price</th><th>Selling Price</th><th>Value</th></tr></thead>
                    <tbody>${products.length === 0 ? '<tr><td colspan="5" class="text-center text-muted">No products</td></tr>' :
                    products.map(p => `<tr>
                        <td>${p.name||p.productName}</td>
                        <td>${p.currentStock||0} ${p.unit||'pcs'}</td>
                        <td>${formatCurrency(p.purchasePrice||0)}</td>
                        <td>${formatCurrency(p.sellingPrice||0)}</td>
                        <td>${formatCurrency((p.currentStock||0)*(p.purchasePrice||0))}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;
        } else if (type === 'expense') {
            const totalExp = s.getTotalExpenses();
            content = `
                <h3 class="mb-2">Expense Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value text-danger">${formatCurrency(totalExp)}</div></div>
                    <div class="stat-card"><div class="stat-label">Transactions</div><div class="stat-value">${expenses.length}</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th></tr></thead>
                    <tbody>${expenses.length === 0 ? '<tr><td colspan="4" class="text-center text-muted">No expenses</td></tr>' :
                    expenses.slice().reverse().map(e => `<tr>
                        <td>${formatDate(e.date)}</td><td>${e.category}</td><td>${e.description||'-'}</td>
                        <td class="text-danger">${formatCurrency(e.amount)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;
        } else if (type === 'capital') {
            const currentCap = s.getCurrentCapital();
            content = `
                <h3 class="mb-2">Capital Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Current Capital</div><div class="stat-value">${formatCurrency(currentCap)}</div></div>
                    <div class="stat-card"><div class="stat-label">Entries</div><div class="stat-value">${capital.length}</div></div>
                </div>
                <div class="table-container"><table>
                    <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
                    <tbody>${capital.length === 0 ? '<tr><td colspan="4" class="text-center text-muted">No capital entries</td></tr>' :
                    capital.slice().reverse().map(c => `<tr>
                        <td>${formatDate(c.date)}</td><td>${c.type}</td><td>${c.description||'-'}</td>
                        <td class="${c.type === 'withdrawal' ? 'text-danger' : 'text-success'}">${formatCurrency(c.amount)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`;
        } else if (type === 'profit') {
            const totalRev = s.getTotalSales();
            const totalCogs = s.getTotalCogs();
            const totalExp = s.getTotalExpenses();
            const grossP = totalRev - totalCogs;
            const netP = grossP - totalExp;
            const margin = totalRev > 0 ? ((grossP / totalRev) * 100).toFixed(1) : 0;
            content = `
                <h3 class="mb-2">Profit Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatCurrency(totalRev)}</div></div>
                    <div class="stat-card"><div class="stat-label">Total COGS</div><div class="stat-value">${formatCurrency(totalCogs)}</div></div>
                    <div class="stat-card"><div class="stat-label">Gross Profit</div><div class="stat-value text-success">${formatCurrency(grossP)}</div></div>
                    <div class="stat-card"><div class="stat-label">Total Expenses</div><div class="stat-value text-danger">${formatCurrency(totalExp)}</div></div>
                    <div class="stat-card"><div class="stat-label">Net Profit</div><div class="stat-value ${netP >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(netP)}</div></div>
                    <div class="stat-card"><div class="stat-label">Gross Margin</div><div class="stat-value">${margin}%</div></div>
                </div>`;
        } else if (type === 'cashflow') {
            const totalRev = s.getTotalSales();
            const totalExp = s.getTotalExpenses();
            const netFlow = totalRev - totalExp;
            const cap = s.getCurrentCapital();
            content = `
                <h3 class="mb-2">Cash Flow Report</h3>
                <div class="stats-grid mb-2">
                    <div class="stat-card"><div class="stat-label">Cash Inflow (Sales)</div><div class="stat-value text-success">${formatCurrency(totalRev)}</div></div>
                    <div class="stat-card"><div class="stat-label">Cash Outflow (Expenses)</div><div class="stat-value text-danger">${formatCurrency(totalExp)}</div></div>
                    <div class="stat-card"><div class="stat-label">Net Cash Flow</div><div class="stat-value ${netFlow >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(netFlow)}</div></div>
                    <div class="stat-card"><div class="stat-label">Available Capital</div><div class="stat-value">${formatCurrency(cap)}</div></div>
                </div>`;
        }
        $('report-content').innerHTML = content;
    },

    exportReport(format) {
        const s = this.store;
        const data = {
            'Sales Report': s.getSales().map(x => ({ Date: formatDate(x.date), Product: x.productName, Quantity: x.quantity, Revenue: x.revenue, COGS: x.cogs, Profit: x.grossProfit })),
            'Inventory Report': s.getProducts().map(p => ({ Product: p.name||p.productName, Stock: p.currentStock, 'Purchase Price': p.purchasePrice, 'Selling Price': p.sellingPrice, Value: (p.currentStock||0)*(p.purchasePrice||0) })),
            'Expense Report': s.getExpenses().map(e => ({ Date: formatDate(e.date), Category: e.category, Description: e.description||'', Amount: e.amount })),
            'Capital Report': s.getCapital().map(c => ({ Date: formatDate(c.date), Type: c.type, Description: c.description||'', Amount: c.amount }))
        };

        if (format === 'csv') {
            let csv = 'Report,Field,Value\n';
            for (const [name, rows] of Object.entries(data)) {
                for (const row of rows) {
                    for (const [key, val] of Object.entries(row)) {
                        csv += `"${name}","${key}","${val}"\n`;
                    }
                }
            }
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
            link.download = 'BizManager_Report.csv'; link.click();
            showToast('CSV exported!');
        } else if (format === 'excel') {
            try {
                const wb = XLSX.utils.book_new();
                for (const [name, rows] of Object.entries(data)) {
                    const ws = XLSX.utils.json_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
                }
                XLSX.writeFile(wb, 'BizManager_Report.xlsx');
                showToast('Excel exported!');
            } catch(e) { showToast('Excel export error: ' + e.message, 'error'); }
        } else if (format === 'pdf') {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                doc.setFontSize(16); doc.text('BizManager Pro - Report', 14, 20);
                doc.setFontSize(10); let y = 30;
                for (const [name, rows] of Object.entries(data)) {
                    if (y > 260) { doc.addPage(); y = 20; }
                    doc.setFontSize(12); doc.text(name, 14, y); y += 6;
                    doc.setFontSize(8);
                    if (rows.length > 0) {
                        const headers = Object.keys(rows[0]);
                        const colW = 180 / headers.length;
                        headers.forEach((h, i) => doc.text(h, 14 + i * colW, y));
                        y += 4;
                        rows.forEach(row => {
                            if (y > 270) { doc.addPage(); y = 20; }
                            headers.forEach((h, i) => doc.text(String(row[h]||''), 14 + i * colW, y));
                            y += 4;
                        });
                    }
                    y += 6;
                }
                doc.save('BizManager_Report.pdf');
                showToast('PDF exported!');
            } catch(e) { showToast('PDF export error: ' + e.message, 'error'); }
        }
    },

    // ============================================
    // HISTORY
    // ============================================
    renderHistory() {
        const html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-clock text-info"></i> Transaction History</h1>
            </div>
            <div class="card mb-2">
                <div class="filter-bar">
                    <select id="history-filter" onchange="App.applyHistoryFilter()">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    <input type="date" id="history-start" onchange="App.applyHistoryFilter()" style="display:none">
                    <input type="date" id="history-end" onchange="App.applyHistoryFilter()" style="display:none">
                    <select id="history-type" onchange="App.applyHistoryFilter()">
                        <option value="all">All Types</option>
                        <option value="sale">Sales</option>
                        <option value="incoming">Stock In</option>
                        <option value="expense">Expenses</option>
                        <option value="capital">Capital</option>
                    </select>
                    <div class="search-box" style="max-width:200px;">
                        <i class="fas fa-search"></i>
                        <input type="text" id="history-search" placeholder="Search..." oninput="App.applyHistoryFilter()">
                    </div>
                </div>
                <div class="table-container" style="max-height:500px;overflow-y:auto;">
                    <table>
                        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
                        <tbody id="history-body"></tbody>
                    </table>
                </div>
            </div>`;
        $('page-history').innerHTML = html;
        // Show date inputs on custom
        $('history-filter').onchange = function() {
            const show = this.value === 'custom';
            $('history-start').style.display = show ? 'inline-block' : 'none';
            $('history-end').style.display = show ? 'inline-block' : 'none';
            App.applyHistoryFilter();
        };
        this.applyHistoryFilter();
    },

    applyHistoryFilter() {
        const filter = $('history-filter').value;
        const type = $('history-type').value;
        const search = ($('history-search').value || '').toLowerCase();
        let all = this.store.getAllTransactions();

        // Date filter
        const now = new Date();
        let start, end;
        if (filter === 'today') { start = new Date(now); end = new Date(now); }
        else if (filter === 'yesterday') { const d = new Date(now); d.setDate(d.getDate()-1); start = d; end = d; }
        else if (filter === 'week') { start = new Date(now); start.setDate(now.getDate()-now.getDay()); end = new Date(now); }
        else if (filter === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1); end = new Date(now); }
        else if (filter === 'year') { start = new Date(now.getFullYear(), 0, 1); end = new Date(now); }
        else if (filter === 'custom') { start = new Date($('history-start').value); end = new Date($('history-end').value); }

        if (start && end) {
            const s = start.getTime(), e = end.getTime() + 86400000;
            all = all.filter(x => { const t = new Date(x.date||x.createdAt).getTime(); return t >= s && t <= e; });
        }

        // Type filter
        if (type !== 'all') all = all.filter(x => x.type === type);

        // Search filter
        if (search) all = all.filter(x => (x.display||x.description||'').toLowerCase().includes(search));

        const tbody = $('history-body');
        if (all.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No transactions found</td></tr>';
        } else {
            tbody.innerHTML = all.map(t => {
                const typeColors = { sale: 'badge-success', incoming: 'badge-info', expense: 'badge-danger', capital: 'badge-warning' };
                return `<tr>
                    <td>${formatDate(t.date||t.createdAt)}</td>
                    <td><span class="badge-status ${typeColors[t.type]||'badge-info'}">${t.type}</span></td>
                    <td>${t.display||t.description||'-'}</td>
                    <td>${t.amount ? formatCurrency(t.amount) : t.revenue ? formatCurrency(t.revenue) : '-'}</td>
                </tr>`;
            }).join('');
        }
    },

    // ============================================
    // CALENDAR
    // ============================================
    renderCalendar() {
        const html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-calendar text-primary"></i> Calendar</h1>
                <div class="btn-group">
                    <button class="btn btn-outline btn-sm" onclick="App.calendarNavigate(-1)"><i class="fas fa-chevron-left"></i></button>
                    <span id="calendar-month-year" style="font-weight:600;min-width:160px;text-align:center;"></span>
                    <button class="btn btn-outline btn-sm" onclick="App.calendarNavigate(1)"><i class="fas fa-chevron-right"></i></button>
                    <button class="btn btn-outline btn-sm" onclick="App.calendarDate=new Date();App.renderCalendar()"><i class="fas fa-calendar-check"></i> Today</button>
                </div>
            </div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3>Calendar</h3></div>
                    <div class="calendar-grid" id="calendar-grid">
                        <div class="calendar-header">Sun</div><div class="calendar-header">Mon</div><div class="calendar-header">Tue</div>
                        <div class="calendar-header">Wed</div><div class="calendar-header">Thu</div><div class="calendar-header">Fri</div>
                        <div class="calendar-header">Sat</div>
                    </div>
                </div>
                <div class="card" id="calendar-detail">
                    <div class="card-header"><h3 id="calendar-detail-date">Select a date</h3></div>
                    <div id="calendar-detail-content"><p class="text-muted">Click a date to see details</p></div>
                </div>
            </div>`;
        $('page-calendar').innerHTML = html;
        this.buildCalendar();
    },

    calendarNavigate(delta) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + delta);
        this.buildCalendar();
    },

    buildCalendar() {
        const date = this.calendarDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        $('calendar-month-year').textContent = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date().toDateString();

        let gridHtml = '';
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            gridHtml += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
        }
        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month, d);
            const isToday = dt.toDateString() === today;
            const hasEvents = this.hasEventsOnDate(dt);
            gridHtml += `<div class="calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-event' : ''}"
                onclick="App.showCalendarDetail('${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}')">
                ${d}${hasEvents ? '<span class="dot"></span>' : ''}</div>`;
        }
        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remaining = (7 - (totalCells % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            gridHtml += `<div class="calendar-day other-month">${d}</div>`;
        }
        $('calendar-grid').innerHTML = `
            <div class="calendar-header">Sun</div><div class="calendar-header">Mon</div><div class="calendar-header">Tue</div>
            <div class="calendar-header">Wed</div><div class="calendar-header">Thu</div><div class="calendar-header">Fri</div>
            <div class="calendar-header">Sat</div>` + gridHtml;
    },

    hasEventsOnDate(dt) {
        const ds = dt.toDateString();
        const s = this.store;
        for (const x of s.getSales()) if (new Date(x.date).toDateString() === ds) return true;
        for (const x of s.getExpenses()) if (new Date(x.date).toDateString() === ds) return true;
        for (const x of s.getIncoming()) if (new Date(x.date).toDateString() === ds) return true;
        for (const x of s.getCapital()) if (new Date(x.date).toDateString() === ds) return true;
        return false;
    },

    showCalendarDetail(dateStr) {
        const dt = new Date(dateStr);
        const ds = dt.toDateString();
        $('calendar-detail-date').textContent = dt.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const s = this.store;
        const sales = s.getSales().filter(x => new Date(x.date).toDateString() === ds);
        const expenses = s.getExpenses().filter(x => new Date(x.date).toDateString() === ds);
        const incoming = s.getIncoming().filter(x => new Date(x.date).toDateString() === ds);
        const capital = s.getCapital().filter(x => new Date(x.date).toDateString() === ds);

        let html = '';
        if (!sales.length && !expenses.length && !incoming.length && !capital.length) {
            html = '<p class="text-muted">No transactions on this date</p>';
        } else {
            if (sales.length) {
                html += `<h4 class="mb-1 text-success">Sales (${sales.length})</h4>
                    <table class="mb-2"><thead><tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Profit</th></tr></thead>
                    <tbody>${sales.map(x => `<tr><td>${x.productName}</td><td>${x.quantity}</td><td>${formatCurrency(x.revenue)}</td><td class="text-success">${formatCurrency(x.grossProfit)}</td></tr>`).join('')}</tbody></table>`;
            }
            if (incoming.length) {
                html += `<h4 class="mb-1 text-info">Stock In (${incoming.length})</h4>
                    <table class="mb-2"><thead><tr><th>Product</th><th>Qty</th><th>Cost</th></tr></thead>
                    <tbody>${incoming.map(x => `<tr><td>${x.productName}</td><td>${x.quantity}</td><td>${formatCurrency(x.totalCost)}</td></tr>`).join('')}</tbody></table>`;
            }
            if (expenses.length) {
                html += `<h4 class="mb-1 text-danger">Expenses (${expenses.length})</h4>
                    <table class="mb-2"><thead><tr><th>Category</th><th>Amount</th></tr></thead>
                    <tbody>${expenses.map(x => `<tr><td>${x.category}</td><td class="text-danger">${formatCurrency(x.amount)}</td></tr>`).join('')}</tbody></table>`;
            }
            if (capital.length) {
                html += `<h4 class="mb-1 text-warning">Capital (${capital.length})</h4>
                    <table class="mb-2"><thead><tr><th>Type</th><th>Amount</th></tr></thead>
                    <tbody>${capital.map(x => `<tr><td>${x.type}</td><td class="${x.type === 'withdrawal' ? 'text-danger' : 'text-success'}">${formatCurrency(x.amount)}</td></tr>`).join('')}</tbody></table>`;
            }
        }
        $('calendar-detail-content').innerHTML = html;
    },

    // ============================================
    // SETTINGS
    // ============================================
    renderSettings() {
        const s = this.store.getSettings();
        const html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-cog text-primary"></i> Settings</h1>
            </div>
            <div class="card">
                <form id="settings-form" onsubmit="App.saveSettings(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Business Name</label>
                            <input type="text" name="businessName" value="${s.businessName||'BizManager Pro'}">
                        </div>
                        <div class="form-group">
                            <label>Currency Symbol</label>
                            <input type="text" name="currency" value="${s.currency||'Rp'}" maxlength="5">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Currency Locale</label>
                            <select name="currencyLocale">
                                <option value="id-ID" ${s.currencyLocale==='id-ID'?'selected':''}>Indonesia (id-ID)</option>
                                <option value="en-US" ${s.currencyLocale==='en-US'?'selected':''}>US (en-US)</option>
                                <option value="en-GB" ${s.currencyLocale==='en-GB'?'selected':''}>UK (en-GB)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tax Percentage (%)</label>
                            <input type="number" name="taxPercentage" value="${s.taxPercentage||0}" min="0" max="100" step="0.1">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Default Profit Margin (%)</label>
                            <input type="number" name="defaultProfitMargin" value="${s.defaultProfitMargin||30}" min="0" max="1000">
                        </div>
                        <div class="form-group">
                            <label>Theme</label>
                            <select name="theme">
                                <option value="light" ${s.theme==='light'?'selected':''}>Light Mode</option>
                                <option value="dark" ${s.theme==='dark'?'selected':''}>Dark Mode</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Language</label>
                        <select name="language">
                            <option value="en" ${s.language==='en'?'selected':''}>English</option>
                            <option value="id" ${s.language==='id'?'selected':''}>Bahasa Indonesia</option>
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Settings</button>
                    </div>
                </form>
            </div>
            <div class="card mt-2">
                <div class="card-header"><h3>Data Management</h3></div>
                <div class="flex gap-2">
                    <button class="btn btn-outline" onclick="App.clearAllData()"><i class="fas fa-trash-alt"></i> Clear All Data</button>
                </div>
            </div>`;
        $('page-settings').innerHTML = html;
    },

    saveSettings(e) {
        e.preventDefault();
        const form = e.target;
        const settings = {
            businessName: form.businessName.value,
            currency: form.currency.value,
            currencyLocale: form.currencyLocale.value,
            taxPercentage: Number(form.taxPercentage.value),
            defaultProfitMargin: Number(form.defaultProfitMargin.value),
            theme: form.theme.value,
            language: form.language.value
        };
        this.store.saveSettings(settings);
        // Apply theme
        if (settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            $('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.removeAttribute('data-theme');
            $('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
$('topbar-brand').innerHTML = (settings.businessName || 'BizManager Pro') + ' <span class="watermark">— Akhdan Nur Syafi</span>';
        showToast('Settings saved!');
    },

    clearAllData() {
        showConfirm('Clear All Data', 'This will permanently delete ALL business data. Are you sure?', () => {
            showConfirm('Final Confirmation', 'This cannot be undone. Type "CONFIRM" to proceed.', () => {
                localStorage.clear();
                showToast('All data cleared', 'warning');
                setTimeout(() => location.reload(), 1000);
            });
        });
    },

    // ============================================
    // IMPORT / EXPORT
    // ============================================
    renderImportExport() {
        const html = `
            <div class="flex-between mb-2">
                <h1><i class="fas fa-database text-primary"></i> Import / Export</h1>
            </div>
            <div class="grid-2">
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-file-export text-success"></i> Export Data</h3></div>
                    <p class="text-muted mb-2">Download all your business data as a JSON backup file.</p>
                    <button class="btn btn-primary" onclick="App.exportData()"><i class="fas fa-download"></i> Export JSON Backup</button>
                </div>
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-file-import text-warning"></i> Import Data</h3></div>
                    <p class="text-muted mb-2">Restore data from a previously exported JSON backup file.</p>
                    <input type="file" id="import-file" accept=".json" style="margin-bottom:0.5rem">
                    <button class="btn btn-warning" onclick="App.importData()"><i class="fas fa-upload"></i> Import JSON Backup</button>
                </div>
            </div>
            <div class="card mt-2">
                <div class="card-header"><h3><i class="fas fa-info-circle text-info"></i> Data Summary</h3></div>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-label">Products</div><div class="stat-value">${this.store.getProducts().length}</div></div>
                    <div class="stat-card"><div class="stat-label">Sales</div><div class="stat-value">${this.store.getSales().length}</div></div>
                    <div class="stat-card"><div class="stat-label">Incoming Stock</div><div class="stat-value">${this.store.getIncoming().length}</div></div>
                    <div class="stat-card"><div class="stat-label">Expenses</div><div class="stat-value">${this.store.getExpenses().length}</div></div>
                    <div class="stat-card"><div class="stat-label">Capital Entries</div><div class="stat-value">${this.store.getCapital().length}</div></div>
                    <div class="stat-card"><div class="stat-label">Notifications</div><div class="stat-value">${this.store.getNotifications().length}</div></div>
                </div>
            </div>`;
        $('page-importexport').innerHTML = html;
    },

    exportData() {
        const data = this.store.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
        link.download = `BizManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showToast('Data exported successfully!');
    },

    importData() {
        const fileInput = $('import-file');
        if (!fileInput.files.length) { showToast('Please select a file first', 'warning'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.products && !data.sales && !data.expenses) {
                    showToast('Invalid backup file format', 'error'); return;
                }
                showConfirm('Import Data', 'This will REPLACE all current data with the imported data. Continue?', () => {
                    this.store.importAllData(data);
                    showToast('Data imported successfully! Refreshing...');
                    setTimeout(() => location.reload(), 1000);
                });
            } catch(err) {
                showToast('Invalid JSON file: ' + err.message, 'error');
            }
        };
        reader.readAsText(fileInput.files[0]);
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    renderNotifications() {
        const list = this.store.getNotifications();
        const container = $('notif-list');
        if (list.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No notifications</p>';
        } else {
            container.innerHTML = list.map(n => `
                <div class="notif-item ${n.read ? '' : 'unread'}" style="${n.read ? 'opacity:0.6' : 'font-weight:600'}"
                    onclick="App.store.markNotifRead('${n.id}');App.renderNotifications();App.updateBadge();">
                    <div class="flex-between"><small class="text-muted">${formatDateTime(n.date)}</small></div>
                    <p>${n.message}</p>
                </div>
            `).join('') + `<button class="btn btn-sm btn-outline mt-2" onclick="App.store.clearNotifications();App.renderNotifications();App.updateBadge();">Clear All</button>`;
        }
    },

    // ============================================
    // GLOBAL SEARCH
    // ============================================
    showGlobalSearch() {
        const html = `
            <div class="form-group">
                <input type="text" id="global-search-input" placeholder="Search products, transactions, suppliers..." autofocus
                    oninput="App.performGlobalSearch(this.value)">
            </div>
            <div id="global-search-results" style="max-height:300px;overflow-y:auto;"></div>`;
        const modal = showModal('Global Search (Ctrl+K)', html);
        setTimeout(() => qs('#global-search-input').focus(), 100);
    },

    performGlobalSearch(q) {
        if (!q || q.length < 2) { $('global-search-results').innerHTML = '<p class="text-muted">Type at least 2 characters</p>'; return; }
        const ql = q.toLowerCase();
        let results = [];

        // Search products
        for (const p of this.store.getProducts()) {
            const name = (p.name||p.productName||'').toLowerCase();
            const cat = (p.category||'').toLowerCase();
            const sup = (p.supplier||'').toLowerCase();
            if (name.includes(ql) || cat.includes(ql) || sup.includes(ql)) {
                results.push({ type: 'Product', label: `${p.name||p.productName} (Stock: ${p.currentStock})`, action: 'products' });
            }
        }
        // Search transactions
        for (const t of this.store.getAllTransactions().slice(0, 50)) {
            if ((t.display||t.description||'').toLowerCase().includes(ql)) {
                results.push({ type: t.type, label: t.display||t.description, action: 'history' });
            }
        }
        // Search expenses
        for (const e of this.store.getExpenses()) {
            if ((e.category||'').toLowerCase().includes(ql) || (e.description||'').toLowerCase().includes(ql)) {
                results.push({ type: 'Expense', label: `${e.category}: ${e.description||''} (${formatCurrency(e.amount)})`, action: 'expenses' });
            }
        }

        const container = $('global-search-results');
        if (results.length === 0) {
            container.innerHTML = '<p class="text-muted">No results found</p>';
        } else {
            container.innerHTML = results.slice(0, 20).map(r => `
                <div class="notif-item" style="cursor:pointer" onclick="document.querySelector('.modal-overlay').remove();App.navigate('${r.action}')">
                    <small class="badge-status badge-info">${r.type}</small> ${r.label}
                </div>
            `).join('');
        }
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => App.init());
