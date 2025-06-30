module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testPathIgnorePatterns: [
    '<rootDir>/tests/e2e/',
    '<rootDir>/supabase/functions/',
    '<rootDir>/src/app/',
    // '<rootDir>/src/lib/',  // allow unit tests in src/lib
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  // Only collect coverage from core library code for now to keep threshold meaningful
  collectCoverageFrom: [
    '<rootDir>/src/lib/**/*.{ts,tsx}',
    '!<rootDir>/src/lib/**/__tests__/**',
    '<rootDir>/src/hooks/useAlerts.ts',
    '<rootDir>/src/hooks/useSettlements.ts',
    '<rootDir>/src/hooks/useWallets.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/archive/',
    '<rootDir>/new main/',
  ],
}; 