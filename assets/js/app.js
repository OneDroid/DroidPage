import { ThemeManager } from './themeManager.js';
import { FormManager } from './formManager.js';
import { Renderer } from './renderer.js';
import { Preview } from './preview.js';
import { Exporter } from './exporter.js';
import { FEATURE_ICONS, FEATURE_ICON_OPTIONS, featureIconSvg } from './icons.js';

const FONT_OPTIONS = [
    { value: 'inter', label: 'Inter' },
    { value: 'manrope', label: 'Manrope' },
    { value: 'space-grotesk', label: 'Space Grotesk' },
    { value: 'dm-sans', label: 'DM Sans' },
    { value: 'lora', label: 'Lora' }
];

const LIVE_THEME_FIELDS = new Set([
    'font_family',
    'primary_color',
    'bg_color',
    'text_primary',
    'text_secondary',
    'card_bg',
    'border_color',
    'header_bg',
    'footer_bg',
    'header_logo_size',
    'footer_logo_size',
    'max_width'
]);

const LIVE_CONTENT_FIELDS = new Set([
    'app_name',
    'tagline',
    'description',
    'play_store_link',
    'features',
    'screenshots',
    'favicon',
    'meta_title',
    'meta_description',
    'show_header',
    'sticky_header',
    'header_logo',
    'header_logo_title',
    'header_logo_subtitle',
    'show_header_logo_title',
    'show_header_logo_subtitle',
    'show_header_nav_cta',
    'header_nav_items',
    'header_nav_link_1_label',
    'header_nav_link_1_url',
    'header_nav_link_2_label',
    'header_nav_link_2_url',
    'header_nav_link_3_label',
    'header_nav_link_3_url',
    'header_nav_cta_label',
    'header_nav_cta_url',
    'show_footer',
    'footer_logo',
    'show_footer_brand_title',
    'show_footer_brand_subtitle',
    'footer_brand_title',
    'footer_brand_subtitle',
    'footer_nav_items',
    'footer_link_1_label',
    'footer_link_1_url',
    'footer_link_2_label',
    'footer_link_2_url',
    'footer_link_3_label',
    'footer_link_3_url',
    'footer_bottom_text'
]);

class DroidPageApp {
    constructor() {
        this.collapsedNavItems = new Set();
        this.collapsedFooterNavItems = new Set();
        this.collapsedFeatures = new Set();
        this.colorPickerSuggestions = ['#0F172A', '#1D4ED8', '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#CA8A04', '#16A34A', '#0891B2', '#64748B', '#F8FAFC', '#111827'];
        document.body.classList.add('sidebar-pre-init');
        this.init();
    }

