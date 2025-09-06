// /api/status/[jobId].js
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { jobId } = req.query;
  // Демо-ответ: "готово"
  res.status(200).json({
    jobId,
    status: 'done',
    progress: 100,
    downloadUrl: `/api/download/${encodeURIComponent(jobId)}`
  });
}
