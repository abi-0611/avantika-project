const BASE = '';

function getToken() {
  return localStorage.getItem('shieldbot_token');
}

async function request(method: string, path: string, body?: any) {
  const token = getToken();

  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('shieldbot_token');
    localStorage.removeItem('shieldbot_user');
    window.location.reload();
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const apiGet = (p: string) => request('GET', p);
export const apiPost = (p: string, b?: any) => request('POST', p, b);
export const apiPut = (p: string, b?: any) => request('PUT', p, b);
export const apiDelete = (p: string) => request('DELETE', p);
