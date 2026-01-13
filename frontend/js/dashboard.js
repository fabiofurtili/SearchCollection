// ========================
// Auth guard
// ========================
const token = localStorage.getItem("token");
if (!token) {
  window.location.replace(frontendUrl("index.html"));
}
const { t, getLocale } = window.I18N || {
  t: (key, vars) => {
    if (!vars) return key;
    return String(key).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ""));
  },
  getLocale: () => "pt-BR"
};

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
function updateAccessUntil() {
  if (!accessUntilEl || isAdmin) return;
  const until = payload?.access_until ? new Date(payload.access_until) : null;
  if (!until || Number.isNaN(until.getTime()) || until.getTime() < Date.now()) {
    accessExpired = true;
    accessUntilEl.textContent = t("dashboard.access.expired");
    accessUntilEl.classList.remove("text-warning");
    accessUntilEl.classList.add("text-danger");
    accessUntilEl.classList.remove("d-none");
    if (btnRequestAccess) btnRequestAccess.classList.remove("d-none");
  } else {
    accessExpired = false;
    const formatted = new Intl.DateTimeFormat(getLocale(), {
      dateStyle: "short",
      timeStyle: "short"
    }).format(until);
    accessUntilEl.textContent = t("dashboard.access.until", { date: formatted });
    accessUntilEl.classList.remove("text-danger");
    accessUntilEl.classList.add("text-warning");
    accessUntilEl.classList.remove("d-none");
  }
}

updateAccessUntil();

function showRenewalModal(previousIso, currentIso) {
  const modalEl = document.getElementById("renewalModal");
  const textEl = document.getElementById("renewalText");
  if (!modalEl || !textEl) return;

  const current = new Date(currentIso);
  if (Number.isNaN(current.getTime())) return;

  const formatted = new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short"
  }).format(current);

  textEl.textContent = t("dashboard.access.renew", { date: formatted });
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
const btnProfileLogout = document.getElementById("btnProfileLogout");
const btnRunSearch = document.getElementById("btnRunSearch");
const btnProfile = document.getElementById("btnProfile");
const btnProfileSave = document.getElementById("btnProfileSave");
const btnProfileRenew = document.getElementById("btnProfileRenew");
const profileError = document.getElementById("profileError");
const profileOk = document.getElementById("profileOk");
const profileUsername = document.getElementById("profileUsername");
const profileEmail = document.getElementById("profileEmail");
const profilePassword = document.getElementById("profilePassword");
const profilePasswordConfirm = document.getElementById("profilePasswordConfirm");
const profileCreatedAt = document.getElementById("profileCreatedAt");
const profileAccessUntil = document.getElementById("profileAccessUntil");
let profileData = null;
if (btnLogout) btnLogout.addEventListener("click", logout);
if (btnProfileLogout) btnProfileLogout.addEventListener("click", logout);
if (btnRunSearch) btnRunSearch.addEventListener("click", runSearch);
if (btnProfile) btnProfile.addEventListener("click", showProfile);
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

function setProfileMessage(type, message) {
  if (profileError) {
    profileError.classList.add("d-none");
    profileError.textContent = "";
  }
  if (profileOk) {
    profileOk.classList.add("d-none");
    profileOk.textContent = "";
  }
  if (!message) return;
  if (type === "ok" && profileOk) {
    profileOk.textContent = message;
    profileOk.classList.remove("d-none");
  } else if (profileError) {
    profileError.textContent = message;
    profileError.classList.remove("d-none");
  }
}

function formatProfileDate(value) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

function fillProfile(data) {
  profileData = data || null;
  if (profileUsername) profileUsername.value = data?.username || "";
  if (profileEmail) profileEmail.value = data?.email || "";
  if (profilePassword) profilePassword.value = "";
  if (profilePasswordConfirm) profilePasswordConfirm.value = "";
  if (profileCreatedAt) profileCreatedAt.textContent = formatProfileDate(data?.created_at);
  if (profileAccessUntil) {
    profileAccessUntil.textContent = data?.access_until
      ? formatProfileDate(data.access_until)
      : "-";
  }
}

