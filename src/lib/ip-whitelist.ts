import { NextRequest } from 'next/server';

export function isWhitelistedIp(req: NextRequest, allowedIps: string[] = []): boolean {
  if (allowedIps.length === 0) return true; // No whitelist configured → allow all
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || (req as any).ip || '';
  return allowedIps.includes(ip);
} 