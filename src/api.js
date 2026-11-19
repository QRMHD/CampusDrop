// In dev, defaults to port 3001; in production (Cloud Run), defaults to same-origin '/api'
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields || null;
  }
}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new ApiError(
      'Cannot connect to the server. Please check your network connection or server status.',
      0
    );
  }

  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch {
      throw new ApiError(`Server error (${res.status})`, res.status);
    }
    throw new ApiError(
      body.error || `Request failed (${res.status})`,
      res.status,
      body.fields || null
    );
  }

  return res.json();
}

export async function fetchResources({ q = '', category = 'All', week = 'All' } = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category !== 'All') params.set('category', category);
  if (week !== 'All') params.set('week', week);

  return request(`${BASE}/resources?${params}`);
}

export async function fetchMeta() {
  return request(`${BASE}/resources/meta`);
}

export async function createResource(data) {
  return request(`${BASE}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateResource(id, data) {
  return request(`${BASE}/resources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteResource(id) {
  return request(`${BASE}/resources/${id}`, { method: 'DELETE' });
}
