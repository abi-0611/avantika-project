const BASE_URL = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('shieldbot_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('shieldbot_token');
      localStorage.removeItem('shieldbot_user');
      window.dispatchEvent(new Event('auth-error'));
    }
    
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new ApiError(response.status, errorMessage);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  patch: <T>(endpoint: string, data?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
