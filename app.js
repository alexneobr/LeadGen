const APIFY_BASE = 'https://api.apify.com/v2';
const ACTOR_ID = 'compass~crawler-google-places';
const POLL_INTERVAL_MS = 4000;

const $ = id => document.getElementById(id);

const form = $('searchForm');
const searchBtn = $('searchBtn');
const statusBar = $('statusBar');
const statusText = $('statusText');
const errorBanner = $('errorBanner');
const errorText = $('errorText');
const resultsSection = $('resultsSection');
const resultCount = $('resultCount');
const resultsBody = $('resultsBody');
const exportBtn = $('exportBtn');

let currentResults = [];

function setStatus(msg) {
  statusText.textContent = msg;
  statusBar.classList.remove('hidden');
}

function hideStatus() {
  statusBar.classList.add('hidden');
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

function token() {
  return CONFIG.APIFY_TOKEN;
}

async function startRun(location, businessType, maxResults) {
  const query = `${businessType} in ${location}`;
  const body = {
    searchStringsArray: [query],
    maxCrawledPlacesPerSearch: parseInt(maxResults, 10),
    language: 'en',
    exportPlaceUrls: false
  };

  const res = await fetch(`${APIFY_BASE}/acts/${ACTOR_ID}/runs?token=${token()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return { runId: data.data.id, datasetId: data.data.defaultDatasetId };
}

async function pollRun(runId) {
  while (true) {
    await sleep(POLL_INTERVAL_MS);
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token()}`);
    if (!res.ok) throw new Error(`Poll failed: HTTP ${res.status}`);
    const data = await res.json();
    const status = data.data.status;

    if (status === 'SUCCEEDED') return;
    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Run ended with status: ${status}`);
    }
    setStatus(`Scraping Google Maps... (${status})`);
  }
}

async function fetchResults(datasetId) {
  const res = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?token=${token()}&limit=100`);
  if (!res.ok) throw new Error(`Failed to fetch results: HTTP ${res.status}`);
  return res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function renderResults(items) {
  currentResults = items;
  resultCount.textContent = items.length;
  resultsBody.innerHTML = '';

  items.forEach((item, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="no-data">${i + 1}</td>
      <td class="cell-name">${esc(item.title || '—')}</td>
      <td>${item.categoryName ? `<span class="tag">${esc(item.categoryName)}</span>` : '<span class="no-data">—</span>'}</td>
      <td class="cell-phone">${esc(item.phone || '—')}</td>
      <td>${item.website ? `<a class="link" href="${esc(item.website)}" target="_blank" rel="noopener">${shortUrl(item.website)}</a>` : '<span class="no-data">—</span>'}</td>
      <td class="cell-address">${esc(item.address || '—')}</td>
      <td class="cell-rating">${item.totalScore ? `<span class="star">★</span> ${item.totalScore.toFixed(1)}` : '<span class="no-data">—</span>'}</td>
      <td class="no-data">${item.reviewsCount != null ? item.reviewsCount.toLocaleString() : '—'}</td>
      <td>${item.url ? `<a class="link" href="${esc(item.url)}" target="_blank" rel="noopener">View</a>` : '<span class="no-data">—</span>'}</td>
    `;
    resultsBody.appendChild(tr);
  });

  resultsSection.classList.remove('hidden');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function exportCSV() {
  if (!currentResults.length) return;

  const headers = ['#', 'Business Name', 'Category', 'Phone', 'Website', 'Address', 'Rating', 'Reviews', 'Maps URL'];
  const rows = currentResults.map((item, i) => [
    i + 1,
    item.title || '',
    item.categoryName || '',
    item.phone || '',
    item.website || '',
    item.address || '',
    item.totalScore != null ? item.totalScore.toFixed(1) : '',
    item.reviewsCount != null ? item.reviewsCount : '',
    item.url || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  hideError();
  resultsSection.classList.add('hidden');
  currentResults = [];

  const location = $('location').value.trim();
  const businessType = $('businessType').value.trim();
  const maxResults = $('maxResults').value;

  searchBtn.disabled = true;
  setStatus('Starting run...');

  try {
    const { runId, datasetId } = await startRun(location, businessType, maxResults);
    setStatus('Scraping Google Maps...');
    await pollRun(runId);
    setStatus('Fetching results...');
    const items = await fetchResults(datasetId);
    hideStatus();
    if (items.length === 0) {
      showError('No results found. Try a different location or business type.');
    } else {
      renderResults(items);
    }
  } catch (err) {
    hideStatus();
    showError(err.message || 'Unexpected error. Check your API token and try again.');
  } finally {
    searchBtn.disabled = false;
  }
});

exportBtn.addEventListener('click', exportCSV);
