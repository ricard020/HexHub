tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "inverse-primary": "#618bff",
                "surface-bright": "#f7f9fb",
                "secondary-fixed-dim": "#c7d5ed",
                "on-surface": "#2a3439",
                "on-error": "#fff7f7",
                "on-primary-container": "#0048bf",
                "on-primary-fixed-variant": "#0050d4",
                "inverse-surface": "#0b0f10",
                "on-primary": "#f8f7ff",
                "inverse-on-surface": "#9a9d9f",
                "surface-container-high": "#e1e9ee",
                "on-tertiary-fixed": "#303c53",
                "tertiary": "#535f78",
                "error-dim": "#4f0116",
                "on-surface-variant": "#566166",
                "outline": "#717c82",
                "on-background": "#2a3439",
                "on-secondary-container": "#455367",
                "on-tertiary-fixed-variant": "#4c5870",
                "surface-tint": "#0053db",
                "on-tertiary-container": "#434e66",
                "background": "#f7f9fb",
                "surface-container-highest": "#d9e4ea",
                "surface-dim": "#cfdce3",
                "primary-fixed": "#dbe1ff",
                "on-secondary-fixed": "#324053",
                "tertiary-dim": "#47536b",
                "secondary-dim": "#465468",
                "surface-container-low": "#f0f4f7",
                "error-container": "#ff8b9a",
                "on-primary-fixed": "#003798",
                "primary-container": "#dbe1ff",
                "tertiary-fixed": "#d1ddfa",
                "outline-variant": "#a9b4b9",
                "surface-container-lowest": "#ffffff",
                "primary-fixed-dim": "#c7d3ff",
                "on-secondary-fixed-variant": "#4e5c71",
                "surface": "#f7f9fb",
                "surface-container": "#e8eff3",
                "primary-dim": "#0048c1",
                "primary": "#0053db",
                "tertiary-fixed-dim": "#c3cfeb",
                "on-secondary": "#f8f8ff",
                "on-tertiary": "#f8f8ff",
                "on-error-container": "#782232",
                "error": "#9e3f4e",
                "tertiary-container": "#d1ddfa",
                "secondary-fixed": "#d5e3fc",
                "secondary": "#526074",
                "surface-variant": "#d9e4ea",
                "secondary-container": "#d5e3fc"
            },
            "borderRadius": {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            "fontFamily": {
                "headline": ["Inter"],
                "body": ["Inter"],
                "label": ["Inter"]
            }
        },
    },
};

const API_URL = 'http://localhost:3000/api/data';

// State
let state = {
    categories: [],
    colors: [],
    currentFilter: null,
    searchQuery: '',
    viewMode: 'grid'
};

// DOM Elements
const elements = {
    grid: document.getElementById('color-grid'),
    catList: document.getElementById('category-list'),
    searchInput: document.getElementById('search-input'),
    btnAll: document.getElementById('btn-all-palettes'),
    btnGrid: document.getElementById('btn-view-grid'),
    btnList: document.getElementById('btn-view-list'),
    overlay: document.getElementById('modal-overlay'),
    // Modals
    modalColor: document.getElementById('modal-color'),
    modalCat: document.getElementById('modal-category'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalInfo: document.getElementById('modal-info'),
    // Color Form
    colorId: document.getElementById('color-id'),
    colorName: document.getElementById('color-name'),
    colorHex: document.getElementById('color-hex'),
    colorCatSelect: document.getElementById('color-category'),
    colorPreview: document.getElementById('color-preview'),
    // Category Form
    catId: document.getElementById('category-id'),
    catName: document.getElementById('category-name')
};

// Logic placeholders
let deleteTarget = null; // { type: 'color'|'category', id: string }

// Fetch data
async function loadData() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Network response structure is missing!');
        const data = await res.json();
        state.categories = data.categories || [];
        state.colors = data.colors || [];
        render();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error', 'No se pudo cargar la base de datos.', 'error');
    }
}

// Save data
async function saveData() {
    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: state.categories, colors: state.colors })
        });
        render();
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Error', 'No se pudieron guardar los cambios.', 'error');
    }
}

// Render Engine
function render() {
    renderCategories();
    renderColors();
    updateViewModeButtons();
}

