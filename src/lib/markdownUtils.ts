export interface Market {
  question: string
  probability: string
  volume: string
  liquidity: string
  category: string
}

export interface NewsArticle {
  title: string
  category?: string
  summary?: string
  link?: string
}

export interface RedditPost {
  title: string
  selftext?: string
  score: number
  numComments: number
  sentiment: string
  sentimentScore: number
  url: string
}

export interface MacroIndicator {
  name: string
  value: string
  change?: string
  isPositive?: boolean
}

export function parseMarketsData(markdown: string): Market[] {
  const markets: Market[] = []
  
  if (!markdown) return markets

  const tableMatch = markdown.match(/\| Market \|.*?\n\|[-|]+\n([\s\S]*?)(?=\n\n|$)/)
  if (!tableMatch) return markets

  const rows = tableMatch[1].trim().split('\n')
  
  for (const row of rows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(Boolean)
    if (cells.length >= 4) {
      markets.push({
        question: cells[0].replace(/\\\|/g, '|'),
        probability: cells[1],
        volume: cells[2],
        liquidity: cells[3],
        category: cells[4] || 'General'
      })
    }
  }

  return markets
}

export function parseNewsData(markdown: string): NewsArticle[] {
  const articles: NewsArticle[] = []
  
  if (!markdown) return articles

  const articleRegex = /###\s+(.+?)\n\s*\*\*Category:\*\*\s*(\w+)\s*\n(.+?)\n\s*\[Read more\]\((.+?)\)/gs
  let match
  
  while ((match = articleRegex.exec(markdown)) !== null) {
    articles.push({
      title: match[1],
      category: match[2],
      summary: match[3].trim(),
      link: match[4]
    })
  }

  return articles
}

export function parseRedditData(markdown: string): RedditPost[] {
  const posts: RedditPost[] = []
  
  if (!markdown) return posts

  const postRegex = /\*\*([^\n]+)\*\*\n\n([\s\S]*?)\n\n👍\s*(\d+)\s*\|\s*💬\s*(\d+)\s*comments\s*\|\s*Sentiment:\s*([-\d]+%)\s*\[View on Reddit\]\((.+?)\)/g
  let match

  while ((match = postRegex.exec(markdown)) !== null) {
    const sentimentValue = match[5].replace('%', '')
    const sentimentNum = parseInt(sentimentValue)
    
    posts.push({
      title: match[1],
      selftext: match[2].trim(),
      score: parseInt(match[3]),
      numComments: parseInt(match[4]),
      sentiment: sentimentNum >= 0 ? 'bullish' : 'bearish',
      sentimentScore: sentimentNum / 100,
      url: match[6]
    })
  }

  return posts
}

export function parseMacroData(markdown: string): MacroIndicator[] {
  const indicators: MacroIndicator[] = []
  
  if (!markdown) return indicators

  const lines = markdown.split('\n')
  
  for (const line of lines) {
    if (line.includes('|') && !line.includes('---')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 3) {
        const name = cells[0]
        const value = cells[1]
        const change = cells[2]
        const isPositive = change?.startsWith('+')
        
        if (name && value && !name.includes('Index') && !name.includes('Indicator') && !name.includes('Asset')) {
          indicators.push({ name, value, change, isPositive })
        }
      }
    }
  }

  return indicators
}
