export default {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '../db.js': '<rootDir>/tests/mocks/db.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
};
