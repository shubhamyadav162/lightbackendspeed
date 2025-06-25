import '@testing-library/jest-dom';
import fetchMock from 'jest-fetch-mock';

// Enable fetch mocks before all tests run
fetchMock.enableMocks();

// Provide dummy Supabase env vars to satisfy createClient validation in tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-key-test';

// Polyfill Web Crypto TextEncoder/TextDecoder for pg native SASL utils when running under Jest (Node < 20)
// Jest's jsdom environment may not expose them on global, leading to ReferenceError.
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = NodeTextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = NodeTextDecoder;
} 