import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticated } from './lib/auth';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard/merchant',
  '/dashboard/admin',
];

// Routes that should not be accessible when authenticated
const authRoutes = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the user is authenticated
  const isAuth = await isAuthenticated(request);
  
  // Redirect authenticated users away from auth routes
  if (isAuth && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard/merchant', request.url));
  }
  
  // Redirect unauthenticated users away from protected routes
  if (!isAuth && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}; 