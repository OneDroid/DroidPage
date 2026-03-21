export const Preview = {
    iframe: null,
    fontStacks: {
        inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        manrope: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        'space-grotesk': "'Space Grotesk', 'Inter', sans-serif",
        'dm-sans': "'DM Sans', 'Inter', sans-serif",
        lora: "'Lora', Georgia, serif"
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

        const fontStack = this.fontStacks[data.font_family] || this.fontStacks.inter;
        root.style.setProperty('--font-sans', fontStack);
    }
};
