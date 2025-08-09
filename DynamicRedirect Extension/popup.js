// Polyfill
const browser = (typeof self !== 'undefined' && self.browser) ? self.browser : (typeof chrome !== 'undefined' ? chrome : undefined);

const $ = (id) => document.getElementById(id);

async function loadMappings() {
  return await new Promise(res => {
    browser.storage?.local?.get(['urlMatches'], out => {
      res(Array.isArray(out?.urlMatches) ? out.urlMatches : []);
    });
  });
}

async function saveMappings(list) {
  return await new Promise(res => {
    browser.storage?.local?.set({ urlMatches: list, lastUpdated: Date.now() }, res);
  });
}

async function notifyBackground(list) {
  try { await new Promise(r => browser.runtime.sendMessage({ action: 'setUrlMatches', list }, r)); } catch {}
}

function render(list) {
  const ul = $('list'); ul.innerHTML = '';
  for (const item of list) {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<div class="domain">${item}</div>`;
    const del = document.createElement('button'); del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      const next = list.filter(x => x !== item);
      await saveMappings(next); await notifyBackground(next); render(next); setStatus('Deleted');
    });
    const actions = document.createElement('div'); actions.className='actions'; actions.appendChild(del);
    li.appendChild(left); li.appendChild(actions); ul.appendChild(li);
  }
}

function setStatus(msg, ok=true) { const el = $('status'); if (el){ el.textContent = msg; el.className = ok ? 'status-ok' : 'status-err'; } }

async function addMapping() {
  const value = $('domain').value.trim();
  if (!value) { setStatus('Enter a URL or domain'); return; }
  const list = await loadMappings();
  if (list.includes(value)) { setStatus('Already exists'); return; }
  const next = [...list, value];
  await saveMappings(next); await notifyBackground(next); render(next);
  $('domain').value = ''; setStatus('Added');
}

async function readClipboardText() {
  try { return (await navigator.clipboard.readText()) || ''; } catch (e) { console.log('[Popup] clipboard read failed', e); return ''; }
}

function parseList(text) {
  // Accept JSON {urls:[...]} or JSON array ["..."] or newline-separated
  try { const data = JSON.parse(text); if (Array.isArray(data)) return data; if (data && Array.isArray(data.urls)) return data.urls; } catch {}
  return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
}

async function importFromClipboard() {
  const text = await readClipboardText(); if (!text) { setStatus('Clipboard empty'); return; }
  const list = await loadMappings();
  const imported = parseList(text);
  if (!imported.length) { setStatus('No entries found'); return; }
  const set = new Set([...list, ...imported]);
  const next = Array.from(set);
  await saveMappings(next); await notifyBackground(next); render(next);
  setStatus(`Imported ${imported.length} item(s)`);
}

async function exportToClipboard() {
  const list = await loadMappings();
  const payload = { urls: list, count: list.length, timestamp: Date.now() };
  try { await navigator.clipboard.writeText(JSON.stringify(payload)); setStatus(`Exported ${list.length} item(s)`);} catch(e){ setStatus('Clipboard write failed'); }
}

async function clearAll() {
  await saveMappings([]); await notifyBackground([]); render([]); setStatus('Cleared');
}

$('add')?.addEventListener('click', addMapping);
$('import')?.addEventListener('click', importFromClipboard);
$('export')?.addEventListener('click', exportToClipboard);
$('clearAll')?.addEventListener('click', clearAll);

(async function init(){ const list = await loadMappings(); render(list); })();
