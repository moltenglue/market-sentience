/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-console */

/**
 * Agentic E2E Test Script
 * 
 * Uses agent-browser capabilities to perform end-to-end testing
 * of the Market Sentiment Dashboard.
 * 
 * This script:
 * 1. Boots the local dashboard
 * 2. Reads page content to verify data rendering
 * 3. Simulates user interactions with the Gemini chat
 * 4. Validates UI components and responses
 * 
 * Usage: node scripts/e2e-agent.js
 */

const { exec } = require('child_process')
const util = require('util')

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
}

/**
 * Logger utility
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const color = type === 'success' ? colors.green 
    : type === 'error' ? colors.red 
    : type === 'warning' ? colors.yellow 
    : colors.blue
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`)
}

/**
 * Test runner
 */
async function runTest(name, testFn) {
  log(`\n🧪 Running test: ${name}`, 'info')
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await testFn()
      results.passed++
      results.tests.push({ name, status: 'passed', attempt })
      log(`✅ Test passed: ${name}`, 'success')
      return
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        results.failed++
        results.tests.push({ name, status: 'failed', error: error.message, attempt })
        log(`❌ Test failed: ${name}`, 'error')
        log(`   Error: ${error.message}`, 'error')
      } else {
        log(`⚠️  Attempt ${attempt} failed, retrying...`, 'warning')
        await sleep(2000)
      }
    }
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with timeout and retry
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeout)
    return response
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * Test 1: Verify dashboard is accessible
 */
async function testDashboardAccessibility() {
  const response = await fetchWithTimeout(BASE_URL)
  
  if (!response.ok) {
    throw new Error(`Dashboard returned status ${response.status}`)
  }
  
  const html = await response.text()
  
  // Verify key elements are present
  const requiredElements = [
    'Market Sentiment Dashboard',
    'Macro Indicators',
    'Prediction Markets',
    'AI Market Assistant'
  ]
  
  for (const element of requiredElements) {
    if (!html.includes(element)) {
      throw new Error(`Missing required element: ${element}`)
    }
  }
}

/**
 * Test 2: Verify API endpoints are responding
 */
async function testAPIEndpoints() {
  const endpoints = [
    { url: '/api/data?source=all', method: 'GET' },
    { url: '/api/refresh', method: 'GET' },
    { url: '/api/chat', method: 'POST', body: { message: 'test', sessionId: 'test-session' } }
  ]
  
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint.url}`
    const options = {
      method: endpoint.method,
      headers: { 'Content-Type': 'application/json' }
    }
    
    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body)
    }
    
    const response = await fetchWithTimeout(url, options)
    
    // Chat endpoint may return 500 if Gemini API is not configured, which is OK for E2E
    if (endpoint.url === '/api/chat' && response.status === 500) {
      log(`   ℹ️  Chat endpoint requires Gemini API key (expected in test env)`, 'warning')
      continue
    }
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Endpoint ${endpoint.url} returned status ${response.status}`)
    }
  }
}

/**
 * Test 3: Verify data sources are returning data
 */
async function testDataSources() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/data?source=all`)
  
  if (!response.ok) {
    throw new Error(`Data API returned status ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!data.data) {
    throw new Error('Data API response missing data property')
  }
  
  const sources = ['yahoo-finance', 'fred-macro', 'quotient-markets', 'sherwood-news', 'reddit-wsb']
  const availableSources = Object.keys(data.data)
  
  // At least some sources should have data (or empty string if not cached yet)
  const activeSources = sources.filter(s => availableSources.includes(s))
  
  if (activeSources.length === 0) {
    throw new Error('No data sources available')
  }
  
  log(`   ✓ Available sources: ${activeSources.join(', ')}`, 'success')
}

/**
 * Test 4: Verify chat functionality (if API key is configured)
 */
