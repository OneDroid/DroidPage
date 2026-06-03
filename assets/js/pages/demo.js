import { ThemeManager } from '../modules/themeManager.js';
import { Renderer } from '../modules/renderer.js';

// Absolute screenshot URLs so they render regardless of the injected <base> tag.
const screenshot = (file) =>
    new URL(`templates/droidpage-default/public/media/screenshots/${file}`, window.location.href).href;

const DEMO_CONTENT = {
    app_name: 'Jotter',
    tagline: 'Notes that stay simple, secure, and offline',
    description: 'Jotter is a beautifully minimal note-taking app built for an offline-first experience. Capture ideas instantly, lock private notes, and back everything up without ever giving up control of your data.',
    play_store_link: 'https://play.google.com/store',
    font_family: 'manrope',
    features: JSON.stringify([
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
    ]),
    screenshots: JSON.stringify([
        { id: 'shot_1', src: screenshot('notes_list.png') },
        { id: 'shot_2', src: screenshot('note_editor.png') },
        { id: 'shot_3', src: screenshot('lock_screen.png') }
    ]),
    show_header: 'true',
    sticky_header: 'true',
    header_logo: '',
    header_logo_size: '60',
    show_header_logo_title: 'true',
    show_header_logo_subtitle: 'true',
    header_logo_title: 'Jotter',
    header_logo_subtitle: 'SIMPLE, SECURE & OFFLINE',
    header_nav_items: JSON.stringify([
        { id: 'nav_features', label: 'Features', url: '#features' },
        { id: 'nav_screenshots', label: 'Screenshots', url: '#screenshots' },
        { id: 'nav_about', label: 'About', url: '#about' }
    ]),
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
    footer_nav_items: JSON.stringify([
        { id: 'footer_play_store', label: 'Play Store', url: 'https://play.google.com/store' },
        { id: 'footer_privacy', label: 'Privacy Policy', url: '#' },
        { id: 'footer_contact', label: 'Contact', url: '#' }
    ]),
    footer_bottom_text: '',
    max_width: '1200',
    meta_title: 'Jotter | Minimal, Secure Notes App',
    meta_description: 'Jotter is a minimal, offline-first note-taking app for Android. Capture, lock, and back up your notes with ease.'
};

function buildDemoData(theme) {
    const colors = {};
    (theme.colorVars || []).forEach((varDef) => {
        colors[varDef.key] = varDef.default;
    });
    return { ...DEMO_CONTENT, ...colors };
}

function showError(message) {
    const status = document.getElementById('demo-status');
    if (status) status.innerHTML = `<p>${message}</p>`;
}

async function init() {
    const themeId = new URLSearchParams(window.location.search).get('theme');
    const themes = await ThemeManager.loadThemes();
    const theme = themes.find((t) => t.id === themeId) || themes[0];

    if (!theme) {
        showError('No theme found to preview.');
        return;
    }

    const template = await Renderer.fetchTemplate(theme.path);
    if (!template) {
        showError('Could not load this theme template.');
        return;
    }

    let html = Renderer.render(template, buildDemoData(theme));

    // Resolve the template's relative asset paths against its own directory.
    const baseHref = new URL(theme.path, window.location.href).href;
    const baseTag = `<base href="${baseHref}">`;
    if (!html.includes('<base')) {
        html = html.replace('<head>', `<head>${baseTag}`);
    }

    // Avoid an unstyled flash: hide until the theme paints, then fade in.
    const fadeStyle = `<style>html{opacity:0;transition:opacity .22s ease}html.is-ready{opacity:1}</style>`;
    const fadeScript = `<script>(function(){function r(){document.documentElement.classList.add('is-ready');}` +
        `if(document.readyState==='complete'){r();}else{addEventListener('load',r);setTimeout(r,600);}})();<\/script>`;
    html = html.replace('</head>', `${fadeStyle}</head>`);
    html = html.includes('</body>') ? html.replace('</body>', `${fadeScript}</body>`) : html + fadeScript;

    document.open();
    document.write(html);
    document.close();
}

init();
