// /api/download/[jobId].js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { jobId } = req.query;

  // В демо отдадим небольшой файл, будто это "модель"
  const content = `Demo model for ${jobId}\nGenerated at ${new Date().toISOString()}\n`;
  const buf = Buffer.from(content, 'utf-8');

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${jobId}.bin"`);
  res.status(200).send(buf);
}
