/**
 * Chromahub - Color Palette Manager
 * Vanilla JS Implementation
 */

class Storage {
    static getColors() {
        const colors = localStorage.getItem('colors');
        if (!colors) {
            const defaults = [
                { id: '1', hex: '#6366F1', rgb: {r:99, g:102, b:241}, category: 'Brand Colors', createdAt: new Date().toISOString() },
                { id: '2', hex: '#A855F7', rgb: {r:168, g:85, b:247}, category: 'Brand Colors', createdAt: new Date().toISOString() },
                { id: '3', hex: '#F43F5E', rgb: {r:244, g:63, b:94}, category: 'Warm', createdAt: new Date().toISOString() },
                { id: '4', hex: '#3B82F6', rgb: {r:59, g:130, b:246}, category: 'Blue', createdAt: new Date().toISOString() }
            ];
            this.saveColors(defaults);
            return defaults;
        }
        return JSON.parse(colors);
    }

    static saveColors(colors) {
        localStorage.setItem('colors', JSON.stringify(colors));
    }

    static getCategories() {
        const cats = localStorage.getItem('categories');
        if (!cats) {
            const defaults = ["Blue", "Warm", "Brand Colors", "General"];
            this.saveCategories(defaults);
            return defaults;
        }
        return JSON.parse(cats);
    }

    static saveCategories(categories) {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
}

class ColorUtils {
    static hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToString(rgb) {
        return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
    }

    static isValidHex(hex) {
        return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex);
    }
}

class ChromaHubApp {
    constructor() {
        this.colors = Storage.getColors();
        this.categories = Storage.getCategories();
        this.currentFilter = 'all';
        this.isDarkMode = localStorage.getItem('theme') === 'dark';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.renderCategories();
        this.renderColors();
        this.updateStats();
    }

    setupTheme() {
        if (this.isDarkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    }

    setupEventListeners() {
        // Add Color Modal
        document.getElementById('addColorBtn').addEventListener('click', () => this.openColorModal());
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openCategoryModal());
        
        // Modal Close Buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Forms
        document.getElementById('colorForm').addEventListener('submit', (e) => this.handleColorSubmit(e));
        document.getElementById('categoryForm').addEventListener('submit', (e) => this.handleCategorySubmit(e));

        // Live Preview in HEX field
        document.getElementById('hexInput').addEventListener('input', (e) => {
            let val = e.target.value;
            if (val && !val.startsWith('#')) {
                val = '#' + val;
                e.target.value = val;
            }
            if (ColorUtils.isValidHex(val)) {
                document.getElementById('hexPreview').style.backgroundColor = val;
                const rgb = ColorUtils.hexToRgb(val);
                document.getElementById('rgbPreviewText').textContent = `RGB: (${rgb.r}, ${rgb.g}, ${rgb.b})`;
            }
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterColors(e.target.value));

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Delegation for color card actions
        document.getElementById('colorGrid').addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-btn');
            if (copyBtn) {
                this.copyToClipboard(copyBtn.dataset.value);
                return;
            }

            const deleteBtn = e.target.closest('.delete-color');
            if (deleteBtn) {
                this.deleteColor(deleteBtn.dataset.id);
                return;
            }

            const editBtn = e.target.closest('.edit-color');
            if (editBtn) {
                this.openColorModal(editBtn.dataset.id);
                return;
            }
        });

