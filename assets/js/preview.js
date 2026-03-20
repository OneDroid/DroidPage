export const Preview = {
    iframe: null,

    init(iframeId) {
        this.iframe = document.getElementById(iframeId);
    },

    update(renderedHtml, basePath) {
        if (!this.iframe) return;

        // Ensure theme path is respected by adding <base> tag
        const baseTag = `<base href="${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/\/[^/]*$/, '/')}${basePath}">`;
        
        let htmlWithBase = renderedHtml;
        if (!renderedHtml.includes('<base')) {
            htmlWithBase = renderedHtml.replace('<head>', `<head>${baseTag}`);
        }

        const doc = this.iframe.contentDocument || this.iframe.contentWindow.document;
        doc.open();
        doc.write(htmlWithBase);
        doc.close();
    }
};
