/* ============================================================
   DroidPage Default Theme — theme.js
   1. Applies CSS variables from the renderer-injected JSON block
   2. Handles screenshot carousel navigation
   3. Handles lightbox
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

    /* ── 2. Screenshot Carousel Navigation ───────────────── */
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

    /* ── 3. Lightbox ─────────────────────────────────────── */
    const lightbox    = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const items       = document.querySelectorAll('.screenshot-item');

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

        items.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                if (img && img.src) openLightbox(img.src);
            });
        });

        lightbox.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });
    }

})();
