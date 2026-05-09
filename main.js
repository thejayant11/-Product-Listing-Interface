
  const API = 'https://api.freeapi.app/api/v1/public/randomproducts?limit=20';
  let allProducts = [];
  let activeCategory = 'All';

  // ── Utilities ────────────────────────────────────────────
  const randDiscount = (id) => ((id * 7 + 3) % 25) + 5; // deterministic per product

  function getBadgeClass(cat) {
    if (!cat) return 'badge-default';
    const c = cat.toLowerCase();
    if (c === 'electronics')    return 'badge-electronics';
    if (c === 'jewelery')       return 'badge-jewelery';
    if (c.includes("men's"))    return 'badge-mens';
    if (c.includes("women's"))  return 'badge-womens';
    return 'badge-default';
  }

  function starsSVG(rating) {
    let html = '<div class="stars">';
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.round(rating);
      html += `<svg class="star-icon" viewBox="0 0 24 24" fill="${filled ? '#c97b2a' : 'none'}" stroke="#c97b2a" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`;
    }
    html += `<span class="rating-num">${rating.toFixed(1)}</span></div>`;
    return html;
  }

  // ── Render skeleton ───────────────────────────────────────
  function showSkeletons() {
    const grid = document.getElementById('grid');
    grid.innerHTML = Array.from({length: 8}).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-img"></div>
        <div class="skeleton-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line w70"></div>
          <div class="skeleton-line w40"></div>
        </div>
      </div>`).join('');
  }

  // ── Render products ───────────────────────────────────────
  function renderProducts(products) {
    const grid = document.getElementById('grid');
    document.getElementById('countLabel').textContent =
      products.length + ' product' + (products.length !== 1 ? 's' : '');

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="state-box" style="grid-column:1/-1">
          <div class="state-icon">🔍</div>
          <div class="state-title">No products found</div>
          <div class="state-sub">Try adjusting your search or filter</div>
        </div>`;
      return;
    }

    grid.innerHTML = products.map(p => {
      const disc = randDiscount(p.id);
      const orig = (p.price * (1 + disc / 100)).toFixed(2);
      const rating = p.rating?.rate ?? 4.2;
      return `
      <div class="card" data-id="${p.id}">
        <div class="card-img-wrap">
          <img src="${p.image}" alt="${escHtml(p.title)}" loading="lazy"
               onerror="this.style.display='none'">
          <span class="badge ${getBadgeClass(p.category)} badge-pos">${escHtml(p.category)}</span>
          <span class="discount-tag">-${disc}%</span>
        </div>
        <div class="card-body">
          <p class="card-title">${escHtml(p.title)}</p>
          ${starsSVG(rating)}
          <div class="price-row">
            <span class="price-now">$${p.price.toFixed(2)}</span>
            <span class="price-old">$${orig}</span>
          </div>
          <div class="card-actions">
            <button class="btn-cart" onclick="event.stopPropagation()">Add to cart</button>
            <button class="btn-wish" onclick="event.stopPropagation()" aria-label="Wishlist">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8a7c6e" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    // click → open modal
    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        openModal(allProducts.find(p => p.id === id));
      });
    });
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Filter & sort ─────────────────────────────────────────
  function applyFilters() {
    const q = document.getElementById('searchInput').value.trim().toLowerCase();
    const sort = document.getElementById('sortSelect').value;

    let list = allProducts.filter(p => {
      const matchCat = activeCategory === 'All' ||
        p.category?.toLowerCase() === activeCategory.toLowerCase();
      const matchQ = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    if (sort === 'price-asc')  list.sort((a,b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a,b) => b.price - a.price);
    if (sort === 'rating')     list.sort((a,b) => (b.rating?.rate||0) - (a.rating?.rate||0));

    renderProducts(list);
  }

  // ── Modal ─────────────────────────────────────────────────
  function openModal(p) {
    if (!p) return;
    const disc = randDiscount(p.id);
    const orig = (p.price * (1 + disc / 100)).toFixed(2);
    const rating = p.rating?.rate ?? 4.2;

    document.getElementById('modalBody').innerHTML = `
      <div class="modal-img-wrap">
        <img src="${p.image}" alt="${escHtml(p.title)}">
      </div>
      <div class="modal-info">
        <span class="badge ${getBadgeClass(p.category)}">${escHtml(p.category)}</span>
        <h2 class="modal-title">${escHtml(p.title)}</h2>
        ${starsSVG(rating)}
        <p class="modal-reviews">${p.rating?.count ?? 0} reviews</p>
        <p class="modal-desc">${escHtml(p.description)}</p>
        <div class="modal-price-row">
          <span class="modal-price-now">$${p.price.toFixed(2)}</span>
          <span class="modal-price-old">$${orig}</span>
          <span class="save-tag">Save ${disc}%</span>
        </div>
        <div class="modal-actions">
          <button class="btn-primary">Add to cart</button>
          <button class="btn-secondary">Buy now</button>
        </div>
      </div>`;
    document.getElementById('modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('open');
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });

  // ── Category buttons ──────────────────────────────────────
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      applyFilters();
    });
  });

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('sortSelect').addEventListener('change', applyFilters);

  // ── Fetch ─────────────────────────────────────────────────
  showSkeletons();
  fetch(API)
    .then(r => r.json())
    .then(data => {
      allProducts = data?.data?.data || data?.data || [];
      document.getElementById('countLabel').textContent = '';
      applyFilters();
    })
    .catch(() => {
      document.getElementById('grid').innerHTML = `
        <div class="state-box error-box" style="grid-column:1/-1">
          <div class="state-icon">⚠️</div>
          <div class="state-title">Failed to load products</div>
          <div class="state-sub">Check your connection and refresh the page</div>
        </div>`;
    });
