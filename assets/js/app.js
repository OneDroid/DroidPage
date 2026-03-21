import { ThemeManager } from './themeManager.js';
import { FormManager } from './formManager.js';
import { Renderer } from './renderer.js';
import { Preview } from './preview.js';
import { Exporter } from './exporter.js';

class DroidPageApp {
    constructor() {
        this.init();
    }

    async init() {
        // Essential theme check before anything else
        this.applySavedTheme();

        this.log('Initializing form managers...');
        FormManager.init((data) => this.handleFormChange(data));
        
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
        await this.refreshPreview();

        // Ensure all CSS is likely applied
        this.log('Ready!');
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

        // Update UI
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === theme.id);
        });
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.value = data[key];
            }
        });

        // Handle color hex display
        document.getElementById('color-hex').textContent = data.primary_color;

        // Handle image previews
        if (data.app_icon) this.showPreview('icon-preview', data.app_icon);
        if (data.screenshot_1) this.showPreview('screenshot-1-preview', data.screenshot_1);
        if (data.screenshot_2) this.showPreview('screenshot-2-preview', data.screenshot_2);
        if (data.screenshot_3) this.showPreview('screenshot-3-preview', data.screenshot_3);
    }

    showPreview(imgId, src) {
        const img = document.getElementById(imgId);
        if (img) {
            img.src = src;
            img.classList.remove('hidden');
            img.nextElementSibling.classList.add('hidden'); // Hide placeholder
        }
    }

    setupEventListeners() {
        const form = document.getElementById('app-form');

        // Theme management
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('droidpage_ui_theme', isDark ? 'dark' : 'light');
        });

        // Resizable Sidebar
        const resizer = document.getElementById('resizer');
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const builderContainer = document.querySelector('.builder-container');

        let isResizing = false;
        const getMinWidth = () => window.innerWidth * 0.2;
        const getMaxWidth = () => window.innerWidth * 0.3;
        let lastWidth = Math.max(getMinWidth(), parseInt(localStorage.getItem('droidpage_sidebar_width')) || 380);

        // Enforce max width on load
        if (lastWidth > getMaxWidth()) lastWidth = getMaxWidth();

        // Initial setup
        const applyWidth = (width) => {
            if (width < 30) {
                builderContainer.style.gridTemplateColumns = `0px 1fr`;
                sidebarToggle.classList.add('collapsed');
                sidebar.style.padding = '0';
            } else {
                builderContainer.style.gridTemplateColumns = `${width}px 1fr`;
                sidebarToggle.classList.remove('collapsed');
                sidebar.style.padding = '24px';
                lastWidth = width;
                localStorage.setItem('droidpage_sidebar_width', width);
            }
        };

        applyWidth(lastWidth);

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.classList.add('resizing');
        });

        window.addEventListener('mouseup', () => {
            isResizing = false;
            isMobileResizing = false;
            document.body.classList.remove('resizing');
        });

        // Mobile Resizer
        const mobileResizer = document.getElementById('mobile-resizer');
        const previewIframeWrapper = document.querySelector('.preview-iframe-wrapper');
        const previewArea = document.querySelector('.preview-area');
        let isMobileResizing = false;

        let centerX = 0;
        let areaWidth = 0;

        mobileResizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isMobileResizing = true;
            document.body.classList.add('resizing');

            const areaRect = previewArea.getBoundingClientRect();
            centerX = areaRect.left + areaRect.width / 2;
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
            if (isCollapsed) {
                applyWidth(lastWidth > 50 ? lastWidth : 380);
            } else {
                applyWidth(0);
            }
        };

        sidebarToggle.addEventListener('click', toggleSidebar);

        // Form field changes
        form.addEventListener('input', (e) => {
            const { name, value } = e.target;
            if (name === 'primary_color') {
                document.getElementById('color-hex').textContent = value;
            }
            FormManager.updateField(name, value);
        });

        // Image uploads
        this.setupImageUpload('icon-upload', 'app_icon_input', 'icon-preview', 'app_icon');
        this.setupImageUpload('screenshot-1-upload', 'screenshot_1_input', 'screenshot-1-preview', 'screenshot_1');
        this.setupImageUpload('screenshot-2-upload', 'screenshot_2_input', 'screenshot-2-preview', 'screenshot_2');
        this.setupImageUpload('screenshot-3-upload', 'screenshot_3_input', 'screenshot-3-preview', 'screenshot_3');

        // Action buttons
        document.getElementById('download-btn').addEventListener('click', () => this.handleDownload());
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            const iframe = document.getElementById('preview-frame');
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            } else if (iframe.webkitRequestFullscreen) { // Safari
                iframe.webkitRequestFullscreen();
            } else if (iframe.msRequestFullscreen) { // IE11
                iframe.msRequestFullscreen();
            }
        });
        document.getElementById('reset-btn').addEventListener('click', () => FormManager.reset());
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

        // View switches
        document.querySelectorAll('.view-switches button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-switches button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const isMobile = btn.id === 'view-mobile';
                const previewAreaEl = document.querySelector('.preview-area');
                previewAreaEl.classList.toggle('mobile', isMobile);

                if (isMobile) {
                    const savedMobileWidth = localStorage.getItem('droidpage_mobile_width') || '375';
                    previewIframeWrapper.style.width = `${savedMobileWidth}px`;
                } else {
                    previewIframeWrapper.style.width = '';
                }
            });
        });
    }

    setupImageUpload(containerId, inputId, previewId, fieldName) {
        const container = document.getElementById(containerId);
        const input = document.getElementById(inputId);

        container.addEventListener('click', () => input.click());

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const base64 = await FormManager.handleImageUpload(fieldName, file);
                this.showPreview(previewId, base64);
            }
        });

        // Drag and Drop
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

    handleFormChange(data) {
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
