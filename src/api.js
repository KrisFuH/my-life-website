const BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

export const getHomeData = () => request('/home');
export const saveHomeData = (data) => request('/home', { method: 'POST', body: JSON.stringify({ data }) });
export const getSectionData = (key) => request('/sections/' + key);
export const listEntries = (key) => request('/' + key);

export function createEntry(key, entry) {
  return request('/' + key, { method: 'POST', body: JSON.stringify(entry) });
}

export function updateEntry(key, id, entry) {
  return request('/' + key + '/' + id, { method: 'PUT', body: JSON.stringify(entry) });
}

export function deleteEntry(key, id) {
  return request('/' + key + '/' + id, { method: 'DELETE' });
}

export function uploadImage(name, dataUrl) {
  return request('/upload-image', { method: 'POST', body: JSON.stringify({ name, dataUrl }) });
}
export async function verifyPassword(password) {
  let res;
  try {
    res = await fetch(BASE + '/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    return { success: false, error: '无法连接服务器，请稍后重试' };
  }
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  return json;
}