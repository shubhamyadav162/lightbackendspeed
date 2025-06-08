import { createClient } from '@supabase/supabase-js';
import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'merchant' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  token: string | null;
  error: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SECRET = new TextEncoder().encode(JWT_SECRET);

export async function sign(payload: any): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET);
  
  return token;
}

export async function verify(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/'
  });
  
  return response;
}

export function getAuthToken() {
  const cookieStore = cookies();
  return cookieStore.get('auth-token')?.value;
}

export async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return false;
  }
  
  const payload = await verify(token);
  return !!payload;
}

export async function getUserFromToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }
  
  return await verify(token);
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user role and other metadata from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, merchant_id')
      .eq('id', data.user?.id)
      .single();

    if (userError) throw userError;

    return {
      user: {
        id: data.user?.id || '',
        email: data.user?.email || '',
        role: userData.role as UserRole,
        merchantId: userData.merchant_id,
      },
      token: data.session?.access_token || null,
      error: null,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      token: null,
      error: (error as Error).message,
    };
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string, 
  password: string, 
  role: UserRole = 'merchant',
  merchantId?: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Insert user role and metadata into users table
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role,
          merchant_id: merchantId,
        });

      if (insertError) throw insertError;
    }

    return {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
        role,
        merchantId,
      } : null,
      token: data.session?.access_token || null,
      error: null,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      user: null,
      token: null,
      error: (error as Error).message,
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    if (!data.session) {
      return { user: null, token: null, error: null };
    }

    // Get user role and other metadata from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, merchant_id')
      .eq('id', data.session.user.id)
      .single();

    if (userError) throw userError;

    return {
      user: {
        id: data.session.user.id,
        email: data.session.user.email || '',
        role: userData.role as UserRole,
        merchantId: userData.merchant_id,
      },
      token: data.session.access_token,
      error: null,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return {
      user: null,
      token: null,
      error: (error as Error).message,
    };
  }
} 