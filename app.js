// Water Bottle Supplier App - Google Sheets Integration
// IMPORTANT: Replace with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW7z5YxuioNT7o_KUXP7yUMXY5_jJkP74QKpliLlL0odQpgf_ae64lHu_LLcKpGXA1Nw/exec';

// Check if Google Sheets is configured
const isGoogleSheetsEnabled = () => GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE';

// Debounce utility for performance optimization
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// API Helper
class GoogleSheetsAPI {
    static async request(action, params = {}) {
        const url = new URL(GOOGLE_SCRIPT_URL);
        url.searchParams.append('action', action);

        Object.keys(params).forEach(key => {
            const value = typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key];
            url.searchParams.append(key, value);
        });

        try {
            const response = await fetch(url.toString());
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

// Data Store - Works with both Local Storage and Google Sheets
class DataStore {
    constructor() {
        this.users = [];
        this.deliveries = [];
        this.isOnline = isGoogleSheetsEnabled();
        this.isLoading = false;
    }

    // Initialize - load from Google Sheets or Local Storage
    async init() {
        if (this.isOnline) {
            await this.syncFromCloud();
        } else {
            this.users = this.loadLocal('waterApp_users') || [];
            this.deliveries = this.loadLocal('waterApp_deliveries') || [];
        }
    }

    // Sync from Google Sheets
    async syncFromCloud() {
        try {
            this.isLoading = true;
            const result = await GoogleSheetsAPI.request('getAllData');
            if (result.success) {
                this.users = result.users || [];
                this.deliveries = result.deliveries || [];
                // Also save to local storage as backup
                this.saveLocal('waterApp_users', this.users);
                this.saveLocal('waterApp_deliveries', this.deliveries);
            }
        } catch (error) {
            console.error('Sync failed, using local data:', error);
            // Fallback to local storage
            this.users = this.loadLocal('waterApp_users') || [];
            this.deliveries = this.loadLocal('waterApp_deliveries') || [];
        } finally {
            this.isLoading = false;
        }
    }

    // Local Storage helpers
    saveLocal(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadLocal(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // User methods
    async addUser(user) {
        if (this.isOnline) {
            try {
                const result = await GoogleSheetsAPI.request('addUser', { data: user });
                if (result.success) {
                    this.users.push(result.user);
                    this.saveLocal('waterApp_users', this.users);
                    return result.user;
                }
            } catch (error) {
                console.error('Failed to add user online:', error);
            }
        }

        // Fallback to local
        user.id = Date.now().toString();
        user.createdAt = new Date().toISOString();
        this.users.push(user);
        this.saveLocal('waterApp_users', this.users);
        return user;
    }

    async updateUser(id, updatedData) {
        if (this.isOnline) {
            try {
                const result = await GoogleSheetsAPI.request('updateUser', { id, data: updatedData });
                if (result.success) {
                    const index = this.users.findIndex(u => u.id == id);
                    if (index !== -1) {
                        this.users[index] = { ...this.users[index], ...updatedData };
                        this.saveLocal('waterApp_users', this.users);
                    }
                    return this.users[index];
                }
            } catch (error) {
                console.error('Failed to update user online:', error);
            }
        }

        // Fallback to local
        const index = this.users.findIndex(u => u.id == id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updatedData };
            this.saveLocal('waterApp_users', this.users);
            return this.users[index];
        }
        return null;
    }

    async deleteUser(id) {
        if (this.isOnline) {
            try {
                await GoogleSheetsAPI.request('deleteUser', { id });
            } catch (error) {
                console.error('Failed to delete user online:', error);
            }
        }

        this.users = this.users.filter(u => u.id != id);
        this.saveLocal('waterApp_users', this.users);
    }

    getUser(id) {
        return this.users.find(u => u.id == id);
    }

    searchUsers(query) {
        const lowerQuery = query.toLowerCase();
        return this.users.filter(u =>
            u.name.toLowerCase().includes(lowerQuery) ||
            u.phone.includes(query) ||
            u.address.toLowerCase().includes(lowerQuery)
        );
    }

    // Delivery methods
    async addDelivery(delivery) {
        if (this.isOnline) {
            try {
                const result = await GoogleSheetsAPI.request('addDelivery', { data: delivery });
                if (result.success) {
                    this.deliveries.push(result.delivery);
                    this.saveLocal('waterApp_deliveries', this.deliveries);
                    return result.delivery;
                }
            } catch (error) {
                console.error('Failed to add delivery online:', error);
            }
        }

        // Fallback to local
        delivery.id = Date.now().toString();
        delivery.createdAt = new Date().toISOString();
        this.deliveries.push(delivery);
        this.saveLocal('waterApp_deliveries', this.deliveries);
        return delivery;
    }

    async deleteDelivery(id) {
        if (this.isOnline) {
            try {
                await GoogleSheetsAPI.request('deleteDelivery', { id });
            } catch (error) {
                console.error('Failed to delete delivery online:', error);
            }
        }

        this.deliveries = this.deliveries.filter(d => d.id != id);
        this.saveLocal('waterApp_deliveries', this.deliveries);
    }

    getDeliveriesByDate(date) {
        return this.deliveries.filter(d => d.date === date);
    }

    getDeliveriesByUser(userId) {
        return this.deliveries.filter(d => d.userId == userId);
    }

    getDeliveriesByMonth(year, month) {
        return this.deliveries.filter(d => {
            const deliveryDate = new Date(d.date);
            return deliveryDate.getFullYear() === year && deliveryDate.getMonth() === month;
        });
    }

    getTodayBottleCount() {
        const today = getToday();
        return this.getDeliveriesByDate(today).reduce((sum, d) => sum + parseInt(d.bottles), 0);
    }

    getMonthBottleCount() {
        const now = new Date();
        return this.getDeliveriesByMonth(now.getFullYear(), now.getMonth())
            .reduce((sum, d) => sum + parseInt(d.bottles), 0);
    }

    getPendingDeliveries() {
        const today = getToday();
        const deliveredUserIds = new Set(this.getDeliveriesByDate(today).map(d => d.userId));
        return this.users.filter(u => !deliveredUserIds.has(u.id));
    }
}

// Utility Functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

// Cache today's date for performance (avoids repeated Date object creation)
let _todayCache = { value: null, date: null };
function getToday() {
    const now = new Date();
    const currentDate = now.toDateString();
    if (_todayCache.date !== currentDate) {
        _todayCache = { value: formatDate(now), date: currentDate };
    }
    return _todayCache.value;
}

function formatMonthYear(dateStr) {
    const date = new Date(dateStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// App Controller
class App {
    constructor() {
        this.store = new DataStore();
        this.currentTab = 'dashboard';
        this.editingUserId = null;

        this.init();
    }

    async init() {
        this.bindElements();
        this.showLoading(true);

        // Initialize data store
        await this.store.init();

        this.bindEvents();
        this.setCurrentDate();
        this.setDefaultDeliveryDate();
        this.updateConnectionStatus();
        this.updateDashboard();
        this.renderUsers();
        this.populateUserDropdowns();
        this.renderTodayDeliveries();
        this.setDefaultHistoryFilter();
        this.renderHistory();

        this.showLoading(false);
    }

    showLoading(show) {
        // Simple loading state
        document.body.style.opacity = show ? '0.7' : '1';
        document.body.style.pointerEvents = show ? 'none' : 'auto';
    }

    updateConnectionStatus() {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            if (this.store.isOnline) {
                statusEl.textContent = '☁️ Cloud Sync';
                statusEl.style.color = '#22c55e';
            } else {
                statusEl.textContent = '📱 Local Only';
                statusEl.style.color = '#f59e0b';
            }
        }
    }

    bindElements() {
        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Dashboard
        this.totalUsersEl = document.getElementById('totalUsers');
        this.todayBottlesEl = document.getElementById('todayBottles');
        this.monthBottlesEl = document.getElementById('monthBottles');
        this.pendingDeliveriesEl = document.getElementById('pendingDeliveries');
        this.recentDeliveriesEl = document.getElementById('recentDeliveries');

        // Users
        this.addUserBtn = document.getElementById('addUserBtn');
        this.searchUserInput = document.getElementById('searchUser');
        this.userListEl = document.getElementById('userList');

        // User Modal
        this.userModal = document.getElementById('userModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.userForm = document.getElementById('userForm');
        this.userIdInput = document.getElementById('userId');
        this.userNameInput = document.getElementById('userName');
        this.userPhoneInput = document.getElementById('userPhone');
        this.userAddressInput = document.getElementById('userAddress');
        this.userDefaultBottlesInput = document.getElementById('userDefaultBottles');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelModalBtn = document.getElementById('cancelModal');

        // Delivery
        this.deliveryForm = document.getElementById('deliveryForm');
        this.deliveryUserSelect = document.getElementById('deliveryUser');
        this.deliveryDateInput = document.getElementById('deliveryDate');
        this.bottleCountInput = document.getElementById('bottleCount');
        this.deliveryNotesInput = document.getElementById('deliveryNotes');
        this.decreaseQtyBtn = document.getElementById('decreaseQty');
        this.increaseQtyBtn = document.getElementById('increaseQty');
        this.todayDeliveryListEl = document.getElementById('todayDeliveryList');

        // History
        this.historyUserFilter = document.getElementById('historyUserFilter');
        this.historyMonthFilter = document.getElementById('historyMonthFilter');
        this.historyListEl = document.getElementById('historyList');
        this.historyTotalBottlesEl = document.getElementById('historyTotalBottles');

        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
    }

    bindEvents() {
        // Tab navigation
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // User management
        this.addUserBtn.addEventListener('click', () => this.openUserModal());
        this.closeModalBtn.addEventListener('click', () => this.closeUserModal());
        this.cancelModalBtn.addEventListener('click', () => this.closeUserModal());
        this.userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        this.searchUserInput.addEventListener('input', debounce((e) => this.handleUserSearch(e), 300));

        // Close modal on backdrop click
        this.userModal.addEventListener('click', (e) => {
            if (e.target === this.userModal) this.closeUserModal();
        });

        // Delivery form
        this.deliveryForm.addEventListener('submit', (e) => this.handleDeliverySubmit(e));
        this.decreaseQtyBtn.addEventListener('click', () => this.adjustQuantity(-1));
        this.increaseQtyBtn.addEventListener('click', () => this.adjustQuantity(1));

        // User selection change - set default bottles
        this.deliveryUserSelect.addEventListener('change', (e) => {
            const user = this.store.getUser(e.target.value);
            if (user) {
                this.bottleCountInput.value = user.defaultBottles || 1;
            }
        });

        // History filters
        this.historyUserFilter.addEventListener('change', () => this.renderHistory());
        this.historyMonthFilter.addEventListener('change', () => this.renderHistory());

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }
    }

    async refreshData() {
        this.showLoading(true);
        await this.store.syncFromCloud();
        // Always update dropdowns as user data may have changed
        this.populateUserDropdowns();
        // Render only visible tab (performance optimization)
        this.renderCurrentTab();
        // Always update dashboard for fresh stats
        if (this.currentTab !== 'dashboard') {
            this.updateDashboard();
        }
        this.showLoading(false);
        this.showToast('Data refreshed!', 'success');
    }

    setCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    setDefaultDeliveryDate() {
        this.deliveryDateInput.value = getToday();
    }

    setDefaultHistoryFilter() {
        const now = new Date();
        this.historyMonthFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    // Tab Navigation
    switchTab(tabId) {
        this.currentTab = tabId;

        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        // Refresh data when switching tabs
        if (tabId === 'dashboard') {
            this.updateDashboard();
        } else if (tabId === 'delivery') {
            this.populateUserDropdowns();
            this.renderTodayDeliveries();
        } else if (tabId === 'history') {
            this.populateUserDropdowns();
            this.renderHistory();
        }
    }

    // Dashboard
    updateDashboard() {
        this.totalUsersEl.textContent = this.store.users.length;
        this.todayBottlesEl.textContent = this.store.getTodayBottleCount();
        this.monthBottlesEl.textContent = this.store.getMonthBottleCount();
        this.pendingDeliveriesEl.textContent = this.store.getPendingDeliveries().length;

        // Recent deliveries
        const today = getToday();
        const todayDeliveries = this.store.getDeliveriesByDate(today);

        if (todayDeliveries.length === 0) {
            this.recentDeliveriesEl.innerHTML = '<p class="empty-state">No deliveries yet today</p>';
        } else {
            this.recentDeliveriesEl.innerHTML = todayDeliveries
                .slice(-5)
                .reverse()
                .map(d => {
                    const user = this.store.getUser(d.userId);
                    return `
                        <div class="delivery-card">
                            <div class="delivery-info">
                                <h4>${user ? user.name : 'Unknown User'}</h4>
                                <p>${d.notes || 'No notes'}</p>
                            </div>
                            <div class="bottle-count">
                                <span>${d.bottles}</span>
                                <small>bottles</small>
                            </div>
                        </div>
                    `;
                }).join('');
        }
    }

    // User Management
    renderUsers(users = null) {
        const userList = users || this.store.users;

        if (userList.length === 0) {
            this.userListEl.innerHTML = '<p class="empty-state">No users added yet</p>';
            return;
        }

        this.userListEl.innerHTML = userList.map(user => `
            <div class="user-card" data-id="${user.id}">
                <div class="user-info">
                    <h3>${user.name}</h3>
                    <p>📞 ${user.phone}</p>
                    <p>📍 ${user.address}</p>
                    <span class="default-bottles">Default: ${user.defaultBottles} bottles/day</span>
                </div>
                <div class="user-actions">
                    <button class="action-btn edit" onclick="app.editUser('${user.id}')" title="Edit">✏️</button>
                    <button class="action-btn delete" onclick="app.confirmDeleteUser('${user.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    handleUserSearch(e) {
        const query = e.target.value.trim();
        if (query === '') {
            this.renderUsers();
        } else {
            const filtered = this.store.searchUsers(query);
            this.renderUsers(filtered);
        }
    }

    openUserModal(userId = null) {
        this.editingUserId = userId;

        if (userId) {
            const user = this.store.getUser(userId);
            this.modalTitle.textContent = 'Edit User';
            this.userIdInput.value = user.id;
            this.userNameInput.value = user.name;
            this.userPhoneInput.value = user.phone;
            this.userAddressInput.value = user.address;
            this.userDefaultBottlesInput.value = user.defaultBottles;
        } else {
            this.modalTitle.textContent = 'Add New User';
            this.userForm.reset();
            this.userIdInput.value = '';
            this.userDefaultBottlesInput.value = 1;
        }

        this.userModal.classList.add('active');
        this.userNameInput.focus();
    }

    closeUserModal() {
        this.userModal.classList.remove('active');
        this.editingUserId = null;
        this.userForm.reset();
    }

    async handleUserSubmit(e) {
        e.preventDefault();
        this.showLoading(true);

        const userData = {
            name: this.userNameInput.value.trim(),
            phone: this.userPhoneInput.value.trim(),
            address: this.userAddressInput.value.trim(),
            defaultBottles: parseInt(this.userDefaultBottlesInput.value) || 1
        };

        try {
            if (this.editingUserId) {
                await this.store.updateUser(this.editingUserId, userData);
                this.showToast('User updated successfully!', 'success');
            } else {
                await this.store.addUser(userData);
                this.showToast('User added successfully!', 'success');
            }

            this.closeUserModal();
            // Always update dropdowns when user data changes
            this.populateUserDropdowns();
            // Render only visible tab (performance optimization)
            this.renderCurrentTab();
            // Update dashboard if not already rendered
            if (this.currentTab !== 'dashboard') {
                this.updateDashboard();
            }
        } catch (error) {
            this.showToast('Error saving user', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    editUser(id) {
        this.openUserModal(id);
    }

    async confirmDeleteUser(id) {
        const user = this.store.getUser(id);
        if (confirm(`Are you sure you want to delete "${user.name}"? This will NOT delete their delivery history.`)) {
            this.showLoading(true);
            try {
                await this.store.deleteUser(id);
                this.showToast('User deleted successfully!', 'success');
                // Always update dropdowns when user data changes
                this.populateUserDropdowns();
                // Render only visible tab (performance optimization)
                this.renderCurrentTab();
                // Update dashboard if not already rendered
                if (this.currentTab !== 'dashboard') {
                    this.updateDashboard();
                }
            } catch (error) {
                this.showToast('Error deleting user', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    // Delivery Management
    populateUserDropdowns() {
        const usersHtml = this.store.users.map(u =>
            `<option value="${u.id}">${u.name}</option>`
        ).join('');

        this.deliveryUserSelect.innerHTML = '<option value="">Choose a user...</option>' + usersHtml;
        this.historyUserFilter.innerHTML = '<option value="">All Users</option>' + usersHtml;
    }

    adjustQuantity(delta) {
        const current = parseInt(this.bottleCountInput.value) || 1;
        const newValue = Math.max(1, Math.min(100, current + delta));
        this.bottleCountInput.value = newValue;
    }

    async handleDeliverySubmit(e) {
        e.preventDefault();

        const userId = this.deliveryUserSelect.value;
        const date = this.deliveryDateInput.value;
        const bottles = parseInt(this.bottleCountInput.value);
        const notes = this.deliveryNotesInput.value.trim();

        if (!userId) {
            this.showToast('Please select a user', 'error');
            return;
        }

        this.showLoading(true);

        const delivery = {
            userId,
            date,
            bottles,
            notes
        };

        try {
            await this.store.addDelivery(delivery);

            const user = this.store.getUser(userId);
            this.showToast(`${bottles} bottle(s) added for ${user.name}!`, 'success');

            // Reset form
            this.deliveryUserSelect.value = '';
            this.bottleCountInput.value = 1;
            this.deliveryNotesInput.value = '';

            // Refresh only visible tab (performance optimization)
            this.renderCurrentTab();
            // Always update dashboard stats since they're important
            if (this.currentTab !== 'dashboard') {
                this.updateDashboard();
            }
        } catch (error) {
            this.showToast('Error adding delivery', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderTodayDeliveries() {
        const today = getToday();
        const deliveries = this.store.getDeliveriesByDate(today);

        if (deliveries.length === 0) {
            this.todayDeliveryListEl.innerHTML = '<p class="empty-state">No deliveries recorded today</p>';
            return;
        }

        this.todayDeliveryListEl.innerHTML = deliveries.map(d => {
            const user = this.store.getUser(d.userId);
            return `
                <div class="delivery-card">
                    <div class="delivery-info">
                        <h4>${user ? user.name : 'Unknown User'}</h4>
                        <p>${d.notes || 'No notes'}</p>
                    </div>
                    <div class="bottle-count">
                        <span>${d.bottles}</span>
                        <small>bottles</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    // History
    renderHistory() {
        const userId = this.historyUserFilter.value;
        const monthValue = this.historyMonthFilter.value;
        let targetYear, targetMonth;

        if (monthValue) {
            [targetYear, targetMonth] = monthValue.split('-').map(Number);
        }

        // Single pass filter and group
        const grouped = {};
        let totalBottles = 0;

        for (const d of this.store.deliveries) {
            // Filter by user (use == for loose comparison as IDs may be string or number)
            if (userId && d.userId != userId) continue;

            // Filter by month using string parsing (faster than Date object creation)
            if (monthValue) {
                const [y, m] = d.date.split('-').map(Number);
                if (y !== targetYear || m !== targetMonth) continue;
            }

            // Group by date and accumulate total
            if (!grouped[d.date]) {
                grouped[d.date] = [];
            }
            grouped[d.date].push(d);
            totalBottles += parseInt(d.bottles);
        }

        this.historyTotalBottlesEl.textContent = totalBottles;

        // Get sorted dates (string comparison works for YYYY-MM-DD format)
        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        if (sortedDates.length === 0) {
            this.historyListEl.innerHTML = '<p class="empty-state">No delivery history for selected filters</p>';
            return;
        }

        this.historyListEl.innerHTML = sortedDates.map(date => {
            const items = grouped[date];
            const dayTotal = items.reduce((sum, d) => sum + parseInt(d.bottles), 0);
            return `
                <div class="history-card">
                    <div>
                        <h4>${formatDisplayDate(date)}</h4>
                        <p class="history-date">${items.length} delivery(s)</p>
                    </div>
                    <div class="bottle-count">
                        <span>${dayTotal}</span>
                        <small>bottles</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render only the current visible tab for performance
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'delivery':
                this.renderTodayDeliveries();
                break;
            case 'history':
                this.renderHistory();
                break;
        }
    }

    // Toast Notification
    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        this.toast.className = `toast show ${type}`;

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize App
const app = new App();
