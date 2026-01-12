// ========================
// Auth guard (admin only)
// ========================
const token = localStorage.getItem("token");
if (!token) {
  window.location.replace(frontendUrl("index.html"));
}

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
if (payload?.username !== "admin") {
  window.location.replace(frontendUrl("dashboard.html"));
}

const listEl = document.getElementById("userList");
const errEl = document.getElementById("userError");
const okEl = document.getElementById("userOk");
const smtpForm = document.getElementById("smtpForm");
const smtpError = document.getElementById("smtpError");
const smtpOk = document.getElementById("smtpOk");
const discordForm = document.getElementById("discordForm");
const discordError = document.getElementById("discordError");
const discordOk = document.getElementById("discordOk");
const btnDiscordTest = document.getElementById("btnDiscordTest");
const requestListEl = document.getElementById("requestList");
const requestError = document.getElementById("requestError");
const requestOk = document.getElementById("requestOk");
const requestStatusFilter = document.getElementById("requestStatusFilter");
const btnRequestReload = document.getElementById("btnRequestReload");
const btnRequestPrevPage = document.getElementById("btnRequestPrevPage");
const btnRequestNextPage = document.getElementById("btnRequestNextPage");
const requestPageInfo = document.getElementById("requestPageInfo");
const btnPrevPage = document.getElementById("btnPrevPage");
const btnNextPage = document.getElementById("btnNextPage");
const userPageInfo = document.getElementById("userPageInfo");

const PAGE_LIMIT = 20;
let userOffset = 0;
let userTotal = 0;
const REQUEST_LIMIT = 20;
let requestOffset = 0;
let requestTotal = 0;

function showError(msg) {
  okEl.classList.add("d-none");
  errEl.textContent = msg;
  errEl.classList.remove("d-none");
}

function showOk(msg) {
  errEl.classList.add("d-none");
  okEl.textContent = msg;
  okEl.classList.remove("d-none");
}

function clearMessages() {
  errEl.classList.add("d-none");
  okEl.classList.add("d-none");
}

function clearSmtpMessages() {
  smtpError.classList.add("d-none");
  smtpOk.classList.add("d-none");
}

function clearDiscordMessages() {
  discordError.classList.add("d-none");
  discordOk.classList.add("d-none");
}

function clearRequestMessages() {
  if (requestError) requestError.classList.add("d-none");
  if (requestOk) requestOk.classList.add("d-none");
}

function showRequestError(msg) {
  if (!requestError) return;
  if (requestOk) requestOk.classList.add("d-none");
  requestError.textContent = msg;
  requestError.classList.remove("d-none");
}

