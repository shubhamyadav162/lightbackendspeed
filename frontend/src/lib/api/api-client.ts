import { getSession } from 'next-auth/react';

/**
 * Base API configurations
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Simple in-memory cache implementation
 */
interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class ApiCache {
  private static cache: Map<string, CacheItem<any>> = new Map();
  private static defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get an item from cache
   */
  static get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist or has expired
    if (!item || Date.now() > item.expiry) {
      if (item) this.cache.delete(key); // Clean up expired item
      return null;
    }
    
    return item.data;
  }

  /**
   * Set an item in cache with optional TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Delete an item from cache
   */
  static delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  static size(): number {
    return this.cache.size;
  }
}

/**
 * API error types definition
 */
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', data?: any) {
    super(message, 401, data);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'You do not have permission to access this resource', data?: any) {
    super(message, 403, data);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', data?: any) {
    super(message, 404, data);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed', data?: any) {
    super(message, 422, data);
    this.name = 'ValidationError';
  }
}

export class ServerError extends ApiError {
  constructor(message: string = 'Internal server error', data?: any) {
    super(message, 500, data);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred', data?: any) {
    super(message, 0, data);
    this.name = 'NetworkError';
  }
}

/**
 * Maps HTTP status code to specific error type
 */
function mapStatusToError(status: number, message: string, data?: any): ApiError {
  switch (status) {
    case 401:
      return new AuthenticationError(message, data);
    case 403:
      return new AuthorizationError(message, data);
    case 404:
      return new NotFoundError(message, data);
    case 422:
      return new ValidationError(message, data);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, data);
    default:
      return new ApiError(message, status, data);
  }
}

/**
 * Custom fetch wrapper with authentication and error handling
 */
export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
  cacheOptions?: {
    useCache: boolean;
    ttl?: number;
    cacheKey?: string;
  }
): Promise<any> {
  // Generate cache key if caching is enabled
  const cacheKey = cacheOptions?.useCache
    ? cacheOptions.cacheKey || `${options.method || 'GET'}-${endpoint}`
    : null;
  
  // Try to get from cache first if caching is enabled and it's a GET request
  if (cacheKey && (!options.method || options.method === 'GET')) {
    const cachedData = ApiCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    // Get the current session
    const session = await getSession();
    const token = session?.user?.token;

    // Prepare headers with auth token
    const headers = {
      ...DEFAULT_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    // Construct full URL
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    // Parse response
    let data;
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      const errorMessage = data.message || `Request failed with status ${response.status}`;
      throw mapStatusToError(response.status, errorMessage, data);
    }

    // Store in cache if caching is enabled and it's a GET request
    if (cacheKey && (!options.method || options.method === 'GET')) {
      ApiCache.set(cacheKey, data, cacheOptions?.ttl);
    }

    return data;
  } catch (error) {
    // Handle abort error (timeout)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    
    // Handle specific API errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network error: Unable to connect to the server');
    }
    
    // Handle unknown errors
    throw new ServerError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}

/**
 * API client for making authenticated requests
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  get: (endpoint: string, options: RequestInit = {}, cacheOptions?: { useCache: boolean; ttl?: number; cacheKey?: string }) => {
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'GET',
    }, cacheOptions);
  },

  /**
   * Make a POST request
   */
  post: (endpoint: string, data: any, options: RequestInit = {}) => {
    // Invalidate cache for the endpoint pattern
    ApiCache.delete(`GET-${endpoint}`);
    
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Make a PUT request
   */
  put: (endpoint: string, data: any, options: RequestInit = {}) => {
    // Invalidate cache for the endpoint pattern
    ApiCache.delete(`GET-${endpoint}`);
    
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Make a PATCH request
   */
  patch: (endpoint: string, data: any, options: RequestInit = {}) => {
    // Invalidate cache for the endpoint pattern
    ApiCache.delete(`GET-${endpoint}`);
    
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Make a DELETE request
   */
  delete: (endpoint: string, options: RequestInit = {}) => {
    // Invalidate cache for the endpoint pattern
    ApiCache.delete(`GET-${endpoint}`);
    
    return fetchWithAuth(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  /**
   * Clear all cache
   */
  clearCache: () => {
    ApiCache.clear();
  },
  
  /**
   * Clear cache for a specific endpoint
   */
  invalidateCache: (endpoint: string) => {
    ApiCache.delete(`GET-${endpoint}`);
  }
};

/**
 * Helper to handle API request with loading and error states
 * (for use with React useState/useEffect)
 */
export async function handleApiRequest<T>(
  requestFn: () => Promise<T>,
  setData: (data: T) => void,
  setIsLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void,
  onSpecificError?: (error: ApiError) => void
): Promise<void> {
  try {
    setIsLoading(true);
    setError(null);
    const result = await requestFn();
    setData(result);
  } catch (error) {
    // Handle specific error types if callback provided
    if (onSpecificError && error instanceof ApiError) {
      onSpecificError(error);
    }
    
    // Set general error message
    const message = error instanceof ApiError
      ? error.message
      : 'An unexpected error occurred';
    setError(message);
    
    // Log detailed error information
    console.error('[API Error]', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      status: error instanceof ApiError ? error.status : undefined,
      data: error instanceof ApiError ? error.data : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    setIsLoading(false);
  }
}

export default apiClient; 