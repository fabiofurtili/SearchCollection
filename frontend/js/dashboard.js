// ========================
// Auth guard
// ========================
const token = localStorage.getItem("token");
if (!token) {
  window.location.replace(frontendUrl("index.html"));
}

const btnAdminUsers = document.getElementById("btnAdminUsers");
const btnRequestAccess = document.getElementById("btnRequestAccess");
const btnRequestNext = document.getElementById("btnRequestNext");
const btnRequestSubmit = document.getElementById("btnRequestSubmit");
const btnRequestBack = document.getElementById("btnRequestBack");

function decodeJwtPayload(jwt) {
  const parts = String(jwt || "").split(".");
  if (parts.length !== 3) return null;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, "=");
  try {
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const payload = decodeJwtPayload(token);
const isAdmin = payload?.username === "admin";
if (payload?.username === "admin" && btnAdminUsers) {
  btnAdminUsers.classList.remove("d-none");
}

const accessUntilEl = document.getElementById("accessUntil");
let accessExpired = false;
if (accessUntilEl && !isAdmin) {
  const until = payload?.access_until ? new Date(payload.access_until) : null;
  if (!until || Number.isNaN(until.getTime()) || until.getTime() < Date.now()) {
    accessExpired = true;
    accessUntilEl.textContent = "Acesso expirou";
    accessUntilEl.classList.remove("text-warning");
    accessUntilEl.classList.add("text-danger");
    accessUntilEl.classList.remove("d-none");
    if (btnRequestAccess) btnRequestAccess.classList.remove("d-none");
  } else {
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(until);
    accessUntilEl.textContent = `Acesso ate ${formatted}`;
    accessUntilEl.classList.remove("text-danger");
    accessUntilEl.classList.add("text-warning");
    accessUntilEl.classList.remove("d-none");
  }
}

function showRenewalModal(previousIso, currentIso) {
  const modalEl = document.getElementById("renewalModal");
  const textEl = document.getElementById("renewalText");
  if (!modalEl || !textEl) return;

  const current = new Date(currentIso);
  if (Number.isNaN(current.getTime())) return;

  const formatted = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(current);

  textEl.textContent = `Parabens e obrigado pelo apoio! Seu acesso foi renovado ate ${formatted}.`;
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// ========================
// State
// ========================
const searches = [];
const listEl = document.getElementById("searchList");
const countEl = document.getElementById("savedSearchCount");
const statusFilter = document.getElementById("statusFilter");
const searchFilter = document.getElementById("searchFilter");

const itemName = document.getElementById("itemName");
const itemType = document.getElementById("itemType");
const optMh = document.getElementById("optMh");
const optSd = document.getElementById("optSd");
const optDd = document.getElementById("optDd");
const optRef = document.getElementById("optRef");
const optDsr = document.getElementById("optDsr");
const optZen = document.getElementById("optZen");

// Buttons
const btnLogout = document.getElementById("btnLogout");
const btnRunSearch = document.getElementById("btnRunSearch");
if (btnLogout) btnLogout.addEventListener("click", logout);
if (btnRunSearch) btnRunSearch.addEventListener("click", runSearch);
if (btnAdminUsers) {
  btnAdminUsers.addEventListener("click", () => {
    window.location.replace(frontendUrl("admin-users.html"));
  });
}
if (statusFilter) {
  statusFilter.addEventListener("change", renderList);
}

if (btnRequestAccess) {
  btnRequestAccess.addEventListener("click", () => {
    const modalEl = document.getElementById("accessModal");
    if (!modalEl) return;
    const accessErrorEl = document.getElementById("accessRequestError");
    if (accessErrorEl) {
      accessErrorEl.classList.add("d-none");
      accessErrorEl.textContent = "";
    }
    const accessDetailsError = document.getElementById("accessDetailsError");
    if (accessDetailsError) {
      accessDetailsError.classList.add("d-none");
      accessDetailsError.textContent = "";
    }
    const detailsForm = document.getElementById("accessDetailsForm");
    if (detailsForm) detailsForm.reset();
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  });
}

function getSelectedPlan() {
  const selected = document.querySelector("input[name=\"accessPlan\"]:checked");
  const value = selected ? selected.value : "";
  const currency = document.getElementById("currencyUSD")?.checked ? "USD" : "BRL";
  return { value, currency };
}

function updatePlanSummary() {
  const summaryEl = document.getElementById("requestPlanSummary");
  if (!summaryEl) return;
  const { value, currency } = getSelectedPlan();
  const planDays = Number(value);
  const priceMap = {
    7: { BRL: "R$ 4,99", USD: "$ 0,99" },
    30: { BRL: "R$ 9,99", USD: "$ 1,99" },
    60: { BRL: "R$ 14,99", USD: "$ 2,99" }
  };
  const planLabel = planDays === 7 ? "1 semana" : `${planDays} dias`;
  const price = priceMap[planDays]?.[currency] || "-";
  summaryEl.textContent = `${planLabel} - ${price} ${currency}`;
}

if (btnRequestNext) {
  btnRequestNext.addEventListener("click", () => {
    const accessErrorEl = document.getElementById("accessRequestError");
    if (accessErrorEl) {
      accessErrorEl.classList.add("d-none");
      accessErrorEl.textContent = "";
    }
    const accessDetailsError = document.getElementById("accessDetailsError");
    if (accessDetailsError) {
      accessDetailsError.classList.add("d-none");
      accessDetailsError.textContent = "";
    }

    const { value } = getSelectedPlan();
    if (![7, 30, 60].includes(Number(value))) {
      if (accessErrorEl) {
        accessErrorEl.textContent = "Selecione um plano valido.";
        accessErrorEl.classList.remove("d-none");
      } else {
        alert("Selecione um plano valido.");
      }
      return;
    }

    const modalEl = document.getElementById("accessModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    updatePlanSummary();
    const detailsEl = document.getElementById("accessDetailsModal");
    if (detailsEl) bootstrap.Modal.getOrCreateInstance(detailsEl).show();
  });
}

if (btnRequestBack) {
  btnRequestBack.addEventListener("click", () => {
    const detailsEl = document.getElementById("accessDetailsModal");
    if (detailsEl) bootstrap.Modal.getOrCreateInstance(detailsEl).hide();
    const modalEl = document.getElementById("accessModal");
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });
}

if (btnRequestSubmit) {
  btnRequestSubmit.addEventListener("click", async () => {
    const { value, currency } = getSelectedPlan();
    const accessDetailsError = document.getElementById("accessDetailsError");
    if (accessDetailsError) {
      accessDetailsError.classList.add("d-none");
      accessDetailsError.textContent = "";
    }

    const firstName = document.getElementById("requestFirstName")?.value.trim() || "";
    const lastName = document.getElementById("requestLastName")?.value.trim() || "";
    const email = document.getElementById("requestEmail")?.value.trim() || "";
    const emailConfirm = document.getElementById("requestEmailConfirm")?.value.trim() || "";
    const phone = document.getElementById("requestPhone")?.value.trim() || "";
    const notes = document.getElementById("requestNotes")?.value.trim() || "";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!firstName || !lastName || !email || !emailConfirm || !phone) {
      if (accessDetailsError) {
        accessDetailsError.textContent = "Preencha todos os campos obrigatorios.";
        accessDetailsError.classList.remove("d-none");
      } else {
        alert("Preencha todos os campos obrigatorios.");
      }
      return;
    }
    if (!emailOk || email !== emailConfirm) {
      if (accessDetailsError) {
        accessDetailsError.textContent = "Emails nao conferem ou sao invalidos.";
        accessDetailsError.classList.remove("d-none");
      } else {
        alert("Emails nao conferem ou sao invalidos.");
      }
      return;
    }

    btnRequestSubmit.disabled = true;

    try {
      const res = await fetch(apiUrl("access-requests"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          plan_days: Number(value),
          currency,
          contact_name: firstName,
          contact_last_name: lastName,
          contact_email: email,
          contact_email_confirm: emailConfirm,
          contact_phone: phone,
          contact_notes: notes || undefined
        })
      });

      if (res.status === 401) {
        logout();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (accessDetailsError) {
          accessDetailsError.textContent = data?.error || "Falha ao enviar solicitacao.";
          accessDetailsError.classList.remove("d-none");
        } else {
          alert(data?.error || "Falha ao enviar solicitacao.");
        }
        return;
      }

      const detailsEl = document.getElementById("accessDetailsModal");
      if (detailsEl) bootstrap.Modal.getOrCreateInstance(detailsEl).hide();
      const successEl = document.getElementById("accessSentModal");
      if (successEl) {
        const whatsappBtn = document.getElementById("btnWhatsappContact");
        if (whatsappBtn) {
          const planDays = Number(value);
          const priceMap = {
            7: { BRL: "R$ 4,99", USD: "$ 0,99" },
            30: { BRL: "R$ 9,99", USD: "$ 1,99" },
            60: { BRL: "R$ 14,99", USD: "$ 2,99" }
          };
          const planLabel = planDays === 7 ? "1 semana" : `${planDays} dias`;
          const price = priceMap[planDays]?.[currency] || "-";
          const userName = payload?.username || "usuario";
          const msg = [
            "Ola! Solicitei acesso ao Search Collection.",
            `Usuario: ${userName}`,
            `Plano: ${planLabel}`,
            `Moeda: ${currency}`,
            `Valor: ${price}`
          ].join("\n");
          const phoneNumber = "5545991478250";
          whatsappBtn.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`;
        }
        const successModal = new bootstrap.Modal(successEl);
        successModal.show();
      }
    } catch (e) {
      console.error(e);
      if (accessDetailsError) {
        accessDetailsError.textContent = "Falha ao enviar solicitacao.";
        accessDetailsError.classList.remove("d-none");
      } else {
        alert("Falha ao enviar solicitacao.");
      }
    } finally {
      btnRequestSubmit.disabled = false;
    }
  });
}

if (btnRunSearch && accessExpired) {
  btnRunSearch.disabled = true;
  btnRunSearch.classList.add("disabled");
}
if (searchFilter) {
  searchFilter.addEventListener("input", renderList);
}

if (!isAdmin && payload?.access_until) {
  const prevAccess = localStorage.getItem("access_until");
  const currentAccess = payload.access_until;
  if (prevAccess) {
    const prevDate = new Date(prevAccess);
    const currentDate = new Date(currentAccess);
    if (!Number.isNaN(prevDate.getTime()) && !Number.isNaN(currentDate.getTime())) {
      if (currentDate.getTime() > prevDate.getTime()) {
        showRenewalModal(prevAccess, currentAccess);
      }
    }
  }
  localStorage.setItem("access_until", currentAccess);
}

// ========================
// Loading helpers
// ========================
function showLoading(text) {
  const txt = document.getElementById("loadingText");
  if (txt) txt.innerText = text || "Processando...";
  document.getElementById("loading").classList.remove("d-none");
}

function hideLoading() {
  document.getElementById("loading").classList.add("d-none");
}

// ========================
// Render
// ========================
function renderOptionsBadges(s) {
  const opts = [];
  const options = s.options || {};

  if (options.mh) opts.push({ label: "MH", cls: "text-bg-success" });
  if (options.sd) opts.push({ label: "SD", cls: "text-bg-primary" });
  if (options.dd) opts.push({ label: "DD", cls: "text-bg-danger" });
  if (options.ref) opts.push({ label: "REF", cls: "text-bg-secondary" });
  if (options.dsr) opts.push({ label: "DSR", cls: "text-bg-info" });
  if (options.zen) opts.push({ label: "ZEN", cls: "text-bg-warning" });

  if (!opts.length) return "-";

  return `
    <div class="d-flex flex-wrap gap-1">
      ${opts.map(o => `<span class="badge ${o.cls}">${o.label}</span>`).join("")}
    </div>
  `;
}

function renderStatus(found, count) {
  if (found === null || found === undefined) return "-";
  if (found) {
    const qty = Number.isFinite(count) ? count : 0;
    return `
      <span class="badge text-bg-success d-inline-flex align-items-center gap-1">
        <i class="bi bi-check-circle"></i>
        Disponivel (${qty})
      </span>
    `;
  }
  return `
    <span class="badge text-bg-danger d-inline-flex align-items-center gap-1">
      <i class="bi bi-x-circle"></i>
      Indisponivel
    </span>
  `;
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number" && Number.isFinite(value)) return value.toLocaleString("pt-BR");
  return String(value);
}

function renderPriceTokens(prices) {
  const tokens = [];
  const imageCurrencies = new Set([
    "soul",
    "life",
    "bless",
    "chaos",
    "creat",
    "harmo",
    "guard"
  ]);

  prices.forEach((p) => {
    const currencyRaw = String(p?.currency || "").trim();
    const currencyKey = currencyRaw.toLowerCase();
    const valueText = formatCurrencyValue(p?.value);

    if (imageCurrencies.has(currencyKey)) {
      tokens.push(`
        <span class="price-token">
          <img src="https://mudream.online/assets/currencies/${currencyKey}.webp" alt="${escapeHtml(currencyKey)}" class="currency-img">
          <span>${escapeHtml(valueText)}</span>
        </span>
      `);
      return;
    }

    if (currencyKey === "zen") {
      tokens.push(`
        <span class="badge text-bg-warning price-badge">ZEN ${escapeHtml(valueText)}</span>
      `);
      return;
    }

    if (currencyKey === "dc") {
      tokens.push(`
        <span class="badge text-bg-success price-badge">DC ${escapeHtml(valueText)}</span>
      `);
      return;
    }

    tokens.push(`
      <span class="price-token">
        <span class="text-muted">${escapeHtml(currencyRaw)}</span>
        <span>${escapeHtml(valueText)}</span>
      </span>
    `);
  });

  return tokens.join("");
}

function buildDetailsHtml(details) {
  const lots = Array.isArray(details?.lots) ? details.lots : [];

  const lotsHtml = lots.length
    ? `
      <div>
        <div class="fw-semibold mb-2">Itens encontrados</div>
        <ul class="list-group list-group-flush">
          ${lots.map((lot, idx) => {
            const prices = Array.isArray(lot.prices) ? lot.prices : [];
            const priceHtml = prices.length
              ? renderPriceTokens(prices)
              : "<span class=\"text-muted\">Sem preco</span>";
            return `
              <li class="list-group-item d-flex align-items-center gap-2">
                <span>Item ${idx + 1}</span>
                <span class="flex-grow-1 lot-prices">${priceHtml}</span>
                <a class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" href="https://mudream.online/pt/market" target="_blank" rel="noopener">
                  <i class="bi bi-box-arrow-up-right"></i>
                  Ir
                </a>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `
    : `<div class="text-muted">Nenhum lote encontrado.</div>`;

  return lotsHtml;
}

function renderList() {
  listEl.innerHTML = "";
  const filterValue = statusFilter ? statusFilter.value : "all";
  const nameQuery = searchFilter ? searchFilter.value.trim().toLowerCase() : "";
  let filtered = filterValue === "available"
    ? searches.filter(s => s.found === true)
    : searches;

  if (nameQuery) {
    filtered = filtered.filter(s =>
      String(s.name || "").toLowerCase().includes(nameQuery)
    );
  }

  if (countEl) countEl.textContent = String(filtered.length);

  if (searches.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          Nenhuma pesquisa cadastrada.
        </td>
      </tr>
    `;
    return;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">
          Nenhuma pesquisa encontrada para o filtro selecionado.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach((s) => {
    const index = searches.indexOf(s);
    listEl.innerHTML += `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.type || "-")}</td>
        <td>${renderOptionsBadges(s)}</td>
        <td>${renderStatus(s.found, s.count)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="showDetails(${index})">Detalhes</button>
          <button class="btn btn-sm btn-danger" onclick="removeSearch(${index})">Excluir</button>
        </td>
      </tr>
    `;
  });
}

// simple and sufficient to avoid breaking the table
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function optionsSignature(options) {
  const opts = options || {};
  return [
    !!opts.mh,
    !!opts.sd,
    !!opts.dd,
    !!opts.ref,
    !!opts.dsr,
    !!opts.zen
  ].map(v => (v ? "1" : "0")).join("");
}

window.showDetails = async function (index) {
  const s = searches[index];
  if (!s?.id) return;

  const modalEl = document.getElementById("detailsModal");
  const titleEl = document.getElementById("detailsTitle");
  const bodyEl = document.getElementById("detailsBody");
  if (!modalEl || !titleEl || !bodyEl) return;

  titleEl.textContent = `Detalhes - ${s.name || "Item"}`;
  bodyEl.innerHTML = "<div class=\"text-muted\">Carregando...</div>";

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  if (!s.found) {
    bodyEl.innerHTML = "<div class=\"text-muted\">Item indisponivel no momento.</div>";
    return;
  }

  try {
    const res = await fetch(apiUrl(`search-configs/${s.id}/details`), {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      bodyEl.innerHTML = `<div class="text-danger">${escapeHtml(data?.error || "Falha ao buscar detalhes.")}</div>`;
      return;
    }

    const details = await res.json();
    bodyEl.innerHTML = buildDetailsHtml(details);
  } catch (e) {
    console.error(e);
    bodyEl.innerHTML = "<div class=\"text-danger\">Erro ao buscar detalhes.</div>";
  }
};

// ========================
// API - Load
// ========================
async function loadSearches() {
  try {
    showLoading("Carregando suas pesquisas...");

    const previousStatus = new Map(
      searches.map(s => [s.id, { found: s.found, count: s.count }])
    );

    const res = await fetch(apiUrl("search-configs"), {
      headers: { "Authorization": "Bearer " + token }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) throw new Error("Falha ao carregar");

    const data = await res.json();

    searches.length = 0;

    data.forEach(row => {
      let opts = {};
      try { opts = JSON.parse(row.options_json || "{}"); } catch { opts = {}; }

      const savedStatus = previousStatus.get(row.id);
      searches.push({
        id: row.id,
        name: row.item_name,
        type: row.item_type || opts.type || "",
        options: {
          mh: !!opts.mh,
          sd: !!opts.sd,
          dd: !!opts.dd,
          ref: !!opts.ref,
          dsr: !!opts.dsr,
          zen: !!opts.zen
        },
        found: savedStatus ? savedStatus.found : null,
        count: savedStatus ? savedStatus.count : null
      });
    });

    searches.sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);
      if (Number.isFinite(aId) && Number.isFinite(bId)) return bId - aId;
      return String(b.id).localeCompare(String(a.id));
    });

    renderList();
  } catch (e) {
    alert("Erro ao carregar pesquisas.");
    console.error(e);
  } finally {
    hideLoading();
  }
}

// ========================
// API - Create
// ========================
document.getElementById("searchForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = itemName.value.trim();
  if (!name) {
    alert("Informe o nome do item.");
    return;
  }

  const type = itemType.value.trim();
  if (!type) {
    alert("Informe o tipo do item.");
    return;
  }

  const payload = {
    item_name: name,
    item_type: type,
    item_level: null,
    max_price: null,
    options: {
      mh: optMh.checked,
      sd: optSd.checked,
      dd: optDd.checked,
      ref: optRef.checked,
      dsr: optDsr.checked,
      zen: optZen.checked
    }
  };

  const newSignature = optionsSignature(payload.options);
  const nameKey = normalizeKey(name);
  const typeKey = normalizeKey(type);
  const isDuplicate = searches.some(s =>
    normalizeKey(s.name) === nameKey &&
    normalizeKey(s.type) === typeKey &&
    optionsSignature(s.options) === newSignature
  );

  if (isDuplicate) {
    alert("Essa pesquisa ja foi cadastrada com o mesmo item, tipo e opcoes.");
    return;
  }

  try {
    showLoading("Salvando pesquisa...");

    const res = await fetch(apiUrl("search-configs"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) throw new Error("Falha ao salvar");

    this.reset();
    await loadSearches();
  } catch (e2) {
    alert("Erro ao salvar a pesquisa.");
    console.error(e2);
  } finally {
    hideLoading();
  }
});

// ========================
// API - Delete
// ========================
window.removeSearch = async function (index) {
  const s = searches[index];
  if (!s?.id) return;

  const ok = confirm("Excluir esta pesquisa?");
  if (!ok) return;

  try {
    showLoading("Excluindo pesquisa...");

    const res = await fetch(apiUrl(`search-configs/${s.id}`), {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) throw new Error("Falha ao excluir");

    await loadSearches();
  } catch (e) {
    alert("Erro ao excluir a pesquisa.");
    console.error(e);
  } finally {
    hideLoading();
  }
};

// ========================
// Search run (validate list + loading)
// ========================
async function runSearch() {
  if (accessExpired) {
    const modalEl = document.getElementById("accessModal");
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } else {
      alert("Acesso expirado. Solicite mais tempo para continuar.");
    }
    return;
  }

  if (searches.length === 0) {
    alert("Nenhuma pesquisa cadastrada.");
    return;
  }

  try {
    showLoading("Pesquisando itens no market...");

    const res = await fetch(apiUrl("search-configs/run"), {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) throw new Error("Falha ao pesquisar");

    const results = await res.json();

    results.forEach(r => {
      const s = searches.find(x => x.id === r.search_id);
      if (s) {
        s.found = !!r.found;
        s.count = Number.isFinite(r.count) ? r.count : 0;
      }
    });

    renderList();
  } catch (e) {
    alert("Erro ao executar a busca.");
    console.error(e);
  } finally {
    hideLoading();
  }
}

// ========================
// Logout
// ========================
function logout() {
  localStorage.removeItem("token");
  window.location.replace(frontendUrl("index.html"));
}

// init
loadSearches();
