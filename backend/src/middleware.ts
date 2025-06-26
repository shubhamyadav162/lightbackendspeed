// @ts-nocheck -- Middleware compiled by Next.js, relying on internal types
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174', // Vite dev server alternative port
  'http://localhost:8080',
  // Frontend domains (NOT backend URL)
  'https://lightspeedpay-dashboard.vercel.app',
  'https://lightspeedpay-frontend.vercel.app',
  'https://your-frontend-domain.vercel.app', // Replace with actual frontend URL
  // Railway production domain
  'https://web-production-0b337.up.railway.app'
].flat().filter(Boolean);

// Add origins from environment variables
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

if (process.env.CORS_ORIGIN) {
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(url => url.trim());
  allowedOrigins.push(...envOrigins);
}

// === Basic in-memory rate limiter ===
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 200; // Increased limit for development

interface CacheEntry {
  count: number;
  ts: number;
}

const ipCache = new LRUCache<string, CacheEntry>({ max: 5000 });

export function middleware(request: NextRequest) {
  // --- CORS Handling ---
  const origin = request.headers.get('origin');
  
  // Log CORS debugging information
  console.log(`[CORS] Request from origin: ${origin}`);
  console.log(`[CORS] Method: ${request.method}`);
  console.log(`[CORS] Path: ${request.nextUrl.pathname}`);
  
  // Is this origin explicitly allowed?
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;
  
  // Development mode - allow all localhost origins
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
  
  // Decision: Allow if explicitly allowed OR (in dev mode AND is localhost)
  const shouldAllowOrigin = isAllowedOrigin || (isDevelopment && isLocalhost);
  
  console.log(`[CORS] Origin "${origin}" allowed: ${shouldAllowOrigin ? 'YES' : 'NO'}`);
  console.log(`[CORS] Dev mode: ${isDevelopment}, Is localhost: ${isLocalhost}`);
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);

  // Handle OPTIONS preflight requests with detailed logging
  if (request.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    
    // Get requested method and headers from preflight request
    const requestMethod = request.headers.get('access-control-request-method');
    const requestHeaders = request.headers.get('access-control-request-headers');
    console.log(`[CORS] Preflight requested method: ${requestMethod}`);
    console.log(`[CORS] Preflight requested headers: ${requestHeaders}`);
    
    if (shouldAllowOrigin) {
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', origin!);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
      // Include ALL possible headers client might send - critical for x-api-key
      headers.set('Access-Control-Allow-Headers', 
        'Content-Type, Authorization, X-Client-Key, x-api-key, X-API-Key, Accept, Origin, ' +
        'X-Requested-With, X-CSRF-Token, X-Api-Version, Content-MD5, Content-Length, ' +
        'Accept-Version, Date, X-Client-Id, access-control-request-headers, ' +
        'access-control-request-method'
      );
      headers.set('Access-Control-Allow-Credentials', 'true');
      headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
      headers.set('Vary', 'Origin'); // Ensure proper caching based on origin
      
      // Log the response headers we're sending
      console.log('[CORS] Responding to preflight with headers:', Object.fromEntries(headers.entries()));
      
      return new NextResponse(null, { status: 204, headers }); // 204 No Content
    }
    console.warn(`[CORS] Preflight blocked for origin: ${origin}`);
    return new NextResponse('CORS Preflight Blocked', { status: 403 });
  }

  // Add CORS headers to the actual response
  const response = NextResponse.next();
  if (shouldAllowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    // Make sure we include the same headers as in preflight response
    response.headers.set('Access-Control-Allow-Headers', 
      'Content-Type, Authorization, X-Client-Key, x-api-key, X-API-Key, Accept, Origin, ' +
      'X-Requested-With, X-CSRF-Token, X-Api-Version, Content-MD5, Content-Length, ' +
      'Accept-Version, Date, X-Client-Id, access-control-request-headers, ' +
      'access-control-request-method'
    );
    response.headers.set('Vary', 'Origin');
    
    // Log that we're adding CORS headers to the response
    console.log('[CORS] Added CORS headers to response');
  }

  // Apply other security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'same-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");

  // --- Simple IP-based rate limit ---
  // Prefer X-Forwarded-For header (Railway/Supabase deploys) then Next.js req.ip
  const ip = (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || '0.0.0.0');
  const now = Date.now();
  const existing = ipCache.get(ip);

  if (existing && now - existing.ts < WINDOW_MS) {
    if (existing.count >= MAX_REQUESTS) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }

    existing.count += 1;
    ipCache.set(ip, existing);
  } else {
    ipCache.set(ip, { count: 1, ts: now });
  }

  // === Enforce HTTPS in production ===
  // If behind a proxy (e.g. Vercel/Railway) rely on `x-forwarded-proto` header
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    if (proto === 'http') {
      const url = new URL(request.url);
      url.protocol = 'https:';
      return NextResponse.redirect(url.toString(), 301);
    }
  }

  return response;
}

// Apply middleware only to API routes (both app and pages router)
// EXCLUDE health endpoint for Railway health checks (internal HTTP requests)
export const config = {
  matcher: [
    '/api/((?!health).)*',  // Match all /api/* EXCEPT /api/health
  ],
}; 