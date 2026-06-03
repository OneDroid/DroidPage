// Note: Requires JSZip and FileSaver to be loaded in the page
export const Exporter = {
    async exportToZip(renderedHtml, selectedTheme, formData) {
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
            alert('Loading export libraries... please wait.');
            return;
        }

        const zip = new JSZip();

        // Normalize asset paths for the exported standalone site.
        let finalHtml = renderedHtml
            .replace(/<base[^>]*>/g, '')
            .replace(/\.\.\/\.\.\/assets\/css\/global\.css/g, 'styles/global.css')
            .replace(/public\/styles\/theme\.css/g, 'styles/theme.css')
            .replace(/public\/scripts\/theme\.js/g, 'scripts/theme.js');

        zip.file('index.html', finalHtml);

        try {
            const [globalStyles, themeStyles, themeScript] = await Promise.all([
                fetch('assets/css/global.css'),
                fetch(`${selectedTheme.path}public/styles/theme.css`),
                fetch(`${selectedTheme.path}public/scripts/theme.js`)
            ]);

            zip.file('styles/global.css', await globalStyles.text());
            zip.file('styles/theme.css', await themeStyles.text());
            zip.file('scripts/theme.js', await themeScript.text());
        } catch (e) {
            console.error('Error fetching theme assets for export:', e);
        }

        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `${formData.app_name.toLowerCase().replace(/\s+/g, '-')}-landingpage.zip`);
        });
    }
};
