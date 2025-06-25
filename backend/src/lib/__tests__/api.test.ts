// Test suite for buildUrl util ensuring env handling

describe('buildUrl', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();

    // Silence expected console warnings from util when env missing in other tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should build full URL without double slashes', async () => {
    process.env = { ...OLD_ENV, NEXT_PUBLIC_BACKEND_URL: 'https://example.com/api' } as NodeJS.ProcessEnv;
    const { buildUrl } = await import('@/lib/api');
    expect(buildUrl('/test')).toBe('https://example.com/api/test');
    expect(buildUrl('nested/path')).toBe('https://example.com/api/nested/path');
  });

  it('falls back to relative path and warns when env missing', async () => {
    // Remove env var
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { buildUrl } = await import('@/lib/api');
    expect(buildUrl('/relative')).toBe('/relative');
    expect((console.warn as jest.Mock).mock.calls[0][0]).toMatch(/NEXT_PUBLIC_BACKEND_URL is not defined/);
  });
}); 