    async init() {
        this.applySavedTheme();

        this.log('Initializing form managers...');
        FormManager.onHistoryChange = (canUndo, canRedo) => this.updateUndoRedoButtons(canUndo, canRedo);
        FormManager.onRestore = (data) => this.handleHistoryRestore(data);
        FormManager.onSave = () => this.flashSaveIndicator();
        FormManager.init((data, changedField) => this.handleFormChange(data, changedField));

        this.log('Connecting to preview renderer...');
        Preview.init('preview-frame');

        this.log('Loading theme collection...');
        const themes = await ThemeManager.loadThemes();
        this.renderThemeList(themes);

        this.log('Restoring previous project...');
        const requestedThemeId = new URLSearchParams(window.location.search).get('theme');
        const requestedTheme = requestedThemeId
            ? themes.find(theme => theme.id === requestedThemeId)
            : null;
        const initialTheme = requestedTheme || ThemeManager.getSelectedTheme();
        this.setActiveTheme(initialTheme);
        this.populateForm(FormManager.formData);

        this.log('Finalizing interface...');
        this.setupEventListeners();
        this.setupCollapsibleSections();
        await this.refreshPreview();

        this.log('Starting the application...');
        setTimeout(() => {
            const loader = document.getElementById('app-loader');
            if (loader) loader.classList.add('hidden');
        }, 800);
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('droidpage_ui_theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    log(message) {
        const logContainer = document.getElementById('loader-log');
        if (logContainer) {
            logContainer.innerHTML = `<p>${message}</p>`;
        }
    }

    /* ── Theme List ──────────────────────────────────────── */
    renderThemeList(themes) {
        const themeList = document.getElementById('theme-list');
        themeList.innerHTML = '';

        themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = `theme-card ${ThemeManager.selectedTheme?.id === theme.id ? 'active' : ''}`;
            card.dataset.id = theme.id;
            card.innerHTML = `
                <img src="${theme.thumbnail}" alt="${theme.name}" onerror="this.src='https://placehold.co/300x200?text=${theme.name}'">
                <div class="theme-name">${theme.name}</div>
            `;
            card.addEventListener('click', () => {
                this.setActiveTheme(theme);
                this.refreshPreview();
            });
            themeList.appendChild(card);
        });
    }

    setActiveTheme(theme) {
        ThemeManager.selectTheme(theme.id);

        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === theme.id);
        });

        const maxWidthGroup = document.getElementById('max-width-group');
        if (maxWidthGroup) {
            maxWidthGroup.style.display = theme.features?.includes('maxWidth') ? 'block' : 'none';
        }

        this.renderThemeColors(theme);
    }

    /* ── Theme Color Pickers ─────────────────────────────── */
    renderThemeColors(theme) {
        const section = document.getElementById('section-theme-colors');
        const grid    = document.getElementById('color-vars-grid');
        const fontSelect = document.getElementById('font_family');
        const resetButton = document.getElementById('reset-theme-colors-btn');
        if (!section || !grid || !fontSelect) return;

        const colorVars = theme.colorVars || [];
        section.classList.add('visible');
        section.style.display = 'block';
        grid.innerHTML = '';
        if (resetButton) resetButton.disabled = false;
        this.renderFontOptions(fontSelect);

        colorVars.forEach(varDef => {
            const currentVal = FormManager.formData[varDef.key] || varDef.default;

            const item = document.createElement('div');
            item.className = 'color-var-item';
            item.innerHTML = `
                <label for="cv_${varDef.key}" title="${varDef.description || ''}">${varDef.label}</label>
                <div class="color-var-swatch" id="cv_swatch_${varDef.key}" data-cv-key="${varDef.key}" tabindex="0" role="button" aria-expanded="false">
                    <div class="color-swatch-preview" id="cv_preview_${varDef.key}" style="background:${currentVal}"></div>
                    <span class="color-swatch-hex" id="cv_hex_${varDef.key}">${currentVal}</span>
                    <input type="hidden" id="cv_${varDef.key}" name="${varDef.key}" value="${currentVal}" data-cv-key="${varDef.key}">
                    <div class="color-picker-popover" id="cv_popover_${varDef.key}" aria-hidden="true">
                        <div class="color-picker-popover-label">Color Picker</div>
                        <input type="text" id="cv_text_${varDef.key}" value="${currentVal}" spellcheck="false" autocomplete="off" placeholder="#3B82F6">
                        <div class="color-picker-suggestions">
                            ${this.colorPickerSuggestions.map((color) => `<button type="button" class="color-picker-chip" data-color="${color}" style="background:${color}" aria-label="Select ${color}"></button>`).join('')}
                        </div>
                        <div class="color-picker-note">Click a swatch or paste a hex color.</div>
                    </div>
                </div>
            `;

            grid.appendChild(item);

            // Wire up: update swatch UI + save to FormManager → triggers refreshPreview
            const swatch = item.querySelector('.color-var-swatch');
            const textInput = item.querySelector(`#cv_text_${varDef.key}`);
            const chips = item.querySelectorAll('.color-picker-chip');

            swatch.addEventListener('click', (e) => {
                if (e.target.closest('.color-picker-popover')) return;
                e.preventDefault();
                this.toggleColorPopover(varDef.key);
            });

            swatch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleColorPopover(varDef.key);
                }
                if (e.key === 'Escape') {
                    this.closeColorPopovers();
                }
            });

            textInput.addEventListener('click', (e) => e.stopPropagation());
            textInput.addEventListener('input', (e) => {
                const normalized = this.normalizeHexColor(e.target.value);
                if (normalized) this.updateThemeColor(varDef.key, normalized);
            });
            textInput.addEventListener('paste', (e) => {
                const pasted = e.clipboardData?.getData('text') || '';
                const normalized = this.normalizeHexColor(pasted);
                if (!normalized) return;
                e.preventDefault();
                this.updateThemeColor(varDef.key, normalized);
            });

            chips.forEach((chip) => {
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.updateThemeColor(varDef.key, chip.dataset.color);
                });
            });
        });
    }

    syncColorVarUI(key, value) {
        const preview = document.getElementById(`cv_preview_${key}`);
        const hex = document.getElementById(`cv_hex_${key}`);
        const input = document.getElementById(`cv_${key}`);
        const textInput = document.getElementById(`cv_text_${key}`);

        if (preview) preview.style.background = value;
        if (hex) hex.textContent = value;
        if (input) input.value = value;
        if (textInput) textInput.value = value;
    }

    normalizeHexColor(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed) return null;
        const raw = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
        if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw)) return null;
        if (raw.length === 3) {
            return `#${raw.split('').map((char) => char + char).join('').toUpperCase()}`;
        }
        return `#${raw.toUpperCase()}`;
    }

    updateThemeColor(key, value) {
        const normalized = this.normalizeHexColor(value);
        if (!normalized) return;
        this.syncColorVarUI(key, normalized);
        FormManager.updateField(key, normalized);
    }

    toggleColorPopover(key) {
        const swatch = document.getElementById(`cv_swatch_${key}`);
        const popover = document.getElementById(`cv_popover_${key}`);
        if (!swatch) return;

        const isOpen = swatch.classList.contains('is-open');
        this.closeColorPopovers();
        if (isOpen) return;

        swatch.classList.add('is-open');
        swatch.setAttribute('aria-expanded', 'true');
        popover?.setAttribute('aria-hidden', 'false');
        this.positionColorPopover(key);
        const textInput = document.getElementById(`cv_text_${key}`);
        textInput?.focus();
        textInput?.select();
    }

    positionColorPopover(key) {
        const swatch = document.getElementById(`cv_swatch_${key}`);
        const popover = document.getElementById(`cv_popover_${key}`);
        const sidebar = document.getElementById('sidebar');
        if (!swatch || !popover || !sidebar) return;

        const swatchRect = swatch.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const viewportPadding = 12;
        const preferredWidth = 260;

        popover.style.position = 'fixed';
        popover.style.left = '0px';
        popover.style.top = '0px';
        popover.style.right = 'auto';
        popover.style.width = `${preferredWidth}px`;

        const popoverRect = popover.getBoundingClientRect();
        let left = sidebarRect.left + ((sidebarRect.width - popoverRect.width) / 2);
        if (left < viewportPadding) left = viewportPadding;
        if (left + popoverRect.width > window.innerWidth - viewportPadding) {
            left = window.innerWidth - viewportPadding - popoverRect.width;
        }

        let top = swatchRect.bottom + 10;
        if (top + popoverRect.height > window.innerHeight - viewportPadding) {
            top = swatchRect.top - popoverRect.height - 10;
        }
        if (top < viewportPadding) top = viewportPadding;

        popover.style.left = `${Math.round(left)}px`;
        popover.style.top = `${Math.round(top)}px`;
    }

    closeColorPopovers() {
        document.querySelectorAll('.color-var-swatch.is-open').forEach((swatch) => {
            swatch.classList.remove('is-open');
            swatch.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.color-picker-popover').forEach((popover) => {
            popover.setAttribute('aria-hidden', 'true');
            popover.style.left = '';
            popover.style.top = '';
            popover.style.right = '';
            popover.style.width = '';
        });
    }

    renderFontOptions(select) {
        const selectedFont = FormManager.formData.font_family || 'inter';
        select.innerHTML = FONT_OPTIONS.map((font) => `
            <option value="${font.value}">${font.label}</option>
        `).join('');
        select.value = selectedFont;
    }

    resetThemeColors() {
        const theme = ThemeManager.getSelectedTheme();
        if (!theme) return;

        (theme.colorVars || []).forEach((varDef) => {
            FormManager.updateField(varDef.key, varDef.default);
        });
        FormManager.updateField('font_family', 'inter');

        this.populateForm(FormManager.formData);
    }

    createNavItem(label = 'New Link', url = '#') {
        return {
            id: `nav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            label,
            url,
            subitems: []
        };
    }

    createNavSubitem(label = 'Sub Link', url = '#') {
        return {
            id: `subnav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            label,
            url
        };
    }

    getHeaderNavItems() {
        try {
            const parsed = JSON.parse(FormManager.formData.header_nav_items || '[]');
            if (!Array.isArray(parsed)) return [];

            return parsed.map((item, index) => ({
                id: item.id || `nav_${index}`,
                label: item.label || 'New Link',
                url: item.url || '#',
                subitems: Array.isArray(item.subitems)
                    ? item.subitems.map((subitem, subIndex) => ({
                        id: subitem.id || `subnav_${index}_${subIndex}`,
                        label: subitem.label || 'Sub Link',
                        url: subitem.url || '#'
                    }))
                    : []
            }));
        } catch (error) {
            console.error('Error parsing header nav items:', error);
            return [];
        }
    }

    saveHeaderNavItems(items) {
        FormManager.updateField('header_nav_items', JSON.stringify(items));
    }

    getFooterNavItems() {
        try {
            const parsed = JSON.parse(FormManager.formData.footer_nav_items || '[]');
            if (!Array.isArray(parsed)) return [];

            return parsed.map((item, index) => ({
                id: item.id || `footer_nav_${index}`,
                label: item.label || 'New Link',
                url: item.url || '#'
            }));
        } catch (error) {
            console.error('Error parsing footer nav items:', error);
            return [];
        }
    }

    saveFooterNavItems(items) {
        FormManager.updateField('footer_nav_items', JSON.stringify(items));
    }

    escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    renderHeaderNavItemsEditor() {
        const container = document.getElementById('header-nav-items-editor');
        if (!container) return;

        const items = this.getHeaderNavItems();
        if (this.collapsedNavItems.size === 0) {
            items.forEach((item) => this.collapsedNavItems.add(item.id));
        }
        container.innerHTML = '';

        items.forEach((item) => {
            const isCollapsed = this.collapsedNavItems.has(item.id);
            const safeLabel = this.escapeHtml(item.label || '');
            const safeUrl = this.escapeHtml(item.url || '');
            const card = document.createElement('article');
            card.className = `nav-item-card${isCollapsed ? ' collapsed' : ''}`;
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="nav-item-header">
                    <button type="button" class="nav-item-handle" title="Drag to reorder" aria-label="Drag to reorder">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="9" cy="7" r="1.4"></circle>
                            <circle cx="15" cy="7" r="1.4"></circle>
                            <circle cx="9" cy="12" r="1.4"></circle>
                            <circle cx="15" cy="12" r="1.4"></circle>
                            <circle cx="9" cy="17" r="1.4"></circle>
                            <circle cx="15" cy="17" r="1.4"></circle>
                        </svg>
                    </button>
                    <div class="nav-item-title">
                        <span class="nav-item-label">${safeLabel || 'New Link'}</span>
                        <span class="nav-item-url">${safeUrl || '#'}</span>
                    </div>
                    <button type="button" class="nav-item-toggle" title="${isCollapsed ? 'Open item' : 'Collapse item'}" aria-label="${isCollapsed ? 'Open item' : 'Collapse item'}">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="8 10 12 14 16 10"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="nav-item-remove" title="Remove item" aria-label="Remove item">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 3h6"></path>
                            <path d="M4 7h16"></path>
                            <path d="M6 7l1 13h10l1-13"></path>
                            <path d="M10 11v5"></path>
                            <path d="M14 11v5"></path>
                        </svg>
                    </button>
                </div>
                <div class="nav-item-body">
                    <div class="form-group">
                        <label>Link Label</label>
                        <input type="text" value="${safeLabel}" data-nav-id="${item.id}" data-nav-field="label">
                    </div>
                    <div class="form-group">
                        <label>Link URL</label>
                        <input type="text" value="${safeUrl}" data-nav-id="${item.id}" data-nav-field="url">
                    </div>
                </div>
            `;

            const labelInput = card.querySelector('[data-nav-field="label"]');
            const urlInput = card.querySelector('[data-nav-field="url"]');
            const labelPreview = card.querySelector('.nav-item-label');
            const urlPreview = card.querySelector('.nav-item-url');
            const header = card.querySelector('.nav-item-header');
            const toggleButton = card.querySelector('.nav-item-toggle');
            const removeButton = card.querySelector('.nav-item-remove');
            const handleButton = card.querySelector('.nav-item-handle');

            labelInput.addEventListener('input', (e) => {
                const nextItems = this.getHeaderNavItems().map((navItem) => (
                    navItem.id === item.id ? { ...navItem, label: e.target.value } : navItem
                ));
                labelPreview.textContent = e.target.value || 'New Link';
                this.saveHeaderNavItems(nextItems);
            });

            urlInput.addEventListener('input', (e) => {
                const nextItems = this.getHeaderNavItems().map((navItem) => (
                    navItem.id === item.id ? { ...navItem, url: e.target.value } : navItem
                ));
                urlPreview.textContent = e.target.value || '#';
                this.saveHeaderNavItems(nextItems);
            });

            [labelInput, urlInput].forEach((input) => {
                input.addEventListener('click', (e) => e.stopPropagation());
                input.addEventListener('mousedown', (e) => e.stopPropagation());
                input.addEventListener('focus', () => {
                    if (!input.dataset.autoselected) {
                        input.select();
                        input.dataset.autoselected = 'true';
                    }
                });
                input.addEventListener('blur', () => {
                    delete input.dataset.autoselected;
                });
            });

            const syncToggleState = () => {
                const currentlyCollapsed = card.classList.contains('collapsed');
                toggleButton.title = currentlyCollapsed ? 'Open item' : 'Collapse item';
                toggleButton.setAttribute('aria-label', currentlyCollapsed ? 'Open item' : 'Collapse item');
            };

            const toggleCollapsed = () => {
                if (this.collapsedNavItems.has(item.id)) {
                    this.collapsedNavItems.delete(item.id);
                } else {
                    this.collapsedNavItems.add(item.id);
                }
                card.classList.toggle('collapsed');
                syncToggleState();
            };

            syncToggleState();

            header.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item-remove') || e.target.closest('.nav-item-handle')) return;
                toggleCollapsed();
            });

            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCollapsed();
            });

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextItems = this.getHeaderNavItems().filter((navItem) => navItem.id !== item.id);
                this.collapsedNavItems.delete(item.id);
                this.saveHeaderNavItems(nextItems);
                this.renderHeaderNavItemsEditor();
            });

            handleButton.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = container.querySelector('.nav-item-card.dragging')?.dataset.id;
                const targetId = card.dataset.id;
                if (!draggedId || !targetId || draggedId === targetId) return;

                const nextItems = this.getHeaderNavItems();
                const fromIndex = nextItems.findIndex((navItem) => navItem.id === draggedId);
                const toIndex = nextItems.findIndex((navItem) => navItem.id === targetId);
                if (fromIndex === -1 || toIndex === -1) return;

                const [movedItem] = nextItems.splice(fromIndex, 1);
                nextItems.splice(toIndex, 0, movedItem);
                this.saveHeaderNavItems(nextItems);
                this.renderHeaderNavItemsEditor();
            });

            container.appendChild(card);
        });
    }

    renderFooterNavItemsEditor() {
        const container = document.getElementById('footer-nav-items-editor');
        if (!container) return;

        const items = this.getFooterNavItems();
        if (this.collapsedFooterNavItems.size === 0) {
            items.forEach((item) => this.collapsedFooterNavItems.add(item.id));
        }
        container.innerHTML = '';

        items.forEach((item) => {
            const isCollapsed = this.collapsedFooterNavItems.has(item.id);
            const safeLabel = this.escapeHtml(item.label || '');
            const safeUrl = this.escapeHtml(item.url || '');
            const card = document.createElement('article');
            card.className = `nav-item-card${isCollapsed ? ' collapsed' : ''}`;
            card.draggable = true;
            card.dataset.id = item.id;
            card.innerHTML = `
                <div class="nav-item-header">
                    <button type="button" class="nav-item-handle" title="Drag to reorder" aria-label="Drag to reorder">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="9" cy="7" r="1.4"></circle>
                            <circle cx="15" cy="7" r="1.4"></circle>
                            <circle cx="9" cy="12" r="1.4"></circle>
                            <circle cx="15" cy="12" r="1.4"></circle>
                            <circle cx="9" cy="17" r="1.4"></circle>
                            <circle cx="15" cy="17" r="1.4"></circle>
                        </svg>
                    </button>
                    <div class="nav-item-title">
                        <span class="nav-item-label">${safeLabel || 'New Link'}</span>
                        <span class="nav-item-url">${safeUrl || '#'}</span>
                    </div>
                    <button type="button" class="nav-item-toggle" title="${isCollapsed ? 'Open item' : 'Collapse item'}" aria-label="${isCollapsed ? 'Open item' : 'Collapse item'}">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="8 10 12 14 16 10"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="nav-item-remove" title="Remove item" aria-label="Remove item">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 3h6"></path>
                            <path d="M4 7h16"></path>
                            <path d="M6 7l1 13h10l1-13"></path>
                            <path d="M10 11v5"></path>
                            <path d="M14 11v5"></path>
                        </svg>
                    </button>
                </div>
                <div class="nav-item-body">
                    <div class="form-group">
                        <label>Link Label</label>
                        <input type="text" value="${safeLabel}" data-footer-nav-id="${item.id}" data-footer-nav-field="label">
                    </div>
                    <div class="form-group">
                        <label>Link URL</label>
                        <input type="text" value="${safeUrl}" data-footer-nav-id="${item.id}" data-footer-nav-field="url">
                    </div>
                </div>
            `;

            const labelInput = card.querySelector('[data-footer-nav-field="label"]');
            const urlInput = card.querySelector('[data-footer-nav-field="url"]');
            const labelPreview = card.querySelector('.nav-item-label');
            const urlPreview = card.querySelector('.nav-item-url');
            const header = card.querySelector('.nav-item-header');
            const toggleButton = card.querySelector('.nav-item-toggle');
            const removeButton = card.querySelector('.nav-item-remove');
            const handleButton = card.querySelector('.nav-item-handle');

            labelInput.addEventListener('input', (e) => {
                const nextItems = this.getFooterNavItems().map((navItem) => (
                    navItem.id === item.id ? { ...navItem, label: e.target.value } : navItem
                ));
                labelPreview.textContent = e.target.value || 'New Link';
                this.saveFooterNavItems(nextItems);
            });

            urlInput.addEventListener('input', (e) => {
                const nextItems = this.getFooterNavItems().map((navItem) => (
                    navItem.id === item.id ? { ...navItem, url: e.target.value } : navItem
                ));
                urlPreview.textContent = e.target.value || '#';
                this.saveFooterNavItems(nextItems);
            });

            [labelInput, urlInput].forEach((input) => {
                input.addEventListener('click', (e) => e.stopPropagation());
                input.addEventListener('mousedown', (e) => e.stopPropagation());
                input.addEventListener('focus', () => {
                    if (!input.dataset.autoselected) {
                        input.select();
                        input.dataset.autoselected = 'true';
                    }
                });
                input.addEventListener('blur', () => {
                    delete input.dataset.autoselected;
                });
            });

            const syncToggleState = () => {
                const currentlyCollapsed = card.classList.contains('collapsed');
                toggleButton.title = currentlyCollapsed ? 'Open item' : 'Collapse item';
                toggleButton.setAttribute('aria-label', currentlyCollapsed ? 'Open item' : 'Collapse item');
            };

            const toggleCollapsed = () => {
                if (this.collapsedFooterNavItems.has(item.id)) {
                    this.collapsedFooterNavItems.delete(item.id);
                } else {
                    this.collapsedFooterNavItems.add(item.id);
                }
                card.classList.toggle('collapsed');
                syncToggleState();
            };

            syncToggleState();

            header.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item-remove') || e.target.closest('.nav-item-handle')) return;
                toggleCollapsed();
            });

            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCollapsed();
            });

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextItems = this.getFooterNavItems().filter((navItem) => navItem.id !== item.id);
                this.collapsedFooterNavItems.delete(item.id);
                this.saveFooterNavItems(nextItems);
                this.renderFooterNavItemsEditor();
            });

            handleButton.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });

            card.addEventListener('dragstart', () => {
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            card.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = container.querySelector('.nav-item-card.dragging')?.dataset.id;
                const targetId = card.dataset.id;
                if (!draggedId || !targetId || draggedId === targetId) return;

                const nextItems = this.getFooterNavItems();
                const fromIndex = nextItems.findIndex((navItem) => navItem.id === draggedId);
                const toIndex = nextItems.findIndex((navItem) => navItem.id === targetId);
                if (fromIndex === -1 || toIndex === -1) return;

                const [movedItem] = nextItems.splice(fromIndex, 1);
                nextItems.splice(toIndex, 0, movedItem);
                this.saveFooterNavItems(nextItems);
                this.renderFooterNavItemsEditor();
            });

            container.appendChild(card);
        });
    }

    /* ── Features Editor ─────────────────────────────────── */
    getFeatures() {
        try {
            const parsed = JSON.parse(FormManager.formData.features || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.map((item, index) => ({
                id: item.id || `feat_${index}`,
                icon: FEATURE_ICONS[item.icon] ? item.icon : 'sparkles',
                title: item.title || '',
                text: item.text || '',
                tags: Array.isArray(item.tags) ? item.tags : []
            }));
        } catch (error) {
            console.error('Error parsing features:', error);
            return [];
        }
    }

    saveFeatures(items) {
        FormManager.updateField('features', JSON.stringify(items));
    }

    createFeature() {
        return {
            id: `feat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            icon: 'sparkles',
            title: 'New Feature',
            text: 'Describe this feature.',
            tags: []
        };
    }

    renderFeaturesEditor() {
        const container = document.getElementById('features-editor');
        if (!container) return;

        const items = this.getFeatures();
        if (this.collapsedFeatures.size === 0) {
            items.forEach((item) => this.collapsedFeatures.add(item.id));
        }
        container.innerHTML = '';

        items.forEach((item) => {
            const isCollapsed = this.collapsedFeatures.has(item.id);
            const safeTitle = this.escapeHtml(item.title || '');
            const safeText = this.escapeHtml(item.text || '');
            const safeTags = this.escapeHtml((item.tags || []).join(', '));
            const card = document.createElement('article');
            card.className = `nav-item-card${isCollapsed ? ' collapsed' : ''}`;
            card.draggable = true;
            card.dataset.id = item.id;
            const iconOptions = FEATURE_ICON_OPTIONS.map((name) => `
                <option value="${name}"${name === item.icon ? ' selected' : ''}>${name}</option>
            `).join('');
            card.innerHTML = `
                <div class="nav-item-header">
                    <button type="button" class="nav-item-handle" title="Drag to reorder" aria-label="Drag to reorder">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="9" cy="7" r="1.4"></circle>
                            <circle cx="15" cy="7" r="1.4"></circle>
                            <circle cx="9" cy="12" r="1.4"></circle>
                            <circle cx="15" cy="12" r="1.4"></circle>
                            <circle cx="9" cy="17" r="1.4"></circle>
                            <circle cx="15" cy="17" r="1.4"></circle>
                        </svg>
                    </button>
                    <div class="nav-item-title">
                        <span class="feature-item-icon">${featureIconSvg(item.icon, 'feature-item-icon-svg')}</span>
                        <span class="nav-item-label">${safeTitle || 'New Feature'}</span>
                    </div>
                    <button type="button" class="nav-item-toggle" title="${isCollapsed ? 'Open item' : 'Collapse item'}" aria-label="${isCollapsed ? 'Open item' : 'Collapse item'}">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="8 10 12 14 16 10"></polyline>
                        </svg>
                    </button>
                    <button type="button" class="nav-item-remove" title="Remove feature" aria-label="Remove feature">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 3h6"></path>
                            <path d="M4 7h16"></path>
                            <path d="M6 7l1 13h10l1-13"></path>
                            <path d="M10 11v5"></path>
                            <path d="M14 11v5"></path>
                        </svg>
                    </button>
                </div>
                <div class="nav-item-body">
                    <div class="form-group">
                        <label>Icon</label>
                        <select data-feat-field="icon">${iconOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" value="${safeTitle}" data-feat-field="title">
                    </div>
                    <div class="form-group">
                        <label>Text</label>
                        <textarea rows="2" data-feat-field="text">${safeText}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags (comma separated)</label>
                        <input type="text" value="${safeTags}" data-feat-field="tags" placeholder="E.g. Fast, Secure">
                    </div>
                </div>
            `;

            const iconSelect = card.querySelector('[data-feat-field="icon"]');
            const titleInput = card.querySelector('[data-feat-field="title"]');
            const textInput = card.querySelector('[data-feat-field="text"]');
            const tagsInput = card.querySelector('[data-feat-field="tags"]');
            const labelPreview = card.querySelector('.nav-item-label');
            const iconPreview = card.querySelector('.feature-item-icon');
            const header = card.querySelector('.nav-item-header');
            const toggleButton = card.querySelector('.nav-item-toggle');
            const removeButton = card.querySelector('.nav-item-remove');
            const handleButton = card.querySelector('.nav-item-handle');

            const patchFeature = (patch) => {
                const nextItems = this.getFeatures().map((feat) => (
                    feat.id === item.id ? { ...feat, ...patch } : feat
                ));
                this.saveFeatures(nextItems);
            };

            iconSelect.addEventListener('change', (e) => {
                iconPreview.innerHTML = featureIconSvg(e.target.value, 'feature-item-icon-svg');
                patchFeature({ icon: e.target.value });
            });
            titleInput.addEventListener('input', (e) => {
                labelPreview.textContent = e.target.value || 'New Feature';
                patchFeature({ title: e.target.value });
            });
            textInput.addEventListener('input', (e) => patchFeature({ text: e.target.value }));
            tagsInput.addEventListener('input', (e) => {
                const tags = e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean);
                patchFeature({ tags });
            });

            [iconSelect, titleInput, textInput, tagsInput].forEach((input) => {
                input.addEventListener('click', (e) => e.stopPropagation());
                input.addEventListener('mousedown', (e) => e.stopPropagation());
            });

            const syncToggleState = () => {
                const currentlyCollapsed = card.classList.contains('collapsed');
                toggleButton.title = currentlyCollapsed ? 'Open item' : 'Collapse item';
                toggleButton.setAttribute('aria-label', currentlyCollapsed ? 'Open item' : 'Collapse item');
            };

            const toggleCollapsed = () => {
                if (this.collapsedFeatures.has(item.id)) {
                    this.collapsedFeatures.delete(item.id);
                } else {
                    this.collapsedFeatures.add(item.id);
                }
                card.classList.toggle('collapsed');
                syncToggleState();
            };

            syncToggleState();

            header.addEventListener('click', (e) => {
                if (e.target.closest('.nav-item-remove') || e.target.closest('.nav-item-handle')) return;
                toggleCollapsed();
            });

            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCollapsed();
            });

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextItems = this.getFeatures().filter((feat) => feat.id !== item.id);
                this.collapsedFeatures.delete(item.id);
                this.saveFeatures(nextItems);
                this.renderFeaturesEditor();
            });

            handleButton.addEventListener('mousedown', (e) => e.stopPropagation());

            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('dragover', (e) => e.preventDefault());
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = container.querySelector('.nav-item-card.dragging')?.dataset.id;
                const targetId = card.dataset.id;
                if (!draggedId || !targetId || draggedId === targetId) return;
                const nextItems = this.getFeatures();
                const fromIndex = nextItems.findIndex((feat) => feat.id === draggedId);
                const toIndex = nextItems.findIndex((feat) => feat.id === targetId);
                if (fromIndex === -1 || toIndex === -1) return;
                const [moved] = nextItems.splice(fromIndex, 1);
                nextItems.splice(toIndex, 0, moved);
                this.saveFeatures(nextItems);
                this.renderFeaturesEditor();
            });

            container.appendChild(card);
        });
    }

    /* ── Screenshots Editor ──────────────────────────────── */
    getScreenshots() {
        try {
            const parsed = JSON.parse(FormManager.formData.screenshots || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.map((item, index) => ({
                id: item.id || `shot_${index}`,
                src: item.src || ''
            }));
        } catch (error) {
            console.error('Error parsing screenshots:', error);
            return [];
        }
    }

    saveScreenshots(items) {
        FormManager.updateField('screenshots', JSON.stringify(items));
    }

    renderScreenshotsEditor() {
        const container = document.getElementById('screenshots-editor');
        if (!container) return;

        const items = this.getScreenshots();
        container.innerHTML = '';

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'screenshot-card';
            card.draggable = true;
            card.dataset.id = item.id;
            const hasImage = Boolean(item.src);
            card.innerHTML = `
                <button type="button" class="screenshot-handle" title="Drag to reorder" aria-label="Drag to reorder">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="9" cy="7" r="1.4"></circle>
                        <circle cx="15" cy="7" r="1.4"></circle>
                        <circle cx="9" cy="12" r="1.4"></circle>
                        <circle cx="15" cy="12" r="1.4"></circle>
                        <circle cx="9" cy="17" r="1.4"></circle>
                        <circle cx="15" cy="17" r="1.4"></circle>
                    </svg>
                </button>
                <div class="screenshot-thumb${hasImage ? '' : ' is-empty'}">
                    ${hasImage ? `<img src="${item.src}" alt="Screenshot ${index + 1}">` : `<span>${index + 1}</span>`}
                    <input type="file" accept="image/*" hidden data-shot-input>
                </div>
                <button type="button" class="screenshot-remove" title="Remove screenshot" aria-label="Remove screenshot">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 3h6"></path>
                        <path d="M4 7h16"></path>
                        <path d="M6 7l1 13h10l1-13"></path>
                        <path d="M10 11v5"></path>
                        <path d="M14 11v5"></path>
                    </svg>
                </button>
            `;

            const thumb = card.querySelector('.screenshot-thumb');
            const fileInput = card.querySelector('[data-shot-input]');
            const removeButton = card.querySelector('.screenshot-remove');
            const handleButton = card.querySelector('.screenshot-handle');

            thumb.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const nextItems = this.getScreenshots().map((shot) => (
                        shot.id === item.id ? { ...shot, src: ev.target.result } : shot
                    ));
                    this.saveScreenshots(nextItems);
                    this.renderScreenshotsEditor();
                };
                reader.readAsDataURL(file);
            });

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const nextItems = this.getScreenshots().filter((shot) => shot.id !== item.id);
                this.saveScreenshots(nextItems);
                this.renderScreenshotsEditor();
            });

            handleButton.addEventListener('mousedown', (e) => e.stopPropagation());

            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            card.addEventListener('dragover', (e) => e.preventDefault());
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedId = container.querySelector('.screenshot-card.dragging')?.dataset.id;
                const targetId = card.dataset.id;
                if (!draggedId || !targetId || draggedId === targetId) return;
                const nextItems = this.getScreenshots();
                const fromIndex = nextItems.findIndex((shot) => shot.id === draggedId);
                const toIndex = nextItems.findIndex((shot) => shot.id === targetId);
                if (fromIndex === -1 || toIndex === -1) return;
                const [moved] = nextItems.splice(fromIndex, 1);
                nextItems.splice(toIndex, 0, moved);
                this.saveScreenshots(nextItems);
                this.renderScreenshotsEditor();
            });

            container.appendChild(card);
        });
    }

    /* ── Form Population ─────────────────────────────────── */
    populateForm(data) {
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = data[key] === 'true';
                } else {
                    input.value = data[key];
                }
            }

            if (key === 'header_logo_size' || key === 'footer_logo_size') {
                const sizeNumberInput = document.getElementById(`${key}_number`);
                if (sizeNumberInput) sizeNumberInput.value = data[key];
            }

            // Sync color var swatches if rendered
            const cvPreview = document.getElementById(`cv_preview_${key}`);
            const cvHex     = document.getElementById(`cv_hex_${key}`);
            const cvInput   = document.getElementById(`cv_${key}`);
            const cvText    = document.getElementById(`cv_text_${key}`);
            if (cvPreview && data[key]) cvPreview.style.background = data[key];
            if (cvHex     && data[key]) cvHex.textContent = data[key];
            if (cvInput   && data[key]) cvInput.value = data[key];
            if (cvText    && data[key]) cvText.value = data[key];
        });

        const colorHex = document.getElementById('color-hex');
        if (colorHex) colorHex.textContent = data.primary_color;

        if (data.app_icon)     this.showPreview('icon-preview', data.app_icon);
        if (data.header_logo)  this.showPreview('header-logo-preview', data.header_logo);
        if (data.footer_logo)  this.showPreview('footer-logo-preview', data.footer_logo);
        if (data.favicon)      this.showPreview('favicon-preview', data.favicon);
        this.renderHeaderNavItemsEditor();
        this.renderFooterNavItemsEditor();
        this.renderFeaturesEditor();
        this.renderScreenshotsEditor();
    }

    showPreview(imgId, src) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = src;
            img.classList.remove('hidden');
            const container = img.closest('.image-upload, .image-upload-small');
            const clearButton = container?.querySelector('.image-clear-btn');
            const placeholder = container?.querySelector('.upload-placeholder, .upload-placeholder-small');
            if (placeholder) placeholder.classList.add('hidden');
            if (clearButton) clearButton.classList.remove('hidden');
        }
    }

    clearPreview(imgId) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = '';
            img.classList.add('hidden');
            const container = img.closest('.image-upload, .image-upload-small');
            const clearButton = container?.querySelector('.image-clear-btn');
            const placeholder = container?.querySelector('.upload-placeholder, .upload-placeholder-small');
            if (placeholder) placeholder.classList.remove('hidden');
            if (clearButton) clearButton.classList.add('hidden');
        }
    }

    /* ── Collapsible Sidebar Sections ────────────────────── */
    setupCollapsibleSections() {
        document.querySelectorAll('.section-header').forEach(header => {
            const targetId = header.dataset.toggle;
            if (!targetId) return;
            const section = document.getElementById(targetId);
            if (!section) return;

            // Restore saved state from localStorage
            const storageKey = `droidpage_section_${targetId}`;
            const saved = localStorage.getItem(storageKey);
            if (saved === 'collapsed') {
                section.classList.add('collapsed');
            } else if (saved === 'open') {
                section.classList.remove('collapsed');
            }

            header.addEventListener('click', () => {
                const isNowCollapsed = section.classList.toggle('collapsed');
                localStorage.setItem(storageKey, isNowCollapsed ? 'collapsed' : 'open');
            });
        });
    }

    /* ── Event Listeners ─────────────────────────────────── */
    setupEventListeners() {
        const form = document.getElementById('app-form');
        const fontFamilySelect = document.getElementById('font_family');
        const headerFooterControls = document.getElementById('header-footer-controls');
        const headerLogoSizeRange = document.getElementById('header_logo_size');
        const headerLogoSizeNumber = document.getElementById('header_logo_size_number');
        const footerLogoSizeRange = document.getElementById('footer_logo_size');
        const footerLogoSizeNumber = document.getElementById('footer_logo_size_number');

        // App UI theme toggle (light/dark)
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('droidpage_ui_theme', isDark ? 'dark' : 'light');
        });

        // Resizable Sidebar
        const resizer           = document.getElementById('resizer');
        const sidebar           = document.getElementById('sidebar');
        const sidebarToggle     = document.getElementById('sidebar-toggle');
        const builderContainer  = document.querySelector('.builder-container');

        let isResizing = false;
        const getMinWidth = () => window.innerWidth * 0.25;
        const getMaxWidth = () => window.innerWidth * 0.3;
        const savedSidebarWidth = parseInt(localStorage.getItem('droidpage_sidebar_width'), 10);
        let lastWidth = Number.isFinite(savedSidebarWidth) ? savedSidebarWidth : getMinWidth();

        if (lastWidth > getMaxWidth()) lastWidth = getMaxWidth();

        const applyWidth = (width) => {
            if (width < 30) {
                builderContainer.style.gridTemplateColumns = `0px 1fr`;
                sidebarToggle.classList.add('collapsed');
                sidebar.classList.add('is-collapsed');
            } else {
                builderContainer.style.gridTemplateColumns = `${width}px 1fr`;
                sidebarToggle.classList.remove('collapsed');
                sidebar.classList.remove('is-collapsed');
                lastWidth = width;
                localStorage.setItem('droidpage_sidebar_width', width);
            }
        };

        applyWidth(lastWidth);
        requestAnimationFrame(() => {
            document.body.classList.remove('sidebar-pre-init');
        });

        resizer.addEventListener('mousedown', () => {
            isResizing = true;
            document.body.classList.add('resizing');
        });

        window.addEventListener('mouseup', () => {
            isResizing = false;
            isMobileResizing = false;
            document.body.classList.remove('resizing');
        });

        // Mobile Resizer
        const mobileResizer        = document.getElementById('mobile-resizer');
        const previewIframeWrapper = document.querySelector('.preview-iframe-wrapper');
        const previewArea          = document.querySelector('.preview-area');
        let isMobileResizing = false;
        let centerX = 0;
        let areaWidth = 0;

        mobileResizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isMobileResizing = true;
            document.body.classList.add('resizing');
            const areaRect = previewArea.getBoundingClientRect();
            centerX   = areaRect.left + areaRect.width / 2;
            areaWidth = areaRect.width;
        });

        window.addEventListener('mousemove', (e) => {
            if (isResizing) {
                let newWidth = e.clientX;
                const minWidth = window.innerWidth * 0.2;
                const maxWidth = window.innerWidth * 0.3;
                if (newWidth < minWidth) newWidth = minWidth;
                if (newWidth > maxWidth) newWidth = maxWidth;
                applyWidth(newWidth);
            }

            if (isMobileResizing) {
                let newWidth = Math.abs(e.clientX - centerX) * 2;
                const minWidth = 300;
                const maxWidth = areaWidth - 40;
                if (newWidth < minWidth) newWidth = minWidth;
                if (newWidth > maxWidth) newWidth = maxWidth;
                previewIframeWrapper.style.width = `${newWidth}px`;
                localStorage.setItem('droidpage_mobile_width', newWidth);
            }
        });

        const toggleSidebar = (e) => {
            if (e) e.stopPropagation();
            const isCollapsed = sidebarToggle.classList.contains('collapsed');
            applyWidth(isCollapsed ? (lastWidth > 50 ? lastWidth : 380) : 0);
        };

        sidebarToggle.addEventListener('click', toggleSidebar);

        // Form field changes (text inputs, textareas, number, url, color in App Details)
        const handleFieldChange = (e) => {
            const { name } = e.target;
            if (!name) return;
            const value = e.target.type === 'checkbox'
                ? (e.target.checked ? 'true' : 'false')
                : e.target.value;
            if (name === 'primary_color') {
                const colorHex = document.getElementById('color-hex');
                if (colorHex) colorHex.textContent = value;
                // Also sync the Theme Colors swatch if it exists
                const cvPreview = document.getElementById(`cv_preview_primary_color`);
                const cvHex     = document.getElementById(`cv_hex_primary_color`);
                const cvInput   = document.getElementById(`cv_primary_color`);
                const cvText    = document.getElementById(`cv_text_primary_color`);
                if (cvPreview) cvPreview.style.background = value;
                if (cvHex)     cvHex.textContent = value;
                if (cvInput)   cvInput.value = value;
                if (cvText)    cvText.value = value;
            }

            if (name === 'header_logo_size' || name === 'footer_logo_size') {
                const rangeInput = name === 'header_logo_size' ? headerLogoSizeRange : footerLogoSizeRange;
                const numberInput = name === 'header_logo_size' ? headerLogoSizeNumber : footerLogoSizeNumber;
                if (rangeInput && e.target !== rangeInput) rangeInput.value = value;
                if (numberInput && e.target !== numberInput) numberInput.value = value;
            }
            FormManager.updateField(name, value);
        };

        form.addEventListener('input', handleFieldChange);
        form.addEventListener('change', handleFieldChange);

        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', handleFieldChange);
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.color-var-swatch')) {
                this.closeColorPopovers();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeColorPopovers();
            }
        });

        window.addEventListener('resize', () => {
            document.querySelectorAll('.color-var-swatch.is-open').forEach((swatch) => {
                this.positionColorPopover(swatch.dataset.cvKey);
            });
        });

        if (headerFooterControls) {
            headerFooterControls.addEventListener('input', handleFieldChange);
            headerFooterControls.addEventListener('change', handleFieldChange);
        }

        document.getElementById('add-header-nav-item-btn')?.addEventListener('click', () => {
            const newItem = this.createNavItem();
            this.collapsedNavItems.add(newItem.id);
            const nextItems = [...this.getHeaderNavItems(), newItem];
            this.saveHeaderNavItems(nextItems);
            this.renderHeaderNavItemsEditor();
        });

        document.getElementById('add-footer-nav-item-btn')?.addEventListener('click', () => {
            const newItem = this.createNavItem();
            this.collapsedFooterNavItems.add(newItem.id);
            const nextItems = [...this.getFooterNavItems(), newItem];
            this.saveFooterNavItems(nextItems);
            this.renderFooterNavItemsEditor();
        });

        document.getElementById('add-feature-btn')?.addEventListener('click', () => {
            const newFeature = this.createFeature();
            const nextItems = [...this.getFeatures(), newFeature];
            this.saveFeatures(nextItems);
            this.renderFeaturesEditor();
        });

        const addScreenshotInput = document.getElementById('screenshot-add-input');
        document.getElementById('add-screenshot-btn')?.addEventListener('click', () => {
            addScreenshotInput?.click();
        });
        addScreenshotInput?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            let pending = files.length;
            const current = this.getScreenshots();
            files.forEach((file, offset) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    current.push({
                        id: `shot_${Date.now()}_${offset}_${Math.random().toString(36).slice(2, 6)}`,
                        src: ev.target.result
                    });
                    pending -= 1;
                    if (pending === 0) {
                        this.saveScreenshots(current);
                        this.renderScreenshotsEditor();
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        });

        if (headerLogoSizeNumber) {
            headerLogoSizeNumber.addEventListener('input', (e) => {
                const clamped = Math.min(96, Math.max(24, parseInt(e.target.value || '46', 10)));
                e.target.value = clamped;
                if (headerLogoSizeRange) headerLogoSizeRange.value = clamped;
                FormManager.updateField('header_logo_size', String(clamped));
            });
        }

        if (footerLogoSizeNumber) {
            footerLogoSizeNumber.addEventListener('input', (e) => {
                const clamped = Math.min(96, Math.max(24, parseInt(e.target.value || '40', 10)));
                e.target.value = clamped;
                if (footerLogoSizeRange) footerLogoSizeRange.value = clamped;
                FormManager.updateField('footer_logo_size', String(clamped));
            });
        }

        // Image uploads
        this.setupImageUpload('icon-upload',        'app_icon_input',    'icon-preview',        'app_icon');
        this.setupImageUpload('header-logo-upload', 'header_logo_input', 'header-logo-preview', 'header_logo', 'header-logo-clear-btn');
        this.setupImageUpload('footer-logo-upload', 'footer_logo_input', 'footer-logo-preview', 'footer_logo', 'footer-logo-clear-btn');
        this.setupImageUpload('favicon-upload',     'favicon_input',     'favicon-preview',     'favicon', 'favicon-clear-btn');

        // Action buttons
        document.getElementById('download-btn').addEventListener('click', () => this.handleDownload());
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            const iframe = document.getElementById('preview-frame');
            if (iframe.requestFullscreen)       iframe.requestFullscreen();
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
            else if (iframe.msRequestFullscreen)     iframe.msRequestFullscreen();
        });
        document.getElementById('undo-btn')?.addEventListener('click', () => {
            if (FormManager.undo()) this.handleHistoryRestore(FormManager.formData);
        });
        document.getElementById('redo-btn')?.addEventListener('click', () => {
            if (FormManager.redo()) this.handleHistoryRestore(FormManager.formData);
        });
        document.addEventListener('keydown', (e) => {
            const isMeta = e.ctrlKey || e.metaKey;
            if (!isMeta) return;
            const key = e.key.toLowerCase();
            const isRedo = key === 'y' || (key === 'z' && e.shiftKey);
            if (key !== 'z' && key !== 'y') return;
            const target = e.target;
            const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            if (isTyping) return;
            e.preventDefault();
            if (isRedo) {
                if (FormManager.redo()) this.handleHistoryRestore(FormManager.formData);
            } else if (FormManager.undo()) {
                this.handleHistoryRestore(FormManager.formData);
            }
        });

        document.getElementById('reset-btn').addEventListener('click', () => FormManager.reset());
        document.getElementById('reset-theme-colors-btn').addEventListener('click', () => this.resetThemeColors());
        document.getElementById('export-json-btn').addEventListener('click', () => FormManager.exportJSON());
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-json-input').click();
        });
        document.getElementById('import-json-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => FormManager.importJSON(ev.target.result);
                reader.readAsText(file);
            }
        });

        // Desktop / Mobile view switches
        document.querySelectorAll('.view-switches button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-switches button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const isMobile = btn.id === 'view-mobile';
                document.querySelector('.preview-area').classList.toggle('mobile', isMobile);

                if (isMobile) {
                    const savedW = localStorage.getItem('droidpage_mobile_width') || '375';
                    previewIframeWrapper.style.width = `${savedW}px`;
                } else {
                    previewIframeWrapper.style.width = '';
                }
            });
        });
    }

    setupImageUpload(containerId, inputId, previewId, fieldName, clearButtonId = null) {
        const container = document.getElementById(containerId);
        const input     = document.getElementById(inputId);
        const clearButton = clearButtonId ? document.getElementById(clearButtonId) : null;

        container.addEventListener('click', () => input.click());

        clearButton?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            input.value = '';
            FormManager.updateField(fieldName, '');
            this.clearPreview(previewId);
        });

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const base64 = await FormManager.handleImageUpload(fieldName, file);
                this.showPreview(previewId, base64);
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--primary-color)';
        });
        container.addEventListener('dragleave', () => {
            container.style.borderColor = 'var(--border-color)';
        });
        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            container.style.borderColor = 'var(--border-color)';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                const base64 = await FormManager.handleImageUpload(fieldName, file);
                this.showPreview(previewId, base64);
            }
        });
    }

    /* ── Undo / Redo & Save Indicator ────────────────────── */
    updateUndoRedoButtons(canUndo, canRedo) {
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        if (undoBtn) undoBtn.disabled = !canUndo;
        if (redoBtn) redoBtn.disabled = !canRedo;
    }

    handleHistoryRestore(data) {
        this.collapsedFeatures.clear();
        this.populateForm(data);
        this.refreshPreview();
    }

    flashSaveIndicator() {
        const indicator = document.getElementById('save-indicator');
        if (!indicator) return;
        indicator.classList.add('is-saving');
        clearTimeout(this.saveIndicatorTimer);
        this.saveIndicatorTimer = setTimeout(() => {
            indicator.classList.remove('is-saving');
        }, 900);
    }

    /* ── Preview Refresh ─────────────────────────────────── */
    handleFormChange(data, changedField) {
        if (changedField && LIVE_THEME_FIELDS.has(changedField)) {
            Preview.updateThemeStyles(data);
            return;
        }

        if (changedField && LIVE_CONTENT_FIELDS.has(changedField)) {
            Preview.updateContent(data);
            return;
        }

        this.refreshPreview();
    }

    async refreshPreview() {
        const theme = ThemeManager.getSelectedTheme();
        if (!theme) return;

        const templateHtml = await Renderer.fetchTemplate(theme.path);
        const renderedHtml = Renderer.render(templateHtml, FormManager.formData);
        await Preview.update(renderedHtml, theme.path);
    }

    async handleDownload() {
        const theme = ThemeManager.getSelectedTheme();
        const templateHtml = await Renderer.fetchTemplate(theme.path);
        const renderedHtml = Renderer.render(templateHtml, FormManager.formData);
        Exporter.exportToZip(renderedHtml, theme, FormManager.formData);
    }
}

// Start the app
new DroidPageApp();
