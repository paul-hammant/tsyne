module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test-apps', '<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  // Exclude JyneTest integration tests (those need the bridge)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'calculator.test.ts' // This is JyneTest, not Jest
  ],
  collectCoverageFrom: [
    'test-apps/**/*.ts',
    'src/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true
};
