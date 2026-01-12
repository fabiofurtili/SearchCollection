import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const router = express.Router();

// login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE username = ?",
    username
  );

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      access_until: user.access_until || null
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({
    token,
    access_until: user.access_until || null
  });
});

// register
router.post("/register", async (req, res) => {
  const { username, password, device_id, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Dados invalidos" });
  }

  if (!device_id) {
    return res.status(400).json({ error: "Dispositivo invalido" });
  }

  const deviceHash = crypto
    .createHash("sha256")
    .update(String(device_id))
    .digest("hex");

  const existingDevice = await db.get(
    "SELECT id FROM users WHERE device_hash = ?",
    deviceHash
  );

  if (existingDevice) {
    return res.status(403).json({
      error: "Dispositivo ja utilizou o acesso teste."
    });
  }

  const existing = await db.get(
    "SELECT id FROM users WHERE username = ?",
    username
  );

  if (existing) {
    return res.status(409).json({ error: "Usuario ja existe" });
  }

  const existingEmail = await db.get(
    "SELECT id FROM users WHERE email = ?",
    email
  );
  if (existingEmail) {
    return res.status(409).json({ error: "Email ja cadastrado" });
  }

  const hash = await bcrypt.hash(password, 10);
  const accessUntil = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  await db.run(
    "INSERT INTO users (username, password_hash, access_until, device_hash, email) VALUES (?, ?, ?, ?, ?)",
    [username, hash, accessUntil, deviceHash, email]
  );

  res.json({ ok: true });
});

// forgot password
router.post("/forgot", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email obrigatorio" });
  }

  const settings = await db.all(
    "SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?, ?, ?)",
    ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"]
  );
  const map = Object.fromEntries(settings.map(r => [r.key, r.value]));
  const smtpHost = map.smtp_host || "";
  const smtpPort = map.smtp_port || "";
  const smtpUser = map.smtp_user || "";
  const smtpPass = map.smtp_pass || "";
  const smtpFrom = map.smtp_from || "";
  const smtpSecure = map.smtp_secure || "false";

  if (!smtpHost || !smtpPort || !smtpFrom) {
    return res.status(500).json({ error: "Email nao configurado" });
  }

  const user = await db.get(
    "SELECT id, username FROM users WHERE email = ?",
    email
  );

  if (!user) {
    return res.json({ ok: true });
  }

  const tempPass = crypto.randomBytes(6).toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10);

  const hash = await bcrypt.hash(tempPass, 10);
  await db.run(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [hash, user.id]
  );

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort || 587),
    secure: String(smtpSecure) === "true",
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined
  });

  await transport.sendMail({
    from: smtpFrom,
    to: email,
    subject: "Recuperacao de senha - Search Collection",
    text: `Usuario: ${user.username}\nSenha temporaria: ${tempPass}\n\nRecomendamos alterar a senha apos o login.`
  });

  res.json({ ok: true });
});

// seed simples (remover em produção)
router.post("/seed", async (req, res) => {
  const hash = await bcrypt.hash("admin", 10);
  await db.run(
    "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?,?)",
    ["admin", hash]
  );
  res.json({ ok: true });
});

export default router;
