import express from "express";
import { auth } from "../auth.middleware.js";
import { db } from "../db.js";
const router = express.Router();

const GRAPHQL_URL = process.env.MARKET_GRAPHQL_URL || "https://mudream.online/api/graphql";
const MARKET_TOKEN = process.env.MARKET_TOKEN || "";
const LIMIT = 50;
const SORT = { field: "LOT_FIELD_UPDATED_AT", type: "SORT_TYPE_DESC" };
const REQUEST_TIMEOUT_MS = Number(process.env.MARKET_REQUEST_TIMEOUT_MS || 12000);
const RETRY_ATTEMPTS = Math.max(1, Number(process.env.MARKET_RETRY_ATTEMPTS || 3));
const RETRY_BASE_DELAY_MS = Number(process.env.MARKET_RETRY_BASE_DELAY_MS || 500);
const DETAILS_LIMIT = Math.max(1, Number(process.env.MARKET_DETAILS_LIMIT || 20));
const QUERY = `query GET_ALL_LOTS($offset: NonNegativeInt, $limit: NonNegativeInt, $sort: LotsSortInput, $filter: LotsFilterInput) {
  lots(limit: $limit, offset: $offset, sort: $sort, filter: $filter) {
    Lots {
      id
      source
      isMine
      type
      gearScore
      hasPendingCounterOffer
      Prices {
        value
        Currency {
          id
          code
          type
          title
          __typename
        }
        __typename
      }
      Currencies {
        id
        code
        type
        title
        isAvailableForLots
        __typename
      }
      __typename
    }
    Pagination {
      total
      currentPage
      nextPageExists
      __typename
    }
    __typename
  }
}`;

const OPTION_FILTERS = {
  mh: "iml",
  sd: "imsd",
  dd: "dd",
  ref: "rd",
  dsr: "dsr",
  zen: "izdr"
};

const OPTION_VALUES = [0, 1, 2, 3, 4];

function getAuthHeader() {
  const token = MARKET_TOKEN.trim();
  if (!token) return "";
  return token.toLowerCase().startsWith("bearer ") ? token : `Bearer ${token}`;
}

function normalizeType(type) {
  if (!type) return "";
  const t = String(type).trim().toLowerCase();
  if (!t) return "";
  if (["helm", "armor", "gloves", "pants", "boots"].includes(t)) return t;
  return t;
}

function buildFilter(search) {
  const options = JSON.parse(search.options_json || "{}");
  const filter = {};

  if (search.item_name) filter.name = search.item_name;

  const type = search.item_type || options.type;
  const normalized = normalizeType(type);
  if (normalized) filter.type = [normalized];

  for (const key of Object.keys(OPTION_FILTERS)) {
    if (options[key]) {
      filter[OPTION_FILTERS[key]] = OPTION_VALUES;
    }
  }

  return filter;
}

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeOptions(options = {}) {
  return {
    mh: !!options.mh,
    sd: !!options.sd,
    dd: !!options.dd,
    ref: !!options.ref,
    dsr: !!options.dsr,
    zen: !!options.zen
  };
}

function optionsSignature(options = {}) {
  const opts = normalizeOptions(options);
  return JSON.stringify({
    mh: opts.mh,
    sd: opts.sd,
    dd: opts.dd,
    ref: opts.ref,
    dsr: opts.dsr,
    zen: opts.zen
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAccessExpired(user) {
  if (!user || user.username === "admin") return false;
  if (!user.access_until) return true;
  const until = new Date(user.access_until);
  if (Number.isNaN(until.getTime())) return true;
  return until.getTime() < Date.now();
}

function createMarketError(message, info = {}) {
  const err = new Error(message);
  err.market = info;
  return err;
}

async function fetchWithRetry(url, options) {
  const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const retryable = retryableStatuses.has(res.status);
        const err = createMarketError(`Market HTTP ${res.status}`, {
          status: res.status,
          retryable
        });
        if (!retryable) throw err;
        throw err;
      }
      return res;
    } catch (err) {
      const isAbort = err?.name === "AbortError";
      const isRetryable = err?.market?.retryable || isAbort;
      const hasNext = attempt < RETRY_ATTEMPTS;

      if (!isRetryable || !hasNext) throw err;

      const backoff = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 150);
      await sleep(backoff + jitter);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

async function fetchLotsCount(filter) {
  const authHeader = getAuthHeader();

  let offset = 0;
  let safety = 0;
  let totalFound = 0;

  while (true) {
    const body = {
      operationName: "GET_ALL_LOTS",
      query: QUERY,
      variables: { filter, limit: LIMIT, offset, sort: SORT }
    };

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/graphql-response+json, application/graphql+json, application/json"
    };
    if (authHeader) headers.Authorization = authHeader;

    const res = await fetchWithRetry(GRAPHQL_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw createMarketError(`Market HTTP ${res.status}`, {
        status: res.status,
        retryable: false
      });
    }

    const payload = await res.json();
    if (payload.errors) {
      throw createMarketError("Market GraphQL error", { retryable: false });
    }

    const lots = payload?.data?.lots?.Lots || [];
    const page = payload?.data?.lots?.Pagination;

    totalFound += lots.length;
    if (!page?.nextPageExists) return totalFound;

    offset += LIMIT;
    safety += 1;
    if (safety > 200) return totalFound;
  }
}

async function fetchLotsDetails(filter) {
  const authHeader = getAuthHeader();

  const body = {
    operationName: "GET_ALL_LOTS",
    query: QUERY,
    variables: { filter, limit: DETAILS_LIMIT, offset: 0, sort: SORT }
  };

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/graphql-response+json, application/graphql+json, application/json"
  };
  if (authHeader) headers.Authorization = authHeader;

  const res = await fetchWithRetry(GRAPHQL_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw createMarketError(`Market HTTP ${res.status}`, {
      status: res.status,
      retryable: false
    });
  }

  const payload = await res.json();
  if (payload.errors) {
    throw createMarketError("Market GraphQL error", { retryable: false });
  }

  const lots = payload?.data?.lots?.Lots || [];

  const normalizeCurrency = (cur) => {
    const raw = cur?.code || cur?.title || cur?.id || "UNKNOWN";
    return String(raw).trim().toUpperCase();
  };

  const mappedLots = lots.map(lot => ({
    id: lot?.id,
    prices: (lot?.Prices || []).map(price => ({
      value: price?.value,
      currency: normalizeCurrency(price?.Currency)
    }))
  }));

  const summaryMap = new Map();
  mappedLots.forEach(lot => {
    lot.prices.forEach(p => {
      const key = p.currency || "UNKNOWN";
      if (!summaryMap.has(key)) {
        summaryMap.set(key, { currency: key, count: 0, min: p.value, max: p.value });
      }
      const entry = summaryMap.get(key);
      entry.count += 1;
      if (typeof p.value === "number") {
        if (typeof entry.min !== "number" || p.value < entry.min) entry.min = p.value;
        if (typeof entry.max !== "number" || p.value > entry.max) entry.max = p.value;
      }
    });
  });

  return {
    total: mappedLots.length,
    lots: mappedLots,
    summary: Array.from(summaryMap.values())
  };
}

