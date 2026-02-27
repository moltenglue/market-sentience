# Market Sentiment Dashboard

[![CI/CD](https://github.com/yourusername/sentiment-dash/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/sentiment-dash/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready financial dashboard that aggregates market data, news, and sentiment analysis with AI-powered insights using Google's Gemini API.

## Features

### 📊 Real-Time Market Data
- **Yahoo Finance**: Major indices, sector performance, and cryptocurrency prices
- **FRED API**: Macroeconomic indicators (Fed rate, unemployment, yield curve)
- **Quotient Markets**: Prediction markets for real-time sentiment tracking

### 📰 News & Sentiment
- **Sherwood News**: Financial headlines and market-moving news
- **Reddit r/wallstreetbets**: Trending posts with sentiment analysis (bullish/bearish/neutral)

### 🤖 AI-Powered Chat
- **Gemini Integration**: Context-aware responses using RAG (Retrieval-Augmented Generation)
- **Streaming Support**: Real-time chat experience
- **Market Context**: AI has access to all cached market data for informed responses

### 🔄 Smart Caching
- **SQLite Database**: Persistent markdown cache with configurable TTL (15-60 minutes)
- **Auto-Refresh**: Automatic stale data detection and refresh
- **Manual Refresh**: On-demand data updates

### 🛠️ Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **AI**: Google Gemini API (@google/genai)
- **Testing**: Jest + agent-browser E2E
- **DevOps**: Docker, Docker Compose, GitHub Actions

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm 10+
- (Optional) Docker & Docker Compose

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sentiment-dash.git
cd sentiment-dash
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
# Required for AI chat
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for enhanced data
FRED_API_KEY=your_fred_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

4. **Initialize database**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your API keys
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Access the dashboard**
Open [http://localhost:3000](http://localhost:3000)

4. **View logs**
```bash
docker-compose logs -f app
```

5. **Stop services**
```bash
docker-compose down
```

### Building Docker Image Manually

```bash
# Build image
docker build -t sentiment-dash:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -v sqlite-data:/app/prisma/data \
  --name sentiment-dash \
  sentiment-dash:latest
```

## Portainer Deployment

Deploy to Portainer using the pre-built GHCR image:

### Quick Deploy

1. **Log in to Portainer** and navigate to your environment

2. **Go to Stacks > Add Stack**

3. **Name**: `market-sentience`

4. **Web editor** - Paste this docker-compose:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/moltenglue/market-sentience:latest
    container_name: market-sentience
    ports:
      - "3000:3000"
    environment:
      # Database
      - DATABASE_URL=file:./prisma/data/prod.db
      
      # Required: Gemini API Key
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      
      # Optional: FRED API Key  
      - FRED_API_KEY=${FRED_API_KEY:-}
      
      # Optional: Reddit API
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID:-}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET:-}
      
      # Configuration
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_NAME=Market Sentiment Dashboard
      - DEFAULT_CACHE_TTL_MINUTES=30
      
    volumes:
      - sqlite-data:/app/prisma/data
    restart: unless-stopped

volumes:
  sqlite-data:
```

5. **Environment Variables** - Click "Add environment variable" and add:
   - `GEMINI_API_KEY` = your_gemini_api_key_here
   - `FRED_API_KEY` = (optional)
   - `REDDIT_CLIENT_ID` = (optional)
   - `REDDIT_CLIENT_SECRET` = (optional)

6. **Deploy the stack**

### Advanced Environment Configuration

```bash
# Required for AI chat features
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - Enhanced Data Sources
FRED_API_KEY=your_fred_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Optional - Cache Configuration
DEFAULT_CACHE_TTL_MINUTES=30
MAX_CACHE_TTL_MINUTES=60
MIN_CACHE_TTL_MINUTES=15

# Optional - Application Settings
NEXT_PUBLIC_APP_NAME=Market Sentiment Dashboard
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
PORT=3000
```

### Updating

To update to the latest version:
1. Go to **Stacks > market-sentience**
2. Click **Editor** tab
3. Click **Update the stack** (Pull latest image version)
4. Toggle **Re-pull image and redeploy** if needed

## Testing

### Unit & Integration Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### End-to-End Tests
```bash
# Start the application first
npm run build
npm start

# Run E2E tests
npm run test:e2e
```

## Data Sources & Configuration

### API Keys

| Source | Key | Purpose | Required |
|--------|-----|---------|----------|
| **Google Gemini** | `GEMINI_API_KEY` | AI chat functionality | ✅ Yes |
| **FRED** | `FRED_API_KEY` | Macroeconomic data | ❌ No (uses simulated data) |
| **Reddit** | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Reddit sentiment | ❌ No (uses public JSON) |

### Getting API Keys

**Google Gemini**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add to `.env` file

**FRED (Optional)**
1. Visit [FRED API](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Request a free API key
3. Add to `.env` file

### Cache Configuration

Default cache TTL is 30 minutes. Adjust in `.env`:
```env
DEFAULT_CACHE_TTL_MINUTES=30
MIN_CACHE_TTL_MINUTES=15
MAX_CACHE_TTL_MINUTES=60
```

## Project Structure

```
sentiment-dash/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── chat/         # Gemini chat endpoint
│   │   │   ├── data/         # Data retrieval endpoint
│   │   │   ├── health/       # Health check endpoint
│   │   │   └── refresh/      # Data refresh endpoint
│   │   ├── page.tsx          # Dashboard page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── chat/            # Chat component
│   │   └── dashboard/       # Dashboard components
│   │       ├── Header.tsx
│   │       ├── MacroBar.tsx
│   │       ├── Markets.tsx
│   │       └── News.tsx
│   └── lib/
│       ├── cache/           # Caching system
│       ├── gemini/          # Gemini AI integration
│       ├── scrapers/        # Data scrapers
│       └── prisma.ts        # Prisma client
├── prisma/
│   └── schema.prisma        # Database schema
├── scripts/
│   └── e2e-agent.js         # E2E test script
├── tests/                   # Test files
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data?source={source}` | GET | Retrieve cached data |
| `/api/refresh` | POST | Refresh data sources |
| `/api/chat` | POST | Send message to Gemini |
| `/api/health` | GET | Health check |

### Example API Usage

```bash
# Get all data
curl http://localhost:3000/api/data?source=all

# Refresh data
curl -X POST http://localhost:3000/api/refresh \
  -H "Content-Type: application/json" \
  -d '{"source": "all"}'

# Chat with Gemini
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Summarize the market", "sessionId": "test-123"}'
```

## Customization

### Adding New Data Sources

1. Create a new scraper in `src/lib/scrapers/`
2. Implement `scrape*()` and `get*()` functions
3. Register in `src/lib/scrapers/index.ts`
4. Add UI component to display the data

### Modifying AI Behavior

Edit `src/lib/gemini/geminiService.ts`:
```typescript
const SYSTEM_PROMPT = `Your custom instructions here...`
```

### Custom Styling

The dashboard uses Tailwind CSS with a dark mode toggle. Modify:
- `src/app/globals.css` - Global styles and CSS variables
- Component files - Component-specific styles

## CI/CD Pipeline

The GitHub Actions workflow (`/.github/workflows/ci.yml`) includes:

1. **Lint & Type Check**: ESLint and TypeScript validation
2. **Unit Tests**: Jest test suite with coverage
3. **Build**: Next.js production build
4. **E2E Tests**: Agent-browser validation
5. **Docker Build**: Container image creation
6. **Deploy**: Automatic deployment (configure as needed)

## Troubleshooting

### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### Cache Issues
```bash
# Clear all cache
npm run scrape -- --clear-cache
```

### API Rate Limits
If you encounter rate limits:
1. Increase `DEFAULT_CACHE_TTL_MINUTES` in `.env`
2. Use `npm run dev` for development (slower refresh)
3. Consider upgrading API plans for production

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure:
- Tests pass: `npm test`
- Linting passes: `npm run lint`
- TypeScript compiles: `npm run typecheck`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Data Sources**: Yahoo Finance, FRED, Quotient Markets, Sherwood News, Reddit
- **UI Components**: shadcn/ui
- **AI**: Google Gemini
- **Framework**: Next.js team

---

**Disclaimer**: This dashboard is for informational purposes only and does not constitute financial advice. Always do your own research before making investment decisions.
