import { isWhitelistedIp } from '../lib/ip-whitelist';
import { NextRequest } from 'next/server';

function mockRequest(ip: string): NextRequest {
  // @ts-ignore – create minimal mock
  return {
    headers: new Map([
      ['x-forwarded-for', ip]
    ]),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ip,
  } as NextRequest;
}

describe('IP Whitelist', () => {
  it('should allow when list empty', () => {
    const req = mockRequest('1.2.3.4');
    expect(isWhitelistedIp(req, [])).toBe(true);
  });

  it('should block when ip not in list', () => {
    const req = mockRequest('1.2.3.4');
    expect(isWhitelistedIp(req, ['5.6.7.8'])).toBe(false);
  });

  it('should allow when ip present', () => {
    const req = mockRequest('1.2.3.4');
    expect(isWhitelistedIp(req, ['1.2.3.4'])).toBe(true);
  });
}); 