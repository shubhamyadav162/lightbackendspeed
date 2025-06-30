// Simple API helper with SWR integration
import useSWR from 'swr';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_BACKEND_URL is not defined. API calls will fail.');
}

export function buildUrl(path: string) {
  // Ensure no double slashes
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

const fetcher = async (url: string) => {
  /* istanbul ignore next -- network fetch logic excluded from unit coverage */
  const res = await fetch(url, {
    credentials: 'include', // send cookies for auth if any
  });
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    // Attach extra info
    error.info = await res.json().catch(() => ({}));
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useApi<T = any>(path: string, shouldFetch = true) {
  const url = shouldFetch ? buildUrl(path) : null;
  const { data, error, isValidating, mutate } = useSWR<T>(url, fetcher);
  return {
    data,
    error,
    loading: !error && !data,
    isValidating,
    mutate,
  };
} 