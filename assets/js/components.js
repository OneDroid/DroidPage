class SiteNav extends HTMLElement {
    connectedCallback() {
        const root = this.getAttribute('root') || './';
        this.innerHTML = `
            <nav style="padding: 20px 0; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 700; font-size: 1.5rem; color: var(--primary-color);">Jotter</div>
                <div style="display: flex; gap: 40px; font-weight: 500;">
                    <a href="${root}index.html" style="text-decoration: none; color: var(--text-primary);">Home</a>
                    <a href="#" style="text-decoration: none; color: var(--text-secondary);">Features</a>
                    <a href="#" style="text-decoration: none; color: var(--text-secondary);">Privacy</a>
                </div>
            </nav>
        `;
    }
}

class HeroSection extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section style="padding: 100px 0; text-align: center;">
                <h1 style="font-size: 4rem; margin-bottom: 20px;">{{app_name}}</h1>
                <p style="font-size: 1.5rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto 40px;">{{tagline}}</p>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <a href="{{play_store_link}}" style="background: #000; color: #fff; padding: 15px 30px; border-radius: 12px; text-decoration: none; display: flex; align-items: center; gap: 12px;">
                        Get it on Play Store
                    </a>
                </div>
            </section>
        `;
    }
}

class JotterSpecs extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section style="padding: 60px 0; display: flex; gap: 40px; flex-wrap: wrap;">
                <div style="flex: 2; min-width: 300px;">
                    <h2 style="font-size: 2.5rem; margin-bottom: 24px;">Built for the modern thinker.</h2>
                    <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 30px;">{{description}}</p>
                </div>
                <div style="flex: 1; min-width: 250px; background: var(--card-bg); padding: 40px; border-radius: 24px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 600; margin-bottom: 12px; color: var(--primary-color);">VERSION 1.0.0</div>
                    <div style="font-size: 1.1rem; margin-bottom: 20px;">Offline first, open-source, and always under your control.</div>
                </div>
            </section>
        `;
    }
}

class FeatureGrid extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section style="padding: 80px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
                <div style="padding: 30px; border-radius: 20px; background: var(--card-bg);">
                    <h3 style="margin-bottom: 15px;">Fast & Offline</h3>
                    <p style="color: var(--text-secondary);">Access your notes anytime, anywhere, with local-first storage.</p>
                </div>
                <div style="padding: 30px; border-radius: 20px; background: var(--card-bg);">
                    <h3 style="margin-bottom: 15px;">Clean UI</h3>
                    <p style="color: var(--text-secondary);">Distraction-free interface designed for focused work.</p>
                </div>
                <div style="padding: 30px; border-radius: 20px; background: var(--card-bg);">
                    <h3 style="margin-bottom: 15px;">Open Source</h3>
                    <p style="color: var(--text-secondary);">Your data, your code. Fully open and transparent.</p>
                </div>
            </section>
        `;
    }
}

class SiteFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer style="padding: 60px 0; border-top: 1px solid var(--border-color); text-align: center;">
                <p style="color: var(--text-secondary);">&copy; 2026 Jotter. Powered by DroidPage.</p>
            </footer>
        `;
    }
}

class ScreenshotCarousel extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <section style="padding: 60px 0;">
                <h2 style="text-align: center; margin-bottom: 40px;">Look Inside</h2>
                <div style="display: flex; overflow-x: auto; gap: 20px; padding: 20px 0; scrollbar-width: none;">
                    <div style="flex: 0 0 280px; aspect-ratio: 9/19; border-radius: 20px; overflow: hidden; background: #eee;">
                        <img src="{{screenshot_1}}" style="width: 100%;" alt="Screenshot 1">
                    </div>
                    <div style="flex: 0 0 280px; aspect-ratio: 9/19; border-radius: 20px; overflow: hidden; background: #eee;">
                        <img src="{{screenshot_2}}" style="width: 100%;" alt="Screenshot 2">
                    </div>
                    <div style="flex: 0 0 280px; aspect-ratio: 9/19; border-radius: 20px; overflow: hidden; background: #eee;">
                        <img src="{{screenshot_3}}" style="width: 100%;" alt="Screenshot 3">
                    </div>
                </div>
            </section>
        `;
    }
}

customElements.define('site-nav', SiteNav);
customElements.define('hero-section', HeroSection);
customElements.define('jotter-specs', JotterSpecs);
customElements.define('feature-grid', FeatureGrid);
customElements.define('site-footer', SiteFooter);
customElements.define('screenshot-carousel', ScreenshotCarousel);
