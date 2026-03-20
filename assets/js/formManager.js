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
        primary_color: '#3498db',
        meta_title: '',
        meta_description: ''
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
        this.onChange = onChange;
    },

    updateField(name, value) {
        this.formData[name] = value;
        this.save();
        if (this.onChange) this.onChange(this.formData);
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
