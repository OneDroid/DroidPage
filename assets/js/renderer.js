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
        
        // Loop through all data keys and replace placeholders
        Object.keys(data).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            renderedHtml = renderedHtml.replace(placeholder, data[key] || '');
        });

        // Simple cleanup for any remaining tags
        const remainingTags = /{{[a-zA-Z0-9_]+}}/g;
        renderedHtml = renderedHtml.replace(remainingTags, '');

        return renderedHtml;
    }
};
