/**
 * Markdown Cache Service
 * 
 * Provides caching functionality for scraped markdown data with TTL support.
 * All data sources use this service to store and retrieve cached content.
 */

import { prisma } from '@/lib/prisma'

export interface CacheEntry {
  sourceName: string
  sourceUrl: string
  markdownContent: string
  ttlMinutes: number
  updatedAt: Date
}

export interface CacheOptions {
  ttlMinutes?: number // 15-60 minutes
}

// Default TTL is 30 minutes, can be configured per source
const DEFAULT_TTL_MINUTES = 30
const MIN_TTL_MINUTES = 15
const MAX_TTL_MINUTES = 60

/**
 * Validates and clamps TTL to allowed range
 */
function validateTTL(ttl: number): number {
  return Math.max(MIN_TTL_MINUTES, Math.min(MAX_TTL_MINUTES, ttl))
}

/**
 * Retrieves cached markdown content if it hasn't expired
 * @param sourceName - Unique identifier for the data source
 * @returns CacheEntry if found and not expired, null otherwise
 */
export async function getCachedMarkdown(sourceName: string): Promise<CacheEntry | null> {
  try {
    const cache = await prisma.markdownCache.findUnique({
      where: { sourceName }
    })

    if (!cache) {
      return null
    }

    // Check if cache has expired
    const now = new Date()
    const expiresAt = new Date(cache.updatedAt.getTime() + cache.ttlMinutes * 60 * 1000)
    
    if (now > expiresAt) {
      // Cache expired, return null to trigger refresh
      return null
    }

    return {
      sourceName: cache.sourceName,
      sourceUrl: cache.sourceUrl,
      markdownContent: cache.markdownContent,
      ttlMinutes: cache.ttlMinutes,
      updatedAt: cache.updatedAt
    }
  } catch (error) {
    console.error(`Error retrieving cache for ${sourceName}:`, error)
    return null
  }
}

/**
 * Stores markdown content in the cache
 * @param sourceName - Unique identifier for the data source
 * @param sourceUrl - The URL that was scraped
 * @param markdownContent - The extracted markdown content
 * @param options - Optional configuration including TTL
 */
export async function setCachedMarkdown(
  sourceName: string,
  sourceUrl: string,
  markdownContent: string,
  options: CacheOptions = {}
): Promise<void> {
  try {
    const ttlMinutes = validateTTL(options.ttlMinutes || DEFAULT_TTL_MINUTES)

    await prisma.markdownCache.upsert({
      where: { sourceName },
      update: {
        sourceUrl,
        markdownContent,
        ttlMinutes,
        updatedAt: new Date()
      },
      create: {
        sourceName,
        sourceUrl,
        markdownContent,
        ttlMinutes
      }
    })

    console.log(`Cache updated for ${sourceName} (TTL: ${ttlMinutes} minutes)`)
  } catch (error) {
    console.error(`Error setting cache for ${sourceName}:`, error)
    throw error
  }
}

/**
 * Checks if cache is stale and needs refresh
 * @param sourceName - Unique identifier for the data source
 * @returns true if cache is stale or doesn't exist
 */
export async function isCacheStale(sourceName: string): Promise<boolean> {
  const cache = await getCachedMarkdown(sourceName)
  return cache === null
}

/**
 * Gets all cached entries (for admin/debugging purposes)
 */
export async function getAllCacheEntries(): Promise<CacheEntry[]> {
  try {
    const entries = await prisma.markdownCache.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    return entries.map((entry: CacheEntry) => ({
      sourceName: entry.sourceName,
      sourceUrl: entry.sourceUrl,
      markdownContent: entry.markdownContent,
      ttlMinutes: entry.ttlMinutes,
      updatedAt: entry.updatedAt
    }))
  } catch (error) {
    console.error('Error retrieving all cache entries:', error)
    return []
  }
}

/**
 * Deletes a specific cache entry
 * @param sourceName - Unique identifier for the data source
 */
export async function deleteCacheEntry(sourceName: string): Promise<void> {
  try {
    await prisma.markdownCache.delete({
      where: { sourceName }
    })
    console.log(`Cache deleted for ${sourceName}`)
  } catch (error) {
    console.error(`Error deleting cache for ${sourceName}:`, error)
    throw error
  }
}

/**
 * Clears all cache entries (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  try {
    await prisma.markdownCache.deleteMany()
    console.log('All cache entries cleared')
  } catch (error) {
    console.error('Error clearing cache:', error)
    throw error
  }
}

/**
 * Gets cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number
  activeEntries: number
  expiredEntries: number
}> {
  try {
    const allEntries = await prisma.markdownCache.findMany()
    const now = new Date()

    let activeEntries = 0
    let expiredEntries = 0

    for (const entry of allEntries) {
      const expiresAt = new Date(entry.updatedAt.getTime() + entry.ttlMinutes * 60 * 1000)
      if (now <= expiresAt) {
        activeEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: allEntries.length,
      activeEntries,
      expiredEntries
    }
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return { totalEntries: 0, activeEntries: 0, expiredEntries: 0 }
  }
}
