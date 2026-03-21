import { ThemeManager } from './themeManager.js';
import { FormManager } from './formManager.js';
import { Renderer } from './renderer.js';
import { Preview } from './preview.js';
import { Exporter } from './exporter.js';

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
    'max_width'
]);

class DroidPageApp {
    constructor() {
        document.body.classList.add('sidebar-pre-init');
        this.init();
    }

    async init() {
        this.applySavedTheme();

        this.log('Initializing form managers...');
        FormManager.init((data, changedField) => this.handleFormChange(data, changedField));

        this.log('Connecting to preview renderer...');
        Preview.init('preview-frame');

        this.log('Loading theme collection...');
        const themes = await ThemeManager.loadThemes();
        this.renderThemeList(themes);

        this.log('Restoring previous project...');
        const initialTheme = ThemeManager.getSelectedTheme();
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
                <div class="color-var-swatch" id="cv_swatch_${varDef.key}">
                    <div class="color-swatch-preview" id="cv_preview_${varDef.key}" style="background:${currentVal}"></div>
                    <span class="color-swatch-hex" id="cv_hex_${varDef.key}">${currentVal}</span>
                    <input
                        type="color"
                        id="cv_${varDef.key}"
                        name="${varDef.key}"
                        value="${currentVal}"
                        data-cv-key="${varDef.key}"
                    >
                </div>
            `;

            grid.appendChild(item);

            // Wire up: update swatch UI + save to FormManager → triggers refreshPreview
            const input = item.querySelector('input[type="color"]');
            input.addEventListener('input', (e) => {
                const val = e.target.value;
                document.getElementById(`cv_preview_${varDef.key}`).style.background = val;
                document.getElementById(`cv_hex_${varDef.key}`).textContent = val;
                FormManager.updateField(varDef.key, val);
            });
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

    /* ── Form Population ─────────────────────────────────── */
    populateForm(data) {
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input) input.value = data[key];

            // Sync color var swatches if rendered
            const cvPreview = document.getElementById(`cv_preview_${key}`);
            const cvHex     = document.getElementById(`cv_hex_${key}`);
            const cvInput   = document.getElementById(`cv_${key}`);
            if (cvPreview && data[key]) cvPreview.style.background = data[key];
            if (cvHex     && data[key]) cvHex.textContent = data[key];
            if (cvInput   && data[key]) cvInput.value = data[key];
        });

        const colorHex = document.getElementById('color-hex');
        if (colorHex) colorHex.textContent = data.primary_color;

        if (data.app_icon)     this.showPreview('icon-preview', data.app_icon);
        if (data.screenshot_1) this.showPreview('screenshot-1-preview', data.screenshot_1);
        if (data.screenshot_2) this.showPreview('screenshot-2-preview', data.screenshot_2);
        if (data.screenshot_3) this.showPreview('screenshot-3-preview', data.screenshot_3);
    }

    showPreview(imgId, src) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = src;
            img.classList.remove('hidden');
            const placeholder = img.nextElementSibling;
            if (placeholder) placeholder.classList.add('hidden');
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
                sidebar.style.padding = '0';
            } else {
                builderContainer.style.gridTemplateColumns = `${width}px 1fr`;
                sidebarToggle.classList.remove('collapsed');
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
            const { name, value } = e.target;
            if (!name) return;
            if (name === 'primary_color') {
                const colorHex = document.getElementById('color-hex');
                if (colorHex) colorHex.textContent = value;
                // Also sync the Theme Colors swatch if it exists
                const cvPreview = document.getElementById(`cv_preview_primary_color`);
                const cvHex     = document.getElementById(`cv_hex_primary_color`);
                const cvInput   = document.getElementById(`cv_primary_color`);
                if (cvPreview) cvPreview.style.background = value;
                if (cvHex)     cvHex.textContent = value;
                if (cvInput)   cvInput.value = value;
            }
            FormManager.updateField(name, value);
        };

        form.addEventListener('input', handleFieldChange);
        form.addEventListener('change', handleFieldChange);

        if (fontFamilySelect) {
            fontFamilySelect.addEventListener('change', handleFieldChange);
        }

        // Image uploads
        this.setupImageUpload('icon-upload',        'app_icon_input',    'icon-preview',        'app_icon');
        this.setupImageUpload('screenshot-1-upload','screenshot_1_input','screenshot-1-preview','screenshot_1');
        this.setupImageUpload('screenshot-2-upload','screenshot_2_input','screenshot-2-preview','screenshot_2');
        this.setupImageUpload('screenshot-3-upload','screenshot_3_input','screenshot-3-preview','screenshot_3');

        // Action buttons
        document.getElementById('download-btn').addEventListener('click', () => this.handleDownload());
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            const iframe = document.getElementById('preview-frame');
            if (iframe.requestFullscreen)       iframe.requestFullscreen();
            else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
            else if (iframe.msRequestFullscreen)     iframe.msRequestFullscreen();
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

    setupImageUpload(containerId, inputId, previewId, fieldName) {
        const container = document.getElementById(containerId);
        const input     = document.getElementById(inputId);

        container.addEventListener('click', () => input.click());

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

    /* ── Preview Refresh ─────────────────────────────────── */
    handleFormChange(data, changedField) {
        if (changedField && LIVE_THEME_FIELDS.has(changedField)) {
            Preview.updateThemeStyles(data);
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
