import express from "express";
import { auth } from "../auth.middleware.js";
import { db } from "../db.js";

const router = express.Router();

async function getSetting(key) {
  const row = await db.get("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? "";
}

const PLAN_LABELS = {
  7: "1 semana",
  30: "30 dias",
  60: "60 dias"
};

const PLAN_PRICES = {
  7: { BRL: "R$ 4,99", USD: "$ 0,99" },
  30: { BRL: "R$ 9,99", USD: "$ 1,99" },
  60: { BRL: "R$ 14,99", USD: "$ 2,99" }
};

router.post("/", auth, async (req, res) => {
  try {
    const cooldownMinutes = Number(await getSetting("discord_cooldown_minutes") || 120);
    const cooldownMs = Math.max(1, cooldownMinutes) * 60 * 1000;

    const planDays = Number(req.body?.plan_days);
    const currency = String(req.body?.currency || "BRL").toUpperCase();
    const contactName = String(req.body?.contact_name || "").trim();
    const contactLastName = String(req.body?.contact_last_name || "").trim();
    const contactEmail = String(req.body?.contact_email || "").trim();
    const contactEmailConfirm = String(req.body?.contact_email_confirm || "").trim();
    const contactPhone = String(req.body?.contact_phone || "").trim();
    const contactNotes = String(req.body?.contact_notes || "").trim();

    if (![7, 30, 60].includes(planDays)) {
      return res.status(400).json({ error: "Plano invalido" });
    }
    if (!["BRL", "USD"].includes(currency)) {
      return res.status(400).json({ error: "Moeda invalida" });
    }
    if (!contactName || !contactLastName || !contactEmail || !contactEmailConfirm || !contactPhone) {
      return res.status(400).json({ error: "Dados de contato invalidos" });
    }
    if (contactEmail !== contactEmailConfirm) {
      return res.status(400).json({ error: "Emails nao conferem" });
    }

    const user = await db.get(
      "SELECT username, email FROM users WHERE id = ?",
      req.user.id
    );

    if (!user) {
      return res.status(401).json({ error: "Usuario nao encontrado" });
    }

    const webhookUrl = await getSetting("discord_webhook_url");
    if (!webhookUrl) {
      return res.status(400).json({ error: "Discord nao configurado" });
    }

    const lastRequest = await db.get(
      "SELECT requested_at FROM access_requests WHERE user_id = ? ORDER BY requested_at DESC LIMIT 1",
      req.user.id
    );
    if (lastRequest?.requested_at) {
      const lastTime = new Date(lastRequest.requested_at);
      if (!Number.isNaN(lastTime.getTime())) {
        const elapsed = Date.now() - lastTime.getTime();
        if (elapsed < cooldownMs) {
          const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
          return res.status(429).json({
            error: `Aguarde ${remaining} minuto(s) para enviar outra solicitacao.`,
            code: "ACCESS_REQUEST_COOLDOWN"
          });
        }
      }
    }

    const price = PLAN_PRICES[planDays]?.[currency] || "-";
    const planLabel = PLAN_LABELS[planDays] || `${planDays} dias`;
    const currencyLabel = currency === "USD" ? "USD" : "BRL";
    const now = new Date().toISOString();

    const content = [
      "Nova solicitacao de acesso",
      `Usuario: ${user.username}`,
      `Email cadastro: ${user.email || "-"}`,
      `Nome: ${contactName} ${contactLastName}`,
      `Email contato: ${contactEmail}`,
      `Whatsapp: ${contactPhone}`,
      `Plano: ${planLabel} (${price} ${currencyLabel})`,
      `Moeda escolhida: ${currencyLabel}`,
      `Data: ${now}`,
      contactNotes ? `Observacoes: ${contactNotes}` : null
    ].filter(Boolean).join("\n");

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    if (!discordRes.ok) {
      return res.status(502).json({ error: "Falha ao enviar ao Discord" });
    }

    await db.run(
      "INSERT INTO access_requests (user_id, plan_days, currency, price, status, contact_name, contact_last_name, contact_email, contact_phone, contact_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, planDays, currencyLabel, price, "pending", contactName, contactLastName, contactEmail, contactPhone, contactNotes || null]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
