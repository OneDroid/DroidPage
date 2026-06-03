const DEFAULT_FEATURES = [
    {
        id: 'feat_rich',
        icon: 'sparkles',
        title: 'Beautiful by default',
        text: 'A polished, modern interface with dynamic theming and tactile mobile interactions out of the box.',
        tags: ['Material 3', 'Dynamic']
    },
    {
        id: 'feat_secure',
        icon: 'lock',
        title: 'Private & secure',
        text: 'Lock individual notes with a PIN or pattern and keep personal writing organized without giving up control.',
        tags: ['Lock', 'Trash']
    },
    {
        id: 'feat_offline',
        icon: 'offline',
        title: 'Offline first',
        text: 'All data is stored locally with no tracking and no cloud requirement. Your data stays yours.',
        tags: ['Local DB', 'Backup']
    }
];

const DEFAULT_SCREENSHOTS = [
    { id: 'shot_1', src: '' },
    { id: 'shot_2', src: '' },
    { id: 'shot_3', src: '' }
];

export const FormManager = {
    formData: {
        app_name: 'My Awesome App',
        tagline: 'The Best Mobile Experience',
        description: 'Describe what makes your mobile app unique and why people should download it.',
        app_icon: '',
        favicon: '',
        screenshots: '',
        features: '',
        play_store_link: 'https://play.google.com/store',
        font_family: 'manrope',
        primary_color: '#6366f1',
        bg_color: '#ffffff',
        text_primary: '#0f172a',
        text_secondary: '#64748b',
        card_bg: '#f8fafc',
        border_color: '#e6eaf2',
        header_bg: '#ffffff',
        footer_bg: '#0f172a',
        show_header: 'true',
        sticky_header: 'true',
        header_logo: '',
        header_logo_size: '60',
        show_header_logo_title: 'true',
        show_header_logo_subtitle: 'true',
        header_logo_title: 'OneDroid',
        header_logo_subtitle: 'SIMPLE, SECURE & OPEN',
        header_nav_items: '[{"id":"nav_features","label":"Features","url":"#features"},{"id":"nav_screenshots","label":"Screenshots","url":"#screenshots"},{"id":"nav_privacy","label":"Privacy","url":"./privacy"}]',
        header_nav_link_1_label: 'Features',
        header_nav_link_1_url: '#features',
        header_nav_link_2_label: 'Screenshots',
        header_nav_link_2_url: '#screenshots',
        header_nav_link_3_label: 'Privacy',
        header_nav_link_3_url: './privacy',
        show_header_nav_cta: 'true',
        header_nav_cta_label: 'Get the App',
        header_nav_cta_url: 'https://play.google.com/store',
        show_footer: 'true',
        footer_logo: '',
        footer_logo_size: '40',
        show_footer_brand_title: 'true',
        show_footer_brand_subtitle: 'true',
        footer_brand_title: '',
        footer_brand_subtitle: '',
        footer_nav_items: '[{"id":"footer_play_store","label":"Play Store","url":"https://play.google.com/store"},{"id":"footer_privacy","label":"Privacy Policy","url":"./privacy"},{"id":"footer_contact","label":"Contact","url":"#"}]',
        footer_link_1_label: 'Play Store',
        footer_link_1_url: 'https://play.google.com/store',
        footer_link_2_label: 'Privacy Policy',
        footer_link_2_url: './privacy',
        footer_link_3_label: 'Contact',
        footer_link_3_url: '#',
        footer_bottom_text: '',
        max_width: '1200',
        meta_title: 'My App | Download on Google Play',
        meta_description: 'Download my app on Google Play.'
    },

    init(onChange) {
        const saved = localStorage.getItem('droidpage_form_data');
        if (saved) {
            try {
                this.formData = { ...this.formData, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error parsing saved form data:', e);
            }
        }

        if (!this.formData.header_nav_items) {
            this.formData.header_nav_items = JSON.stringify([
                {
                    id: 'nav_features',
                    label: this.formData.header_nav_link_1_label || 'Features',
                    url: this.formData.header_nav_link_1_url || '#features'
                },
                {
                    id: 'nav_screenshots',
                    label: this.formData.header_nav_link_2_label || 'Screenshots',
                    url: this.formData.header_nav_link_2_url || '#screenshots'
                },
                {
                    id: 'nav_privacy',
                    label: this.formData.header_nav_link_3_label || 'Privacy',
                    url: this.formData.header_nav_link_3_url || './privacy'
                }
            ]);
        }

        if (!this.formData.footer_nav_items) {
            this.formData.footer_nav_items = JSON.stringify([
                {
                    id: 'footer_play_store',
                    label: this.formData.footer_link_1_label || 'Play Store',
                    url: this.formData.footer_link_1_url || 'https://play.google.com/store'
                },
                {
                    id: 'footer_privacy',
                    label: this.formData.footer_link_2_label || 'Privacy Policy',
                    url: this.formData.footer_link_2_url || './privacy'
                },
                {
                    id: 'footer_contact',
                    label: this.formData.footer_link_3_label || 'Contact',
                    url: this.formData.footer_link_3_url || '#'
                }
            ]);
        }
        if (!this.formData.features) {
            this.formData.features = JSON.stringify(DEFAULT_FEATURES);
        }

        if (!this.formData.screenshots) {
            const legacy = [this.formData.screenshot_1, this.formData.screenshot_2, this.formData.screenshot_3]
                .filter(Boolean)
                .map((src, index) => ({ id: `shot_${index + 1}`, src }));
            this.formData.screenshots = JSON.stringify(legacy.length ? legacy : DEFAULT_SCREENSHOTS);
        }
        ['screenshot_1', 'screenshot_2', 'screenshot_3'].forEach((key) => delete this.formData[key]);

        this.onChange = onChange;
        this.pushHistory(true);
    },

    updateField(name, value) {
        this.formData[name] = value;
        this.save();
        this.pushHistory();
        if (this.onChange) this.onChange(this.formData, name);
    },

    /* ── Undo / Redo history ─────────────────────────────── */
    history: [],
    historyIndex: -1,
    historyTimer: null,

    snapshot() {
        return JSON.stringify(this.formData);
    },

    pushHistory(immediate = false) {
        const commit = () => {
            const snap = this.snapshot();
            if (this.history[this.historyIndex] === snap) return;
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(snap);
            if (this.history.length > 100) this.history.shift();
            this.historyIndex = this.history.length - 1;
            if (this.onHistoryChange) this.onHistoryChange(this.canUndo(), this.canRedo());
        };
        clearTimeout(this.historyTimer);
        if (immediate) return commit();
        this.historyTimer = setTimeout(commit, 400);
    },

    canUndo() {
        return this.historyIndex > 0;
    },

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    },

    undo() {
        if (!this.canUndo()) return false;
        clearTimeout(this.historyTimer);
        this.historyIndex -= 1;
        this.restoreSnapshot(this.history[this.historyIndex]);
        return true;
    },

    redo() {
        if (!this.canRedo()) return false;
        clearTimeout(this.historyTimer);
        this.historyIndex += 1;
        this.restoreSnapshot(this.history[this.historyIndex]);
        return true;
    },

    restoreSnapshot(snap) {
        try {
            this.formData = JSON.parse(snap);
        } catch (e) {
            return;
        }
        this.save();
        if (this.onHistoryChange) this.onHistoryChange(this.canUndo(), this.canRedo());
        if (this.onRestore) this.onRestore(this.formData);
    },

    async handleImageUpload(name, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                this.updateField(name, base64);
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    save() {
        localStorage.setItem('droidpage_form_data', JSON.stringify(this.formData));
        if (this.onSave) this.onSave();
    },

    reset() {
        localStorage.removeItem('droidpage_form_data');
        location.reload();
    },

    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.formData = { ...this.formData, ...data };
            this.save();
            location.reload();
        } catch (e) {
            alert('Invalid JSON file.');
        }
    },

    exportJSON() {
        const blob = new Blob([JSON.stringify(this.formData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'droidpage-project.json';
        a.click();
        URL.revokeObjectURL(url);
    }
};
