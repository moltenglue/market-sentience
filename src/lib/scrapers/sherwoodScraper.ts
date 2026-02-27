/**
 * Sherwood News Scraper
 * 
 * Extracts financial news headlines from Sherwood News
 * and formats them as markdown for caching.
 * 
 * Note: Sherwood News may require browser-based scraping
 * due to JavaScript-rendered content.
 * 
 * Source: https://sherwood.news/
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { setCachedMarkdown } from '../cache/markdownCache'

const SHERWOOD_URL = 'https://sherwood.news/'
const SOURCE_NAME = 'sherwood-news'
const DEFAULT_TTL = 30 // minutes

interface NewsArticle {
  title: string
  summary?: string
  link: string
  publishedAt?: string
  category?: string
}

/**
 * Fetches and parses Sherwood News homepage
 */
async function fetchSherwoodNews(): Promise<NewsArticle[]> {
  try {
    const response = await axios.get(SHERWOOD_URL, {
      timeout: 15000,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $ = cheerio.load(response.data)
    const articles: NewsArticle[] = []

    // Try multiple selectors to find articles
    // Sherwood News structure may vary, so we try common patterns
    const selectors = [
      'article h2 a',
      'article h3 a',
      '.news-item h2 a',
      '.news-item h3 a',
      '.headline a',
      '[class*="title"] a',
      'h2 a[href*="/"]',
      'h3 a[href*="/"]'
    ]

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const $el = $(element)
        const title = $el.text().trim()
        const link = $el.attr('href') || ''
        
        // Skip if no title or link
        if (!title || !link) return
        
        // Make relative URLs absolute
        const absoluteLink = link.startsWith('http') ? link : `${SHERWOOD_URL}${link.replace(/^\//, '')}`
        
        // Try to find summary
        let summary = ''
        const $parent = $el.closest('article, .news-item, .headline, [class*="item"]')
        if ($parent.length) {
          summary = $parent.find('p, [class*="summary"], [class*="excerpt"]').first().text().trim()
        }
        
        // Try to find category
        let category = ''
        if ($parent.length) {
          category = $parent.find('[class*="category"], [class*="tag"]').first().text().trim()
        }

        // Avoid duplicates
        if (!articles.find(a => a.title === title)) {
          articles.push({
            title,
            summary: summary || undefined,
            link: absoluteLink,
            category: category || undefined
          })
        }
      })

      // If we found articles, stop trying other selectors
      if (articles.length > 0) break
    }

    return articles.slice(0, 30) // Limit to top 30 articles
  } catch (error) {
    console.error('Error fetching Sherwood News:', error)
    throw error
  }
}

/**
 * Formats news articles as markdown list
 */
function formatNewsAsMarkdown(articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return '# Sherwood News\n\nNo news articles found. The site structure may have changed.\n'
  }

  const timestamp = new Date().toISOString()
  
  let markdown = `# Sherwood Financial News\n\n`
  markdown += `*Last updated: ${timestamp}*\n\n`
  markdown += `## Top Headlines\n\n`
  
  for (const article of articles) {
    markdown += `### ${article.title}\n\n`
    
    if (article.category) {
      markdown += `**Category:** ${article.category}  \n`
    }
    
    if (article.summary) {
      markdown += `${article.summary}  \n`
    }
    
    markdown += `[Read more](${article.link})\n\n`
    markdown += `---\n\n`
  }
  
  markdown += `*Source: [Sherwood News](${SHERWOOD_URL})*\n`
  
  return markdown
}

/**
 * Main scraper function - fetches and caches Sherwood News
 */
export async function scrapeSherwoodNews(): Promise<string> {
  console.log('Scraping Sherwood News...')
  
  try {
    const articles = await fetchSherwoodNews()
    const markdown = formatNewsAsMarkdown(articles)
    
    await setCachedMarkdown(SOURCE_NAME, SHERWOOD_URL, markdown, {
      ttlMinutes: DEFAULT_TTL
    })
    
    console.log(`✓ Sherwood News scraped successfully (${articles.length} articles)`)
    return markdown
  } catch (error) {
    console.error('✗ Failed to scrape Sherwood News:', error)
    throw error
  }
}

/**
 * Get cached Sherwood News or trigger fresh scrape
 */
export async function getSherwoodNews(): Promise<string> {
  const { getCachedMarkdown } = await import('../cache/markdownCache')
  const cached = await getCachedMarkdown(SOURCE_NAME)
  
  if (cached) {
    console.log('Returning cached Sherwood News data')
    return cached.markdownContent
  }
  
  return scrapeSherwoodNews()
}

// Export for testing
export { fetchSherwoodNews, formatNewsAsMarkdown }
