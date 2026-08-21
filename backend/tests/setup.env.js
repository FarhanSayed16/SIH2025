// Must run before test files import the app (see jest.config setupFiles).
process.env.NODE_ENV = 'test';
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}
