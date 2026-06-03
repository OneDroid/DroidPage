// Shared feature-icon set. Used by the renderer, live preview, and the editor.
// Each entry is the inner markup of a 24x24 stroke SVG.
export const FEATURE_ICONS = {
    sparkles: '<path d="m12 3 1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9Z"></path><path d="M19 14v4"></path><path d="M21 16h-4"></path>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 1 1 8 0v4"></path>',
    bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7Z"></path>',
    offline: '<path d="m2 2 20 20"></path><path d="M8.5 8.5a5 5 0 0 0 7 7"></path><path d="M16 8a5 5 0 0 0-7-1"></path><path d="M12 12h.01"></path>',
    cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 6.5 19Z"></path>',
    palette: '<circle cx="12" cy="12" r="9"></circle><circle cx="8" cy="10" r="1"></circle><circle cx="12" cy="8" r="1"></circle><circle cx="16" cy="10" r="1"></circle><path d="M12 21a3 3 0 0 0 0-6 1.5 1.5 0 0 1 0-3 3 3 0 0 0 0-6"></path>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"></path>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.7a1.9 1.9 0 0 0-3 0Z"></path><path d="M12 15 9 12a14 14 0 0 1 3-6.5C13.8 3 17 2 19 2c.5 2-.5 5.2-3.5 7A14 14 0 0 1 12 15Z"></path><path d="M9 12H4s.5-2.8 2-4 5 0 5 0"></path><path d="M12 15v5s2.8-.5 4-2 0-5 0-5"></path>',
    star: '<path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 17.8 6.6 19.6l1-6L3.3 9.4l6-.9Z"></path>',
    layers: '<path d="m12 2 9 5-9 5-9-5Z"></path><path d="m3 12 9 5 9-5"></path><path d="m3 17 9 5 9-5"></path>'
};

export const FEATURE_ICON_OPTIONS = Object.keys(FEATURE_ICONS);

export function featureIconSvg(name, className = 'feature-icon-svg') {
    const inner = FEATURE_ICONS[name] || FEATURE_ICONS.sparkles;
    return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
