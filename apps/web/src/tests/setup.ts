import '@testing-library/jest-dom/vitest';

// JSDOM mock for scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function () {};

