/**
 * Jest Setup File
 * 
 * Initializes testing environment and provides common mocks.
 */

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  }),
  usePathname: () => '/'
}))

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    markdownCache: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn()
    }
  }
}))

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.GEMINI_API_KEY = 'test-api-key'

// Global test timeout
jest.setTimeout(30000)

// Suppress console errors during tests (optional)
// global.console = {
//   ...console,
//   error: jest.fn()
// }
