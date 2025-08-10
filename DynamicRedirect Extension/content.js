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

  Promise.all([
    getUrlMatches(),
    browser.runtime.sendMessage({ action: 'getAutoRedirect' })
  ]).then(([patterns, auto]) => {
    if (!patterns.length) { console.log('[LiveRedirector] No URL match patterns configured'); return; }
    const url = location.href;
    if (!matches(url, patterns)) { console.log('[LiveRedirector] No match for', url); return; }
    const encoded = base64(url);
    const target = `livecontainer://open-web-page?url=${encoded}`;

    // Create floating, draggable button (iOS-focused)
    const btn = document.createElement('button');
    btn.id = 'livecontainer-open-btn';
    btn.style.position = 'fixed'; // don't scroll with the page
    btn.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 24px)';
    btn.style.right = '16px';
    btn.style.zIndex = '2147483647';
    btn.style.padding = '8px 16px 8px 8px';
    btn.style.background = '#007aff';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '8px';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    btn.style.cursor = 'grab';
    btn.style.fontSize = '16px';
    btn.style.userSelect = 'none';
    btn.style.webkitUserSelect = 'none';
    btn.style.webkitTouchCallout = 'none';
    btn.style.touchAction = 'none';
    btn.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';

  // Add logo image
  const img = document.createElement('img');
  img.src = 'https://github.com/LiveContainer/LiveContainer/raw/main/screenshots/AppIcon1024.png';
  img.alt = 'LiveContainer Logo';
  img.style.width = '28px';
  img.style.height = '28px';
  img.style.marginRight = '8px';
  img.style.borderRadius = '6px';
  btn.appendChild(img);

  // Add text
  const span = document.createElement('span');
  span.innerText = 'Open';
  btn.appendChild(span);

  // iOS touch-only drag/tap logic
  let isDragging = false, moved = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    const TAP_THRESHOLD_PX = 6;

    btn.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const rect = btn.getBoundingClientRect();
      startX = t.clientX;
      startY = t.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      isDragging = true;
      moved = false;
  // Switch to left/top while keeping fixed positioning
      btn.style.left = rect.left + 'px';
      btn.style.top = rect.top + 'px';
      btn.style.right = '';
      btn.style.bottom = '';
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX) moved = true;
      btn.style.left = (startLeft + dx) + 'px';
      btn.style.top = (startTop + dy) + 'px';
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      // Treat as tap if not moved significantly
      if (!moved) {
        // Use the CURRENT URL at tap time to support SPA navigation (e.g., YouTube)
        const current = location.href;
        const enc = base64(current);
        const t = `livecontainer://open-web-page?url=${enc}`;
        window.location.href = t;
      }
    });

  // Optional click handler (desktop or iPad with mouse)
  btn.addEventListener('click', function(e) {
    const current = location.href;
    const enc = base64(current);
    const t = `livecontainer://open-web-page?url=${enc}`;
    window.location.href = t;
  });
    document.body.appendChild(btn);

    // Only redirect if auto redirect is enabled
    if (auto && auto.enabled !== false) {
      console.log('[LiveRedirector] Redirect ->', target);
      window.location.href = target;
    }
  });
})();
