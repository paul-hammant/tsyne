module.exports = {
  preset: 'ts-jest',
  testEnvironment: './core/jest-environment-tsyne.js',
  maxWorkers: 1,
  roots: ['<rootDir>/phone-apps'],
  testMatch: [
    '<rootDir>/phone-apps/**/*.test.ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  verbose: true
};
