export const Renderer = {
    async fetchTemplate(path) {
        try {
            const response = await fetch(path + 'index.html');
            const template = await response.text();
            return template;
        } catch (error) {
            console.error('Error fetching template:', error);
            return '';
        }
    },

    render(template, data) {
        let renderedHtml = template;
        const mergedData = {
            ...data,
            header_logo_markup: data.header_logo
                ? `<img src="${data.header_logo}" alt="${data.header_logo_title || data.app_name} logo" class="header-brand-logo">`
                : '',
            header_logo_title: data.header_logo_title || data.app_name,
            header_logo_subtitle: data.header_logo_subtitle || data.tagline,
            footer_brand_title: data.footer_brand_title || data.app_name,
            footer_brand_subtitle: data.footer_brand_subtitle || data.tagline,
            footer_bottom_text: data.footer_bottom_text || `&copy; 2025 ${data.app_name}. Powered by <a href="https://github.com/OneDroid/DroidPage" target="_blank" style="color: inherit; text-decoration: underline;">DroidPage</a>.`,
            header_sticky_class: data.sticky_header === 'false' ? 'is-static' : 'is-sticky'
        };
        
        // Loop through all data keys and replace placeholders
        Object.keys(mergedData).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            renderedHtml = renderedHtml.replace(placeholder, mergedData[key] || '');
        });

        // Simple cleanup for any remaining tags
        const remainingTags = /{{[a-zA-Z0-9_]+}}/g;
        renderedHtml = renderedHtml.replace(remainingTags, '');

        return renderedHtml;
    }
};
