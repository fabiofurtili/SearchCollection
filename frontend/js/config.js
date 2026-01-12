window.APP_CONFIG = {
  API_BASE: "/dream/api",
  FRONTEND_BASE: "/dream/frontend"
};

function apiUrl(path) {
  const base = window.APP_CONFIG.API_BASE.replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

function frontendUrl(path) {
  const base = window.APP_CONFIG.FRONTEND_BASE.replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}
