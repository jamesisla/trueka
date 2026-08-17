/**
 * Trueka — Plataforma de Intercambio & Trueque Client Logic
 * Vanilla JavaScript (Zero External Libraries, Ultra-lightweight)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let productsState = [];
  let cartState = loadCartFromStorage();
  let filterMode = 'offered'; // 'offered' | 'seeking'
  let currentCategory = 'todos';
  let currentStatus = 'disponible';
  let currentSort = 'newest';
  let searchQuery = '';
  
  // Chilean Auto-Assigned Handle Generator (Zero-friction user onboarding)
  function getOrCreateUserHandle() {
    let handle = localStorage.getItem('trueka_user_handle');
    if (!handle || handle === '@mi_usuario' || handle === '@usuario') {
      const prefixes = ['truekero', 'truekera', 'trueke', 'permuta', 'vintage', 'retro', 'garaje', 'coleccion', 'feria'];
      const places = ['stgo', 'providencia', 'nunoa', 'lascondes', 'chile', 'alameda', 'tobalaba', 'andes', 'quilpue', 'valpo'];
      const num = Math.floor(10 + Math.random() * 90);
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      const l = places[Math.floor(Math.random() * places.length)];
      handle = `@${p}_${l}_${num}`;
      localStorage.setItem('trueka_user_handle', handle);
    }
    return handle;
  }

  let currentUserHandle = getOrCreateUserHandle();
  let savedWhatsApp = localStorage.getItem('trueka_user_whatsapp') || '';

  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const statusSelect = document.getElementById('statusSelect');
  const sortSelect = document.getElementById('sortSelect');
  const userHandleBtn = document.getElementById('userHandleBtn');
  const currentUserNameLabel = document.getElementById('currentUserNameLabel');

  // Filter Mode Tabs
  const tabOfferedMode = document.getElementById('tabOfferedMode');
  const tabSeekingMode = document.getElementById('tabSeekingMode');
  const filterModeHint = document.getElementById('filterModeHint');
  const categoryPillsContainer = document.getElementById('categoryPills');

  // Theme & Drawer
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = themeToggleBtn.querySelector('.theme-icon');
  const themeLabel = themeToggleBtn.querySelector('.theme-label');
  const cartToggleBtn = document.getElementById('cartToggleBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartDrawer = document.getElementById('cartDrawer');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutForm = document.getElementById('checkoutForm');

  // User Profile Modal Elements
  const userModal = document.getElementById('userModal');
  const closeUserModal = document.getElementById('closeUserModal');
  const cancelUserModalBtn = document.getElementById('cancelUserModalBtn');
  const userProfileForm = document.getElementById('userProfileForm');
  const userModalHandleInput = document.getElementById('userModalHandleInput');
  const userStatsPublished = document.getElementById('userStatsPublished');
  const userStatsSaved = document.getElementById('userStatsSaved');
  const userModalThemeToggle = document.getElementById('userModalThemeToggle');
  const userModalThemeIcon = document.getElementById('userModalThemeIcon');
  const userModalThemeText = document.getElementById('userModalThemeText');

  // Meta theme tag
  const metaThemeColor = document.getElementById('metaThemeColor');

  // Modals - Detail
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const modalProposeTradeBtn = document.getElementById('modalProposeTradeBtn');
  const modalDirectWaBtn = document.getElementById('modalDirectWaBtn');
  const modalSaveTradeBtn = document.getElementById('modalSaveTradeBtn');
  const modalShareBtn = document.getElementById('modalShareBtn');
  let selectedModalProductId = null;

  // Modals - Publish
  const sellItemBtn = document.getElementById('sellItemBtn');
  const sellModal = document.getElementById('sellModal');
  const closeSellModal = document.getElementById('closeSellModal');
  const cancelSellBtn = document.getElementById('cancelSellBtn');
  const sellForm = document.getElementById('sellForm');
  const sellFileInput = document.getElementById('sellFileInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const imagePreviewBox = document.getElementById('imagePreviewBox');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const sellImageUrl = document.getElementById('sellImageUrl');
  const sellSellerName = document.getElementById('sellSellerName');

  // Modals - Propose Trade
  const proposeModal = document.getElementById('proposeModal');
  const closeProposeModal = document.getElementById('closeProposeModal');
  const cancelProposeBtn = document.getElementById('cancelProposeBtn');
  const proposeForm = document.getElementById('proposeForm');
  const proposeFileInput = document.getElementById('proposeFileInput');
  const proposeDropzonePrompt = document.getElementById('proposeDropzonePrompt');
  const proposeImagePreviewBox = document.getElementById('proposeImagePreviewBox');
  const proposeImagePreviewImg = document.getElementById('proposeImagePreviewImg');
  const removeProposeImageBtn = document.getElementById('removeProposeImageBtn');
  const proposeImageUrl = document.getElementById('proposeImageUrl');
  const proposerNameInput = document.getElementById('proposerName');

  // Initialize
  initUserHandle();
  initTheme();
  initCartUI();
  initImageHandlers();
  initPresetButtons();
  fetchSiteConfig();
  fetchProducts();

  // Dynamic Site Config & Fixed Texts (CMS)
  async function fetchSiteConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) {
        applySiteConfig(data.data);
      }
    } catch (err) {
      console.warn('Config fetch skipped:', err);
    }
  }

  function applySiteConfig(cfg) {
    // Top Ribbon
    const ribbonContainer = document.getElementById('topRibbonContainer');
    const ribbonText = document.getElementById('topRibbonText');
    const ribbonTag = document.getElementById('topRibbonTag');
    if (ribbonContainer) {
      if (cfg.topRibbonShow === false) {
        ribbonContainer.style.display = 'none';
      } else {
        ribbonContainer.style.display = '';
      }
    }
    if (ribbonText && cfg.topRibbonText) ribbonText.innerHTML = formatRibbonHtml(cfg.topRibbonText);
    if (ribbonTag && cfg.topRibbonTag) ribbonTag.textContent = cfg.topRibbonTag;

    // Brand Tagline & Search
    const brandTagline = document.getElementById('brandTagline');
    if (brandTagline && cfg.brandTagline) brandTagline.textContent = cfg.brandTagline;
    if (searchInput && cfg.searchPlaceholder) searchInput.placeholder = cfg.searchPlaceholder;

    // Hero Section
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const heroStep1Text = document.getElementById('heroStep1Text');
    const heroStep2Text = document.getElementById('heroStep2Text');
    const heroStep3Text = document.getElementById('heroStep3Text');

    if (heroTitle && cfg.heroTitle) heroTitle.textContent = cfg.heroTitle;
    if (heroSubtitle && cfg.heroSubtitle) heroSubtitle.textContent = cfg.heroSubtitle;

    if (heroStep1Text && cfg.heroStep1) heroStep1Text.innerHTML = formatStepHtml(cfg.heroStep1);
    if (heroStep2Text && cfg.heroStep2) heroStep2Text.innerHTML = formatStepHtml(cfg.heroStep2);
    if (heroStep3Text && cfg.heroStep3) heroStep3Text.innerHTML = formatStepHtml(cfg.heroStep3);

    // Footer
    const footerText = document.getElementById('footerText');
    const footerCopyright = document.getElementById('footerCopyright');
    if (footerText && cfg.footerText) footerText.textContent = cfg.footerText;
    if (footerCopyright && cfg.footerCopyright) footerCopyright.textContent = cfg.footerCopyright;
  }

  function formatRibbonHtml(text) {
    if (!text) return '';
    let escaped = escapeHtml(text);
    escaped = escaped.replace(/\btrueka\b/gi, '<strong>trueka</strong>');
    return escaped;
  }

  function formatStepHtml(text) {
    if (!text) return '';
    const colonIdx = text.indexOf(':');
    if (colonIdx !== -1) {
      const boldPart = text.substring(0, colonIdx + 1);
      const rest = text.substring(colonIdx + 1);
      return `<strong>${escapeHtml(boldPart)}</strong>${escapeHtml(rest)}`;
    }
    return escapeHtml(text);
  }

  // User Handle & Profile Management
  function initUserHandle() {
    updateUserHandleDisplay(currentUserHandle);

    if (userHandleBtn) userHandleBtn.addEventListener('click', openUserModal);

    if (closeUserModal) closeUserModal.addEventListener('click', () => { userModal.hidden = true; });
    if (cancelUserModalBtn) cancelUserModalBtn.addEventListener('click', () => { userModal.hidden = true; });
    if (userModal) {
      userModal.addEventListener('click', (e) => {
        if (e.target === userModal) userModal.hidden = true;
      });
    }

    if (userProfileForm) {
      userProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const raw = userModalHandleInput.value.trim();
        if (raw) {
          currentUserHandle = raw.startsWith('@') ? raw : '@' + raw;
          localStorage.setItem('trueka_user_handle', currentUserHandle);
          updateUserHandleDisplay(currentUserHandle);
          userModal.hidden = true;
          showToast(`👤 Perfil actualizado: ${currentUserHandle}`, 'success');
        }
      });
    }

    if (userModalThemeToggle) {
      userModalThemeToggle.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      });
    }
  }

  function updateUserHandleDisplay(handle) {
    if (currentUserNameLabel) currentUserNameLabel.textContent = handle;
    if (sellSellerName) sellSellerName.value = handle;
    if (proposerNameInput) proposerNameInput.value = handle;
  }

  function openUserModal() {
    if (!userModal) return;
    if (userModalHandleInput) userModalHandleInput.value = currentUserHandle;
    
    // Calculate stats
    const pubCount = productsState.filter(p => (p.sellerName || '').toLowerCase() === currentUserHandle.toLowerCase()).length;
    if (userStatsPublished) userStatsPublished.textContent = pubCount;
    if (userStatsSaved) userStatsSaved.textContent = cartState.length;

    updateUserModalThemeBtn();
    userModal.hidden = false;
  }

  function updateUserModalThemeBtn() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (userModalThemeIcon) userModalThemeIcon.textContent = isDark ? '🌙' : '☀️';
    if (userModalThemeText) userModalThemeText.textContent = isDark ? 'Modo Minimal Noir' : 'Modo Canvas';
  }

  // Search Input with Debounce & Global Search Scope
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.hidden = !searchQuery;

    // When typing a search query, reset active category to 'todos' to search across entire catalog
    if (searchQuery.trim() && currentCategory !== 'todos') {
      currentCategory = 'todos';
      categoryPillsContainer.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
      const defaultPill = categoryPillsContainer.querySelector('.pill-btn[data-category="todos"]');
      if (defaultPill) defaultPill.classList.add('active');
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchProducts(), 200);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.hidden = true;
    fetchProducts();
  });

  // Filter Mode Tabs: "Artículos Ofrecidos" vs "¿Qué buscan los usuarios?"
  tabOfferedMode.addEventListener('click', () => {
    if (filterMode === 'offered') return;
    filterMode = 'offered';
    tabOfferedMode.classList.add('active');
    tabSeekingMode.classList.remove('active');
    filterModeHint.textContent = 'Explora los artículos disponibles para trueke en cada categoría.';
    fetchProducts();
  });

  tabSeekingMode.addEventListener('click', () => {
    if (filterMode === 'seeking') return;
    filterMode = 'seeking';
    tabSeekingMode.classList.add('active');
    tabOfferedMode.classList.remove('active');
    filterModeHint.textContent = 'Muestra qué usuarios están buscando artículos en cada categoría para intercambiar.';
    fetchProducts();
  });

  // Category Pills
  categoryPillsContainer.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-btn');
    if (!pill) return;

    categoryPillsContainer.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentCategory = pill.dataset.category;
    fetchProducts();
  });

  statusSelect.addEventListener('change', (e) => {
    currentStatus = e.target.value;
    fetchProducts();
  });

  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    fetchProducts();
  });

  resetFiltersBtn.addEventListener('click', resetAllFilters);

  function resetAllFilters() {
    searchQuery = '';
    currentCategory = 'todos';
    currentStatus = 'disponible';
    currentSort = 'newest';
    filterMode = 'offered';
    searchInput.value = '';
    clearSearchBtn.hidden = true;
    statusSelect.value = 'disponible';
    sortSelect.value = 'newest';

    tabOfferedMode.classList.add('active');
    tabSeekingMode.classList.remove('active');
    filterModeHint.textContent = 'Explora los artículos disponibles para trueke en cada categoría.';

    categoryPillsContainer.querySelectorAll('.pill-btn').forEach(p => p.classList.remove('active'));
    const defaultPill = categoryPillsContainer.querySelector('.pill-btn[data-category="todos"]');
    if (defaultPill) defaultPill.classList.add('active');

    fetchProducts();
  }

  // Theme Toggle (Canvas vs Noir)
  function initTheme() {
    const savedTheme = localStorage.getItem('trueka_theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trueka_theme', theme);
    const metaTheme = document.getElementById('metaThemeColor');
    if (theme === 'dark') {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Noir';
      if (metaTheme) metaTheme.setAttribute('content', '#11131a');
    } else {
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Canvas';
      if (metaTheme) metaTheme.setAttribute('content', '#fbf9f5');
    }
    updateUserModalThemeBtn();
  }

  // Fetch Products with active filters
  async function fetchProducts() {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      if (currentCategory && currentCategory !== 'todos') {
        if (filterMode === 'seeking') {
          params.append('looking_for', currentCategory);
        } else {
          params.append('category', currentCategory);
        }
      }

      if (currentStatus && currentStatus !== 'todos') {
        params.append('status', currentStatus);
      }

      if (currentSort) params.append('sort', currentSort);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar catálogo de Trueka');

      const data = await res.json();
      productsState = data.data || [];
      renderProducts(productsState);
      updateFilterSummary();
    } catch (err) {
      console.error(err);
      showToast('⚠️ Error conectando con el servidor de Trueka', 'error');
    }
  }

  // Format Price in Chilean Pesos ($ CLP)
  function formatPrice(val) {
    if (val === undefined || val === null || val === '' || val <= 0) return 'Trato libre';
    return '$' + Number(val).toLocaleString('es-CL');
  }

  // Format WhatsApp URL with Chilean phone intelligence
  function formatWhatsAppUrl(rawPhone, message) {
    let clean = (rawPhone || '').replace(/[^0-9]/g, '');
    if (clean.length === 9 && clean.startsWith('9')) {
      clean = '56' + clean;
    } else if (clean.length === 8) {
      clean = '569' + clean;
    } else if (!clean.startsWith('56') && clean.length <= 10 && clean.length > 0) {
      clean = '56' + clean;
    } else if (!clean) {
      clean = '56912345678';
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }

  // Render Product & Trade Cards
  function renderProducts(list) {
    productGrid.innerHTML = '';
    if (list.length === 0) return;

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'trueka-card';

      const isCompleted = item.status === 'trueke_completado' || !item.inStock;
      const refPrice = formatPrice(item.price);
      const seller = item.sellerName || '@truekero';
      const location = item.location ? (item.location.includes('Metro') || item.location.includes('📍') ? item.location : '📍 ' + item.location) : '🚇 Metro a convenir';
      const proposalsCount = (item.tradeProposals && item.tradeProposals.length) || 0;

      // Looking For Wishlist Tags
      const lookingForTagsHtml = (item.lookingFor || [])
        .map(tag => `<span class="barter-tag-mini">${escapeHtml(tag)}</span>`)
        .join('');

      const lookingNoteHtml = item.lookingForNote
        ? `<div class="barter-note-quote">“${escapeHtml(item.lookingForNote)}”</div>`
        : '';

      const linkedBadgeHtml = item.linkedToTitle
        ? `<div class="linked-badge-pill">🔗 Vinculado a: ${escapeHtml(item.linkedToTitle)}</div>`
        : '';

      const proposalsChipHtml = proposalsCount > 0
        ? `<div class="proposals-chip-card">🔄 ${proposalsCount} ${proposalsCount === 1 ? 'oferta vinculada' : 'ofertas vinculadas'}</div>`
        : '';

      card.innerHTML = `
        <div class="card-image-wrap">
          <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" class="card-img" loading="lazy" onError="this.src='/static/images/walkman.jpg'">
          <span class="cat-badge-card">${escapeHtml(item.category)}</span>
          <span class="score-badge-card">${item.conditionScore || 9}/10</span>
        </div>
        <div class="card-content">
          <div class="card-seller-row">
            <span class="seller-handle">${escapeHtml(seller)}</span>
            <span class="seller-location">${escapeHtml(location)}</span>
          </div>
          ${linkedBadgeHtml}
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
          <p class="card-desc">${escapeHtml(item.description)}</p>
          
          <div class="card-barter-box">
            <div class="barter-box-label">
              <span class="icon">🎯</span>
              <span>Busca a cambio:</span>
            </div>
            <div class="barter-tags-list">
              ${lookingForTagsHtml || '<span class="barter-tag-mini">Abierto a propuestas</span>'}
            </div>
            ${lookingNoteHtml}
          </div>

          ${proposalsChipHtml}

          <div class="card-footer">
            <div class="card-ref-price">
              <span>Valor ref.</span>
              <strong>${refPrice}</strong>
            </div>
            <div class="card-status-indicator">
              ${isCompleted ? `<span class="badge-completed-pill">✅ Completado</span>` : `<span class="badge-available-pill">✨ Disponible</span>`}
            </div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        openProductModal(item.id);
      });

      productGrid.appendChild(card);
    });
  }

  function updateFilterSummary() {
    const total = productsState.length;
    const modeText = filterMode === 'seeking' ? 'buscando truekes' : 'artículos disponibles';
    resultsCount.textContent = `Mostrando ${total} ${modeText} en Trueka`;
    resetFiltersBtn.hidden = !(searchQuery || currentCategory !== 'todos' || currentStatus !== 'disponible' || filterMode !== 'offered');
  }

  // Modal Detail View
  function openProductModal(id) {
    const item = productsState.find(p => p.id === id);
    if (!item) return;

    selectedModalProductId = id;

    document.getElementById('modalProductImg').src = item.imageUrl || '/static/images/walkman.jpg';
    document.getElementById('modalSellerName').textContent = item.sellerName || '@truekero';
    document.getElementById('modalProductScoreBadge').textContent = `Estado ${item.conditionScore || 9}/10`;

    document.getElementById('modalCategoryTag').textContent = item.category;
    const isCompleted = item.status === 'trueke_completado';
    document.getElementById('modalStockStatus').textContent = isCompleted ? '✅ Trueke Completado' : '✨ Disponible para Trueke';

    document.getElementById('modalProductTitle').textContent = item.title;
    document.getElementById('modalProductConditionTag').textContent = item.condition || 'Excelente Estado';
    document.getElementById('modalProductEra').textContent = item.era || 'Vintage / Colección';
    document.getElementById('modalProductPrice').textContent = formatPrice(item.price);
    document.getElementById('modalLocation').textContent = item.location ? (item.location.includes('Metro') || item.location.includes('📍') ? item.location : '📍 ' + item.location) : '🚇 Metro Santiago a convenir';
    document.getElementById('modalProductDesc').textContent = item.description;

    // Looking For Wishlist in Modal
    const pillsContainer = document.getElementById('modalLookingForPills');
    pillsContainer.innerHTML = '';
    if (item.lookingFor && item.lookingFor.length > 0) {
      item.lookingFor.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'wishlist-pill-item';
        span.textContent = tag;
        pillsContainer.appendChild(span);
      });
    } else {
      pillsContainer.innerHTML = '<span class="wishlist-pill-item">Abierto a ofertas</span>';
    }

    const noteEl = document.getElementById('modalLookingForNote');
    if (item.lookingForNote) {
      noteEl.textContent = `“${item.lookingForNote}”`;
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }

    // Trade Proposals List
    const proposalsList = document.getElementById('modalProposalsList');
    const proposalsCountEl = document.getElementById('proposalsCount');
    const proposals = item.tradeProposals || [];
    proposalsCountEl.textContent = proposals.length;

    proposalsList.innerHTML = '';
    if (proposals.length === 0) {
      proposalsList.innerHTML = '<div style="font-size: 0.82rem; color: var(--text-muted); padding: 8px 0;">Aún no se han registrado ofertas de intercambio públicas. ¡Sé el primero en proponer un trueke!</div>';
    } else {
      proposals.forEach(prop => {
        const pdiv = document.createElement('div');
        pdiv.className = 'proposal-item-card';

        const isOwner = currentUserHandle.toLowerCase() === (item.sellerName || '').toLowerCase();
        const actionsHtml = (isOwner && prop.status === 'pendiente') ? `
          <div class="proposal-action-btns">
            <button class="btn btn-sm btn-trueka-primary accept-prop-btn" data-target="${item.id}" data-prop="${prop.id}">Aceptar Trueke</button>
            <button class="btn btn-sm btn-secondary reject-prop-btn" data-target="${item.id}" data-prop="${prop.id}">Rechazar</button>
          </div>
        ` : '';

        const statusTag = prop.status === 'aceptado'
          ? '<span class="proposal-status-tag tag-accepted">✅ Trueke Aceptado</span>'
          : (prop.status === 'rechazado' ? '<span class="proposal-status-tag tag-rejected">❌ Rechazada</span>' : '<span class="proposal-status-tag">⏳ Pendiente</span>');

        pdiv.innerHTML = `
          <img src="${escapeHtml(prop.offeredItemImageUrl || '/static/images/polaroid.jpg')}" class="proposal-item-thumb" alt="">
          <div class="proposal-item-details">
            <div class="proposal-top-line">
              <strong class="proposal-title">${escapeHtml(prop.offeredItemTitle)}</strong>
              ${statusTag}
            </div>
            <div class="proposal-meta-line">
              <span>Por <strong>${escapeHtml(prop.proposerName || '@usuario')}</strong></span>
              <span>${escapeHtml(prop.offeredItemCategory || '')}</span>
              <span>• Estado: ${escapeHtml(prop.offeredItemCondition || '9/10')}</span>
            </div>
            ${prop.message ? `<p class="proposal-message">“${escapeHtml(prop.message)}”</p>` : ''}
            ${actionsHtml}
          </div>
        `;
        proposalsList.appendChild(pdiv);
      });

      // Bind Accept / Reject buttons
      proposalsList.querySelectorAll('.accept-prop-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleAcceptProposal(btn.dataset.target, btn.dataset.prop);
        });
      });

      proposalsList.querySelectorAll('.reject-prop-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleRejectProposal(btn.dataset.target, btn.dataset.prop);
        });
      });
    }

    productModal.hidden = false;
  }

  async function handleAcceptProposal(targetId, propId) {
    try {
      const res = await fetch(`/api/products/${targetId}/proposals/${propId}/accept`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al aceptar propuesta');
      showToast('🎉 ¡Felicitaciones! Has acordado el trueke con éxito.', 'success');
      productModal.hidden = true;
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('⚠️ No se pudo procesar la aceptación', 'error');
    }
  }

  async function handleRejectProposal(targetId, propId) {
    try {
      const res = await fetch(`/api/products/${targetId}/proposals/${propId}/reject`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al rechazar propuesta');
      showToast('Propuesta marcada como rechazada', 'info');
      productModal.hidden = true;
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  }

  closeProductModal.addEventListener('click', () => { productModal.hidden = true; });
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) productModal.hidden = true;
  });

  modalProposeTradeBtn.addEventListener('click', () => {
    if (selectedModalProductId) {
      productModal.hidden = true;
      openProposeModal(selectedModalProductId);
    }
  });

  modalSaveTradeBtn.addEventListener('click', () => {
    if (selectedModalProductId) {
      addToCart(selectedModalProductId);
    }
  });

  // Direct WhatsApp Deal Generator (Lightweight high-conversion deal builder)
  modalDirectWaBtn.addEventListener('click', () => {
    if (!selectedModalProductId) return;
    const item = productsState.find(p => p.id === selectedModalProductId);
    if (!item) return;

    const wants = (item.lookingFor && item.lookingFor.length > 0) ? item.lookingFor.join(', ') : 'intercambios';
    const loc = item.location || 'Metro Santiago / A convenir';

    const msg = `¡Hola ${item.sellerName || ''}! 👋 Vi tu publicación en Trueka:\n📦 *${item.title}*\n🎯 Vi que buscas: ${wants}\n🚇 Punto de encuentro: ${loc}\n\n¿Te tinca coordinar para hacer el trueke?`;
    window.open(formatWhatsAppUrl(item.sellerContact, msg), '_blank');
  });

  // 1-Tap Share Ficha de Trueke
  if (modalShareBtn) {
    modalShareBtn.addEventListener('click', () => {
      if (!selectedModalProductId) return;
      const item = productsState.find(p => p.id === selectedModalProductId);
      if (!item) return;
      shareProduct(item);
    });
  }

  async function shareProduct(item) {
    const wants = (item.lookingFor || []).join(', ') || 'Cualquier categoría';
    const loc = item.location || 'Metro Santiago / A convenir';
    const text = `🔄 ¡Permuto en Trueka!\n📦 *${item.title}* (${item.category})\n🎯 Busco a cambio: ${wants}\n🚇 Punto de encuentro: ${loc}`;
    const shareUrl = window.location.origin;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Trueka: ${item.title}`,
          text: text,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or fallback
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n🔗 ${shareUrl}`);
      showToast('📋 ¡Ficha de trueke copiada! Pégala en WhatsApp o tus redes sociales.', 'success');
    } catch (err) {
      showToast('🔗 Comparte el enlace de la publicación.', 'info');
    }
  }

  // Sell Modal (Publish Item for Trade)
  if (sellItemBtn) {
    sellItemBtn.addEventListener('click', () => {
      if (sellSellerName) sellSellerName.value = currentUserHandle;
      sellModal.hidden = false;
    });
  }

  [closeSellModal, cancelSellBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => { sellModal.hidden = true; });
  });

  sellModal.addEventListener('click', (e) => {
    if (e.target === sellModal) sellModal.hidden = true;
  });

  // Propose Trade Modal
  function openProposeModal(targetId) {
    const target = productsState.find(p => p.id === targetId);
    if (!target) return;

    document.getElementById('proposeTargetId').value = target.id;
    document.getElementById('proposeTargetSeller').textContent = target.sellerName || '@dueño';
    document.getElementById('proposeTargetImg').src = target.imageUrl || '/static/images/walkman.jpg';
    document.getElementById('proposeTargetTitle').textContent = target.title;
    
    if (proposerNameInput) proposerNameInput.value = currentUserHandle;

    const wants = (target.lookingFor && target.lookingFor.length > 0)
      ? target.lookingFor.join(', ')
      : 'Abierto a cualquier categoría';
    document.getElementById('proposeTargetWants').textContent = wants;

    proposeModal.hidden = false;
  }

  [closeProposeModal, cancelProposeBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', () => { proposeModal.hidden = true; });
  });

  proposeModal.addEventListener('click', (e) => {
    if (e.target === proposeModal) proposeModal.hidden = true;
  });

  // Image Upload Handling (Real multipart file upload to backend disk + demo presets)
  async function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error('Error al subir la imagen al servidor');
    const data = await res.json();
    return data.imageUrl;
  }

  function initImageHandlers() {
    // Sell Form Dropzone
    if (sellFileInput) {
      sellFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          showToast('⏳ Subiendo foto al servidor...', 'info');
          try {
            const uploadedUrl = await uploadImageFile(file);
            imagePreviewImg.src = uploadedUrl;
            imagePreviewBox.hidden = false;
            dropzonePrompt.hidden = true;
            sellImageUrl.value = uploadedUrl;
            showToast('📸 Foto subida y guardada en disco', 'success');
          } catch (err) {
            console.error(err);
            showToast('⚠️ Error al subir foto', 'error');
          }
        }
      });
    }

    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sellFileInput.value = '';
        imagePreviewBox.hidden = true;
        dropzonePrompt.hidden = false;
        sellImageUrl.value = '/static/images/walkman.jpg';
      });
    }

    // Propose Form Dropzone
    if (proposeFileInput) {
      proposeFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          showToast('⏳ Subiendo foto al servidor...', 'info');
          try {
            const uploadedUrl = await uploadImageFile(file);
            proposeImagePreviewImg.src = uploadedUrl;
            proposeImagePreviewBox.hidden = false;
            proposeDropzonePrompt.hidden = true;
            proposeImageUrl.value = uploadedUrl;
            showToast('📸 Foto de propuesta subida con éxito', 'success');
          } catch (err) {
            console.error(err);
            showToast('⚠️ Error al subir foto', 'error');
          }
        }
      });
    }

    if (removeProposeImageBtn) {
      removeProposeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        proposeFileInput.value = '';
        proposeImagePreviewBox.hidden = true;
        proposeDropzonePrompt.hidden = false;
        proposeImageUrl.value = '/static/images/polaroid.jpg';
      });
    }
  }

  // Preset Buttons (Images & Santiago Metro Locations)
  function initPresetButtons() {
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const img = chip.dataset.img;
        imagePreviewImg.src = img;
        imagePreviewBox.hidden = false;
        dropzonePrompt.hidden = true;
        sellImageUrl.value = img;
        showToast('📸 Foto demo aplicada', 'info');
      });
    });

    document.querySelectorAll('.preset-chip-propose').forEach(chip => {
      chip.addEventListener('click', () => {
        const img = chip.dataset.img;
        proposeImagePreviewImg.src = img;
        proposeImagePreviewBox.hidden = false;
        proposeDropzonePrompt.hidden = true;
        proposeImageUrl.value = img;
        showToast('📸 Foto demo aplicada', 'info');
      });
    });
  }

  // Publish Form Submit
  sellForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get selected categories from checkboxes
    const selectedLooking = [];
    document.querySelectorAll('input[name="lookingCategories"]:checked').forEach(cb => {
      selectedLooking.push(cb.value);
    });

    const priceVal = parseFloat(document.getElementById('sellPrice').value);
    const sellerHandle = document.getElementById('sellSellerName').value.trim() || currentUserHandle;
    const sellerContact = document.getElementById('sellSellerContact').value.trim();
    
    localStorage.setItem('trueka_user_handle', sellerHandle);
    if (sellerContact) {
      localStorage.setItem('trueka_user_whatsapp', sellerContact);
      savedWhatsApp = sellerContact;
    }
    currentUserHandle = sellerHandle;
    currentUserNameLabel.textContent = currentUserHandle;

    const newProduct = {
      title: document.getElementById('sellTitle').value.trim(),
      category: document.getElementById('sellCategory').value,
      condition: document.getElementById('sellCondition').value,
      conditionScore: 9,
      price: isNaN(priceVal) ? 0 : priceVal,
      era: 'Colección / Santiago',
      location: document.getElementById('sellLocation').value.trim() || 'Metro Santiago / A convenir',
      sellerName: sellerHandle,
      sellerContact: sellerContact,
      imageUrl: sellImageUrl.value.trim() || '/static/images/walkman.jpg',
      description: document.getElementById('sellDescription').value.trim(),
      lookingFor: selectedLooking.length > 0 ? selectedLooking : ['Cualquier intercambio'],
      lookingForNote: document.getElementById('sellLookingForNote').value.trim()
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (!res.ok) throw new Error('Error al publicar el trueke');

      showToast('🎉 ¡Artículo publicado con éxito en Trueka!', 'success');
      sellForm.reset();
      imagePreviewBox.hidden = true;
      dropzonePrompt.hidden = false;
      sellModal.hidden = true;
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('⚠️ No se pudo publicar el artículo', 'error');
    }
  });

  // Propose Trade Form Submit
  proposeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const targetId = document.getElementById('proposeTargetId').value;
    const addToCatalog = document.getElementById('proposeAddToCatalog').checked;
    const proposerHandle = document.getElementById('proposerName').value.trim() || currentUserHandle;
    const proposerContact = document.getElementById('proposerContact').value.trim();

    localStorage.setItem('trueka_user_handle', proposerHandle);
    if (proposerContact) {
      localStorage.setItem('trueka_user_whatsapp', proposerContact);
      savedWhatsApp = proposerContact;
    }
    currentUserHandle = proposerHandle;
    currentUserNameLabel.textContent = currentUserHandle;

    const payload = {
      targetItemId: targetId,
      offeredTitle: document.getElementById('proposeItemTitle').value.trim(),
      offeredCategory: document.getElementById('proposeItemCategory').value,
      offeredCondition: document.getElementById('proposeItemCondition').value,
      offeredImageUrl: proposeImageUrl.value.trim() || '/static/images/polaroid.jpg',
      offeredDescription: document.getElementById('proposeItemDesc').value.trim(),
      proposerName: proposerHandle,
      proposerContact: proposerContact,
      message: document.getElementById('proposeMessage').value.trim(),
      addToCatalog: addToCatalog
    };

    try {
      const res = await fetch(`/api/products/${targetId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al registrar la propuesta');

      const data = await res.json();
      showToast('🔄 ¡Propuesta de Trueke enviada con éxito!', 'success');
      proposeForm.reset();
      proposeImagePreviewBox.hidden = true;
      proposeDropzonePrompt.hidden = false;
      proposeModal.hidden = true;

      // Ask if user wants to open WhatsApp directly with owner
      const targetProd = productsState.find(p => p.id === targetId);
      if (targetProd && targetProd.sellerContact) {
        const msg = `¡Hola ${targetProd.sellerName || ''}! 👋 Te acabo de enviar una propuesta de trueke en Trueka:\n📦 *${targetProd.title}*\n🎁 Te ofrezco a cambio: *${payload.offeredTitle}*\n💬 Mensaje: "${payload.message}"\n\n¿Te tinca revisar para coordinar?`;
        setTimeout(() => {
          window.open(formatWhatsAppUrl(targetProd.sellerContact, msg), '_blank');
        }, 600);
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('⚠️ No se pudo enviar la propuesta', 'error');
    }
  });

  // Saved Truekes Cart / Drawer
  function loadCartFromStorage() {
    try {
      const data = localStorage.getItem('trueka_saved_trades');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveCartToStorage() {
    localStorage.setItem('trueka_saved_trades', JSON.stringify(cartState));
  }

  function addToCart(productId) {
    const product = productsState.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cartState.findIndex(ci => ci.productId === productId);
    if (existingIndex > -1) {
      showToast('ℹ️ Este artículo ya está en tus guardados', 'info');
    } else {
      cartState.push({ productId, addedAt: new Date().toISOString() });
      saveCartToStorage();
      initCartUI();
      showToast(`⭐ "${product.title}" guardado en Mis Truekes`, 'success');
    }
  }

  function removeFromCart(productId) {
    cartState = cartState.filter(ci => ci.productId !== productId);
    saveCartToStorage();
    initCartUI();
  }

  function initCartUI() {
    const totalCount = cartState.length;
    cartBadge.textContent = totalCount;
    if (userStatsSaved) {
      userStatsSaved.textContent = totalCount;
    }

    cartItemsList.innerHTML = '';

    if (cartState.length === 0) {
      cartItemsList.innerHTML = '<div style="padding: 24px 0; color: var(--text-muted); text-align: center;">No tienes artículos guardados aún. Explora el catálogo y guarda los que te interesen para trueke.</div>';
    } else {
      cartState.forEach(item => {
        const prod = productsState.find(p => p.id === item.productId);
        if (!prod) return;

        const div = document.createElement('div');
        div.className = 'cart-item-card';
        div.innerHTML = `
          <img src="${escapeHtml(prod.imageUrl)}" class="cart-item-img" alt="">
          <div class="cart-item-info">
            <span class="cart-item-title">${escapeHtml(prod.title)}</span>
            <span class="cart-item-seller">${escapeHtml(prod.sellerName || '@vendedor')}</span>
            <span class="cart-item-wants">🎯 Busca: ${(prod.lookingFor || []).slice(0, 2).join(', ')}</span>
          </div>
          <button class="cart-item-remove" data-id="${prod.id}" title="Quitar">&times;</button>
        `;

        div.querySelector('.cart-item-remove').addEventListener('click', () => removeFromCart(prod.id));
        cartItemsList.appendChild(div);
      });
    }
  }

  cartToggleBtn.addEventListener('click', () => { cartDrawer.hidden = false; });
  closeCartBtn.addEventListener('click', () => { cartDrawer.hidden = true; });
  cartDrawer.addEventListener('click', (e) => {
    if (e.target === cartDrawer) cartDrawer.hidden = true;
  });

  clearCartBtn.addEventListener('click', () => {
    cartState = [];
    saveCartToStorage();
    initCartUI();
    showToast('Lista de guardados vaciada', 'info');
  });

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (cartState.length === 0) {
      showToast('No tienes artículos guardados', 'info');
      return;
    }

    const name = document.getElementById('custName').value.trim() || currentUserHandle;
    const phone = document.getElementById('custPhone').value.trim();

    // Prepare WhatsApp proposal message with saved items
    let msg = `¡Hola! Soy ${name} desde Trueka.\nEstuve revisando estos artículos guardados para coordinar un trueke:\n\n`;
    cartState.forEach((ci, idx) => {
      const prod = productsState.find(p => p.id === ci.productId);
      if (prod) {
        msg += `${idx + 1}. *${prod.title}* (${prod.sellerName || ''})\n   🎯 Busca: ${(prod.lookingFor || []).join(', ')}\n`;
      }
    });
    msg += `\n¿Podemos coordinar para intercambiar?`;

    // Open first seller or general coordinator
    const firstProd = productsState.find(p => p.id === cartState[0].productId);
    const targetPhone = (firstProd && firstProd.sellerContact) ? firstProd.sellerContact : '+56912345678';

    window.open(formatWhatsAppUrl(targetPhone, msg), '_blank');
    cartDrawer.hidden = true;
  });

  // Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // HTML Escape Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, match => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return map[match];
    });
  }
});
