/**
 * Centralized API Client for Socio-hub Frontend
 * Adheres strictly to docs/00_READ_FIRST_AND_SHARED_CONTRACT.md and docs/01_MEMBER_1_FRONTEND.md
 */
import { APIErrorShape } from '../types/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Token provider callback set by AuthContext
let authTokenProvider: (() => Promise<string | null>) | null = null;

export function registerAuthTokenProvider(provider: () => Promise<string | null>) {
  authTokenProvider = provider;
}

export class ApiError extends Error {
  public code: string;
  public details?: unknown[];
  public status: number;

  constructor(code: string, message: string, status: number, details?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authTokenProvider) {
    try {
      const token = await authTokenProvider();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Token resolution issue
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: APIErrorShape['error'] | null = null;
    try {
      const json = await response.json();
      if (json && json.error) {
        errorData = json.error;
      }
    } catch {
      // Response wasn't JSON
    }

    const code = errorData?.code || `HTTP_${response.status}`;
    const message = errorData?.message || `Request failed with status ${response.status}`;
    const details = errorData?.details;

    throw new ApiError(code, message, response.status, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
