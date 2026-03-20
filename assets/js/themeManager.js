export const ThemeManager = {
    themes: [],
    selectedTheme: null,

    async loadThemes() {
        try {
            const response = await fetch('config/themes.json');
            this.themes = await response.json();
            return this.themes;
        } catch (error) {
            console.error('Error loading themes:', error);
            return [];
        }
    },

    selectTheme(themeId) {
        this.selectedTheme = this.themes.find(t => t.id === themeId);
        localStorage.setItem('droidpage_selected_theme', themeId);
        return this.selectedTheme;
    },

    getSelectedTheme() {
        const saved = localStorage.getItem('droidpage_selected_theme');
        if (saved) {
            this.selectTheme(saved);
        }
        return this.selectedTheme || this.themes[0];
    }
};
