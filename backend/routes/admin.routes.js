import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { db } from "../db.js";
import { auth } from "../auth.middleware.js";

const router = express.Router();
const ACCESS_STATUSES = new Set(["pending", "done", "canceled"]);

function ensureAdmin(req, res, next) {
  if (req.user?.username !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

router.use(auth, ensureAdmin);

async function getSetting(key) {
  const row = await db.get("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? null;
}

async function setSetting(key, value) {
  await db.run(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

async function getEmailConfig() {
  const keys = [
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from",
    "smtp_secure"
  ];
  const rows = await db.all(
    `SELECT key, value FROM settings WHERE key IN (${keys.map(() => "?").join(",")})`,
    keys
  );
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    smtp_host: map.smtp_host || "",
    smtp_port: map.smtp_port || "",
    smtp_user: map.smtp_user || "",
    smtp_pass: map.smtp_pass || "",
    smtp_from: map.smtp_from || "",
    smtp_secure: map.smtp_secure || "false"
  };
}

function getTransport(config) {
  return nodemailer.createTransport({
    host: config.smtp_host,
    port: Number(config.smtp_port || 587),
    secure: String(config.smtp_secure) === "true",
    auth: config.smtp_user
      ? { user: config.smtp_user, pass: config.smtp_pass }
      : undefined
  });
}

router.get("/email-config", async (req, res) => {
  const config = await getEmailConfig();
  res.json(config);
});

router.get("/discord-config", async (req, res) => {
  const webhook_url = await getSetting("discord_webhook_url");
  const cooldown_minutes = await getSetting("discord_cooldown_minutes");
  res.json({
    webhook_url: webhook_url || "",
    cooldown_minutes: cooldown_minutes || "120"
  });
});

router.put("/email-config", async (req, res) => {
  const {
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_pass,
    smtp_from,
    smtp_secure
  } = req.body || {};

  if (!smtp_host || !smtp_port || !smtp_from) {
    return res.status(400).json({ error: "Dados invalidos" });
  }

  await setSetting("smtp_host", String(smtp_host));
  await setSetting("smtp_port", String(smtp_port));
  await setSetting("smtp_user", String(smtp_user || ""));
  await setSetting("smtp_pass", String(smtp_pass || ""));
  await setSetting("smtp_from", String(smtp_from));
  await setSetting("smtp_secure", String(!!smtp_secure));

  res.json({ ok: true });
});

router.put("/discord-config", async (req, res) => {
  const webhook_url = String(req.body?.webhook_url || "").trim();
  const cooldown_minutes = String(req.body?.cooldown_minutes || "").trim();
  if (!webhook_url) {
    return res.status(400).json({ error: "Webhook obrigatorio" });
  }
  if (!cooldown_minutes || Number(cooldown_minutes) <= 0) {
    return res.status(400).json({ error: "Cooldown invalido" });
  }
  await setSetting("discord_webhook_url", webhook_url);
  await setSetting("discord_cooldown_minutes", cooldown_minutes);
  res.json({ ok: true });
});

router.post("/discord-test", async (req, res) => {
  const webhookUrl = await getSetting("discord_webhook_url");
  if (!webhookUrl) {
    return res.status(400).json({ error: "Discord nao configurado" });
  }

  const content = "Teste de webhook - Search Collection";
  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });

  if (!resp.ok) {
    return res.status(502).json({ error: "Falha ao enviar ao Discord" });
  }

  res.json({ ok: true });
});

router.post("/email-test", async (req, res) => {
  const { to } = req.body || {};
  if (!to) {
    return res.status(400).json({ error: "Email de teste obrigatorio" });
  }

  const config = await getEmailConfig();
  if (!config.smtp_host || !config.smtp_port || !config.smtp_from) {
    return res.status(400).json({ error: "SMTP nao configurado" });
  }

  const transport = getTransport(config);
  await transport.sendMail({
    from: config.smtp_from,
    to,
    subject: "Teste de email - Search Collection",
    text: "Seu envio de teste foi realizado com sucesso."
  });

  res.json({ ok: true });
});

router.get("/access-requests", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const status = String(req.query.status || "all").toLowerCase();

  const params = [];
  let whereSql = "";
  if (status !== "all") {
    if (!ACCESS_STATUSES.has(status)) {
      return res.status(400).json({ error: "Status invalido" });
    }
    whereSql = "WHERE ar.status = ?";
    params.push(status);
  }

  const rows = await db.all(
    `
      SELECT ar.id, ar.user_id, ar.plan_days, ar.currency, ar.price, ar.status, ar.requested_at,
             ar.contact_name, ar.contact_last_name, ar.contact_email, ar.contact_phone, ar.contact_notes,
             u.username, u.email
      FROM access_requests ar
      LEFT JOIN users u ON u.id = ar.user_id
      ${whereSql}
      ORDER BY ar.requested_at DESC
      LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  const totalRow = await db.get(
    `SELECT COUNT(1) as total FROM access_requests ar ${whereSql}`,
    params
  );

  res.json({ rows, total: totalRow?.total || 0, limit, offset });
});

router.patch("/access-requests/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "ID invalido" });
  }

  const status = String(req.body?.status || "").toLowerCase();
  if (!ACCESS_STATUSES.has(status)) {
    return res.status(400).json({ error: "Status invalido" });
  }

  const request = await db.get(
    "SELECT id, user_id, plan_days FROM access_requests WHERE id = ?",
    id
  );
  if (!request) {
    return res.status(404).json({ error: "Solicitacao nao encontrada" });
  }

  await db.run(
    "UPDATE access_requests SET status = ? WHERE id = ?",
    [status, id]
  );

  if (status === "done") {
    const planDays = Number(request.plan_days);
    if (Number.isFinite(planDays) && planDays > 0) {
      const user = await db.get(
        "SELECT access_until FROM users WHERE id = ?",
        request.user_id
      );
      const now = Date.now();
      const current = user?.access_until ? new Date(user.access_until).getTime() : NaN;
      const base = Number.isFinite(current) && current > now ? current : now;
      const newAccess = new Date(base + planDays * 24 * 60 * 60 * 1000).toISOString();
      await db.run(
        "UPDATE users SET access_until = ? WHERE id = ?",
        [newAccess, request.user_id]
      );
    }
  }

  const updated = await db.get(
    `
      SELECT ar.id, ar.user_id, ar.plan_days, ar.currency, ar.price, ar.status, ar.requested_at,
             ar.contact_name, ar.contact_last_name, ar.contact_email, ar.contact_phone, ar.contact_notes,
             u.username, u.email
      FROM access_requests ar
      LEFT JOIN users u ON u.id = ar.user_id
      WHERE ar.id = ?
    `,
    id
  );

  res.json(updated || { ok: true });
});

router.get("/users", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const rows = await db.all(
    "SELECT id, username, email, access_until, created_at FROM users ORDER BY id ASC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  const totalRow = await db.get("SELECT COUNT(1) as total FROM users");
  res.json({ rows, total: totalRow?.total || 0, limit, offset });
});

router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "ID invalido" });
  }

  const { username, password, access_until, email } = req.body || {};

  if (!username && !password && access_until === undefined && !email) {
    return res.status(400).json({ error: "Nada para atualizar" });
  }

  if (username) {
    const exists = await db.get(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username, id]
    );
    if (exists) {
      return res.status(409).json({ error: "Usuario ja existe" });
    }
  }

  if (email) {
    const existsEmail = await db.get(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );
    if (existsEmail) {
      return res.status(409).json({ error: "Email ja cadastrado" });
    }
  }

  const updates = [];
  const params = [];

  if (username) {
    updates.push("username = ?");
    params.push(username);
  }

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    updates.push("password_hash = ?");
    params.push(hash);
  }

  if (email) {
    updates.push("email = ?");
    params.push(email);
  }

  if (access_until !== undefined) {
    updates.push("access_until = ?");
    params.push(access_until || null);
  }

  params.push(id);

  await db.run(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  const updated = await db.get(
    "SELECT id, username, email, access_until, created_at FROM users WHERE id = ?",
    id
  );

  res.json(updated);
});

export default router;
