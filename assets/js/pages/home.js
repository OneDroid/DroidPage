import { ThemeManager } from '../modules/themeManager.js';

const THEME_KEY = 'droidpage_ui_theme';

function applySavedTheme() {
    if (localStorage.getItem(THEME_KEY) === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

function setupThemeToggle() {
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    });
}

function setupMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    const close = () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
    });

    links.querySelectorAll('[data-nav-link]').forEach(link => {
        link.addEventListener('click', close);
    });

    document.addEventListener('click', (e) => {
        if (!links.contains(e.target) && !toggle.contains(e.target)) close();
    });
}

function placeholderThumb(name) {
    return `https://placehold.co/600x375?text=${encodeURIComponent(name)}`;
}

function renderThemes(themes) {
    const grid = document.getElementById('theme-grid');
    if (!grid) return;

    if (!themes.length) {
        grid.innerHTML = `<p style="color:var(--text-secondary)">No themes available yet.</p>`;
        return;
    }

    grid.innerHTML = themes.map(theme => {
        const demoUrl = `demo.html?theme=${encodeURIComponent(theme.id)}`;
        const editUrl = `editor.html?theme=${encodeURIComponent(theme.id)}`;
        return `
            <article class="theme-card">
                <a class="theme-thumb" href="${demoUrl}" target="_blank" rel="noopener"
                    title="Preview ${theme.name} in a new tab">
                    <img src="${theme.thumbnail}" alt="${theme.name} preview"
                        onerror="this.src='${placeholderThumb(theme.name)}'">
                    <span class="theme-thumb-overlay">View live demo</span>
                </a>
                <div class="theme-body">
                    <h3 class="theme-name">${theme.name}</h3>
                    <p class="theme-desc">${theme.description || ''}</p>
                    <div class="theme-actions">
                        <a class="btn btn-ghost" href="${demoUrl}" target="_blank" rel="noopener">Live Demo</a>
                        <a class="btn btn-primary" href="${editUrl}">Edit</a>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

async function init() {
    applySavedTheme();
    setupThemeToggle();
    setupMobileNav();
    const themes = await ThemeManager.loadThemes();
    renderThemes(themes);
}

init();
