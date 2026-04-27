const { supabaseFetch, allowMethods, sendError } = require('./_supabase');

function requireAdmin(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return;
  const provided = (req.query && req.query.token) || req.headers['x-admin-token'];
  if (provided !== token) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

function pct(value) {
  return Math.round(value * 10) / 10;
}

module.exports = async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    requireAdmin(req);
    const rows = await supabaseFetch('njti_results?select=share_id,created_at,language,personality_id,personality_name,dimension_code,percentages&order=created_at.desc&limit=10000', { method: 'GET' });
    const total = rows.length;

    const personalityMap = new Map();
    const languageMap = new Map();
    const dimAcc = {};
    const dimCount = {};

    rows.forEach(row => {
      const pKey = row.personality_name || row.personality_id || '未知';
      personalityMap.set(pKey, (personalityMap.get(pKey) || 0) + 1);
      const lang = row.language || 'unknown';
      languageMap.set(lang, (languageMap.get(lang) || 0) + 1);

      const percentages = row.percentages || {};
      Object.entries(percentages).forEach(([dim, val]) => {
        const left = Number(val.leftPct ?? val.left ?? 0);
        const right = Number(val.rightPct ?? (100 - left));
        if (!dimAcc[dim]) dimAcc[dim] = { left: 0, right: 0 };
        dimAcc[dim].left += left;
        dimAcc[dim].right += right;
        dimCount[dim] = (dimCount[dim] || 0) + 1;
      });
    });

    const personalityDistribution = [...personalityMap.entries()]
      .map(([name, count]) => ({ name, count, percent: total ? pct((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const languageDistribution = [...languageMap.entries()]
      .map(([language, count]) => ({ language, count, percent: total ? pct((count / total) * 100) : 0 }))
      .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));

    const dimensionAverages = Object.keys(dimAcc).map(dim => ({
      dim,
      leftPct: dimCount[dim] ? pct(dimAcc[dim].left / dimCount[dim]) : 0,
      rightPct: dimCount[dim] ? pct(dimAcc[dim].right / dimCount[dim]) : 0
    }));

    const recent = rows.slice(0, 30).map(row => ({
      share_id: row.share_id,
      created_at: row.created_at,
      language: row.language,
      personality_name: row.personality_name,
      dimension_code: row.dimension_code
    }));

    return res.status(200).json({
      total,
      personalityDistribution,
      languageDistribution,
      dimensionAverages,
      recent
    });
  } catch (err) {
    return sendError(res, err);
  }
};
