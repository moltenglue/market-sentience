/**
 * Reddit Sentiment Scraper
 * 
 * Extracts trending posts from r/wallstreetbets and performs
 * basic sentiment analysis to assign bullish/bearish scores.
 * 
 * Note: Reddit API requires authentication for production use.
 * This implementation uses a fallback to publicly accessible JSON.
 * 
 * Source: https://www.reddit.com/r/wallstreetbets.json
 */

import axios from 'axios'
import { setCachedMarkdown } from '../cache/markdownCache'

const REDDIT_URL = 'https://www.reddit.com/r/wallstreetbets.json'
const SOURCE_NAME = 'reddit-wsb'
const DEFAULT_TTL = 30 // minutes

// Sentiment keywords for basic analysis
const BULLISH_KEYWORDS = [
  'buy', 'bull', 'bullish', 'moon', 'rocket', 'tendies', 'gain', 'gains',
  'profit', 'profits', 'long', 'calls', 'call', 'yolo', 'diamond hands',
  'hodl', 'hold', 'green', 'up', 'rise', 'rising', 'surge', 'mooning',
  '🚀', '🌙', '💎', '🙌', 'all in', 'all-in', 'breakout', ' ATH'
]

const BEARISH_KEYWORDS = [
  'sell', 'bear', 'bearish', 'crash', 'dump', 'loss', 'losses', 'short',
  'puts', 'put', 'panic', 'fear', 'red', 'down', 'fall', 'falling',
  'drop', 'dropping', 'plunge', 'recession', 'bear market', 'correction',
  '📉', '💀', '😭', 'crash', 'rug pull', 'rugpull'
]

interface RedditPost {
  title: string
  selftext: string
  score: number
  numComments: number
  url: string
  createdUtc: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  sentimentScore: number
}

/**
 * Performs basic keyword-based sentiment analysis on text
 */
function analyzeSentiment(text: string): { sentiment: 'bullish' | 'bearish' | 'neutral', score: number } {
  const lowerText = text.toLowerCase()
  
  let bullishCount = 0
  let bearishCount = 0
  
  for (const keyword of BULLISH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      bullishCount++
    }
  }
  
  for (const keyword of BEARISH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      bearishCount++
    }
  }
  
  // Calculate sentiment score (-1 to 1)
  const totalKeywords = bullishCount + bearishCount
  if (totalKeywords === 0) {
    return { sentiment: 'neutral', score: 0 }
  }
  
  const score = (bullishCount - bearishCount) / totalKeywords
  
  if (score > 0.2) {
    return { sentiment: 'bullish', score }
  } else if (score < -0.2) {
    return { sentiment: 'bearish', score }
  } else {
    return { sentiment: 'neutral', score }
  }
}

/**
 * Fetches trending posts from r/wallstreetbets
 */
async function fetchRedditPosts(): Promise<RedditPost[]> {
  try {
    const response = await axios.get(REDDIT_URL, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MarketSentimentDashboard/1.0'
      }
    })

    const posts: RedditPost[] = []
    const children = response.data?.data?.children || []

    for (const child of children.slice(0, 25)) {
      const data = child.data
      if (!data) continue

      const title = data.title || ''
      const selftext = data.selftext || ''
      const fullText = `${title} ${selftext}`
      
      const sentiment = analyzeSentiment(fullText)

      posts.push({
        title: title,
        selftext: selftext.substring(0, 300) + (selftext.length > 300 ? '...' : ''),
        score: data.score || 0,
        numComments: data.num_comments || 0,
        url: `https://reddit.com${data.permalink}`,
        createdUtc: data.created_utc || 0,
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score
      })
    }

    return posts
  } catch (error) {
    console.error('Error fetching Reddit posts:', error)
    throw error
  }
}

/**
 * Formats Reddit posts as markdown with sentiment analysis
 */