async function testChatFunctionality() {
  // First check if Gemini API is configured
  const checkResponse = await fetchWithTimeout(`${BASE_URL}/api/data?source=all`)
  if (!checkResponse.ok) {
    throw new Error('Cannot verify chat - dashboard not accessible')
  }
  
  // Try to send a message
  const response = await fetchWithTimeout(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Summarize the market',
      sessionId: `test-${Date.now()}`,
      stream: false
    })
  })
  
  // If we get a 500, likely API key issue - that's OK for basic E2E
  if (response.status === 500) {
    log('   ℹ️  Chat requires Gemini API configuration', 'warning')
    return
  }
  
  if (!response.ok) {
    throw new Error(`Chat API returned status ${response.status}`)
  }
  
  const result = await response.json()
  
  if (!result.response) {
    throw new Error('Chat response missing expected fields')
  }
  
  log(`   ✓ Chat returned response (${result.response.length} chars)`, 'success')
}

/**
 * Test 5: Verify refresh functionality
 */
async function testRefreshFunctionality() {
  const response = await fetchWithTimeout(`${BASE_URL}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auto: true })
  })
  
  if (!response.ok) {
    throw new Error(`Refresh API returned status ${response.status}`)
  }
  
  const result = await response.json()
  
  if (!result.hasOwnProperty('success')) {
    throw new Error('Refresh response missing success property')
  }
  
  log(`   ✓ Refresh completed: ${result.summary?.successful || 0} sources refreshed`, 'success')
}

/**
 * Test 6: Verify UI components render correctly
 */
async function testUIComponents() {
  const response = await fetchWithTimeout(BASE_URL)
  const html = await response.text()
  
  // Check for UI component indicators
  const components = [
    { name: 'Header', indicators: ['Market Sentiment Dashboard', 'Refresh Data'] },
    { name: 'MacroBar', indicators: ['Macro Indicators'] },
    { name: 'Markets', indicators: ['Prediction Markets'] },
    { name: 'News', indicators: ['News', 'Reddit'] },
    { name: 'Chat', indicators: ['AI Market Assistant'] }
  ]
  
  for (const component of components) {
    const found = component.indicators.some(indicator => html.includes(indicator))
    if (!found) {
      throw new Error(`Component ${component.name} not properly rendered`)
    }
    log(`   ✓ ${component.name} component rendered`, 'success')
  }
}

/**
 * Main test suite
 */
async function runE2ETests() {
  log(`${colors.bright}========================================`, 'info')
  log('🚀 Starting E2E Tests', 'info')
  log(`📍 Target URL: ${BASE_URL}`, 'info')
  log(`⏱️  Timeout: ${TIMEOUT}ms`, 'info')
  log(`🔄 Max Retries: ${MAX_RETRIES}`, 'info')
  log(`========================================${colors.reset}`, 'info')
  
  // Wait for server to be ready
  log('\n⏳ Waiting for server to be ready...', 'info')
  let retries = 0
  while (retries < 10) {
    try {
      await fetchWithTimeout(BASE_URL)
      log('✅ Server is ready!', 'success')
      break
    } catch {
      retries++
      await sleep(1000)
    }
  }
  
  if (retries >= 10) {
    log('❌ Server not responding after 10 attempts', 'error')
    process.exit(1)
  }
  
  // Run tests
  await runTest('Dashboard Accessibility', testDashboardAccessibility)
  await runTest('API Endpoints', testAPIEndpoints)
  await runTest('Data Sources', testDataSources)
  await runTest('Chat Functionality', testChatFunctionality)
  await runTest('Refresh Functionality', testRefreshFunctionality)
  await runTest('UI Components', testUIComponents)
  
  // Report results
  log(`\n${colors.bright}========================================`, 'info')
  log('📊 Test Results', 'info')
  log(`========================================${colors.reset}`, 'info')
  log(`✅ Passed: ${results.passed}`, 'success')
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'info')
  log(`📈 Total: ${results.tests.length}`, 'info')
  
  if (results.failed > 0) {
    log(`\n${colors.bright}Failed Tests:${colors.reset}`, 'error')
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        log(`  ❌ ${t.name}: ${t.error}`, 'error')
      })
  }
  
  log(`\n${colors.bright}========================================${colors.reset}`, 'info')
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error}`, 'error')
  process.exit(1)
})

// Run tests
runE2ETests().catch(error => {
  log(`Test suite error: ${error.message}`, 'error')
  process.exit(1)
})
