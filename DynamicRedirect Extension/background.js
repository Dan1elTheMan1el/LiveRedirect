// Polyfill for browser API
const browser = (typeof self !== 'undefined' && self.browser) ? self.browser : (typeof chrome !== 'undefined' ? chrome : undefined);

console.log("=== BACKGROUND SCRIPT STARTING ===", new Date().toString());

// In‑memory cache
let currentUrlMatches = [];

let autoRedirectEnabled = true;

function loadAutoRedirect() {
  browser?.storage?.local?.get(["autoRedirect"], res => {
    autoRedirectEnabled = res?.autoRedirect !== false;
  });
}

loadAutoRedirect();

// Persist to browser storage (best effort)
function persistUrlMatches() {
  browser?.storage?.local?.set({ urlMatches: currentUrlMatches, lastUpdated: Date.now() });
}

// Attempt to read cached matches from storage first
function loadCachedUrlMatches() {
  browser?.storage?.local?.get(["urlMatches"], res => {
    if (Array.isArray(res?.urlMatches)) currentUrlMatches = res.urlMatches;
  });
}

loadCachedUrlMatches();

// Message handler for content scripts + popup
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return false;
  if (msg.action === 'getUrlMatches') { sendResponse({ urls: currentUrlMatches }); return true; }
  if (msg.action === 'getAutoRedirect') { sendResponse({ enabled: autoRedirectEnabled }); return true; }
  if (msg.action === 'setUrlMatches' && Array.isArray(msg.list)) {
    currentUrlMatches = msg.list;
    persistUrlMatches();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.action === 'setAutoRedirect' && typeof msg.value === 'boolean') {
    autoRedirectEnabled = msg.value;
    browser?.storage?.local?.set({ autoRedirect: autoRedirectEnabled });
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

console.log("=== BACKGROUND SCRIPT READY ===");