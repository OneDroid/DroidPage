export const Renderer = {
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

    buildFooterNavMarkup(items) {
        return items.map((item) => `
            <li><a href="${item.url || '#'}">${item.label || 'New Link'}</a></li>
        `).join('');
    },

    getFooterBottomText(appName, customText) {
        const prefix = customText?.trim() || `&copy; ${new Date().getFullYear()} ${appName}.`;
        return `${prefix} Powered by <a href="https://github.com/OneDroid/DroidPage" target="_blank" style="color: inherit; text-decoration: underline;">DroidPage</a>.`;
    },

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
        let headerNavItems = [];
        let footerNavItems = [];

        try {
            headerNavItems = JSON.parse(data.header_nav_items || '[]');
        } catch (error) {
            console.error('Error parsing header nav items for rendering:', error);
        }
        try {
            footerNavItems = JSON.parse(data.footer_nav_items || '[]');
        } catch (error) {
            console.error('Error parsing footer nav items for rendering:', error);
        }

        const showFooterTitle = data.show_footer_brand_title !== 'false';
        const showFooterSubtitle = data.show_footer_brand_subtitle !== 'false';
        const hasFooterBrand = showFooterTitle || showFooterSubtitle || Boolean(data.footer_logo);
        const hasFooterNav = footerNavItems.length > 0;

        const mergedData = {
            ...data,
            header_logo_markup: data.header_logo
                ? `<img src="${data.header_logo}" alt="${data.header_logo_title || data.app_name} logo" class="header-brand-logo">`
                : '',
            footer_logo_markup: data.footer_logo
                ? `<img src="${data.footer_logo}" alt="${data.footer_brand_title || data.app_name} logo" class="footer-brand-logo">`
                : '',
            header_logo_title: data.show_header_logo_title === 'false' ? '' : (data.header_logo_title || data.app_name),
            header_logo_subtitle: data.show_header_logo_subtitle === 'false' ? '' : (data.header_logo_subtitle || data.tagline),
            header_logo_title_class: data.show_header_logo_title === 'false' ? 'is-hidden' : '',
            header_logo_subtitle_class: data.show_header_logo_subtitle === 'false' ? 'is-hidden' : '',
            header_nav_items_markup: this.buildHeaderNavMarkup(headerNavItems),
            header_nav_cta_markup: data.show_header_nav_cta === 'false'
                ? ''
                : `
                    <li>
                        <a href="${data.header_nav_cta_url || '#'}" class="nav-cta" target="_blank" rel="noopener" id="header-nav-cta">
                            ${data.header_nav_cta_label || ''}
                        </a>
                    </li>
                `,
            footer_nav_items_markup: this.buildFooterNavMarkup(footerNavItems),
            footer_brand_title: data.show_footer_brand_title === 'false' ? '' : (data.footer_brand_title || data.app_name),
            footer_brand_subtitle: data.show_footer_brand_subtitle === 'false' ? '' : (data.footer_brand_subtitle || data.tagline),
            footer_brand_block_class: hasFooterBrand ? '' : 'is-hidden',
            footer_nav_class: hasFooterNav ? '' : 'is-hidden',
            footer_inner_class: !hasFooterBrand && !hasFooterNav
                ? 'is-hidden'
                : !hasFooterBrand
                    ? 'footer-brand-hidden'
                    : !hasFooterNav
                        ? 'footer-nav-hidden'
                        : '',
            footer_brand_title_class: data.show_footer_brand_title === 'false' ? 'is-hidden' : '',
            footer_brand_subtitle_class: data.show_footer_brand_subtitle === 'false' ? 'is-hidden' : '',
            footer_bottom_text: this.getFooterBottomText(data.app_name, data.footer_bottom_text),
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
