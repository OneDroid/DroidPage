export const Preview = {
    iframe: null,
    fontStacks: {
        inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        manrope: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        'space-grotesk': "'Space Grotesk', 'Inter', sans-serif",
        'dm-sans': "'DM Sans', 'Inter', sans-serif",
        lora: "'Lora', Georgia, serif"
    },
    buildHeaderNavMarkup(items) {
        return items.map((item) => {
            const subitems = Array.isArray(item.subitems) ? item.subitems : [];
            const subitemsMarkup = subitems.length
                ? `
                    <ul class="header-subnav">
                        ${subitems.map((subitem) => `
                            <li><a href="${subitem.url || '#'}">${subitem.label || 'Sub Link'}</a></li>
                        `).join('')}
                    </ul>
                `
                : '';

            return `
                <li class="header-nav-item${subitems.length ? ' has-subnav' : ''}">
                    <a href="${item.url || '#'}">${item.label || 'New Link'}</a>
                    ${subitemsMarkup}
                </li>
            `;
        }).join('');
    },

    init(iframeId) {
        this.iframe = document.getElementById(iframeId);
    },

    update(renderedHtml, basePath) {
        return new Promise((resolve) => {
            if (!this.iframe) return resolve();

            const iframeWindow = this.iframe.contentWindow;
            const previousDocument = this.iframe.contentDocument || iframeWindow?.document;
            const previousRoot = previousDocument?.documentElement;
            const previousBody = previousDocument?.body;
            const previousScrollHeight = Math.max(
                previousRoot?.scrollHeight || 0,
                previousBody?.scrollHeight || 0
            );
            const previousViewportHeight = iframeWindow?.innerHeight || 0;
            const previousScrollableHeight = Math.max(previousScrollHeight - previousViewportHeight, 0);
            const savedScroll = iframeWindow
                ? {
                    x: iframeWindow.scrollX || 0,
                    y: iframeWindow.scrollY || 0,
                    progress: previousScrollableHeight > 0
                        ? (iframeWindow.scrollY || 0) / previousScrollableHeight
                        : 0
                }
                : { x: 0, y: 0, progress: 0 };

            // Ensure theme path is respected by adding <base> tag
            const baseTag = `<base href="${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/[^/]*$/, '/')}${basePath}">`;
            
            let htmlWithBase = renderedHtml;
            if (!renderedHtml.includes('<base')) {
                htmlWithBase = renderedHtml.replace('<head>', `<head>${baseTag}`);
            }

            // Set up load listener before writing
            const onIframeLoad = () => {
                this.iframe.removeEventListener('load', onIframeLoad);
                const nextWindow = this.iframe.contentWindow;
                if (nextWindow) {
                    const restoreScroll = () => {
                        const nextDocument = this.iframe.contentDocument || nextWindow.document;
                        const nextRoot = nextDocument?.documentElement;
                        const nextBody = nextDocument?.body;
                        const nextScrollHeight = Math.max(
                            nextRoot?.scrollHeight || 0,
                            nextBody?.scrollHeight || 0
                        );
                        const nextViewportHeight = nextWindow.innerHeight || 0;
                        const nextScrollableHeight = Math.max(nextScrollHeight - nextViewportHeight, 0);
                        const targetY = nextScrollableHeight > 0
                            ? Math.min(savedScroll.y, Math.round(nextScrollableHeight * savedScroll.progress))
                            : 0;

                        nextWindow.scrollTo(savedScroll.x, targetY);
                    };

                    nextWindow.requestAnimationFrame(() => {
                        restoreScroll();
                        nextWindow.setTimeout(restoreScroll, 60);
                        nextWindow.setTimeout(restoreScroll, 180);
                        resolve();
                    });
                    return;
                }
                resolve();
            };
            this.iframe.addEventListener('load', onIframeLoad);

            const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
            doc.open();
            doc.write(htmlWithBase);
            doc.close();
        });
    },

    updateThemeStyles(data) {
        if (!this.iframe) return;

        const doc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
        const root = doc?.documentElement;
        if (!root) return;

        const styleMap = {
            primary_color: '--primary-color',
            bg_color: '--bg-color',
            text_primary: '--text-primary',
            text_secondary: '--text-secondary',
            card_bg: '--card-bg',
            border_color: '--border-color',
            header_bg: '--header-bg',
            footer_bg: '--footer-bg'
        };

        Object.entries(styleMap).forEach(([field, cssVar]) => {
            const value = data[field];
            if (value) {
                root.style.setProperty(cssVar, value);
            }
        });

        if (data.max_width) {
            root.style.setProperty('--container-max-width', `${data.max_width}px`);
        }

        if (data.header_logo_size) {
            root.style.setProperty('--header-logo-size', `${data.header_logo_size}px`);
        }

        const fontStack = this.fontStacks[data.font_family] || this.fontStacks.inter;
        root.style.setProperty('--font-sans', fontStack);
    },

    updateContent(data) {
        if (!this.iframe) return;

        const doc = this.iframe.contentDocument || this.iframe.contentWindow?.document;
        if (!doc) return;

        const appName = data.app_name || 'My Awesome App';
        const tagline = data.tagline || 'The Best Mobile Experience';
        const footerBottomText = data.footer_bottom_text
            || `&copy; 2025 ${appName}. Powered by <a href="https://github.com/OneDroid/DroidPage" target="_blank" style="color: inherit; text-decoration: underline;">DroidPage</a>.`;

        const setText = (id, value) => {
            const el = doc.getElementById(id);
            if (el) el.textContent = value;
        };

        const setHtml = (id, value) => {
            const el = doc.getElementById(id);
            if (el) el.innerHTML = value;
        };

        const setHref = (id, href) => {
            const el = doc.getElementById(id);
            if (el) el.setAttribute('href', href || '#');
        };

        let headerNavItems = [];
        try {
            headerNavItems = JSON.parse(data.header_nav_items || '[]');
        } catch (error) {
            console.error('Error parsing header nav items for preview:', error);
        }

        setText('header-brand-title', data.header_logo_title || appName);
        setText('header-brand-subtitle', data.header_logo_subtitle || tagline);
        setText('footer-brand-title', data.footer_brand_title || appName);
        setText('footer-brand-subtitle', data.footer_brand_subtitle || tagline);
        setHtml('footer-bottom', footerBottomText);

        setText('footer-link-1', data.footer_link_1_label || '');
        setText('footer-link-2', data.footer_link_2_label || '');
        setText('footer-link-3', data.footer_link_3_label || '');

        setHref('footer-link-1', data.footer_link_1_url);
        setHref('footer-link-2', data.footer_link_2_url);
        setHref('footer-link-3', data.footer_link_3_url);

        const headerNavList = doc.getElementById('header-nav-list');
        if (headerNavList) {
            const itemsMarkup = this.buildHeaderNavMarkup(headerNavItems);
            const ctaMarkup = data.show_header_nav_cta === 'false'
                ? ''
                : `
                <li>
                    <a href="${data.header_nav_cta_url || '#'}" class="nav-cta" target="_blank" rel="noopener" id="header-nav-cta">
                        ${data.header_nav_cta_label || ''}
                    </a>
                </li>
            `;
            headerNavList.innerHTML = itemsMarkup + ctaMarkup;
        }

        const siteHeader = doc.getElementById('site-header');
        if (siteHeader) {
            siteHeader.classList.toggle('is-static', data.sticky_header === 'false');
            siteHeader.classList.toggle('is-sticky', data.sticky_header !== 'false');
        }

        const headerBrand = doc.getElementById('header-brand');
        const headerBrandTitle = doc.getElementById('header-brand-title');
        const headerBrandSubtitle = doc.getElementById('header-brand-subtitle');
        let headerLogo = headerBrand?.querySelector('.header-brand-logo');
        const headerBrandCopy = headerBrand?.querySelector('.header-brand-copy');

        if (headerBrandTitle) {
            const showTitle = data.show_header_logo_title !== 'false';
            headerBrandTitle.classList.toggle('is-hidden', !showTitle);
            headerBrandTitle.textContent = showTitle ? (data.header_logo_title || appName) : '';
        }

        if (headerBrandSubtitle) {
            const showSubtitle = data.show_header_logo_subtitle !== 'false';
            headerBrandSubtitle.classList.toggle('is-hidden', !showSubtitle);
            headerBrandSubtitle.textContent = showSubtitle ? (data.header_logo_subtitle || tagline) : '';
        }

        if (headerBrand && headerBrandCopy) {
            if (data.header_logo) {
                if (!headerLogo) {
                    headerLogo = doc.createElement('img');
                    headerLogo.className = 'header-brand-logo';
                    headerBrand.insertBefore(headerLogo, headerBrandCopy);
                }
                headerLogo.src = data.header_logo;
                headerLogo.alt = `${data.header_logo_title || appName} logo`;
            } else if (headerLogo) {
                headerLogo.remove();
            }
        }
    }
};
