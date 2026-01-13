import express from "express";
import bcrypt from "bcrypt";
import { auth } from "../auth.middleware.js";
import { db } from "../db.js";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const user = await db.get(
    "SELECT id, username, email, access_until, created_at FROM users WHERE id = ?",
    req.user.id
  );
  if (!user) {
    res.status(404).json({ error: "Usuario nao encontrado" });
    return;
  }
  res.json(user);
});

router.patch("/me", auth, async (req, res) => {
  const { username, email, password } = req.body || {};

  if (username === undefined && email === undefined && !password) {
    res.status(400).json({ error: "Nada para atualizar" });
    return;
  }

  const updates = [];
  const params = [];

  if (username !== undefined) {
    const trimmed = String(username || "").trim();
    if (!trimmed) {
      res.status(400).json({ error: "Usuario invalido" });
      return;
    }
    const exists = await db.get(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [trimmed, req.user.id]
    );
    if (exists) {
      res.status(409).json({ error: "Usuario ja existe" });
      return;
    }
    updates.push("username = ?");
    params.push(trimmed);
  }

  if (email !== undefined) {
    const trimmed = String(email || "").trim();
    if (!trimmed) {
      res.status(400).json({ error: "Email invalido" });
      return;
    }
    const existsEmail = await db.get(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [trimmed, req.user.id]
    );
    if (existsEmail) {
      res.status(409).json({ error: "Email ja cadastrado" });
      return;
    }
    updates.push("email = ?");
    params.push(trimmed);
  }

  if (password) {
    const trimmed = String(password || "");
    if (!trimmed) {
      res.status(400).json({ error: "Senha invalida" });
      return;
    }
    const hash = await bcrypt.hash(trimmed, 10);
    updates.push("password_hash = ?");
    params.push(hash);
  }

  if (!updates.length) {
    res.status(400).json({ error: "Nada para atualizar" });
    return;
  }

  params.push(req.user.id);
  await db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

  const updated = await db.get(
    "SELECT id, username, email, access_until, created_at FROM users WHERE id = ?",
    req.user.id
  );
  res.json(updated);
});

export default router;