function showRequestOk(msg) {
  if (!requestOk) return;
  if (requestError) requestError.classList.add("d-none");
  requestOk.textContent = msg;
  requestOk.classList.remove("d-none");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUsers(users) {
  listEl.innerHTML = "";

  if (!users || users.length === 0) {
    listEl.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          Nenhum usuario encontrado.
        </td>
      </tr>
    `;
    return;
  }

  users.forEach(u => {
    listEl.innerHTML += `
      <tr>
        <td>${u.id}</td>
        <td>
          <input type="text" class="form-control form-control-sm" value="${escapeHtml(u.username)}" data-user="${u.id}" data-field="username">
        </td>
        <td>
          <input type="email" class="form-control form-control-sm" value="${escapeHtml(u.email || "")}" data-user="${u.id}" data-field="email">
        </td>
        <td>
          <input type="datetime-local" class="form-control form-control-sm" value="${toLocalInput(u.access_until)}" data-user="${u.id}" data-field="access_until">
        </td>
        <td>${escapeHtml(u.created_at || "-")}</td>
        <td>
          <input type="password" class="form-control form-control-sm" placeholder="Nova senha" data-user="${u.id}" data-field="password">
        </td>
        <td>
          <button class="btn btn-sm btn-success" onclick="saveUser(${u.id})">Salvar</button>
        </td>
      </tr>
    `;
  });
}

function formatPlanDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return "-";
  if (n === 7) return "1 semana";
  return `${n} dias`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(d);
}

function renderRequestStatus(status) {
  const val = String(status || "pending");
  if (val === "done") {
    return "<span class=\"badge text-bg-success\">Concluida</span>";
  }
  if (val === "canceled") {
    return "<span class=\"badge text-bg-secondary\">Cancelada</span>";
  }
  return "<span class=\"badge text-bg-warning\">Pendente</span>";
}

function renderRequests(rows) {
  if (!requestListEl) return;
  requestListEl.innerHTML = "";

  if (!rows || rows.length === 0) {
    requestListEl.innerHTML = `
      <tr>
        <td colspan="11" class="text-center text-muted py-4">
          Nenhuma solicitacao encontrada.
        </td>
      </tr>
    `;
    return;
  }

  rows.forEach(r => {
    const status = String(r.status || "pending");
    let actionHtml = "-";
    if (status === "pending") {
      actionHtml = `
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-success" onclick="setRequestStatus(${r.id}, 'done')">Concluir</button>
          <button class="btn btn-sm btn-outline-danger" onclick="setRequestStatus(${r.id}, 'canceled')">Recusar</button>
        </div>
      `;
    } else {
      actionHtml = `
        <button class="btn btn-sm btn-outline-secondary" onclick="setRequestStatus(${r.id}, 'pending')">Reabrir</button>
      `;
    }

    requestListEl.innerHTML += `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.username || "-")}</td>
        <td>${escapeHtml(r.email || "-")}</td>
        <td>${escapeHtml([r.contact_name, r.contact_last_name].filter(Boolean).join(" ") || "-")}</td>
        <td>${escapeHtml(r.contact_email || "-")}</td>
        <td>${escapeHtml(r.contact_phone || "-")}</td>
        <td>${escapeHtml(formatPlanDays(r.plan_days))}</td>
        <td>${escapeHtml(r.currency || "-")}</td>
        <td>${escapeHtml(r.price || "-")}</td>
        <td>${escapeHtml(formatDateTime(r.requested_at))}</td>
        <td>${renderRequestStatus(status)}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  });
}

