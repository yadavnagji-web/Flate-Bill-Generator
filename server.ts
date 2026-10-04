import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { app } from "./api/index.js";

const PORT = 3000;

async function startServer() {
  // Explicit Service Worker endpoint with proper content-type and cache control
  app.get("/sw.js", (_req, res) => {
    const swPath =
      process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "sw.js")
        : path.join(process.cwd(), "public", "sw.js");
    res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(swPath);
  });

  // Explicit Web App Manifest endpoint
  app.get(["/manifest.json", "/manifest.webmanifest"], (_req, res) => {
    const manifestPath =
      process.env.NODE_ENV === "production"
        ? path.join(process.cwd(), "dist", "manifest.json")
        : path.join(process.cwd(), "public", "manifest.json");
    res.setHeader("Content-Type", "application/manifest+json; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(manifestPath);
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sub Meter Bill Generator server running on http://0.0.0.0:${PORT}`);
  });
}

// In standard Node/Cloud Run/AI Studio environment, start listening on PORT.
// On Vercel serverless platform, export app directly without running app.listen.
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
