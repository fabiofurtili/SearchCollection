import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import searchRoutes from "./routes/search.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import accessRoutes from "./routes/access.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "../frontend");

let basePath = String(process.env.BASE_PATH || "").trim();
if (basePath && !basePath.startsWith("/")) basePath = `/${basePath}`;
basePath = basePath.replace(/\/+$/, "");

app.use("/auth", authRoutes);
app.use("/search-configs", searchRoutes);
app.use("/admin", adminRoutes);
app.use("/access-requests", accessRoutes);

if (basePath) {
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/search-configs`, searchRoutes);
  app.use(`${basePath}/admin`, adminRoutes);
  app.use(`${basePath}/access-requests`, accessRoutes);
}

const frontendMounts = ["/frontend", "/dream/frontend"];
for (const mount of frontendMounts) {
  app.get(mount, (req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
  app.get(`${mount}/`, (req, res) => {
    res.redirect(301, mount);
  });
  app.use(mount, express.static(frontendDir, { index: false }));
}

app.get("/dream/:page", (req, res, next) => {
  const page = String(req.params.page || "");
  if (!page.endsWith(".html")) return next();
  res.redirect(301, `/dream/frontend/${page}`);
});

const rootPaths = ["/"];
if (basePath) {
  rootPaths.push(basePath, `${basePath}/`);
}

app.get(rootPaths, (req, res) => {
  res.json({ status: "API online" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