// Category logic
function renderCategories() {
    elements.catList.innerHTML = '';
    // Populate form select
    elements.colorCatSelect.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    state.categories.forEach(cat => {
        const isActive = state.currentFilter === cat.id;
        const li = document.createElement('li');
        li.className = `group flex items-center justify-between px-4 py-2 cursor-pointer rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`;
        
        li.innerHTML = `
            <div class="flex items-center gap-3 flex-1" onclick="filterByCategory('${cat.id}')">
                <span class="w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-slate-400 dark:bg-slate-600'}"></span>
                <span class="text-sm font-bold ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}">${cat.name}</span>
            </div>
            <div class="hidden group-hover:flex items-center gap-1">
                <button class="material-symbols-outlined text-[16px] text-slate-400 hover:text-blue-500" onclick="openCatModal('${cat.id}')">edit</button>
                <button class="material-symbols-outlined text-[16px] text-slate-400 hover:text-red-500" onclick="confirmDelete('category', '${cat.id}')">delete</button>
            </div>
        `;
        elements.catList.appendChild(li);
    });
}

function filterByCategory(id) {
    state.currentFilter = id;
    renderColors();
    renderCategories(); // to update active class
}

elements.btnAll.addEventListener('click', () => {
    state.currentFilter = null;
    renderColors();
    renderCategories();
});

