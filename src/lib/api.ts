// Server-side API utilities (no React dependencies)

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_BACKEND_URL is not defined. API calls will fail.');
}

export function buildUrl(path: string) {
  // Ensure no double slashes
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

// Server-side fetcher (no React hooks)
export const fetcher = async (url: string) => {
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

// Server-side API call helper (no React hooks)
export async function apiCall<T = any>(path: string): Promise<T> {
  const url = buildUrl(path);
  return fetcher(url);
} 