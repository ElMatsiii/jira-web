import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && !window.fetch) {
  window.fetch = (globalThis.fetch || jest.fn()) as any;
}
if (typeof global.fetch === 'undefined') {
  global.fetch = (globalThis.fetch || jest.fn()) as any;
}
