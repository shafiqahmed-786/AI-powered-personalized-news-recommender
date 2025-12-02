// app/static/app.js — minimal UI logic (no libraries)
const articlesList = document.getElementById('articlesList');
const recommendPanel = document.getElementById('recommendPanel');
const recommendList = document.getElementById('recommendList');
const panelTitle = document.getElementById('panelTitle');
const countText = document.getElementById('countText');
const searchInput = document.getElementById('searchInput');

let articles = [];

// helper: create a bootstrap card for an article
function buildArticleCard(a, idx) {
  const col = document.createElement('div');
  col.className = 'col-12 article-item';

  const card = document.createElement('div');
  card.className = 'p-3 bg-white rounded article-card d-flex justify-content-between align-items-start';

  const left = document.createElement('div');
  left.style.flex = '1';
  const title = document.createElement('div');
  title.className = 'article-title';
  title.textContent = a.title || 'Untitled';
  const meta = document.createElement('div');
  meta.className = 'article-meta mt-1';
  meta.textContent = `${a.source || ''} • ${a.link || ''}`;

  left.appendChild(title);
  left.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'ms-3 text-end';

  const recBtn = document.createElement('button');
  recBtn.className = 'btn btn-sm btn-outline-primary mb-2';
  recBtn.textContent = 'Similar';
  recBtn.onclick = () => getRecommendForIndex(idx);

  const likeBtn = document.createElement('button');
  likeBtn.className = 'btn btn-sm btn-like btn-outline-success ms-2';
  likeBtn.textContent = 'Like';
  likeBtn.onclick = () => sendFeedback(idx, 'like');

  actions.appendChild(recBtn);
  actions.appendChild(likeBtn);

  card.appendChild(left);
  card.appendChild(actions);
  col.appendChild(card);
  return col;
}

function renderArticles(list) {
  articlesList.innerHTML = '';
  list.forEach((a, i) => {
    articlesList.appendChild(buildArticleCard(a, i));
  });
  countText.textContent = `${list.length} articles loaded`;
}

// fetch articles from server
async function loadArticles() {
  try {
    // We don't have an /api/articles route in your Flask yet, so fetch metadata file
    const res = await fetch('/static/../artifacts/articles_meta.jsonl');
    // fallback to fetch via /api if you implement it later
    if (!res.ok) {
      // try an endpoint /api/articles
      const api = await fetch('/api/articles');
      if (api.ok) {
        articles = await api.json();
      } else {
        console.error('Unable to load articles');
      }
    } else {
      const text = await res.text();
      // parse jsonl
      articles = text.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    }
    renderArticles(articles);
  } catch (e) {
    console.error(e);
    articlesList.innerHTML = '<div class="text-danger">Failed to load articles.</div>';
  }
}

async function getRecommendForIndex(idx) {
  try {
    panelTitle.textContent = `Recommendations for: ${articles[idx].title}`;
    const body = { article_idx: idx, top_k: 6 };
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    showRecommendations(data.recommendations || []);
  } catch (e) {
    console.error(e);
  }
}

function showRecommendations(items) {
  recommendList.innerHTML = '';
  recommendPanel.classList.remove('d-none');
  if (!items.length) {
    recommendList.innerHTML = '<div class="text-muted p-3">No recommendations.</div>';
    return;
  }
  items.forEach((it) => {
    const col = document.createElement('div');
    col.className = 'col-12';
    const card = document.createElement('div');
    card.className = 'p-3 bg-white rounded article-card d-flex justify-content-between align-items-start';

    const left = document.createElement('div');
    left.style.flex = '1';
    const title = document.createElement('div');
    title.className = 'article-title';
    title.textContent = it.title || it['title'] || 'No title';
    const meta = document.createElement('div');
    meta.className = 'article-meta mt-1';
    meta.textContent = it.source || it.url || '';

    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'ms-3 text-end';
    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn btn-sm btn-like btn-outline-success ms-2';
    likeBtn.textContent = 'Like';
    likeBtn.onclick = () => sendFeedback(it._idx ?? -1, 'like');

    actions.appendChild(likeBtn);
    card.appendChild(left);
    card.appendChild(actions);
    col.appendChild(card);
    recommendList.appendChild(col);
  });
}

async function sendFeedback(article_idx, action) {
  try {
    const payload = { user: 'demo_user', article_idx, action };
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'stored') {
      alert('Thanks — feedback saved!');
    } else {
      alert('Feedback not saved (server error).');
    }
  } catch (e) {
    console.error(e);
    alert('Failed to send feedback (see console).');
  }
}

// quick search filter
searchInput.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter') {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return loadArticles();
    const filtered = articles.filter(a => (a.title + ' ' + (a.summary || '')).toLowerCase().includes(q));
    renderArticles(filtered);
  }
});

document.getElementById('refreshBtn').onclick = loadArticles;
document.getElementById('demoBtn').onclick = () => getRecommendForIndex(0);

// init
loadArticles();
