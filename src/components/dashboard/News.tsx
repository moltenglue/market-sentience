'use client'

/**
 * News Component
 * 
 * Displays financial news from Sherwood and Reddit sentiment analysis.
 */

import { useState } from 'react'
import { Newspaper, MessageSquare, ChevronDown, ChevronUp, ExternalLink, ThumbsUp, MessageCircle } from 'lucide-react'
import { parseNewsData, parseRedditData, NewsArticle, RedditPost } from '@/lib/markdownUtils'

interface NewsProps {
  newsData: string
  redditData: string
}

interface SentimentData {
  title: string
  summary?: string
  link: string
  category?: string
}
  sentimentScore: number
}

export function News({ newsData, redditData }: NewsProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'reddit'>('news')
  const articles = parseNewsData(newsData)
  const posts = parseRedditData(redditData)

  // Calculate sentiment for Reddit tab header
  const bullishCount = posts.filter(p => p.sentiment === 'bullish').length
  const bearishCount = posts.filter(p => p.sentiment === 'bearish').length
  const overallSentiment = bullishCount > bearishCount ? '🐂' : bearishCount > bullishCount ? '🐻' : '⚖️'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'news'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          News ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('reddit')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'reddit'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Reddit {overallSentiment} ({posts.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto">
        {activeTab === 'news' ? (
          <NewsList articles={articles} />
        ) : (
          <RedditList posts={posts} />
        )}
      </div>
    </div>
  )
}

function NewsList({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No news articles available.</p>
        <p className="text-sm mt-1">Click refresh to load latest news.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {articles.slice(0, 10).map((article, index) => (
        <NewsItem key={index} article={article} />
      ))}
    </div>
  )
}

function NewsItem({ article }: { article: NewsArticle }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
            {article.title}
          </h3>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          )}
        </div>

        {article.category && (
          <span className="inline-block mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            {article.category}
          </span>
        )}

        {isExpanded && article.summary && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            {article.summary}
          </div>
        )}

        {isExpanded && (
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            Read full article
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function RedditList({ posts }: { posts: RedditPost[] }) {
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all')

  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(p => p.sentiment === filter)

  const sentimentCounts = {
    all: posts.length,
    bullish: posts.filter(p => p.sentiment === 'bullish').length,
    bearish: posts.filter(p => p.sentiment === 'bearish').length,
    neutral: posts.filter(p => p.sentiment === 'neutral').length
  }

  return (
    <div>
      {/* Sentiment Filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto">
        {(['all', 'bullish', 'bearish', 'neutral'] as const).map((sentiment) => (
          <button
            key={sentiment}
            onClick={() => setFilter(sentiment)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              filter === sentiment
                ? sentiment === 'bullish'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : sentiment === 'bearish'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : sentiment === 'neutral'
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {sentiment === 'all' ? 'All' : sentiment === 'bullish' ? '🐂 Bullish' : sentiment === 'bearish' ? '🐻 Bearish' : '⚖️ Neutral'}
            <span className="ml-1 opacity-75">({sentimentCounts[sentiment]})</span>
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No posts found for this filter.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredPosts.slice(0, 15).map((post, index) => (
            <RedditItem key={index} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

function RedditItem({ post }: { post: RedditPost }) {
  const sentimentColor = post.sentiment === 'bullish' 
    ? 'text-green-600 dark:text-green-400'
    : post.sentiment === 'bearish'
    ? 'text-red-600 dark:text-red-400'
    : 'text-gray-600 dark:text-gray-400'

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
          {post.title}
        </h3>

        {post.selftext && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {post.selftext}
          </p>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {post.score.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {post.numComments.toLocaleString()}
            </span>
          </div>
          <span className={`font-medium ${sentimentColor}`}>
            {post.sentiment === 'bullish' ? '🐂' : post.sentiment === 'bearish' ? '🐻' : '⚖️'}
            {' '}
            {(post.sentimentScore * 100).toFixed(0)}%
          </span>
        </div>
      </a>
    </div>
  )
}

export default News