function formatRedditAsMarkdown(posts: RedditPost[]): string {
  if (posts.length === 0) {
    return '# Reddit r/wallstreetbets Sentiment\n\nNo posts found.\n'
  }

  const timestamp = new Date().toISOString()
  
  // Calculate overall sentiment
  const bullishCount = posts.filter(p => p.sentiment === 'bullish').length
  const bearishCount = posts.filter(p => p.sentiment === 'bearish').length
  const neutralCount = posts.filter(p => p.sentiment === 'neutral').length
  const totalSentiment = bullishCount - bearishCount
  const overallSentiment = totalSentiment > 2 ? '🐂 Bullish' : totalSentiment < -2 ? '🐻 Bearish' : '⚖️ Neutral'
  
  let markdown = `# Reddit r/wallstreetbets Sentiment Analysis\n\n`
  markdown += `*Last updated: ${timestamp}*\n\n`
  markdown += `## Overall Sentiment: ${overallSentiment}\n\n`
  markdown += `- 🐂 **Bullish posts:** ${bullishCount}\n`
  markdown += `- 🐻 **Bearish posts:** ${bearishCount}\n`
  markdown += `- ⚖️ **Neutral posts:** ${neutralCount}\n\n`
  
  // Group posts by sentiment
  const bullishPosts = posts.filter(p => p.sentiment === 'bullish').slice(0, 10)
  const bearishPosts = posts.filter(p => p.sentiment === 'bearish').slice(0, 10)
  const neutralPosts = posts.filter(p => p.sentiment === 'neutral').slice(0, 5)
  
  // Bullish section
  if (bullishPosts.length > 0) {
    markdown += `## 🐂 Bullish Posts\n\n`
    for (const post of bullishPosts) {
      markdown += `**${post.title}**\n\n`
      if (post.selftext) {
        markdown += `${post.selftext}\n\n`
      }
      markdown += `👍 ${post.score} | 💬 ${post.numComments} comments | Sentiment: ${(post.sentimentScore * 100).toFixed(0)}%\n`
      markdown += `[View on Reddit](${post.url})\n\n`
      markdown += `---\n\n`
    }
  }
  
  // Bearish section
  if (bearishPosts.length > 0) {
    markdown += `## 🐻 Bearish Posts\n\n`
    for (const post of bearishPosts) {
      markdown += `**${post.title}**\n\n`
      if (post.selftext) {
        markdown += `${post.selftext}\n\n`
      }
      markdown += `👍 ${post.score} | 💬 ${post.numComments} comments | Sentiment: ${(post.sentimentScore * 100).toFixed(0)}%\n`
      markdown += `[View on Reddit](${post.url})\n\n`
      markdown += `---\n\n`
    }
  }
  
  // Neutral section (brief)
  if (neutralPosts.length > 0) {
    markdown += `## ⚖️ Neutral Posts\n\n`
    for (const post of neutralPosts) {
      markdown += `- **${post.title}** - 👍 ${post.score}\n`
    }
    markdown += `\n`
  }
  
  // Sentiment methodology
  markdown += `## Sentiment Methodology\n\n`
  markdown += `This analysis uses keyword-based sentiment detection on post titles and content.\n\n`
  markdown += `**Bullish keywords:** ${BULLISH_KEYWORDS.slice(0, 10).join(', ')}, ...\n\n`
  markdown += `**Bearish keywords:** ${BEARISH_KEYWORDS.slice(0, 10).join(', ')}, ...\n\n`
  markdown += `*Source: [r/wallstreetbets](https://reddit.com/r/wallstreetbets)*\n`
  
  return markdown
}

/**
 * Main scraper function - fetches and caches Reddit sentiment
 */
export async function scrapeRedditSentiment(): Promise<string> {
  console.log('Scraping Reddit r/wallstreetbets...')
  
  try {
    const posts = await fetchRedditPosts()
    const markdown = formatRedditAsMarkdown(posts)
    
    await setCachedMarkdown(SOURCE_NAME, REDDIT_URL, markdown, {
      ttlMinutes: DEFAULT_TTL
    })
    
    console.log(`✓ Reddit sentiment scraped successfully (${posts.length} posts)`)
    return markdown
  } catch (error) {
    console.error('✗ Failed to scrape Reddit sentiment:', error)
    throw error
  }
}

/**
 * Get cached Reddit sentiment or trigger fresh scrape
 */
export async function getRedditSentiment(): Promise<string> {
  const { getCachedMarkdown } = await import('../cache/markdownCache')
  const cached = await getCachedMarkdown(SOURCE_NAME)
  
  if (cached) {
    console.log('Returning cached Reddit sentiment data')
    return cached.markdownContent
  }
  
  return scrapeRedditSentiment()
}

// Export for testing
export { fetchRedditPosts, formatRedditAsMarkdown, analyzeSentiment }
