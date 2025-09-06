import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // запас
const upload = multer({ limits: { fileSize: 4.5 * 1024 * 1024 } }); // Vercel лимит

// Простая «очередь» в памяти
const jobs = new Map();
// job: { status: 'queued'|'processing'|'done'|'error', progress: 0..100, url?: string, error?: string }

app.get("/", (req, res) => {
  res.type("text/plain").send("AvatarForge server OK");
});

app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Нет файла 'photo'" });
    const id = nanoid(10);
    jobs.set(id, { status: "queued", progress: 0 });
    // имитация обработки
    setTimeout(() => step(id, 25), 500);
    res.json({ jobId: id });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

function step(id, p) {
  const j = jobs.get(id);
  if (!j) return;
  if (p >= 100) {
    j.status = "done";
    j.progress = 100;
    j.url = `https://picsum.photos/seed/${id}/512/512.jpg`;
    return;
  }
  j.status = "processing";
  j.progress = p;
  setTimeout(() => step(id, p + 25), 800);
}

app.get("/api/status/:jobId", (req, res) => {
  const j = jobs.get(req.params.jobId);
  if (!j) return res.status(404).json({ error: "jobId не найден" });
  res.json({
    status: j.status,
    progress: j.progress || 0,
    downloadUrl: j.url || null,
    error: j.error || null
  });
});

app.get("/api/download/:jobId", (req, res) => {
  const j = jobs.get(req.params.jobId);
  if (!j) return res.status(404).json({ error: "jobId не найден" });
  if (j.status !== "done" || !j.url) return res.status(400).json({ error: "Ещё не готово" });
  res.redirect(j.url);
});

export default app; // для Vercel (preset Express)
