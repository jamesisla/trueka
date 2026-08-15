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
  let currentUserHandle = localStorage.getItem('trueka_user_handle') || '@mi_usuario';

  // DOM Elements
  const productGrid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCount = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const clearFiltersEmptyBtn = document.getElementById('clearFiltersEmptyBtn');
  const publishEmptyBtn = document.getElementById('publishEmptyBtn');
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

  // Modals - Detail
  const productModal = document.getElementById('productModal');
  const closeProductModal = document.getElementById('closeProductModal');
  const modalProposeTradeBtn = document.getElementById('modalProposeTradeBtn');
  const modalDirectWaBtn = document.getElementById('modalDirectWaBtn');
  const modalSaveTradeBtn = document.getElementById('modalSaveTradeBtn');
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
  fetchProducts();

  // User Handle Management
  function initUserHandle() {
    currentUserNameLabel.textContent = currentUserHandle;
    if (sellSellerName) sellSellerName.value = currentUserHandle;
    if (proposerNameInput) proposerNameInput.value = currentUserHandle;

    userHandleBtn.addEventListener('click', () => {
      const newHandle = prompt('Ingresa tu nombre o alias de usuario (ej. @tu_nombre):', currentUserHandle);
      if (newHandle && newHandle.trim()) {
        currentUserHandle = newHandle.trim().startsWith('@') ? newHandle.trim() : '@' + newHandle.trim();
        localStorage.setItem('trueka_user_handle', currentUserHandle);
        currentUserNameLabel.textContent = currentUserHandle;
        if (sellSellerName) sellSellerName.value = currentUserHandle;
        if (proposerNameInput) proposerNameInput.value = currentUserHandle;
        showToast(`👤 Usuario activo: ${currentUserHandle}`, 'info');
      }
    });
  }

  // Search Input with Debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.hidden = !searchQuery;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchProducts(), 250);
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
  clearFiltersEmptyBtn.addEventListener('click', resetAllFilters);
  if (publishEmptyBtn) {
    publishEmptyBtn.addEventListener('click', () => {
      sellModal.hidden = false;
    });
  }

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
    if (theme === 'dark') {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Noir';
    } else {
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Canvas';
    }
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

  // Render Product & Trade Cards
  function renderProducts(list) {
    productGrid.innerHTML = '';

    if (list.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'trueka-card';

      const isCompleted = item.status === 'trueke_completado' || !item.inStock;
      const refPrice = item.price ? `${item.price.toFixed(0)} €` : 'Trato libre';
      const seller = item.sellerName || '@truekero';
      const location = item.location || 'España';
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
            <div class="card-actions-group">
              <button class="btn btn-sm btn-trueka-outline view-detail-btn" data-id="${item.id}">Ver</button>
              ${!isCompleted ? `<button class="btn btn-sm btn-trueka-primary propose-trade-btn" data-id="${item.id}">🔄 Truekear</button>` : `<span class="text-muted" style="font-size: 0.8rem;">Completado</span>`}
            </div>
          </div>
        </div>
      `;

      card.querySelector('.view-detail-btn').addEventListener('click', () => openProductModal(item.id));
      const proposeBtn = card.querySelector('.propose-trade-btn');
      if (proposeBtn) {
        proposeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openProposeModal(item.id);
        });
      }

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
    document.getElementById('modalLocation').textContent = item.location ? `📍 ${item.location}` : '📍 Intercambio directo';
    document.getElementById('modalProductScoreBadge').textContent = `Estado ${item.conditionScore || 9}/10`;

    document.getElementById('modalCategoryTag').textContent = item.category;
    const isCompleted = item.status === 'trueke_completado';
    document.getElementById('modalStockStatus').textContent = isCompleted ? '✅ Trueke Completado' : '✨ Disponible para Trueke';

    document.getElementById('modalProductTitle').textContent = item.title;
    document.getElementById('modalProductConditionTag').textContent = item.condition || 'Excelente Estado';
    document.getElementById('modalProductEra').textContent = item.era || 'Vintage / Colección';
    document.getElementById('modalProductPrice').textContent = item.price ? `~${item.price.toFixed(0)} €` : 'Trato libre';
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
      proposalsList.innerHTML = '<div style="font-size: 0.82rem; color: var(--text-muted); padding: 8px 0;">Aún no se han registrado ofertas de intercambio. ¡Sé el primero en proponer un trueke!</div>';
    } else {
      proposals.forEach(prop => {
        const pdiv = document.createElement('div');
        pdiv.className = 'proposal-item-card';

        const isAccepted = prop.status === 'aceptada';
        const isRejected = prop.status === 'rechazada';

        let statusBadge = '';
        if (isAccepted) {
          statusBadge = '<span style="font-size: 0.72rem; color: var(--trk-1); font-weight: 700;">✅ Trueke Aceptado</span>';
        } else if (isRejected) {
          statusBadge = '<span style="font-size: 0.72rem; color: var(--trk-4); font-weight: 700;">❌ Rechazada</span>';
        }

        pdiv.innerHTML = `
          <img src="${escapeHtml(prop.offeredItemImageUrl || '/static/images/polaroid.jpg')}" alt="" class="proposal-item-thumb" onError="this.src='/static/images/polaroid.jpg'">
          <div class="proposal-item-details">
            <div class="proposal-item-title">${escapeHtml(prop.offeredItemTitle)}</div>
            <div style="font-size: 0.74rem; color: var(--trk-2);">${escapeHtml(prop.proposerName)} • ${escapeHtml(prop.offeredItemCondition || 'Excelente')}</div>
            ${prop.message ? `<div class="proposal-item-msg">"${escapeHtml(prop.message)}"</div>` : ''}
            ${statusBadge}
          </div>
          <div style="display: flex; gap: 4px; flex-direction: column; align-items: flex-end;">
            ${prop.offeredItemId ? `<button class="btn btn-sm btn-secondary view-offered-btn" data-id="${prop.offeredItemId}">Ver</button>` : ''}
            ${!isCompleted && prop.status === 'pendiente' ? `
              <button class="btn btn-sm btn-trueka-primary accept-prop-btn" data-prop-id="${prop.id}">Aceptar</button>
              <button class="btn btn-sm btn-secondary reject-prop-btn" data-prop-id="${prop.id}">Rechazar</button>
            ` : ''}
          </div>
        `;

        const viewOfferedBtn = pdiv.querySelector('.view-offered-btn');
        if (viewOfferedBtn) {
          viewOfferedBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openProductModal(prop.offeredItemId);
          });
        }

        const acceptBtn = pdiv.querySelector('.accept-prop-btn');
        if (acceptBtn) {
          acceptBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleAcceptProposal(item.id, prop.id);
          });
        }

        const rejectBtn = pdiv.querySelector('.reject-prop-btn');
        if (rejectBtn) {
          rejectBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleRejectProposal(item.id, prop.id);
          });
        }

        proposalsList.appendChild(pdiv);
      });
    }

    productModal.hidden = false;
  }

  async function handleAcceptProposal(targetId, propId) {
    if (!confirm('¿Deseas aceptar esta propuesta de trueke? Ambos artículos se marcarán como completados.')) return;
    try {
      const res = await fetch(`/api/products/${targetId}/proposals/${propId}/accept`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al aceptar propuesta');
      showToast('🎉 ¡Trueke aceptado y completado con éxito!', 'success');
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

  modalDirectWaBtn.addEventListener('click', () => {
    if (!selectedModalProductId) return;
    const item = productsState.find(p => p.id === selectedModalProductId);
    if (!item) return;

    const contactPhone = (item.sellerContact || "34600000000").replace(/\+/g, '').replace(/\s+/g, '');
    const lookingText = item.lookingFor ? item.lookingFor.join(', ') : 'intercambios';
    const msg = `¡Hola ${item.sellerName || ''}! Vi tu publicación en Trueka: "${item.title}". Veo que buscas (${lookingText}). Me gustaría hacerte una propuesta de trueke. ¿Hablamos?`;
    window.open(`https://wa.me/${contactPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  });

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

  // Preset Buttons
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
    localStorage.setItem('trueka_user_handle', sellerHandle);
    currentUserHandle = sellerHandle;
    currentUserNameLabel.textContent = currentUserHandle;

    const newProduct = {
      title: document.getElementById('sellTitle').value.trim(),
      category: document.getElementById('sellCategory').value,
      condition: document.getElementById('sellCondition').value,
      conditionScore: 9,
      price: isNaN(priceVal) ? 100 : priceVal,
      era: 'Colección / Retro',
      location: document.getElementById('sellLocation').value.trim() || 'España',
      sellerName: sellerHandle,
      sellerContact: document.getElementById('sellSellerContact').value.trim(),
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
    localStorage.setItem('trueka_user_handle', proposerHandle);
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
      proposerContact: document.getElementById('proposerContact').value.trim(),
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
      showToast('🔄 ¡Propuesta de Trueke vinculada con éxito!', 'success');
      proposeForm.reset();
      proposeImagePreviewBox.hidden = true;
      proposeDropzonePrompt.hidden = false;
      proposeModal.hidden = true;
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('⚠️ Error al enviar propuesta', 'error');
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
    const targetPhone = (firstProd && firstProd.sellerContact ? firstProd.sellerContact : '34600000000').replace(/\+/g, '').replace(/\s+/g, '');

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
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
