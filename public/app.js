// DOM Elements
const urlInput = document.getElementById('urlInput');
const shortenBtn = document.getElementById('shortenBtn');
const resultContainer = document.getElementById('resultContainer');
const resultLink = document.getElementById('resultLink');
const resultOriginal = document.getElementById('resultOriginal');
const errorContainer = document.getElementById('errorContainer');
const errorText = document.getElementById('errorText');
const copyBtn = document.getElementById('copyBtn');

// Stats Elements
const statsInput = document.getElementById('statsInput');
const statsBtn = document.getElementById('statsBtn');
const statsResult = document.getElementById('statsResult');

// State
let recentLinks = JSON.parse(localStorage.getItem('snaplink_recent')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderRecentLinks();
  
  // Enter key support
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') shortenUrl();
  });
  
  statsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') lookupStats();
  });
});

// Shorten URL
async function shortenUrl() {
  const url = urlInput.value.trim();
  if (!url) {
    showError('Please enter a URL');
    return;
  }

  // Basic client validation
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    showError('Please enter a valid URL (e.g. https://google.com)');
    return;
  }

  // Ensure http protocol
  const finalUrl = url.startsWith('http') ? url : `https://${url}`;

  // UI Loading State
  hideError();
  resultContainer.style.display = 'none';
  shortenBtn.classList.add('loading');
  shortenBtn.disabled = true;

  try {
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: finalUrl })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to shorten URL');
    }

    // Success UI
    resultLink.href = data.short_url;
    resultLink.textContent = data.short_url;
    resultOriginal.textContent = finalUrl;
    resultContainer.style.display = 'block';
    
    // Save to recents
    saveRecentLink({
      code: data.code,
      shortUrl: data.short_url,
      originalUrl: finalUrl
    });

  } catch (err) {
    showError(err.message);
  } finally {
    shortenBtn.classList.remove('loading');
    shortenBtn.disabled = false;
    // Reset copy button
    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>';
    copyBtn.classList.remove('copied');
  }
}

// Lookup Stats
async function lookupStats() {
  let code = statsInput.value.trim();
  if (!code) return;

  // Extract code if user pasted full URL
  if (code.includes('/')) {
    code = code.split('/').pop();
  }

  statsBtn.classList.add('loading');
  statsBtn.disabled = true;
  statsResult.style.display = 'none';

  try {
    const response = await fetch(`/api/stats/${code}`);
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'Stats not found');
      return;
    }

    // Update UI
    document.getElementById('statCode').textContent = data.data.code;
    document.getElementById('statClicks').textContent = data.data.clicks.toLocaleString();
    
    const urlEl = document.getElementById('statUrl');
    urlEl.textContent = data.data.long_url;
    urlEl.href = data.data.long_url;

    const date = new Date(data.data.created_at);
    document.getElementById('statDate').textContent = date.toLocaleDateString(undefined, { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });

    statsResult.style.display = 'block';

  } catch (err) {
    alert('Network error while fetching stats');
  } finally {
    statsBtn.classList.remove('loading');
    statsBtn.disabled = false;
  }
}

// Utilities
function showError(msg) {
  errorText.textContent = msg;
  errorContainer.style.display = 'block';
  resultContainer.style.display = 'none';
}

function hideError() {
  errorContainer.style.display = 'none';
}

async function copyUrl() {
  const url = resultLink.textContent;
  try {
    await navigator.clipboard.writeText(url);
    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Copied!</span>';
    copyBtn.classList.add('copied');
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

// Local Storage for Recent Links
function saveRecentLink(linkData) {
  // Check if already exists, remove it if so (to move to top)
  recentLinks = recentLinks.filter(l => l.code !== linkData.code);
  
  // Add to top
  recentLinks.unshift(linkData);
  
  // Keep only last 5
  if (recentLinks.length > 5) recentLinks.pop();
  
  localStorage.setItem('snaplink_recent', JSON.stringify(recentLinks));
  renderRecentLinks();
}

function renderRecentLinks() {
  const section = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  
  if (recentLinks.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  list.innerHTML = '';
  
  recentLinks.forEach(link => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <div>
        <a href="${link.shortUrl}" target="_blank" class="recent-item-url">${window.location.host}/${link.code}</a>
        <div class="recent-item-original">${link.originalUrl}</div>
      </div>
      <div class="recent-item-clicks" onclick="document.getElementById('statsInput').value='${link.code}'; lookupStats(); location.hash='#stats-section'" style="cursor:pointer" title="View Stats">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Stats
      </div>
    `;
    list.appendChild(item);
  });
}
