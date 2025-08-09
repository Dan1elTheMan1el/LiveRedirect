// Polyfill
const browser = (typeof self !== 'undefined' && self.browser) ? self.browser : (typeof chrome !== 'undefined' ? chrome : undefined);

console.log('[LiveRedirector] Content script loaded:', location.href);

async function getUrlMatches() {
  try { const res = await browser.runtime.sendMessage({ action: 'getUrlMatches' }); return (res && Array.isArray(res.urls)) ? res.urls : []; } catch { return []; }
}

function matches(url, patterns) {
  const uStr = url.toLowerCase();
  let uObj; try { uObj = new URL(uStr); } catch { return false; }
  const uHost = uObj.hostname;
  const uPath = uObj.pathname;

  for (let raw of patterns) {
    if (!raw) continue;
    let p = String(raw).trim().toLowerCase();

    // 1) Exact full URL
    if (uStr === p) return true;

    // 2) Prefix match on full URL (when pattern includes scheme)
    if (p.includes('://') && uStr.startsWith(p)) return true;

    // 3) Scheme-agnostic URL pattern like *://host/path or //host/path
    let schemeAgnostic = false;
    if (p.startsWith('*://')) { p = p.slice(4); schemeAgnostic = true; }
    if (p.startsWith('//')) { p = p.slice(2); schemeAgnostic = true; }

    // 4) Host + optional path (e.g., "discord.com" or "discord.com/invite")
    const slashIdx = p.indexOf('/');
    const pHost = slashIdx === -1 ? p : p.slice(0, slashIdx);
    const pPath = slashIdx === -1 ? '' : p.slice(slashIdx); // includes leading '/'

    // Host match: exact or subdomain
    const hostMatches = (uHost === pHost) || uHost.endsWith('.' + pHost);

    if (hostMatches) {
      if (!pPath) return true; // host-only pattern matches all paths
      // Normalize trailing slashes for path startsWith check
      const normUPath = uPath.endsWith('/') ? uPath : uPath + '/';
      const normPPath = pPath.endsWith('/') ? pPath : pPath + '/';
      if (normUPath.startsWith(normPPath)) return true;
    }
  }
  return false;
}

function base64(str){ try { return btoa(unescape(encodeURIComponent(str))); } catch { return btoa(str); } }

(function run(){
  getUrlMatches().then(patterns => {
    if (!patterns.length) { console.log('[LiveRedirector] No URL match patterns configured'); return; }
    const url = location.href;
    if (!matches(url, patterns)) { console.log('[LiveRedirector] No match for', url); return; }
    const encoded = base64(url);
    const target = `livecontainer://open-web-page?url=${encoded}`;
    console.log('[LiveRedirector] Redirect ->', target);
    location.href = target;
  });
})();
