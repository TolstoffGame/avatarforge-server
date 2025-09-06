// /api/upload.js
import Busboy from 'busboy';

export const config = {
  api: {
    bodyParser: false // сами парсим multipart
  }
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const bb = Busboy({ headers: req.headers });
    let fileFound = false;

    await new Promise((resolve, reject) => {
      bb.on('file', (name, file, info) => {
        // ожидаем поле "image"
        fileFound = true;
        // В демо никуда не сохраняем: просто читаем поток, чтобы не упасть
        file.resume();
      });
      bb.on('error', reject);
      bb.on('finish', resolve);
      req.pipe(bb);
    });

    if (!fileFound) {
      return res.status(400).json({ message: 'No file field "image" in multipart form' });
    }

    // Генерим jobId и возвращаем
    const jobId = 'job_' + Date.now().toString(36);
    return res.status(200).json({ jobId, message: 'ok' });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Upload failed' });
  }
}
