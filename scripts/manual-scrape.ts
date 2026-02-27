/**
 * Manual Scrape Script
 * 
 * Utility script for manually triggering data scrapes
 * and managing the cache from the command line.
 * 
 * Usage:
 *   npm run scrape -- --source=all
 *   npm run scrape -- --source=yahoo-finance --clear-cache
 *   npm run scrape -- --stats
 */

import { PrismaClient } from '@prisma/client'
import { refreshData } from '../src/lib/scrapers'

const prisma = new PrismaClient()

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  source: 'all' as const,
  clearCache: false,
  stats: false,
  help: false
}

args.forEach(arg => {
  if (arg.startsWith('--source=')) {
    options.source = arg.split('=')[1] as typeof options.source
  } else if (arg === '--clear-cache') {
    options.clearCache = true
  } else if (arg === '--stats') {
    options.stats = true
  } else if (arg === '--help' || arg === '-h') {
    options.help = true
  }
})

// Show help
if (options.help) {
  console.log(`
Manual Scrape Script

Usage:
  npm run scrape [options]

Options:
  --source=<source>    Scrape specific source (yahoo-finance, fred-macro, 
                       quotient-markets, sherwood-news, reddit-wsb, all)
  --clear-cache        Clear cache before scraping
  --stats              Show cache statistics
  --help, -h           Show this help message

Examples:
  npm run scrape -- --source=all
  npm run scrape -- --source=yahoo-finance --clear-cache
  npm run scrape -- --stats
`)
  process.exit(0)
}

// Show cache statistics
async function showStats(): Promise<void> {
  console.log('\n📊 Cache Statistics\n')
  
  const totalEntries = await prisma.markdownCache.count()
  const entries = await prisma.markdownCache.findMany()
  
  console.log(`Total cached sources: ${totalEntries}`)
  
  if (totalEntries > 0) {
    console.log('\nSource Details:')
    console.log('─'.repeat(80))
    console.log(`${'Source'.padEnd(25)} ${'Updated'.padEnd(25)} ${'TTL'.padEnd(10)} Status`)
    console.log('─'.repeat(80))
    
    for (const entry of entries) {
      const age = Date.now() - entry.updatedAt.getTime()
      const maxAge = entry.ttlMinutes * 60 * 1000
      const isStale = age > maxAge
      const status = isStale ? '🔴 Stale' : '🟢 Fresh'
      const updated = entry.updatedAt.toLocaleString()
      
      console.log(
        `${entry.sourceName.padEnd(25)} ${updated.padEnd(25)} ${entry.ttlMinutes.toString().padEnd(10)} ${status}`
      )
    }
    console.log('─'.repeat(80))
  }
  
  console.log()
}

// Clear cache
async function clearCache(): Promise<void> {
  console.log('\n🗑️  Clearing cache...')
  await prisma.markdownCache.deleteMany()
  console.log('✅ Cache cleared\n')
}

// Run scraper
async function runScraper(): Promise<void> {
  console.log(`\n🚀 Starting scraper for source: ${options.source}\n`)
  
  try {
    const results = await refreshData(options.source)
    
    console.log('\n📈 Results:')
    console.log('─'.repeat(60))
    
    for (const [source, result] of Object.entries(results)) {
      const icon = result.success ? '✅' : '❌'
      console.log(`${icon} ${source.padEnd(25)} ${result.success ? 'Success' : 'Failed'}`)
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`)
      }
    }
    
    console.log('─'.repeat(60))
    console.log()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Scraper error:', errorMessage)
    process.exit(1)
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    if (options.stats) {
      await showStats()
      return
    }
    
    if (options.clearCache) {
      await clearCache()
    }
    
    await runScraper()
    await showStats()
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', errorMessage)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
