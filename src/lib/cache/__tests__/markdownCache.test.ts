/**
 * Markdown Cache Unit Tests
 * 
 * Tests the caching functionality including TTL validation,
 * cache retrieval, and cache management.
 */

import {
  getCachedMarkdown,
  setCachedMarkdown,
  isCacheStale,
  deleteCacheEntry,
  clearAllCache,
  getCacheStats
} from '@/lib/cache/markdownCache'
import { prisma } from '@/lib/prisma'

describe('MarkdownCache', () => {
  // Clean up before each test
  beforeEach(async () => {
    await prisma.markdownCache.deleteMany()
  })

  // Clean up after all tests
  afterAll(async () => {
    await prisma.markdownCache.deleteMany()
  })

  describe('setCachedMarkdown', () => {
    it('should store markdown content in cache', async () => {
      const sourceName = 'test-source'
      const sourceUrl = 'https://example.com'
      const content = '# Test Content\n\nThis is test markdown.'

      await setCachedMarkdown(sourceName, sourceUrl, content, { ttlMinutes: 30 })

      const cached = await prisma.markdownCache.findUnique({
        where: { sourceName }
      })

      expect(cached).toBeTruthy()
      expect(cached?.sourceName).toBe(sourceName)
      expect(cached?.sourceUrl).toBe(sourceUrl)
      expect(cached?.markdownContent).toBe(content)
      expect(cached?.ttlMinutes).toBe(30)
    })

    it('should update existing cache entry', async () => {
      const sourceName = 'test-source'
      
      // First insert
      await setCachedMarkdown(sourceName, 'https://example.com', 'Original content')
      
      // Update
      const newContent = 'Updated content'
      await setCachedMarkdown(sourceName, 'https://example.com/new', newContent, { ttlMinutes: 45 })

      const cached = await prisma.markdownCache.findUnique({
        where: { sourceName }
      })

      expect(cached?.markdownContent).toBe(newContent)
      expect(cached?.ttlMinutes).toBe(45)
    })

    it('should clamp TTL to valid range (15-60 minutes)', async () => {
      const sourceName = 'test-source'
      
      // Test minimum clamping
      await setCachedMarkdown(sourceName, 'url', 'content', { ttlMinutes: 5 })
      let cached = await prisma.markdownCache.findUnique({ where: { sourceName } })
      expect(cached?.ttlMinutes).toBe(15)

      // Clean up
      await prisma.markdownCache.deleteMany()

      // Test maximum clamping
      await setCachedMarkdown(sourceName + '-2', 'url', 'content', { ttlMinutes: 120 })
      cached = await prisma.markdownCache.findUnique({ where: { sourceName: sourceName + '-2' } })
      expect(cached?.ttlMinutes).toBe(60)
    })
  })

  describe('getCachedMarkdown', () => {
    it('should return cached content if not expired', async () => {
      const sourceName = 'test-source'
      const content = '# Test Content'
      
      await prisma.markdownCache.create({
        data: {
          sourceName,
          sourceUrl: 'https://example.com',
          markdownContent: content,
          ttlMinutes: 30,
          updatedAt: new Date() // Just created, not expired
        }
      })

      const result = await getCachedMarkdown(sourceName)

      expect(result).toBeTruthy()
      expect(result?.markdownContent).toBe(content)
      expect(result?.sourceName).toBe(sourceName)
    })

    it('should return null for expired cache', async () => {
      const sourceName = 'test-source'
      
      await prisma.markdownCache.create({
        data: {
          sourceName,
          sourceUrl: 'https://example.com',
          markdownContent: 'Old content',
          ttlMinutes: 30,
          updatedAt: new Date(Date.now() - 31 * 60 * 1000) // 31 minutes ago
        }
      })

      const result = await getCachedMarkdown(sourceName)

      expect(result).toBeNull()
    })

    it('should return null for non-existent cache', async () => {
      const result = await getCachedMarkdown('non-existent-source')
      expect(result).toBeNull()
    })
  })

  describe('isCacheStale', () => {
    it('should return true for non-existent cache', async () => {
      const result = await isCacheStale('non-existent')
      expect(result).toBe(true)
    })

    it('should return true for expired cache', async () => {
      const sourceName = 'stale-source'
      
      await prisma.markdownCache.create({
        data: {
          sourceName,
          sourceUrl: 'url',
          markdownContent: 'content',
          ttlMinutes: 15,
          updatedAt: new Date(Date.now() - 16 * 60 * 1000)
        }
      })

      const result = await isCacheStale(sourceName)
      expect(result).toBe(true)
    })

    it('should return false for fresh cache', async () => {
      const sourceName = 'fresh-source'
      
      await prisma.markdownCache.create({
        data: {
          sourceName,
          sourceUrl: 'url',
          markdownContent: 'content',
          ttlMinutes: 30,
          updatedAt: new Date()
        }
      })

      const result = await isCacheStale(sourceName)
      expect(result).toBe(false)
    })
  })

  describe('deleteCacheEntry', () => {
    it('should delete a cache entry', async () => {
      const sourceName = 'to-delete'
      
      await prisma.markdownCache.create({
        data: {
          sourceName,
          sourceUrl: 'url',
          markdownContent: 'content',
          ttlMinutes: 30
        }
      })

      await deleteCacheEntry(sourceName)

      const cached = await prisma.markdownCache.findUnique({
        where: { sourceName }
      })

      expect(cached).toBeNull()
    })
  })

  describe('clearAllCache', () => {
    it('should delete all cache entries', async () => {
      // Create multiple entries
      await prisma.markdownCache.createMany({
        data: [
          { sourceName: 'source1', sourceUrl: 'url1', markdownContent: 'content1', ttlMinutes: 30 },
          { sourceName: 'source2', sourceUrl: 'url2', markdownContent: 'content2', ttlMinutes: 30 },
          { sourceName: 'source3', sourceUrl: 'url3', markdownContent: 'content3', ttlMinutes: 30 }
        ]
      })

      await clearAllCache()

      const count = await prisma.markdownCache.count()
      expect(count).toBe(0)
    })
  })

  describe('getCacheStats', () => {
    it('should return accurate cache statistics', async () => {
      // Create mixed cache entries
      await prisma.markdownCache.createMany({
        data: [
          {
            sourceName: 'active1',
            sourceUrl: 'url',
            markdownContent: 'content',
            ttlMinutes: 30,
            updatedAt: new Date() // Active
          },
          {
            sourceName: 'active2',
            sourceUrl: 'url',
            markdownContent: 'content',
            ttlMinutes: 30,
            updatedAt: new Date() // Active
          },
          {
            sourceName: 'expired1',
            sourceUrl: 'url',
            markdownContent: 'content',
            ttlMinutes: 15,
            updatedAt: new Date(Date.now() - 16 * 60 * 1000) // Expired
          }
        ]
      })

      const stats = await getCacheStats()

      expect(stats.totalEntries).toBe(3)
      expect(stats.activeEntries).toBe(2)
      expect(stats.expiredEntries).toBe(1)
    })
  })
})
