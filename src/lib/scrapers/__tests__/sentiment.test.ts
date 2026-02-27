/**
 * Reddit Sentiment Analysis Unit Tests
 * 
 * Tests the sentiment analysis algorithm for Reddit posts.
 */

import { analyzeSentiment } from '@/lib/scrapers/redditScraper'

describe('Sentiment Analysis', () => {
  describe('analyzeSentiment', () => {
    it('should classify bullish posts correctly', () => {
      const bullishTexts = [
        'AMC to the moon! 🚀 Diamond hands!',
        'Just bought more TSLA calls, feeling bullish',
        'This stock is going to breakout soon, all in!',
        'Bullish on tech stocks for Q4, buying the dip',
        'HODL! The market is going up 🌙'
      ]

      for (const text of bullishTexts) {
        const result = analyzeSentiment(text)
        expect(result.sentiment).toBe('bullish')
        expect(result.score).toBeGreaterThan(0)
      }
    })

    it('should classify bearish posts correctly', () => {
      const bearishTexts = [
        'Market is crashing, sell everything!',
        'Shorting this stock, it\'s going to dump',
        'Bearish on crypto, recession incoming 📉',
        'This is a rug pull, get out now!',
        'Panic selling, the market is red'
      ]

      for (const text of bearishTexts) {
        const result = analyzeSentiment(text)
        expect(result.sentiment).toBe('bearish')
        expect(result.score).toBeLessThan(0)
      }
    })

    it('should classify neutral posts correctly', () => {
      const neutralTexts = [
        'What do you think about this stock?',
        'Just doing some research on the market',
        'Here are some financial metrics',
        'Question about options trading',
        'Analysis of quarterly earnings'
      ]

      for (const text of neutralTexts) {
        const result = analyzeSentiment(text)
        expect(result.sentiment).toBe('neutral')
        expect(result.score).toBe(0)
      }
    })

    it('should handle mixed sentiment posts', () => {
      // Post with both bullish and bearish keywords
      const mixedText = 'Market is crashing but buying the dip with diamond hands'
      const result = analyzeSentiment(mixedText)
      
      // Should still return a result
      expect(['bullish', 'bearish', 'neutral']).toContain(result.sentiment)
      expect(typeof result.score).toBe('number')
    })

    it('should handle empty text', () => {
      const result = analyzeSentiment('')
      expect(result.sentiment).toBe('neutral')
      expect(result.score).toBe(0)
    })

    it('should be case insensitive', () => {
      const lowerCase = analyzeSentiment('bullish on this stock')
      const upperCase = analyzeSentiment('BULLISH on this stock')
      const mixedCase = analyzeSentiment('BuLLisH on this stock')

      expect(lowerCase.sentiment).toBe('bullish')
      expect(upperCase.sentiment).toBe('bullish')
      expect(mixedCase.sentiment).toBe('bullish')
    })

    it('should handle emojis', () => {
      const emojiText = '🚀🌙💎🙌 This is going to the moon!'
      const result = analyzeSentiment(emojiText)
      expect(result.sentiment).toBe('bullish')
    })

    it('should calculate appropriate score magnitudes', () => {
      // Strong bullish sentiment should have higher score
      const strongBullish = analyzeSentiment('MOON! 🚀🚀🚀 DIAMOND HANDS! ALL IN! BUY BUY BUY!')
      const weakBullish = analyzeSentiment('slightly bullish on this')

      expect(strongBullish.score).toBeGreaterThan(weakBullish.score)
      expect(Math.abs(strongBullish.score)).toBeGreaterThan(0.5)
    })
  })
})
