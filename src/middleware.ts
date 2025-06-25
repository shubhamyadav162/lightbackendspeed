// @ts-nocheck -- Middleware compiled by Next.js, relying on internal types
import { NextRequest, NextResponse } from 'next/server';
import LRUCache from 'lru-cache';

// === Basic in-memory rate limiter ===
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // per IP per window

interface CacheEntry {
  count: number;
  ts: number;
}

const ipCache = new LRUCache<string, CacheEntry>({ max: 5000 });

export function middleware(request: NextRequest) {
  // Apply security headers via response wrapper first
  const response = NextResponse.next();

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
  // If behind a proxy (e.g. Vercel/Railway) rely on `x-forwarded-proto` header. If the request is detected as HTTP we 301 redirect to the HTTPS equivalent. This is skipped in development (NEXT_DEV or NODE_ENV !== 'production').
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
export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 