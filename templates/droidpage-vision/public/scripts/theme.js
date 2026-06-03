/* ============================================================
   DroidPage Default Theme — theme.js
   1. Applies CSS variables from the renderer-injected JSON block
   2. Handles mobile nav toggle
   3. Handles the phone-mockup empty state
   4. Handles screenshot carousel navigation
   5. Handles lightbox
   ============================================================ */

(function () {
    'use strict';

    const FONT_STACKS = {
        inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        manrope: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        'space-grotesk': "'Space Grotesk', 'Inter', sans-serif",
        'dm-sans': "'DM Sans', 'Inter', sans-serif",
        lora: "'Lora', Georgia, serif"
    };

    /* ── 1. Apply CSS Variables ──────────────────────────── */
    const themeVarsEl = document.getElementById('theme-vars');
    if (themeVarsEl) {
        try {
            const vars = JSON.parse(themeVarsEl.textContent);
            const root = document.documentElement;
            Object.entries(vars).forEach(([prop, val]) => {
                if (val && val.trim() !== '') {
                    if (prop === '--font-choice') {
                        root.style.setProperty('--font-sans', FONT_STACKS[val] || FONT_STACKS.inter);
                    } else {
                        root.style.setProperty(prop, val);
                    }
                }
            });
        } catch (e) {
            console.warn('[DroidPage] Could not parse theme-vars:', e);
        }
    }

    /* ── 2. Mobile Nav Toggle ────────────────────────────── */
    const navToggle = document.getElementById('nav-toggle');
    const siteNav   = document.getElementById('site-nav');
    if (navToggle && siteNav) {
        navToggle.addEventListener('click', () => {
            const open = siteNav.classList.toggle('open');
            navToggle.classList.toggle('is-active', open);
            navToggle.setAttribute('aria-expanded', String(open));
        });
        siteNav.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                siteNav.classList.remove('open');
                navToggle.classList.remove('is-active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ── 3. Phone-Mockup Empty State ─────────────────────── */
    const deviceFrame = document.querySelector('.device-frame');
    const deviceImg   = document.getElementById('hero-device-img');
    if (deviceFrame && deviceImg) {
        const syncDevice = () => {
            deviceFrame.classList.toggle('is-empty', !deviceImg.getAttribute('src'));
        };
        syncDevice();
        deviceImg.addEventListener('error', () => deviceFrame.classList.add('is-empty'));
        deviceImg.addEventListener('load', () => deviceFrame.classList.remove('is-empty'));
    }

    /* ── 4. Screenshot Carousel Navigation ───────────────── */
    const carousel = document.getElementById('screenshot-carousel');
    const btnPrev  = document.getElementById('carousel-prev');
    const btnNext  = document.getElementById('carousel-next');

    if (carousel && btnPrev && btnNext) {
        const scrollAmount = 300;
        btnPrev.addEventListener('click', () => {
            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
        btnNext.addEventListener('click', () => {
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });
    }

    /* ── 5. Lightbox ─────────────────────────────────────── */
    const lightbox    = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');

    if (lightbox && lightboxImg) {
        const openLightbox = (src) => {
            lightboxImg.src = src;
            lightbox.style.display = 'flex';
            requestAnimationFrame(() => lightbox.classList.add('active'));
        };

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.style.display = 'none';
                lightboxImg.src = '';
            }, 300);
        };

        if (carousel) {
            carousel.addEventListener('click', (e) => {
                const item = e.target.closest('.screenshot-item');
                if (!item) return;
                const img = item.querySelector('img');
                if (img && img.src) openLightbox(img.src);
            });
        }

        lightbox.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });
    }

})();
