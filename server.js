import express from "express";
import cors from "cors";
import multer from "multer";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const jobs = new Map();
const DUMMY_OBJ = `# demo cube
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
v 0 0 1
v 1 0 1
v 1 1 1
v 0 1 1
f 1 2 3 4
f 5 6 7 8
f 1 2 6 5
f 2 3 7 6
f 3 4 8 7
f 4 1 5 8
`;

app.get("/", (_, res) => res.send("AvatarForge server OK"));

app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "image required" });
  const id = `job_${Date.now()}_${nanoid(6)}`;
  jobs.set(id, { status: "queued", progress: 0, readyAt: Date.now() + 8000 });

  const t = setInterval(() => {
    const j = jobs.get(id);
    if (!j) return clearInterval(t);
    if (Date.now() >= j.readyAt) {
      j.status = "done";
      j.progress = 100;
      j.downloadPath = `/api/download/${id}`;
      clearInterval(t);
    } else {
      j.status = "processing";
      j.progress = Math.min(95, j.progress + 10);
    }
  }, 1000);

  res.json({ jobId: id, message: "accepted" });
});

app.get("/api/status/:id", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j) return res.status(404).json({ message: "job not found" });

  // публичный базовый URL (https на Render)
  const base = `${req.protocol}://${req.get("host")}`;
  res.json({
    status: j.status,
    progress: j.progress,
    downloadUrl: j.status === "done" ? `${base}${j.downloadPath}` : null,
    message: j.status,
    error: null
  });
});

app.get("/api/download/:id", (req, res) => {
  const j = jobs.get(req.params.id);
  if (!j || j.status !== "done") return res.status(404).json({ message: "not ready" });
  const filePath = path.join(__dirname, `${req.params.id}.obj`);
  fs.writeFileSync(filePath, DUMMY_OBJ, "utf8");
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.id}.obj"`);
  fs.createReadStream(filePath).pipe(res).on("close", () => { try { fs.unlinkSync(filePath); } catch {} });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