function toLocalInput(value) {
  if (!value) return "";
  let v = String(value);
  if (v.includes(" ") && !v.includes("T")) {
    v = v.replace(" ", "T");
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function updatePager() {
  const start = userTotal === 0 ? 0 : userOffset + 1;
  const end = Math.min(userOffset + PAGE_LIMIT, userTotal);
  userPageInfo.textContent = `Mostrando ${start}-${end} de ${userTotal}`;
  btnPrevPage.disabled = userOffset === 0;
  btnNextPage.disabled = userOffset + PAGE_LIMIT >= userTotal;
}

function updateRequestPager() {
  if (!requestPageInfo) return;
  const start = requestTotal === 0 ? 0 : requestOffset + 1;
  const end = Math.min(requestOffset + REQUEST_LIMIT, requestTotal);
  requestPageInfo.textContent = `Mostrando ${start}-${end} de ${requestTotal}`;
  if (btnRequestPrevPage) btnRequestPrevPage.disabled = requestOffset === 0;
  if (btnRequestNextPage) btnRequestNextPage.disabled = requestOffset + REQUEST_LIMIT >= requestTotal;
}

async function loadUsers() {
  clearMessages();
  try {
    const res = await fetch(apiUrl(`admin/users?limit=${PAGE_LIMIT}&offset=${userOffset}`), {
      headers: { "Authorization": "Bearer " + token }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.replace(frontendUrl("index.html"));
      return;
    }

    if (res.status === 403) {
      window.location.replace(frontendUrl("dashboard.html"));
      return;
    }

    if (!res.ok) throw new Error("Falha ao carregar");

    const data = await res.json();
    renderUsers(data.rows || []);
    userTotal = Number(data.total || 0);
    updatePager();
  } catch (e) {
    showError("Erro ao carregar usuarios.");
    console.error(e);
  }
}

async function loadRequests() {
  if (!requestListEl) return;
  clearRequestMessages();
  const status = requestStatusFilter ? requestStatusFilter.value : "pending";

  try {
    const res = await fetch(apiUrl(`admin/access-requests?limit=${REQUEST_LIMIT}&offset=${requestOffset}&status=${encodeURIComponent(status)}`), {
      headers: { "Authorization": "Bearer " + token }
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.replace(frontendUrl("index.html"));
      return;
    }

    if (res.status === 403) {
      window.location.replace(frontendUrl("dashboard.html"));
      return;
    }

    if (!res.ok) throw new Error("Falha ao carregar");

    const data = await res.json();
    renderRequests(data.rows || []);
    requestTotal = Number(data.total || 0);
    updateRequestPager();
  } catch (e) {
    showRequestError("Erro ao carregar solicitacoes.");
    console.error(e);
  }
}

window.setRequestStatus = async function (id, status) {
  clearRequestMessages();
  try {
    const res = await fetch(apiUrl(`admin/access-requests/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ status })
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.replace(frontendUrl("index.html"));
      return;
    }

    if (res.status === 403) {
      window.location.replace(frontendUrl("dashboard.html"));
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showRequestError(data?.error || "Falha ao atualizar solicitacao.");
      return;
    }

    showRequestOk("Solicitacao atualizada.");
    await loadRequests();
  } catch (e) {
    showRequestError("Erro ao atualizar solicitacao.");
    console.error(e);
  }
};

window.saveUser = async function (id) {
  clearMessages();

  const usernameInput = document.querySelector(`input[data-user="${id}"][data-field="username"]`);
  const passwordInput = document.querySelector(`input[data-user="${id}"][data-field="password"]`);
  const accessInput = document.querySelector(`input[data-user="${id}"][data-field="access_until"]`);
  const emailInput = document.querySelector(`input[data-user="${id}"][data-field="email"]`);

  const username = usernameInput?.value.trim();
  const password = passwordInput?.value.trim();
  const access_until = accessInput?.value || "";
  const email = emailInput?.value.trim() || "";

  if (!username && !password && !access_until && !email) {
    showError("Informe usuario, email, senha ou data de acesso.");
    return;
  }

  if (email) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      showError("Email invalido.");
      return;
    }
  }

  try {
    const res = await fetch(apiUrl(`admin/users/${id}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        username: username || undefined,
        email: email || undefined,
        password: password || undefined,
        access_until: access_until ? toIso(access_until) : null
      })
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.replace(frontendUrl("index.html"));
      return;
    }

    if (res.status === 403) {
      window.location.replace(frontendUrl("dashboard.html"));
      return;
    }

    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      showError(data?.error || "Dados ja existem.");
      return;
    }

    if (!res.ok) throw new Error("Falha ao salvar");

    if (passwordInput) passwordInput.value = "";
    showOk("Usuario atualizado.");
    await loadUsers();
  } catch (e) {
    showError("Erro ao salvar usuario.");
    console.error(e);
  }
};

document.getElementById("btnBack").addEventListener("click", () => {
  window.location.replace(frontendUrl("dashboard.html"));
});

document.getElementById("btnReload").addEventListener("click", loadUsers);
btnPrevPage.addEventListener("click", () => {
  userOffset = Math.max(userOffset - PAGE_LIMIT, 0);
  loadUsers();
});
btnNextPage.addEventListener("click", () => {
  if (userOffset + PAGE_LIMIT < userTotal) {
    userOffset += PAGE_LIMIT;
    loadUsers();
  }
});

if (btnRequestReload) {
  btnRequestReload.addEventListener("click", () => {
    requestOffset = 0;
    loadRequests();
  });
}
if (btnRequestPrevPage) {
  btnRequestPrevPage.addEventListener("click", () => {
    requestOffset = Math.max(requestOffset - REQUEST_LIMIT, 0);
    loadRequests();
  });
}
if (btnRequestNextPage) {
  btnRequestNextPage.addEventListener("click", () => {
    if (requestOffset + REQUEST_LIMIT < requestTotal) {
      requestOffset += REQUEST_LIMIT;
      loadRequests();
    }
  });
}
if (requestStatusFilter) {
  requestStatusFilter.addEventListener("change", () => {
    requestOffset = 0;
    loadRequests();
  });
}

async function loadSmtpConfig() {
  clearSmtpMessages();
  try {
    const res = await fetch(apiUrl("admin/email-config"), {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Falha ao carregar SMTP");

    const data = await res.json();
    document.getElementById("smtpHost").value = data.smtp_host || "";
    document.getElementById("smtpPort").value = data.smtp_port || "";
    document.getElementById("smtpUser").value = data.smtp_user || "";
    document.getElementById("smtpPass").value = data.smtp_pass || "";
    document.getElementById("smtpFrom").value = data.smtp_from || "";
    document.getElementById("smtpSecure").checked = String(data.smtp_secure) === "true";
  } catch (e) {
    smtpError.textContent = "Erro ao carregar configuracao SMTP.";
    smtpError.classList.remove("d-none");
    console.error(e);
  }
}

async function loadDiscordConfig() {
  clearDiscordMessages();
  try {
    const res = await fetch(apiUrl("admin/discord-config"), {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!res.ok) throw new Error("Falha ao carregar Discord");
    const data = await res.json();
    document.getElementById("discordWebhook").value = data.webhook_url || "";
    document.getElementById("discordCooldown").value = data.cooldown_minutes || "120";
  } catch (e) {
    discordError.textContent = "Erro ao carregar configuracao do Discord.";
    discordError.classList.remove("d-none");
    console.error(e);
  }
}

smtpForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearSmtpMessages();

  const payload = {
    smtp_host: document.getElementById("smtpHost").value.trim(),
    smtp_port: document.getElementById("smtpPort").value.trim(),
    smtp_user: document.getElementById("smtpUser").value.trim(),
    smtp_pass: document.getElementById("smtpPass").value.trim(),
    smtp_from: document.getElementById("smtpFrom").value.trim(),
    smtp_secure: document.getElementById("smtpSecure").checked
  };

  try {
    const res = await fetch(apiUrl("admin/email-config"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Falha ao salvar SMTP");
    smtpOk.textContent = "Configuracao SMTP salva.";
    smtpOk.classList.remove("d-none");
  } catch (e) {
    smtpError.textContent = "Erro ao salvar configuracao SMTP.";
    smtpError.classList.remove("d-none");
    console.error(e);
  }
});

document.getElementById("btnSmtpTest").addEventListener("click", async () => {
  clearSmtpMessages();
  const to = document.getElementById("smtpTestTo").value.trim();
  if (!to) {
    smtpError.textContent = "Informe o email de teste.";
    smtpError.classList.remove("d-none");
    return;
  }

  try {
    const res = await fetch(apiUrl("admin/email-test"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ to })
    });

    if (!res.ok) throw new Error("Falha no teste");
    smtpOk.textContent = "Email de teste enviado.";
    smtpOk.classList.remove("d-none");
  } catch (e) {
    smtpError.textContent = "Erro ao enviar email de teste.";
    smtpError.classList.remove("d-none");
    console.error(e);
  }
});

if (discordForm) {
  discordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearDiscordMessages();

    const webhook_url = document.getElementById("discordWebhook").value.trim();
    const cooldown_minutes = document.getElementById("discordCooldown").value.trim();
    if (!webhook_url) {
      discordError.textContent = "Informe a Webhook URL.";
      discordError.classList.remove("d-none");
      return;
    }
    if (!cooldown_minutes || Number(cooldown_minutes) <= 0) {
      discordError.textContent = "Informe um cooldown valido.";
      discordError.classList.remove("d-none");
      return;
    }

    try {
      const res = await fetch(apiUrl("admin/discord-config"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ webhook_url, cooldown_minutes })
      });

      if (!res.ok) throw new Error("Falha ao salvar Discord");
      discordOk.textContent = "Configuracao do Discord salva.";
      discordOk.classList.remove("d-none");
    } catch (e) {
      discordError.textContent = "Erro ao salvar configuracao do Discord.";
      discordError.classList.remove("d-none");
      console.error(e);
    }
  });
}

if (btnDiscordTest) {
  btnDiscordTest.addEventListener("click", async () => {
    clearDiscordMessages();
    try {
      const res = await fetch(apiUrl("admin/discord-test"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        discordError.textContent = data?.error || "Falha ao testar Discord.";
        discordError.classList.remove("d-none");
        return;
      }

      discordOk.textContent = "Teste enviado para o Discord.";
      discordOk.classList.remove("d-none");
    } catch (e) {
      discordError.textContent = "Erro ao testar Discord.";
      discordError.classList.remove("d-none");
      console.error(e);
    }
  });
}

loadUsers();
loadSmtpConfig();
loadDiscordConfig();
loadRequests();
