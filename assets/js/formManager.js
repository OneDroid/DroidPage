export const FormManager = {
    formData: {
        app_name: 'My Awesome App',
        tagline: 'The Best Mobile Experience',
        description: 'Describe what makes your mobile app unique and why people should download it.',
        app_icon: '',
        screenshot_1: '',
        screenshot_2: '',
        screenshot_3: '',
        play_store_link: 'https://play.google.com/store',
        font_family: 'manrope',
        primary_color: '#3b82f6',
        bg_color: '#ffffff',
        text_primary: '#0f172a',
        text_secondary: '#64748b',
        card_bg: '#f8fafc',
        border_color: '#e2e8f0',
        header_bg: '#0f172a',
        footer_bg: '#020617',
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
        this.onChange = onChange;
    },

    updateField(name, value) {
        this.formData[name] = value;
        this.save();
        if (this.onChange) this.onChange(this.formData, name);
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