async function loadProfile() {
  setProfileMessage(null, "");
  if (profileCreatedAt) profileCreatedAt.textContent = t("dashboard.profile_loading");
  if (profileAccessUntil) profileAccessUntil.textContent = t("dashboard.profile_loading");
  try {
    const res = await fetch(apiUrl("users/me"), {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) throw new Error("PROFILE_LOAD");
    const data = await res.json();
    fillProfile(data);
  } catch (e) {
    setProfileMessage("error", t("dashboard.profile.load_error"));
  }
}

async function showProfile() {
  const modalEl = document.getElementById("profileModal");
  if (!modalEl) return;
  setProfileMessage(null, "");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  await loadProfile();
}

if (btnProfileSave) {
  btnProfileSave.addEventListener("click", async () => {
    const username = profileUsername?.value.trim() || "";
    const email = profileEmail?.value.trim() || "";
    const password = profilePassword?.value || "";
    const confirm = profilePasswordConfirm?.value || "";

    if (!username) {
      setProfileMessage("error", t("dashboard.profile.username_required"));
      return;
    }
    if (!email) {
      setProfileMessage("error", t("dashboard.profile.email_required"));
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      setProfileMessage("error", t("dashboard.profile.email_invalid"));
      return;
    }
    if (password || confirm) {
      if (password !== confirm) {
        setProfileMessage("error", t("dashboard.profile.password_mismatch"));
        return;
      }
    }

    const payload = {
      username,
      email
    };
    if (password) payload.password = password;

    try {
      const res = await fetch(apiUrl("users/me"), {
        method: "PATCH",
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProfileMessage("error", data?.error || t("dashboard.profile.save_error"));
        return;
      }
      const data = await res.json();
      fillProfile(data);
      setProfileMessage("ok", t("dashboard.profile.save_ok"));
    } catch (e) {
      setProfileMessage("error", t("dashboard.profile.save_error"));
    }
  });
}

if (btnProfileRenew) {
  btnProfileRenew.addEventListener("click", () => {
    const profileModal = document.getElementById("profileModal");
    if (profileModal) bootstrap.Modal.getOrCreateInstance(profileModal).hide();
    const accessModal = document.getElementById("accessModal");
    if (accessModal) bootstrap.Modal.getOrCreateInstance(accessModal).show();
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
  const planLabel = planDays === 7
    ? t("dashboard.access_modal.plan_week")
    : t("dashboard.access_modal.plan_days", { count: planDays });
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
        accessErrorEl.textContent = t("dashboard.alert_plan_invalid");
        accessErrorEl.classList.remove("d-none");
      } else {
        alert(t("dashboard.alert_plan_invalid"));
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
        accessDetailsError.textContent = t("dashboard.alert_required_fields");
        accessDetailsError.classList.remove("d-none");
      } else {
        alert(t("dashboard.alert_required_fields"));
      }
      return;
    }
    if (!emailOk || email !== emailConfirm) {
      if (accessDetailsError) {
        accessDetailsError.textContent = t("dashboard.alert_email_invalid");
        accessDetailsError.classList.remove("d-none");
      } else {
        alert(t("dashboard.alert_email_invalid"));
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
          accessDetailsError.textContent = data?.error || t("dashboard.access_modal.request_error");
          accessDetailsError.classList.remove("d-none");
        } else {
          alert(data?.error || t("dashboard.access_modal.request_error"));
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
          const planLabel = planDays === 7
            ? t("dashboard.access_modal.plan_week")
            : t("dashboard.access_modal.plan_days", { count: planDays });
          const price = priceMap[planDays]?.[currency] || "-";
          const userName = payload?.username || "usuario";
          const msg = [
            t("dashboard.whatsapp.greeting"),
            t("dashboard.whatsapp.user", { user: userName }),
            t("dashboard.whatsapp.plan", { plan: planLabel }),
            t("dashboard.whatsapp.currency", { currency }),
            t("dashboard.whatsapp.price", { price })
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
        accessDetailsError.textContent = t("dashboard.access_modal.request_error");
        accessDetailsError.classList.remove("d-none");
      } else {
        alert(t("dashboard.access_modal.request_error"));
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
  if (txt) txt.innerText = text || t("dashboard.loading_default");
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
    return `
      <span class="text-success status-icon" title="${t("status.available")}">
        <i class="bi bi-check-circle-fill"></i>
      </span>
    `;
  }
  return `
    <span class="text-danger status-icon" title="${t("status.unavailable")}">
      <i class="bi bi-x-circle-fill"></i>
    </span>
  `;
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number" && Number.isFinite(value)) return value.toLocaleString(getLocale());
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
        <div class="fw-semibold mb-2">${t("dashboard.details_list_title")}</div>
        <ul class="list-group list-group-flush">
          ${lots.map((lot, idx) => {
            const prices = Array.isArray(lot.prices) ? lot.prices : [];
            const priceHtml = prices.length
              ? renderPriceTokens(prices)
              : `<span class="text-muted">${t("dashboard.details_no_price")}</span>`;
            const lotLabel = lot?.name
              ? escapeHtml(lot.name)
              : t("dashboard.item_label", { index: idx + 1 });
            return `
              <li class="list-group-item d-flex align-items-center gap-2">
                <span class="fw-semibold">${lotLabel}</span>
                <span class="flex-grow-1 lot-prices">${priceHtml}</span>
                <a class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" href="https://mudream.online/pt/market" target="_blank" rel="noopener">
                  <i class="bi bi-box-arrow-up-right"></i>
                  ${t("dashboard.button.go")}
                </a>
              </li>
            `;
          }).join("")}
        </ul>
      </div>
    `
    : `<div class="text-muted">${t("dashboard.details_no_lots")}</div>`;

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
        <td colspan="6" class="text-center text-muted py-4">
          ${t("dashboard.empty_list")}
        </td>
      </tr>
    `;
    return;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          ${t("dashboard.empty_filter")}
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
        <td>${Number.isFinite(s.count) ? s.count : "-"}</td>
        <td>
          <div class="d-inline-flex flex-nowrap gap-1">
            <button class="btn btn-sm btn-outline-primary" onclick="showDetails(${index})">${t("dashboard.button.details")}</button>
            <button class="btn btn-sm btn-danger" onclick="removeSearch(${index})">${t("dashboard.button.delete")}</button>
          </div>
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

  const fallbackItem = t("dashboard.item_generic");
  const detailName = s.name || fallbackItem;
  const detailLabel = s.type ? `${s.type} - ${detailName}` : detailName;
  titleEl.textContent = t("dashboard.details_prefix", { label: detailLabel });
  bodyEl.innerHTML = `<div class="text-muted">${t("dashboard.details_loading")}</div>`;

  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  if (!s.found) {
    bodyEl.innerHTML = `<div class="text-muted">${t("dashboard.details_unavailable")}</div>`;
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
      bodyEl.innerHTML = `<div class="text-danger">${escapeHtml(data?.error || t("dashboard.details_error"))}</div>`;
      return;
    }

    const details = await res.json();
    bodyEl.innerHTML = buildDetailsHtml(details);
  } catch (e) {
    console.error(e);
    bodyEl.innerHTML = `<div class="text-danger">${t("dashboard.details_error")}</div>`;
  }
};

// ========================
// API - Load
// ========================
async function loadSearches() {
  try {
    showLoading(t("dashboard.loading_searches"));

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
    alert(t("dashboard.alert_error_load"));
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
    alert(t("dashboard.alert_enter_name"));
    return;
  }

  const type = itemType.value.trim();
  if (!type) {
    alert(t("dashboard.alert_enter_type"));
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
    alert(t("dashboard.alert_duplicate"));
    return;
  }

  try {
    showLoading(t("dashboard.loading_save"));

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
    alert(t("dashboard.alert_error_save"));
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

  const ok = confirm(t("dashboard.confirm_delete"));
  if (!ok) return;

  try {
    showLoading(t("dashboard.loading_delete"));

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
    alert(t("dashboard.alert_error_delete"));
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
      alert(t("dashboard.access_expired_request"));
    }
    return;
  }

  if (searches.length === 0) {
    alert(t("dashboard.alert_no_searches"));
    return;
  }

  try {
    showLoading(t("dashboard.loading_search"));

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
    alert(t("dashboard.alert_error_run"));
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

document.addEventListener("langchange", () => {
  updateAccessUntil();
  updatePlanSummary();
  renderList();
  if (profileData) fillProfile(profileData);
});

// init
loadSearches();