// ==========================
// CRUD
// ==========================
router.get("/", auth, async (req, res) => {
  const rows = await db.all(
    "SELECT * FROM search_configs WHERE user_id = ?",
    req.user.id
  );
  res.json(rows);
});

router.post("/", auth, async (req, res) => {
  const { item_name, item_type, options } = req.body;

  const nameKey = normalizeKey(item_name);
  const typeKey = normalizeKey(item_type);
  const newSignature = optionsSignature(options);

  const existing = await db.all(
    "SELECT item_name, item_type, options_json FROM search_configs WHERE user_id = ?",
    req.user.id
  );

  const isDuplicate = existing.some(row => {
    const existingOptions = (() => {
      try { return JSON.parse(row.options_json || "{}"); } catch { return {}; }
    })();
    return (
      normalizeKey(row.item_name) === nameKey &&
      normalizeKey(row.item_type) === typeKey &&
      optionsSignature(existingOptions) === newSignature
    );
  });

  if (isDuplicate) {
    res.status(409).json({
      error: "Pesquisa ja cadastrada com o mesmo item, tipo e opcoes.",
      code: "DUPLICATE_SEARCH"
    });
    return;
  }

  const normalizedOptions = normalizeOptions(options);
  await db.run(
    `INSERT INTO search_configs
     (user_id, item_name, item_type, options_json)
     VALUES (?,?,?,?)`,
    [
      req.user.id,
      item_name,
      item_type,
      JSON.stringify(normalizedOptions)
    ]
  );

  res.json({ ok: true });
});

router.delete("/:id", auth, async (req, res) => {
  await db.run(
    "DELETE FROM search_configs WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

router.get("/:id/details", auth, async (req, res) => {
  try {
    if (isAccessExpired(req.user)) {
      res.status(403).json({
        error: "Acesso expirado. Solicite mais tempo para continuar.",
        code: "ACCESS_EXPIRED"
      });
      return;
    }

    const row = await db.get(
      "SELECT * FROM search_configs WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!row) {
      res.status(404).json({ error: "Pesquisa nao encontrada" });
      return;
    }

    const filter = buildFilter(row);
    const details = await fetchLotsDetails(filter);
    res.json(details);
  } catch (e) {
    console.error(e);
    const friendly = "Falha de comunicacao com o site pesquisado. Tentamos varias vezes, mas a conexao parece instavel no momento. Aguarde alguns instantes e tente novamente.";
    if (e?.market || e?.name === "AbortError") {
      res.status(502).json({ error: friendly, code: "MARKET_UNAVAILABLE" });
      return;
    }
    res.status(500).json({ error: "Erro interno" });
  }
});

// ==========================
// EXECUÇÃO DO SCRAPER
// ==========================
router.post("/run", auth, async (req, res) => {
  try {
    if (isAccessExpired(req.user)) {
      res.status(403).json({
        error: "Acesso expirado. Solicite mais tempo para continuar.",
        code: "ACCESS_EXPIRED"
      });
      return;
    }

    const searches = await db.all(
      "SELECT * FROM search_configs WHERE user_id = ? AND active = 1",
      req.user.id
    );

    const results = [];
    for (const search of searches) {
      const filter = buildFilter(search);
      const count = await fetchLotsCount(filter);
      results.push({ search_id: search.id, found: count > 0, count });
    }

    res.json(results);
  } catch (e) {
    console.error(e);
    const friendly = "Falha de comunicacao com o site pesquisado. Tentamos varias vezes, mas a conexao parece instavel no momento. Aguarde alguns instantes e tente novamente.";
    if (e?.market || e?.name === "AbortError") {
      res.status(502).json({ error: friendly, code: "MARKET_UNAVAILABLE" });
      return;
    }
    res.status(500).json({ error: "Erro interno" });
  }
});

// ✅ ISSO É O QUE ESTAVA FALTANDO
export default router;
