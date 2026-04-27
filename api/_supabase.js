const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('SUPABASE_URL');
    if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    const err = new Error(`Missing environment variables: ${missing.join(', ')}`);
    err.statusCode = 500;
    throw err;
  }
}

function restUrl(pathAndQuery) {
  requireEnv();
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${pathAndQuery}`;
}

function headers(extra = {}) {
  requireEnv();
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseFetch(pathAndQuery, options = {}) {
  const response = await fetch(restUrl(pathAndQuery), {
    ...options,
    headers: headers(options.headers || {})
  });
  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); }
    catch (_) { data = text; }
  }
  if (!response.ok) {
    const err = new Error(typeof data === 'string' ? data : (data && data.message) || response.statusText);
    err.statusCode = response.status;
    err.details = data;
    throw err;
  }
  return data;
}

function allowMethods(req, res, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

function sendError(res, err) {
  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    details: process.env.NODE_ENV === 'development' ? err.details || err.message : undefined
  });
}

module.exports = { supabaseFetch, allowMethods, sendError };
