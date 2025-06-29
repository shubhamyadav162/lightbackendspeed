import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Get allowed origins from environment with fallbacks
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174').split(',').map(o => o.trim());
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add Railway production domain explicitly
allowedOrigins.push('https://web-production-0b337.up.railway.app');

// Development mode - allow all localhost origins
const isDevelopment = process.env.NODE_ENV !== 'production';

function setCorsHeaders(response: NextResponse, origin: string) {
  // Handle file:// protocol or null origin
  const corsOrigin = (!origin || origin === 'null' || origin === 'file://') ? '*' : origin;
  response.headers.set('Access-Control-Allow-Origin', corsOrigin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  
  // Include all possible headers that might be used - especially x-api-key
  response.headers.set('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, ' + 
    'Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Client-Key, ' +
    'x-api-key, X-API-Key, x-client-id, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // Cache preflight requests longer (24 hours)
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Add Vary header to ensure proper caching
  response.headers.set('Vary', 'Origin');
  
  return response;
}

export async function handleCors(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const origin = req.headers.get('origin') ?? '';
  console.log(`[CORS] Request from origin: ${origin}`);
  
  let isAllowed = false;
  
  // Check if origin is in allowed origins
  if (allowedOrigins.includes(origin)) {
    isAllowed = true;
  }
  
  // In development mode, allow any localhost origin
  if (isDevelopment && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    isAllowed = true;
    console.log('[CORS] Allowing localhost origin in development mode');
  }
  
  // Allow requests from file:// protocol (for local HTML file testing)
  if (!origin || origin === 'null' || origin === 'file://') {
    isAllowed = true;
    console.log('[CORS] Allowing file:// protocol request for local testing');
  }
  
  // For easier debugging
  console.log(`[CORS] Origin ${origin} is ${isAllowed ? 'allowed' : 'not allowed'}`);
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);

  // Special handling for preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    const response = new NextResponse(null, { status: 204 }); // No Content
    return setCorsHeaders(response, origin);
  }

  // Handle actual request
  try {
    const response = await handler(req);
    return setCorsHeaders(response, origin);
  } catch (error) {
    console.error('[CORS] Error handling request:', error);
    const errorResponse = new NextResponse(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    return setCorsHeaders(errorResponse, origin);
  }
} 