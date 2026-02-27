/**
 * Markdown Formatting Utility Tests
 * 
 * Tests markdown parsing and formatting utilities.
 */

import { parseMarketsData, parseNewsData, parseRedditData, parseMacroData } from '@/lib/markdownUtils'

describe('Markdown Formatting', () => {
  describe('parseMarketsData', () => {
    it('should parse market data from markdown table', () => {
      const markdown = `
# Quotient Prediction Markets

## Top Active Markets

| Market | Probability | Volume | Liquidity | Category |
|--------|-------------|--------|-----------|----------|
| Will BTC hit 100k? | 65.5% | $1,234,567 | $500,000 | Crypto |
| Election winner? | 52.3% | $2,000,000 | $750,000 | Politics |
| Rain tomorrow? | 30.0% | $50,000 | $25,000 | Weather |

## Summary
Total markets: 3
`

      const markets = parseMarketsData(markdown)

      expect(markets).toHaveLength(3)
      expect(markets[0]).toEqual({
        question: 'Will BTC hit 100k?',
        probability: '65.5%',
        volume: '$1,234,567',
        liquidity: '$500,000',
        category: 'Crypto'
      })
    })

    it('should handle escaped pipe characters', () => {
      const markdown = `
| Market | Probability | Volume | Liquidity | Category |
|--------|-------------|--------|-----------|----------|
| Will A|B merge? | 50% | $100,000 | $50,000 | Business |
`

      const markets = parseMarketsData(markdown)

      expect(markets).toHaveLength(1)
      expect(markets[0].question).toBe('Will A|B merge?')
    })

    it('should return empty array for invalid markdown', () => {
      const markets = parseMarketsData('Invalid markdown without table')
      expect(markets).toEqual([])
    })
  })

  describe('parseNewsData', () => {
    it('should parse news articles from markdown', () => {
      const markdown = `
# Sherwood Financial News

### Fed Raises Interest Rates

**Category:** Economy  
The Federal Reserve announced a 25 basis point rate hike today...

[Read more](https://example.com/article1)

---

### Tech Stocks Surge

**Category:** Technology  
Major tech companies reported strong earnings...

[Read more](https://example.com/article2)
`

      const articles = parseNewsData(markdown)

      expect(articles).toHaveLength(2)
      expect(articles[0]).toEqual({
        title: 'Fed Raises Interest Rates',
        category: 'Economy',
        summary: 'The Federal Reserve announced a 25 basis point rate hike today...',
        link: 'https://example.com/article1'
      })
    })

    it('should handle articles without summaries', () => {
      const markdown = `
### Breaking News

[Read more](https://example.com/news)
`

      const articles = parseNewsData(markdown)

      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Breaking News')
      expect(articles[0].summary).toBeUndefined()
    })
  })

  describe('parseRedditData', () => {
    it('should parse Reddit posts from markdown', () => {
      const markdown = `
## 🐂 Bullish Posts

**GME is going to moon!**

Just bought 100 more shares, diamond hands! 💎🙌

👍 15432 | 💬 2341 comments | Sentiment: 85%
[View on Reddit](https://reddit.com/r/wsb/post1)

---

## 🐻 Bearish Posts

**Market is crashing**

Selling everything, bear market incoming

👍 8765 | 💬 1234 comments | Sentiment: -75%
[View on Reddit](https://reddit.com/r/wsb/post2)
`

      const posts = parseRedditData(markdown)

      expect(posts).toHaveLength(2)
      expect(posts[0]).toEqual({
        title: 'GME is going to moon!',
        selftext: 'Just bought 100 more shares, diamond hands! 💎🙌',
        score: 15432,
        numComments: 2341,
        sentiment: 'bullish',
        sentimentScore: 0.85,
        url: 'https://reddit.com/r/wsb/post1'
      })
    })
  })

  describe('parseMacroData', () => {
    it('should parse macro indicators from combined markdown', () => {
      const markdown = `
# Market Summary

## Major Indices

| Index | Price | Change | % Change |
|-------|-------|--------|----------|
| S&P 500 | 4500.00 | +25.00 | +0.56% |
| VIX | 18.50 | -0.50 | -2.63% |

## Macroeconomic Indicators

| Indicator | Value | Unit | Change |
|-----------|-------|------|--------|
| Federal Funds Rate | 5.33 | % | +0.25 |
| Unemployment Rate | 3.7 | % | -0.1 |
| Yield Curve | -0.35 | % | +0.06 |

## Cryptocurrency

| Asset | Price | Change | % Change |
|-------|-------|--------|----------|
| Bitcoin | 65000 | +1000 | +1.56% |
`

      const indicators = parseMacroData(markdown)

      expect(indicators.length).toBeGreaterThan(0)
      
      // Check for S&P 500
      const sp500 = indicators.find((i: { name: string }) => i.name === 'S&P 500')
      expect(sp500).toBeTruthy()
      expect(sp500?.value).toBe('4500.00')
      expect(sp500?.isPositive).toBe(true)
    })

    it('should handle missing data gracefully', () => {
      const markdown = 'No data available'
      const indicators = parseMacroData(markdown)
      expect(indicators).toEqual([])
    })
  })
})
