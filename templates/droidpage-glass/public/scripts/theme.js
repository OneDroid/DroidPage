(function () {
    'use strict';

    const FONT_STACKS = {
        inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        manrope: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        'space-grotesk': "'Space Grotesk', 'Inter', sans-serif",
        'dm-sans': "'DM Sans', 'Inter', sans-serif",
        lora: "'Lora', Georgia, serif"
    };

    const themeVarsEl = document.getElementById('theme-vars');
    if (!themeVarsEl) return;

    try {
        const vars = JSON.parse(themeVarsEl.textContent);
        const root = document.documentElement;

        Object.entries(vars).forEach(([prop, value]) => {
            if (!value || value.trim() === '') return;

            if (prop === '--font-choice') {
                root.style.setProperty('--font-sans', FONT_STACKS[value] || FONT_STACKS.inter);
                return;
            }

            root.style.setProperty(prop, value);
        });
    } catch (error) {
        console.warn('[DroidPage Glass] Could not parse theme vars:', error);
    }
})();
