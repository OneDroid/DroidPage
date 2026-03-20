// Note: Requires JSZip and FileSaver to be loaded in the page
export const Exporter = {
    async exportToZip(renderedHtml, selectedTheme, formData) {
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
            alert('Loading export libraries... please wait.');
            return;
        }

        const zip = new JSZip();

        // Add index.html
        // We need to fix paths for the exported zip because <base> or ../../ might be in there.
        // We'll clean those up.
        let finalHtml = renderedHtml.replace(/<base[^>]*>/g, '');
        zip.file('index.html', finalHtml);

        // Fetch theme-specific assets
        // For simplicity, we assume templates have a style.css and potentially assets/ folder.
        try {
            const styles = await fetch(selectedTheme.path + 'style.css');
            const styleContent = await styles.text();
            zip.file('style.css', styleContent);
        } catch (e) {
            console.error('Error fetching style.css for export:', e);
        }

        // We can add more asset fetching logic as needed.
        // For a true static app, we may want to traverse CSS/JS imports.
        // Let's also include some dummy icons/screenshots in the zip.
        // Real screenshots are in base64, we can extract and save them as files if we want,
        // but it's simpler to keep them base64 in the index.html for now as specified.

        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, `${formData.app_name.toLowerCase().replace(/\s+/g, '-')}-landingpage.zip`);
        });
    }
};
