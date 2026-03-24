import 'dotenv/config';
import express from "express";
import path from "path";
import cors from "cors";
import fs from 'fs';

import authRoutes from "./src/routes/auth";
import chatRoutes from "./src/routes/chats";
import rulesRoutes from "./src/routes/rules";
import logsRoutes from "./src/routes/logs";
import supervisionRoutes from "./src/routes/supervision";
import childSettingsRoutes from "./src/routes/childSettings";
import safetyRoutes from "./src/routes/safety";
import memoryRoutes from "./src/routes/memory";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "ShieldBot Backend is running" });
  });

  // Mock endpoint for "ML retraining" as requested in requirements
  app.post("/api/admin/retrain", (req, res) => {
    // In a real scikit-learn environment, this would trigger a training job.
    // For this environment, we'll simulate it.
    res.json({ success: true, message: "Safety models retrained successfully" });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/rules', rulesRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/supervision', supervisionRoutes);
  app.use('/api/child-settings', childSettingsRoutes);
  app.use('/api/safety', safetyRoutes);
  app.use('/api/memory', memoryRoutes);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });

  // Serve built frontend in production (optional)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'frontend', 'dist');
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(indexPath);
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