        // Category clicks
        document.getElementById('categoryList').addEventListener('click', (e) => {
            const item = e.target.closest('.category-item');
            if (!item) return;

            if (e.target.classList.contains('delete-cat')) {
                this.deleteCategory(item.dataset.category);
                return;
            }

            this.currentFilter = item.dataset.category;
            this.renderCategories();
            this.renderColors();
        });
    }

    // --- Actions ---

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        document.querySelector('.theme-icon').textContent = this.isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }

    openColorModal(id = null) {
        const modal = document.getElementById('colorModal');
        const form = document.getElementById('colorForm');
        const title = document.getElementById('modalTitle');
        const idInput = document.getElementById('editId');
        
        // Populate Categories in Select
        const select = document.getElementById('colorCategory');
        select.innerHTML = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');

        if (id) {
            const color = this.colors.find(c => c.id === id);
            title.textContent = 'Edit Color';
            idInput.value = id;
            document.getElementById('hexInput').value = color.hex;
            document.getElementById('colorCategory').value = color.category;
            document.getElementById('hexPreview').style.backgroundColor = color.hex;
            document.getElementById('rgbPreviewText').textContent = `RGB: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
        } else {
            title.textContent = 'Add Color';
            form.reset();
            idInput.value = '';
            document.getElementById('hexPreview').style.backgroundColor = '#000000';
            document.getElementById('rgbPreviewText').textContent = 'RGB: (0, 0, 0)';
        }

        modal.classList.add('active');
    }

    openCategoryModal() {
        document.getElementById('categoryModal').classList.add('active');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    handleColorSubmit(e) {
        e.preventDefault();
        const hex = document.getElementById('hexInput').value;
        const category = document.getElementById('colorCategory').value;
        const id = document.getElementById('editId').value;

        if (!ColorUtils.isValidHex(hex)) {
            alert('Please enter a valid HEX code');
            return;
        }

        const colorData = {
            id: id || Date.now().toString(),
            hex: hex.toUpperCase(),
            rgb: ColorUtils.hexToRgb(hex),
            category,
            createdAt: new Date().toISOString()
        };

        if (id) {
            this.colors = this.colors.map(c => c.id === id ? colorData : c);
        } else {
            this.colors.unshift(colorData);
        }

        Storage.saveColors(this.colors);
        this.renderColors();
        this.updateStats();
        this.closeModals();
    }

    handleCategorySubmit(e) {
        e.preventDefault();
        const name = document.getElementById('categoryInput').value.trim();
        
        if (this.categories.includes(name)) {
            alert('Category already exists');
            return;
        }

        this.categories.push(name);
        Storage.saveCategories(this.categories);
        this.renderCategories();
        this.closeModals();
        e.target.reset();
    }

    deleteColor(id) {
        if (confirm('Are you sure you want to delete this color?')) {
            this.colors = this.colors.filter(c => c.id !== id);
            Storage.saveColors(this.colors);
            this.renderColors();
            this.updateStats();
        }
    }

    deleteCategory(cat) {
        if (cat === 'all') return;
        if (confirm(`Delete category "${cat}"? Colors in this category will be moved to "General".`)) {
            this.categories = this.categories.filter(c => c !== cat);
            this.colors = this.colors.map(c => {
                if (c.category === cat) {
                    return { ...c, category: 'General' };
                }
                return c;
            });
            
            if (!this.categories.includes('General')) {
                this.categories.push('General');
            }

            if (this.currentFilter === cat) {
                this.currentFilter = 'all';
            }

            Storage.saveCategories(this.categories);
            Storage.saveColors(this.colors);
            this.renderCategories();
            this.renderColors();
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast();
        });
    }

    showToast() {
        const toast = document.getElementById('toast');
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 2000);
    }

    // --- Rendering ---

    renderCategories() {
        const list = document.getElementById('categoryList');
        const allItem = `
            <li class="category-item ${this.currentFilter === 'all' ? 'active' : ''}" data-category="all">
                <span>All Colors</span>
            </li>
        `;

        const items = this.categories.map(cat => `
            <li class="category-item ${this.currentFilter === cat ? 'active' : ''}" data-category="${cat}">
                <span>${cat}</span>
                <button class="delete-cat" title="Delete Category">×</button>
            </li>
        `).join('');

        list.innerHTML = allItem + items;
    }

    filterColors(query = '') {
        const filtered = this.colors.filter(c => {
            const matchesCategory = this.currentFilter === 'all' || c.category === this.currentFilter;
            const matchesQuery = c.hex.toLowerCase().includes(query.toLowerCase()) || 
                                 JSON.stringify(c.rgb).includes(query);
            return matchesCategory && matchesQuery;
        });
        this.renderColors(filtered);
    }

    renderColors(colorsToRender = null) {
        const grid = document.getElementById('colorGrid');
        const emptyState = document.getElementById('emptyState');
        const colors = colorsToRender || (this.currentFilter === 'all' 
            ? this.colors 
            : this.colors.filter(c => c.category === this.currentFilter));

        document.getElementById('currentCategoryTitle').textContent = 
            this.currentFilter === 'all' ? 'All Colors' : this.currentFilter;

        if (colors.length === 0) {
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            grid.classList.remove('hidden');
            emptyState.classList.add('hidden');

            grid.innerHTML = colors.map(color => `
                <div class="color-card" data-id="${color.id}">
                    <div class="color-preview" style="background-color: ${color.hex}">
                        <div class="card-actions">
                            <button class="icon-btn edit-color" data-id="${color.id}" title="Edit">✏️</button>
                            <button class="icon-btn delete-color" data-id="${color.id}" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <div class="color-info">
                        <div class="info-row">
                            <span class="info-label">HEX</span>
                            <div class="info-value">
                                ${color.hex}
                                <button class="copy-btn" data-value="${color.hex}" title="Copy HEX">📋</button>
                            </div>
                        </div>
                        <div class="info-row">
                            <span class="info-label">RGB</span>
                            <div class="info-value">
                                ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}
                                <button class="copy-btn" data-value="rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})" title="Copy RGB">📋</button>
                            </div>
                        </div>
                        <div class="info-row" style="margin-top: 4px;">
                            <span class="info-label" style="font-size: 0.65rem; background: var(--bg-main); padding: 2px 8px; border-radius: 10px;">
                                ${color.category}
                            </span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateStats() {
        const stats = document.getElementById('colorStats');
        stats.textContent = `${this.colors.length} color${this.colors.length === 1 ? '' : 's'}`;
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChromaHubApp();
});
