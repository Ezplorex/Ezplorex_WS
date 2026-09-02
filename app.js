function setup() {
  const b = document.querySelector('.menu-button');
  const n = document.querySelector('nav');
  if (b) b.onclick = () => {
    n.classList.toggle('open');
    b.setAttribute('aria-expanded', n.classList.contains('open'));
  };
  document.querySelectorAll('#year').forEach(x => x.textContent = new Date().getFullYear());
}

function card(p) {
  return `<article class="card"><div class="card-meta">${p.category.toUpperCase()}</div><h3>${p.title}</h3><p>${p.excerpt}</p><a href="article.html?post=${encodeURIComponent(p.slug)}" class="card-link">Read the learning →</a></article>`;
}

function home() {
  const t = document.getElementById('latest-posts');
  if (t) t.innerHTML = POSTS.slice(0, 3).map(card).join('');
  const c = document.getElementById('home-categories');
  if (c) c.innerHTML = CATEGORIES.map(x => `<a class="category-card" href="learnings.html?category=${encodeURIComponent(x)}"><span>${x}</span><span>→</span></a>`).join('');
}

function learnings() {
  const t = document.getElementById('all-posts');
  const f = document.getElementById('filters');
  if (!t || !f) return;
  const cats = ['All', ...CATEGORIES];
  f.innerHTML = cats.map((c, i) => `<button class="filter ${i ? '' : 'active'}" data-c="${c}">${c}</button>`).join('');

  const params = new URLSearchParams(location.search);
  const requested = params.get('category');
  const initial = CATEGORIES.includes(requested) ? requested : 'All';

  function render(category) {
    document.querySelectorAll('.filter').forEach(x => x.classList.toggle('active', x.dataset.c === category));
    const shown = category === 'All' ? POSTS : POSTS.filter(p => p.category === category);
    t.innerHTML = shown.length ? shown.map(card).join('') : `<div class="empty-state"><h3>More learnings coming soon.</h3><p>This category is part of Ezplorex. New guides will be added as the knowledge library grows.</p></div>`;
  }

  render(initial);
  f.onclick = e => {
    if (!e.target.matches('.filter')) return;
    render(e.target.dataset.c);
    const url = new URL(location.href);
    if (e.target.dataset.c === 'All') url.searchParams.delete('category');
    else url.searchParams.set('category', e.target.dataset.c);
    history.replaceState({}, '', url);
  };
}

function article() {
  const t = document.getElementById('article');
  if (!t) return;
  const slug = new URLSearchParams(location.search).get('post');
  const p = POSTS.find(x => x.slug === slug);
  if (!p) {
    t.innerHTML = '<h1>Learning not found</h1><a class="button primary" href="learnings.html">Back to Learnings</a>';
    return;
  }
  document.title = p.title + ' | Ezplorex';
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', p.excerpt);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `${location.origin}${location.pathname}?post=${encodeURIComponent(p.slug)}`);
  t.innerHTML = `<div class="article-header"><p class="eyebrow">${p.category}</p><h1 class="article-title">${p.title}</h1><p class="article-summary">${p.excerpt}</p><p class="article-meta">EZPLOREX LEARNINGS · ${p.date}</p></div><div class="article-body">${p.content}</div><p class="article-footer-link"><a class="button secondary" href="learnings.html">← All Learnings</a></p>`;
}

document.addEventListener('DOMContentLoaded', () => { setup(); home(); learnings(); article(); });
