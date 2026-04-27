const { supabaseFetch, allowMethods, sendError } = require('./_supabase');

function normalizeBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch (_) { return {}; }
  }
  return req.body;
}

function validateCreatePayload(body) {
  const required = ['language', 'personality_id', 'personality_name', 'dimension_code', 'answers', 'scores', 'percentages'];
  const missing = required.filter(k => body[k] === undefined || body[k] === null || body[k] === '');
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(body.answers)) {
    const err = new Error('answers must be an array');
    err.statusCode = 400;
    throw err;
  }
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;

  try {
    if (req.method === 'GET') {
      const id = req.query && (req.query.id || req.query.share_id);
      if (!id) return res.status(400).json({ error: 'Missing result id' });

      const query = `njti_results?share_id=eq.${encodeURIComponent(id)}&select=share_id,created_at,language,personality_id,personality_name,dimension_code,answers,scores,percentages&limit=1`;
      const rows = await supabaseFetch(query, { method: 'GET' });
      if (!rows || !rows.length) return res.status(404).json({ error: 'Result not found' });
      return res.status(200).json({ result: rows[0] });
    }

    const body = normalizeBody(req);
    validateCreatePayload(body);

    const record = {
      language: String(body.language || 'zh').slice(0, 12),
      personality_id: String(body.personality_id).slice(0, 64),
      personality_name: String(body.personality_name).slice(0, 128),
      dimension_code: String(body.dimension_code || '').slice(0, 32),
      answers: body.answers,
      scores: body.scores,
      percentages: body.percentages,
      user_agent: req.headers['user-agent'] || null,
      referrer: req.headers.referer || req.headers.referrer || null
    };

    const rows = await supabaseFetch('njti_results?select=share_id,created_at,personality_id,personality_name,dimension_code', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(record)
    });
    const saved = Array.isArray(rows) ? rows[0] : rows;
    return res.status(200).json({ ok: true, result: saved });
  } catch (err) {
    return sendError(res, err);
  }
};
