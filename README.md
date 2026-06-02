# DroidPage Landing Page Builder

DroidPage is a client-side, production-ready landing page builder for mobile applications. It allows users to create stunning landing pages in seconds, directly in the browser.

## Features
- **Real-time Preview**: See changes instantly in an interactive iframe.
- **Theme Selection**: Choose from multiple professionally designed themes.
- **Form-Based Editing**: Simply fill in your app details.
- **Image Support**: Drag and drop your app icon and screenshots.
- **Static Export**: Download your finished landing page as a ZIP file.
- **Project Persistence**: Save and resume your work via localStorage or JSON export.

## How to Use
1. Open `index.html` in any modern web browser.
2. Browse the available themes on the home page.
3. Click **Live Demo** to preview a theme in a new tab, or **Edit** to open it in the editor.
4. In the editor, select a theme and fill in your app name, tagline, description, and links.
5. Upload your icon and screenshots, then tweak colors, fonts, header, and footer.
6. Click **Download Website** to export a ready-to-host ZIP.

## Pages
- `index.html`: Home page — responsive navbar (About / Themes / Editor), hero, and the theme gallery.
- `editor.html`: The builder interface. Accepts `?theme=<id>` to preselect a theme.
- `demo.html`: Standalone live preview. Accepts `?theme=<id>` and renders the theme with demo content.

## Project Structure
- `assets/`:
  - `css/`: `home.css` (landing page) and `style.css` (builder); `global.css` is shared by templates.
  - `js/`: Modular ES6 logic — `home.js`, `demo.js`, `app.js`, `themeManager.js`, `formManager.js`, `renderer.js`, `preview.js`, `exporter.js`.
- `templates/`: Theme templates with `{{placeholder}}` syntax.
- `config/`: `themes.json` metadata for the available themes.

## Technology Stack
- HTML5 / CSS3 (Vanilla)
- ES6 Modules
- [JSZip](https://stuk.github.io/jszip/)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

## Deployment
Since this is a fully static application, you can host the generated files anywhere (GitHub Pages, Netlify, Vercel, or your own server).