// Color logic
function renderColors() {
    let filtered = state.colors;

    if (state.currentFilter) {
        filtered = filtered.filter(c => c.categoryId === state.currentFilter);
    }
    
    if (state.searchQuery) {
        const sq = state.searchQuery.toLowerCase();
        filtered = filtered.filter(c => c.hex.toLowerCase().includes(sq) || c.rgb.toLowerCase().includes(sq));
    }

    elements.grid.className = state.viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8'
        : 'flex flex-col gap-4';

    elements.grid.innerHTML = '';
    
    if(filtered.length === 0) {
        elements.grid.innerHTML = `<p class="col-span-full text-center text-slate-500 mt-12 font-bold py-16">No hay colores aquí.</p>`;
        return;
    }

    filtered.forEach(color => {
        const catName = state.categories.find(c => c.id === color.categoryId)?.name || 'Sin categoría';
        
        const card = document.createElement('div');
        if(state.viewMode === 'grid') {
            card.className = "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 transition-all hover:scale-[1.02] hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent dark:border-slate-800";
            card.innerHTML = `
                <div class="h-48 w-full rounded-xl mb-4 shadow-sm relative overflow-hidden" style="background-color: ${color.hex}">
                    <div class="absolute right-2 top-2 hidden group-hover:flex gap-1 z-10">
                        <button class="bg-white/90 text-slate-800 p-1.5 rounded-lg shadow-sm hover:text-blue-600 transition-colors" onclick="openColorModal('${color.id}')"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                        <button class="bg-white/90 text-slate-800 p-1.5 rounded-lg shadow-sm hover:text-red-600 transition-colors" onclick="confirmDelete('color', '${color.id}')"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                    </div>
                </div>
                <div class="px-2 pb-2">
                    <div class="flex justify-between items-center mb-4">
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">${catName}</p>
                        ${color.name ? `<span class="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest truncate max-w-[50%] text-right">${color.name}</span>` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between items-center text-xs group/copy cursor-pointer" onclick="copyToClipboard('${color.hex}', this)">
                            <span class="font-mono text-slate-500 dark:text-slate-400">HEX: ${color.hex}</span>
                            <span class="material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 group-hover/copy:text-blue-500 transition-colors icon-copy" data-icon="content_copy">content_copy</span>
                        </div>
                        <div class="flex justify-between items-center text-xs group/copy cursor-pointer" onclick="copyToClipboard('${color.rgb}', this)">
                            <span class="font-mono text-slate-500 dark:text-slate-400">RGB: ${color.rgb}</span>
                            <span class="material-symbols-outlined text-[14px] text-slate-400 dark:text-slate-500 group-hover/copy:text-blue-500 transition-colors icon-copy" data-icon="content_copy">content_copy</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // List View
            card.className = "flex items-center p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all";
            card.innerHTML = `
                <div class="w-16 h-16 rounded-xl shrink-0 border border-slate-200 dark:border-slate-700 mr-6" style="background-color: ${color.hex}"></div>
                <div class="flex-1 flex justify-between items-center pr-4">
                     <div>
                        <div class="flex items-center gap-3 mb-1">
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">${catName}</p>
                            ${color.name ? `<span class="text-[10px] font-bold text-slate-800 dark:text-slate-200 border-l border-slate-300 dark:border-slate-600 pl-3 uppercase tracking-widest">${color.name}</span>` : ''}
                        </div>
                        <div class="flex gap-6">
                            <div class="flex items-center gap-2 cursor-pointer group/copy" onclick="copyToClipboard('${color.hex}', this)">
                                <span class="font-mono text-sm text-slate-900 dark:text-slate-50 font-bold">${color.hex}</span>
                                <span class="material-symbols-outlined text-[14px] text-slate-400 group-hover/copy:text-blue-500 icon-copy">content_copy</span>
                            </div>
                            <div class="flex items-center gap-2 cursor-pointer group/copy" onclick="copyToClipboard('${color.rgb}', this)">
                                <span class="font-mono text-sm text-slate-500 dark:text-slate-400">${color.rgb}</span>
                                <span class="material-symbols-outlined text-[14px] text-slate-400 group-hover/copy:text-blue-500 icon-copy">content_copy</span>
                            </div>
                        </div>
                     </div>
                     <div class="flex items-center gap-2">
                        <button class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500" onclick="openColorModal('${color.id}')"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                        <button class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500" onclick="confirmDelete('color', '${color.id}')"><span class="material-symbols-outlined text-[20px]">delete</span></button>
                     </div>
                </div>
            `;
        }
        elements.grid.appendChild(card);
    });
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

elements.colorHex.addEventListener('input', (e) => {
    let val = e.target.value;
    if(val.startsWith('#') && val.length === 7) {
        elements.colorPreview.style.backgroundColor = val;
    } else {
        elements.colorPreview.style.backgroundColor = 'transparent';
    }
});

// Clipboard
function copyToClipboard(text, el) {
    navigator.clipboard.writeText(text);
    const icon = el.querySelector('.icon-copy');
    icon.innerHTML = 'check_circle';
    icon.classList.add('text-green-500');
    
    showToast('Copiado!', `Valor: ${text}`, 'success');

    setTimeout(() => {
        icon.innerHTML = 'content_copy';
        icon.classList.remove('text-green-500');
    }, 1500);
}

// Search
elements.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderColors();
});

// View mode handling
elements.btnGrid.addEventListener('click', () => { state.viewMode = 'grid'; updateViewModeButtons(); renderColors(); });
elements.btnList.addEventListener('click', () => { state.viewMode = 'list'; updateViewModeButtons(); renderColors(); });

function updateViewModeButtons() {
    if(state.viewMode === 'grid') {
        elements.btnGrid.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-blue-500');
        elements.btnGrid.classList.remove('text-slate-500');
        elements.btnList.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-blue-500');
        elements.btnList.classList.add('text-slate-500');
    } else {
        elements.btnList.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-blue-500');
        elements.btnList.classList.remove('text-slate-500');
        elements.btnGrid.classList.remove('bg-slate-200', 'dark:bg-slate-700', 'text-blue-500');
        elements.btnGrid.classList.add('text-slate-500');
    }
}

// --- Modals ---
function hideModals() {
    elements.overlay.classList.add('hidden');
    elements.overlay.classList.remove('flex', 'opacity-100');
    
    elements.modalColor.classList.add('hidden');
    elements.modalColor.classList.remove('flex', 'scale-100');
    
    elements.modalCat.classList.add('hidden');
    elements.modalCat.classList.remove('flex', 'scale-100');
    
    elements.modalConfirm.classList.add('hidden');
    elements.modalConfirm.classList.remove('flex', 'scale-100');
    
    elements.modalInfo.classList.add('hidden');
    elements.modalInfo.classList.remove('flex', 'scale-100');
}

function showModal(el) {
    elements.overlay.classList.remove('hidden');
    elements.overlay.classList.add('flex');
    
    // Quick animation trick
    setTimeout(() => {
        elements.overlay.classList.add('opacity-100');
        el.classList.remove('hidden');
        el.classList.add('flex');
        setTimeout(() => el.classList.add('scale-100'), 10);
    }, 10);
}

document.querySelectorAll('.btn-cancel-modal').forEach(btn => btn.addEventListener('click', hideModals));

elements.overlay.addEventListener('click', (e) => {
    if (e.target === elements.overlay) hideModals();
});

document.getElementById('btn-info').addEventListener('click', () => showModal(elements.modalInfo));

// Color Form
document.getElementById('btn-create-palette').addEventListener('click', () => openColorModal(''));

function openColorModal(id = '') {
    elements.colorId.value = id;
    if(id) {
        const c = state.colors.find(x => x.id === id);
        elements.colorName.value = c.name || '';
        elements.colorHex.value = c.hex;
        elements.colorCatSelect.value = c.categoryId;
        elements.colorPreview.style.backgroundColor = c.hex;
        document.getElementById('modal-color-title').innerText = 'Editar Color';
    } else {
        elements.colorName.value = '';
        elements.colorHex.value = '';
        elements.colorPreview.style.backgroundColor = 'transparent';
        document.getElementById('modal-color-title').innerText = 'Añadir Nuevo Color';
        if(state.categories.length > 0) elements.colorCatSelect.value = state.categories[0].id;
    }
    showModal(elements.modalColor);
}

document.getElementById('btn-save-color').addEventListener('click', () => {
    const hex = elements.colorHex.value.trim().toUpperCase();
    if(!/^#[0-9A-F]{6}$/i.test(hex)) return showToast('Error', 'HEX code invalido', 'error');
    if(!elements.colorCatSelect.value) return showToast('Error', 'Selecciona una categoría', 'error');

    const rgb = hexToRgb(hex);
    const name = elements.colorName.value.trim();
    const id = elements.colorId.value;

    if(id) {
        const idx = state.colors.findIndex(c => c.id === id);
        if (idx !== -1) {
            state.colors[idx] = { ...state.colors[idx], hex, rgb, name, categoryId: elements.colorCatSelect.value };
            showToast('Éxito', 'Color actualizado', 'success');
        }
    } else {
        state.colors.push({ id: 'col_' + Date.now(), hex, rgb, name, categoryId: elements.colorCatSelect.value });
        showToast('Éxito', 'Color agregado', 'success');
    }
    saveData();
    hideModals();
});

// Category Form
document.getElementById('btn-add-category').addEventListener('click', () => openCatModal(''));

window.openCatModal = function(id = '') {
    elements.catId.value = id;
    if(id) {
        const c = state.categories.find(x => x.id === id);
        elements.catName.value = c.name;
        document.getElementById('modal-category-title').innerText = 'Editar Categoría';
    } else {
        elements.catName.value = '';
        document.getElementById('modal-category-title').innerText = 'Añadir Categoría';
    }
    showModal(elements.modalCat);
};

document.getElementById('btn-save-category').addEventListener('click', () => {
    const name = elements.catName.value.trim();
    if(!name) return showToast('Error', 'El nombre es requerido', 'error');

    const id = elements.catId.value;
    if(id) {
        const idx = state.categories.findIndex(c => c.id === id);
        if (idx !== -1) {
            state.categories[idx].name = name;
            showToast('Éxito', 'Categoría actualizada', 'success');
        }
    } else {
        state.categories.push({ id: 'cat_' + Date.now(), name });
        showToast('Éxito', 'Categoría agregada', 'success');
    }
    saveData();
    hideModals();
});

// Delete Logic
window.confirmDelete = function(type, id) {
    deleteTarget = { type, id };
    showModal(elements.modalConfirm);
};

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if(!deleteTarget) return;

    if(deleteTarget.type === 'color') {
        state.colors = state.colors.filter(c => c.id !== deleteTarget.id);
        showToast('Eliminado', 'Color eliminado', 'success');
    } else if(deleteTarget.type === 'category') {
        state.categories = state.categories.filter(c => c.id !== deleteTarget.id);
        // Also remove colors in this category
        state.colors = state.colors.filter(c => c.categoryId !== deleteTarget.id);
        if(state.currentFilter === deleteTarget.id) state.currentFilter = null;
        showToast('Eliminado', 'Categoría eliminada', 'success');
    }
    saveData();
    hideModals();
});

// Toast
let toastTimeout;
function showToast(title, desc, type) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-desc').innerText = desc;
    
    const icon = document.getElementById('toast-icon');
    if(type === 'error') {
        icon.innerHTML = 'error';
        icon.className = 'material-symbols-outlined text-red-500';
    } else {
        icon.innerHTML = 'check_circle';
        icon.className = 'material-symbols-outlined text-green-500';
    }

    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
    }, 3000);
}

// Init
loadData();
