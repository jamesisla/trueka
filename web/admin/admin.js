/**
 * Trueka Admin Module — Client Logic
 * Handles CMS fixed texts editing, live preview, product management, system API control and authentication
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements - CMS Form
  const cfgTopRibbonShow = document.getElementById('cfgTopRibbonShow');
  const cfgTopRibbonText = document.getElementById('cfgTopRibbonText');
  const cfgTopRibbonTag = document.getElementById('cfgTopRibbonTag');
  const cfgBrandTagline = document.getElementById('cfgBrandTagline');
  const cfgSearchPlaceholder = document.getElementById('cfgSearchPlaceholder');
  const cfgHeroTitle = document.getElementById('cfgHeroTitle');
  const cfgHeroSubtitle = document.getElementById('cfgHeroSubtitle');
  const cfgHeroStep1 = document.getElementById('cfgHeroStep1');
  const cfgHeroStep2 = document.getElementById('cfgHeroStep2');
  const cfgHeroStep3 = document.getElementById('cfgHeroStep3');
  const cfgFooterText = document.getElementById('cfgFooterText');
  const cfgFooterCopyright = document.getElementById('cfgFooterCopyright');

  // Elements - Live Preview
  const prevRibbonBox = document.getElementById('prevRibbonBox');
  const prevRibbonText = document.getElementById('prevRibbonText');
  const prevRibbonTag = document.getElementById('prevRibbonTag');
  const prevBrandTagline = document.getElementById('prevBrandTagline');
  const prevHeroTitle = document.getElementById('prevHeroTitle');
  const prevHeroSubtitle = document.getElementById('prevHeroSubtitle');
  const prevHeroStep1 = document.getElementById('prevHeroStep1');
  const prevHeroStep2 = document.getElementById('prevHeroStep2');
  const prevHeroStep3 = document.getElementById('prevHeroStep3');
  const prevFooterText = document.getElementById('prevFooterText');
  const prevFooterCopyright = document.getElementById('prevFooterCopyright');

  // Buttons
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const btnSaveConfigBottom = document.getElementById('btnSaveConfigBottom');
  const btnResetConfig = document.getElementById('btnResetConfig');
  const btnShutdownAdmin = document.getElementById('btnShutdownAdmin');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
  const btnRefreshProducts = document.getElementById('btnRefreshProducts');
  const btnRefreshProposals = document.getElementById('btnRefreshProposals');

  // Auth Elements
  const authModal = document.getElementById('authModal');
  const authForm = document.getElementById('authForm');
  const adminSecretInput = document.getElementById('adminSecretInput');
  const authStatusBtn = document.getElementById('authStatusBtn');
  const authStatusDot = document.getElementById('authStatusDot');
  const authStatusText = document.getElementById('authStatusText');

  // Products & Proposals containers
  const adminProductsTableBody = document.getElementById('adminProductsTableBody');
  const adminProductSearch = document.getElementById('adminProductSearch');
  const adminProductFilterStatus = document.getElementById('adminProductFilterStatus');
  const adminProposalsContainer = document.getElementById('adminProposalsContainer');

  // Status badges & stats
  const mainAppStatusBadge = document.getElementById('mainAppStatusBadge');
  const mainAppStatusText = document.getElementById('mainAppStatusText');
  const statTotalProducts = document.getElementById('statTotalProducts');
  const statActiveProducts = document.getElementById('statActiveProducts');
  const statCompletedTrades = document.getElementById('statCompletedTrades');
  const statTotalProposals = document.getElementById('statTotalProposals');
  const statUptime = document.getElementById('statUptime');

  // System Diag
  const diagGoVer = document.getElementById('diagGoVer');
  const diagRam = document.getElementById('diagRam');
  const diagGoroutines = document.getElementById('diagGoroutines');
  const diagUptime = document.getElementById('diagUptime');

  // Global State
  let adminToken = sessionStorage.getItem('trueka_admin_token') || 'trueka-admin-2026';
  let productsCache = [];
  let proposalsCache = [];

  // Initialize
  initAuthUI();
  initTabs();
  initLivePreviewBindings();
  loadConfig();
  loadStatus();
  loadProducts();
  loadProposals();

  // Periodic status poll (every 5 seconds)
  setInterval(loadStatus, 5000);

  // Authentication Helpers
  function initAuthUI() {
    updateAuthBadge();

    if (authStatusBtn) {
      authStatusBtn.addEventListener('click', () => {
        openAuthModal();
      });
    }

    if (btnLogoutAdmin) {
      btnLogoutAdmin.addEventListener('click', () => {
        adminToken = '';
        sessionStorage.removeItem('trueka_admin_token');
        updateAuthBadge();
        showToast('🔒 Sesión de administrador bloqueada.', 'info');
        openAuthModal();
      });
    }

    const btnToggleSecretVisibility = document.getElementById('btnToggleSecretVisibility');
    if (btnToggleSecretVisibility) {
      btnToggleSecretVisibility.addEventListener('click', () => {
        if (adminSecretInput.type === 'password') {
          adminSecretInput.type = 'text';
          btnToggleSecretVisibility.textContent = '🙈';
        } else {
          adminSecretInput.type = 'password';
          btnToggleSecretVisibility.textContent = '👁️';
        }
      });
    }

    const btnFillDefaultSecret = document.getElementById('btnFillDefaultSecret');
    if (btnFillDefaultSecret) {
      btnFillDefaultSecret.addEventListener('click', () => {
        if (adminSecretInput) {
          adminSecretInput.value = 'trueka-admin-2026';
          adminSecretInput.focus();
        }
      });
    }

    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const secret = adminSecretInput.value.trim();
        if (!secret) return;

        try {
          const res = await fetch('/api/admin/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            adminToken = data.token || secret;
            sessionStorage.setItem('trueka_admin_token', adminToken);
            closeAuthModal();
            updateAuthBadge();
            showToast('🔓 Panel desbloqueado con éxito.', 'success');
            loadConfig();
            loadProducts();
          } else {
            showToast('❌ Clave incorrecta: ' + (data.error || 'Error'), 'error');
            adminSecretInput.select();
          }
        } catch (err) {
          showToast('Error de conexión: ' + err.message, 'error');
        }
      });
    }
  }

  function updateAuthBadge() {
    if (!authStatusDot || !authStatusText) return;
    if (adminToken) {
      authStatusDot.className = 'status-dot dot-active';
      authStatusText.textContent = '🔓 Admin Autorizado';
    } else {
      authStatusDot.className = 'status-dot dot-offline';
      authStatusText.textContent = '🔒 Bloqueado';
    }
  }

  function openAuthModal() {
    if (authModal) {
      authModal.hidden = false;
      if (adminSecretInput) {
        adminSecretInput.value = '';
        adminSecretInput.focus();
      }
    }
  }

  function closeAuthModal() {
    if (authModal) authModal.hidden = true;
  }

  // Authenticated Fetch Wrapper
  async function fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    if (adminToken) {
      options.headers['X-Admin-Token'] = adminToken;
    }

    const res = await fetch(url, options);
    if (res.status === 401) {
      adminToken = '';
      sessionStorage.removeItem('trueka_admin_token');
      updateAuthBadge();
      openAuthModal();
      throw new Error('Autenticación requerida. Ingresa la clave secreta.');
    }
    return res;
  }

  // Tab Navigation
  function initTabs() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        navTabs.forEach((t) => t.classList.remove('active'));
        tabPanes.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const activePane = document.getElementById(targetTab);
        if (activePane) activePane.classList.add('active');

        if (targetTab === 'tab-products') loadProducts();
        if (targetTab === 'tab-proposals') loadProposals();
        if (targetTab === 'tab-system') loadStatus();
      });
    });
  }

  // Live Preview Event Bindings
  function initLivePreviewBindings() {
    const inputs = [
      { el: cfgTopRibbonShow, handler: updatePreviewRibbonShow },
      { el: cfgTopRibbonText, target: prevRibbonText },
      { el: cfgTopRibbonTag, target: prevRibbonTag },
      { el: cfgBrandTagline, target: prevBrandTagline },
      { el: cfgHeroTitle, target: prevHeroTitle },
      { el: cfgHeroSubtitle, target: prevHeroSubtitle },
      { el: cfgHeroStep1, target: prevHeroStep1, isHTML: true },
      { el: cfgHeroStep2, target: prevHeroStep2, isHTML: true },
      { el: cfgHeroStep3, target: prevHeroStep3, isHTML: true },
      { el: cfgFooterText, target: prevFooterText },
      { el: cfgFooterCopyright, target: prevFooterCopyright },
    ];

    inputs.forEach(({ el, target, isHTML, handler }) => {
      if (!el) return;
      el.addEventListener('input', () => {
        if (handler) {
          handler();
        } else if (target) {
          if (isHTML) {
            target.innerHTML = formatStepHtml(el.value);
          } else {
            target.textContent = el.value;
          }
        }
      });
      if (el.type === 'checkbox') {
        el.addEventListener('change', () => {
          if (handler) handler();
        });
      }
    });

    function updatePreviewRibbonShow() {
      if (prevRibbonBox) {
        if (cfgTopRibbonShow.checked) {
          prevRibbonBox.classList.remove('hidden-ribbon');
        } else {
          prevRibbonBox.classList.add('hidden-ribbon');
        }
      }
    }
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

  // Load Config from API
  async function loadConfig() {
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error('Error al obtener configuración');
      const data = await res.json();
      if (data.success && data.data) {
        populateConfigForm(data.data);
      }
    } catch (err) {
      showToast('Error cargando textos del CMS: ' + err.message, 'error');
    }
  }

  function populateConfigForm(cfg) {
    if (cfgTopRibbonShow) cfgTopRibbonShow.checked = cfg.topRibbonShow !== false;
    if (cfgTopRibbonText) cfgTopRibbonText.value = cfg.topRibbonText || '';
    if (cfgTopRibbonTag) cfgTopRibbonTag.value = cfg.topRibbonTag || '';
    if (cfgBrandTagline) cfgBrandTagline.value = cfg.brandTagline || '';
    if (cfgSearchPlaceholder) cfgSearchPlaceholder.value = cfg.searchPlaceholder || '';
    if (cfgHeroTitle) cfgHeroTitle.value = cfg.heroTitle || '';
    if (cfgHeroSubtitle) cfgHeroSubtitle.value = cfg.heroSubtitle || '';
    if (cfgHeroStep1) cfgHeroStep1.value = cfg.heroStep1 || '';
    if (cfgHeroStep2) cfgHeroStep2.value = cfg.heroStep2 || '';
    if (cfgHeroStep3) cfgHeroStep3.value = cfg.heroStep3 || '';
    if (cfgFooterText) cfgFooterText.value = cfg.footerText || '';
    if (cfgFooterCopyright) cfgFooterCopyright.value = cfg.footerCopyright || '';

    // Update Preview Elements
    if (prevRibbonBox) {
      if (cfg.topRibbonShow === false) {
        prevRibbonBox.classList.add('hidden-ribbon');
      } else {
        prevRibbonBox.classList.remove('hidden-ribbon');
      }
    }
    if (prevRibbonText) prevRibbonText.textContent = cfg.topRibbonText;
    if (prevRibbonTag) prevRibbonTag.textContent = cfg.topRibbonTag;
    if (prevBrandTagline) prevBrandTagline.textContent = cfg.brandTagline;
    if (prevHeroTitle) prevHeroTitle.textContent = cfg.heroTitle;
    if (prevHeroSubtitle) prevHeroSubtitle.textContent = cfg.heroSubtitle;
    if (prevHeroStep1) prevHeroStep1.innerHTML = formatStepHtml(cfg.heroStep1);
    if (prevHeroStep2) prevHeroStep2.innerHTML = formatStepHtml(cfg.heroStep2);
    if (prevHeroStep3) prevHeroStep3.innerHTML = formatStepHtml(cfg.heroStep3);
    if (prevFooterText) prevFooterText.textContent = cfg.footerText;
    if (prevFooterCopyright) prevFooterCopyright.textContent = cfg.footerCopyright;
  }

  // Save Config Handler (Secured with fetchWithAuth)
  async function saveConfig() {
    const payload = {
      topRibbonShow: cfgTopRibbonShow.checked,
      topRibbonText: cfgTopRibbonText.value.trim(),
      topRibbonTag: cfgTopRibbonTag.value.trim(),
      brandTagline: cfgBrandTagline.value.trim(),
      searchPlaceholder: cfgSearchPlaceholder.value.trim(),
      heroTitle: cfgHeroTitle.value.trim(),
      heroSubtitle: cfgHeroSubtitle.value.trim(),
      heroStep1: cfgHeroStep1.value.trim(),
      heroStep2: cfgHeroStep2.value.trim(),
      heroStep3: cfgHeroStep3.value.trim(),
      footerText: cfgFooterText.value.trim(),
      footerCopyright: cfgFooterCopyright.value.trim(),
    };

    if (!payload.heroTitle) {
      showToast('El título central (Hero Title) no puede estar vacío', 'error');
      return;
    }

    try {
      if (btnSaveConfig) btnSaveConfig.disabled = true;
      if (btnSaveConfigBottom) btnSaveConfigBottom.disabled = true;

      const res = await fetchWithAuth('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar');
      }

      showToast('✅ ¡Mensajes y textos fijos guardados y sincronizados!', 'success');
      loadStatus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btnSaveConfig) btnSaveConfig.disabled = false;
      if (btnSaveConfigBottom) btnSaveConfigBottom.disabled = false;
    }
  }

  if (btnSaveConfig) btnSaveConfig.addEventListener('click', saveConfig);
  if (btnSaveConfigBottom) btnSaveConfigBottom.addEventListener('click', saveConfig);

  // Reset Config Handler (Secured)
  if (btnResetConfig) {
    btnResetConfig.addEventListener('click', async () => {
      const confirmed = confirm('¿Restaurar todos los textos fijos a los valores originales predeterminados de Trueka?');
      if (!confirmed) return;

      try {
        const res = await fetchWithAuth('/api/admin/config/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.data) {
          populateConfigForm(data.data);
          showToast('Valores predeterminados restaurados con éxito', 'success');
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Load Status & Health Metrics
  async function loadStatus() {
    try {
      const res = await fetch('/api/admin/status');
      if (!res.ok) throw new Error('Status unreachable');
      const data = await res.json();

      if (data.success) {
        // Main App Status Badge
        if (mainAppStatusBadge && mainAppStatusText) {
          const isOnline = data.mainApp && data.mainApp.online;
          const port = data.mainApp ? data.mainApp.port : '3005';
          const dot = mainAppStatusBadge.querySelector('.status-dot');

          if (isOnline) {
            dot.className = 'status-dot dot-active';
            mainAppStatusText.textContent = `App Principal Activa (:${port})`;
          } else {
            dot.className = 'status-dot dot-offline';
            mainAppStatusText.textContent = `App Principal Desconectada (:${port})`;
          }
        }

        // Stats summary
        if (data.stats) {
          if (statTotalProducts) statTotalProducts.textContent = data.stats.totalProducts;
          if (statActiveProducts) statActiveProducts.textContent = data.stats.activeProducts;
          if (statCompletedTrades) statCompletedTrades.textContent = data.stats.completedTrades;
          if (statTotalProposals) statTotalProposals.textContent = data.stats.totalProposals;
        }
        if (statUptime) statUptime.textContent = data.uptime || '-';

        // Diag
        if (data.system) {
          if (diagGoVer) diagGoVer.textContent = data.system.goVersion;
          if (diagRam) diagRam.textContent = `${data.system.allocMB.toFixed(2)} MB RAM`;
          if (diagGoroutines) diagGoroutines.textContent = data.system.numGoroutine;
        }
        if (diagUptime) diagUptime.textContent = data.uptime;
      }
    } catch {
      if (mainAppStatusBadge) {
        const dot = mainAppStatusBadge.querySelector('.status-dot');
        dot.className = 'status-dot dot-offline';
        mainAppStatusText.textContent = 'Servidor sin respuesta';
      }
    }
  }

  // Stop Admin Service (Secured)
  if (btnShutdownAdmin) {
    btnShutdownAdmin.addEventListener('click', async () => {
      const confirmed = confirm('¿Deseas detener el Módulo Independiente de Administración?\n\nPodrás reiniciarlo cuando desees ejecutando "go run ./cmd/admin" o con "start-admin.bat".');
      if (!confirmed) return;

      try {
        const res = await fetchWithAuth('/api/admin/stop', { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'El módulo de administración se ha detenido.');
        document.body.innerHTML = `
          <div style="text-align:center; padding: 4rem 1rem; font-family: sans-serif; background: #0f172a; color: #fff; min-height: 100vh;">
            <h1 style="color: #f87171;">🛑 Módulo de Administración Detenido</h1>
            <p style="color: #94a3b8; margin: 1rem 0 2rem;">El proceso de administración se ha cerrado de manera segura.</p>
            <p>Para volver a iniciarlo en cualquier momento ejecuta:</p>
            <code style="background: #1e293b; padding: 0.5rem 1rem; border-radius: 6px; color: #38bdf8; font-family: monospace;">go run ./cmd/admin</code>
          </div>
        `;
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Product Management
  async function loadProducts() {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success && data.data) {
        productsCache = data.data;
        renderProductsTable();
      }
    } catch (err) {
      if (adminProductsTableBody) {
        adminProductsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error cargando artículos: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function normalizeText(str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function renderProductsTable() {
    if (!adminProductsTableBody) return;
    const queryNorm = normalizeText(adminProductSearch ? adminProductSearch.value : '');
    const filterStatus = adminProductFilterStatus ? adminProductFilterStatus.value : 'todos';

    const filtered = productsCache.filter((p) => {
      const pText = normalizeText(`${p.title} ${p.sellerName} ${p.category} ${p.description} ${(p.lookingFor || []).join(' ')}`);
      const matchesSearch = !queryNorm || pText.includes(queryNorm);
      const matchesStatus = filterStatus === 'todos' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      adminProductsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron artículos con estos criterios.</td></tr>`;
      return;
    }

    adminProductsTableBody.innerHTML = filtered.map((p) => {
      const isCompleted = p.status === 'trueke_completado';
      const statusClass = isCompleted ? 'trueke_completado' : 'disponible';
      const statusLabel = isCompleted ? '✅ Trueke Realizado' : '✨ Disponible';
      const proposalsCount = p.tradeProposals ? p.tradeProposals.length : 0;
      const lookingPills = (p.lookingFor || []).slice(0, 2).map((lf) => `<span class="step-badge">${escapeHtml(lf)}</span>`).join(' ');

      return `
        <tr>
          <td>
            <img src="${p.imageUrl || '/static/images/walkman.jpg'}" alt="${escapeHtml(p.title)}" class="table-img" onerror="this.src='/static/images/walkman.jpg'">
          </td>
          <td>
            <strong>${escapeHtml(p.title)}</strong>
            <div class="form-hint">${escapeHtml(p.category)} • Est.: €${p.price.toFixed(2)}</div>
          </td>
          <td>
            <div>${escapeHtml(p.sellerName || '@truekero')}</div>
            <small class="text-muted">${escapeHtml(p.location || 'España')}</small>
          </td>
          <td>
            <div>${lookingPills}</div>
          </td>
          <td>
            <strong>${proposalsCount}</strong> oferta(s)
          </td>
          <td>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </td>
          <td>
            <div style="display:flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="toggleProductStatus('${p.id}', '${isCompleted ? 'disponible' : 'trueke_completado'}')">
                ${isCompleted ? 'Marcar Disponible' : 'Marcar Completado'}
              </button>
              <button class="btn btn-danger-soft btn-sm" onclick="deleteProduct('${p.id}', '${escapeHtml(p.title)}')">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (adminProductSearch) adminProductSearch.addEventListener('input', renderProductsTable);
  if (adminProductFilterStatus) adminProductFilterStatus.addEventListener('change', renderProductsTable);
  if (btnRefreshProducts) btnRefreshProducts.addEventListener('click', loadProducts);

  // Global actions for products (Secured)
  window.toggleProductStatus = async (id, newStatus) => {
    try {
      const res = await fetchWithAuth(`/api/admin/products/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Estado actualizado', 'success');
        loadProducts();
        loadStatus();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteProduct = async (id, title) => {
    const confirmed = confirm(`¿Estás seguro de eliminar el artículo "${title}" de Trueka?`);
    if (!confirmed) return;

    try {
      const res = await fetchWithAuth(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Artículo eliminado', 'success');
        loadProducts();
        loadStatus();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Proposals Management
  async function loadProposals() {
    try {
      const res = await fetch('/api/admin/proposals');
      const data = await res.json();
      if (data.success && data.data) {
        proposalsCache = data.data;
        renderProposals();
      }
    } catch (err) {
      if (adminProposalsContainer) {
        adminProposalsContainer.innerHTML = `<div class="text-danger py-4 text-center">Error cargando propuestas: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function renderProposals() {
    if (!adminProposalsContainer) return;
    if (proposalsCache.length === 0) {
      adminProposalsContainer.innerHTML = `<div class="cms-card text-center py-4 text-muted">Aún no se han recibido propuestas de trueke en la plataforma.</div>`;
      return;
    }

    adminProposalsContainer.innerHTML = proposalsCache.map(({ proposal, targetItem }) => {
      return `
        <div class="prop-card">
          <div class="prop-card-header">
            <div>
              <span class="prop-author">${escapeHtml(proposal.proposerName)}</span>
              <span class="text-muted"> (${escapeHtml(proposal.proposerContact || 'Sin tel.')})</span>
            </div>
            <span class="status-badge ${proposal.status === 'aceptada' ? 'trueke_completado' : 'disponible'}">${proposal.status}</span>
          </div>

          <div class="prop-trade-visual">
            <img src="${proposal.offeredItemImageUrl || '/static/images/polaroid.jpg'}" class="prop-thumb" alt="Ofrecido">
            <span class="prop-arrow">➔</span>
            <img src="${targetItem.imageUrl || '/static/images/walkman.jpg'}" class="prop-thumb" alt="Destino">
          </div>

          <div style="font-size: 0.82rem; margin-bottom: 0.5rem;">
            <strong>Ofrece:</strong> ${escapeHtml(proposal.offeredItemTitle)} (${escapeHtml(proposal.offeredItemCondition)})<br>
            <strong>A cambio de:</strong> ${escapeHtml(targetItem.title)}
          </div>

          ${proposal.message ? `<div style="background: #f1f5f9; padding: 0.5rem; border-radius: 6px; font-size: 0.78rem; font-style: italic; color: #475569;">"${escapeHtml(proposal.message)}"</div>` : ''}
        </div>
      `;
    }).join('');
  }

  if (btnRefreshProposals) btnRefreshProposals.addEventListener('click', loadProposals);

  // Toast Helper
  function showToast(message, type = 'info') {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
