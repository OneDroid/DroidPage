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
2. Select a theme from the sidebar.
3. Fill in your app name, tagline, description, and links.
4. Upload your icon and screenshots.
5. Click **Download Website** to get your files.

## Project Structure
- `index.html`: Main builder interface.
- `assets/`: 
  - `css/`: Styling for the builder.
  - `js/`: Modular JavaScript logic (`app.js`, `themeManager.js`, `formManager.js`, etc.).
- `templates/`: Theme templates with placeholder syntax.
- `config/`: Metadata for themes.

## Technology Stack
- HTML5 / CSS3 (Vanilla)
- ES6 Modules
- [JSZip](https://stuk.github.io/jszip/)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

## Deployment
Since this is a fully static application, you can host the generated files anywhere (GitHub Pages, Netlify, Vercel, or your own server).
