# LegalChain - Technical Documentation

## System Architecture

### High-Level Overview

The system consists of four main layers:

1. **Frontend Layer** (User-facing interfaces)
   - Web Application (React)
   - Telegram Bot
   - Browser Extension
   - API Documentation Site

2. **API Gateway Layer** (Request routing)
   - Node.js Express server
   - Authentication & rate limiting
   - Request validation
   - Job queue management

3. **Processing Layer** (Core business logic)
   - Analysis Engine (Python)
   - Oracle Services (Node.js)
   - Voice Service (ElevenLabs integration)

4. **Data Layer** (Persistence)
   - PostgreSQL (structured data)
   - Redis (caching)
   - IPFS (decentralized storage)
   - Blockchain Nodes (Alchemy/Infura)

### Data Flow

**Standard Analysis Request:**
1. User submits contract address via web/bot/extension
2. API Gateway validates request and checks cache
3. If not cached, adds job to analysis queue
4. Analysis Engine fetches contract code from Etherscan
5. Runs static analysis (Slither + Mythril)
6. Fetches oracle data (Chainlink, APIs)
7. ML model calculates risk score
8. GPT-4 generates natural language explanation
9. ElevenLabs synthesizes voice narration
10. Results cached and returned to user

**Total Processing Time:** 15-35 seconds

---

## Technology Stack

### Frontend Technologies

#### Web Application
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui component library
- **State Management:** Zustand (lightweight, simple)
- **Web3 Integration:** wagmi + viem for wallet connections
- **Audio Playback:** Howler.js for cross-browser audio support
- **Code Display:** Monaco Editor (same as VS Code)
- **Data Visualization:** Recharts for risk score charts
- **Build Tool:** Vite (fast development and builds)
- **Routing:** React Router v6

**Key Features:**
- Responsive design (mobile-first)
- Dark/light mode support
- Progressive Web App (PWA) capabilities
- Code splitting for optimal loading
- Accessibility (WCAG 2.1 AA compliant)

#### Browser Extension
- **Framework:** Plasmo (modern extension development framework)
- **Web3 Library:** ethers.js v6
- **Storage:** Chrome Storage API for settings and cache
- **Content Scripts:** Injected into dApp pages to detect MetaMask
- **Background Service Worker:** Handles API calls and analysis
- **Supported Browsers:** Chrome, Firefox, Brave, Edge

**Extension Capabilities:**
- Intercepts MetaMask transaction popups
- Injects analysis overlay before approval
- Auto-plays voice warnings for high-risk contracts
- Works offline with cached data
- Cross-browser compatibility

#### Telegram Bot
- **Framework:** Grammy (modern Telegram bot framework for Node.js)
- **Runtime:** Node.js 20 LTS
- **Voice Processing:** FFmpeg for audio format conversion
- **Speech-to-Text:** OpenAI Whisper API
- **Message Queue:** In-memory for MVP, Redis for production

**Bot Capabilities:**
- Text commands (/check, /watch, /help)
- Voice message interaction (send voice, get voice back)
- Inline mode (use in any chat)
- Webhook mode for real-time updates
- Multi-language support

### Backend Technologies

#### API Layer
- **Runtime:** Node.js 20 LTS
- **Web Framework:** Express.js 4.x
- **Authentication:** 
  - JWT tokens for web users
  - API keys for developers
  - Session management via Redis
- **Rate Limiting:** 
  - Redis-based sliding window algorithm
  - Tier-based limits (Free: 10/day, Pro: 1000/day)
- **Input Validation:** Zod schemas for type-safe validation
- **API Documentation:** OpenAPI/Swagger with interactive docs
- **Job Queue:** Bull (Redis-backed) for async processing
- **Error Handling:** Centralized error middleware with Sentry integration

**API Design:**
- RESTful endpoints
- JSON request/response format
- Versioned API (/v1, /v2)
- CORS enabled for web app
- Webhook support for real-time alerts

#### Analysis Engine
- **Language:** Python 3.11
- **Static Analysis Tools:**
  - **Slither** (Trail of Bits): Detects 70+ vulnerability types
  - **Mythril** (ConsenSys): Symbolic execution for deep analysis
  - **Solhint:** Linting and best practice checks
- **Machine Learning:**
  - **Framework:** PyTorch 2.0
  - **Model:** Gradient boosting classifier trained on 10,000+ contracts
  - **Features:** 50+ extracted features (complexity, patterns, metrics)
  - **Training:** Continuous learning with new data
- **LLM Integration:**
  - **Provider:** OpenAI GPT-4 Turbo
  - **Library:** LangChain for prompt orchestration
  - **Temperature:** 0.3 (deterministic for consistency)
  - **Max Tokens:** 1000 per explanation
- **Task Processing:** Celery with Redis broker for distributed processing

**Analysis Pipeline Stages:**
1. Code retrieval (2-5 seconds)
2. Static analysis (5-15 seconds)
3. Oracle enrichment (3-7 seconds)
4. Risk scoring (2-3 seconds)
5. Explanation generation (3-5 seconds)
6. Voice synthesis (2-4 seconds)

#### Voice Service
- **Provider:** ElevenLabs API
- **Models:** Multilingual v2 (supports 20+ languages)
- **Voice Selection:**
  - **Adam (Professional):** Low and medium risk contracts
  - **Rachel (Urgent):** High risk warnings
  - **Bella (Friendly):** Educational content
- **Voice Settings:**
  - Stability: 0.4-0.5 (natural variation)
  - Similarity Boost: 0.75 (voice consistency)
  - Style: 0.3-0.8 (based on urgency)
- **Audio Format:** MP3, 44.1kHz, mono
- **Caching Strategy:** Pre-generate common phrases to reduce API costs

**Cost Optimization:**
- Cache identical narrations (30-day TTL)
- Chunk long explanations into reusable segments
- Free tier: 10k characters/month
- Pro tier: Dedicated API key with higher limits

### Data Layer

#### PostgreSQL 15
**Database Design:**
- Normalized schema with proper foreign keys
- JSONB columns for flexible metadata storage
- Full-text search with pg_trgm extension
- Automatic timestamp tracking
- Soft deletes for user data

**Core Tables:**
- **users:** User accounts and preferences
- **contracts:** Smart contract metadata and source code
- **analyses:** Analysis results with risk scores
- **findings:** Detailed vulnerability findings
- **watchlist:** User monitoring subscriptions
- **known_scams:** Community-reported malicious contracts
- **audit_logs:** Security and compliance tracking
- **api_keys:** Developer API access credentials

**Indexes:**
- B-tree indexes on foreign keys
- Composite indexes on (chain_id, address)
- GiST indexes for full-text search
- Partial indexes for active records

**Performance:**
- Connection pooling (max 20 connections)
- Query timeout: 10 seconds
- Automatic vacuum for cleanup
- Point-in-time recovery enabled

#### Redis 7
**Use Cases:**
1. **Caching:** Analysis results (24-hour TTL)
2. **Session Storage:** User sessions (7-day TTL)
3. **Rate Limiting:** Request counters (rolling window)
4. **Job Queue:** Bull queue persistence
5. **Voice Cache:** Audio file URLs (30-day TTL)

**Key Naming Conventions:**
- `analysis:{chain_id}:{address}` - Cached analysis results
- `contract:{chain_id}:{address}` - Contract metadata cache
- `ratelimit:{user_id}:{endpoint}` - Rate limit counters
- `voice:{text_hash}` - Voice file URLs
- `session:{session_id}` - User session data

**Configuration:**
- Eviction policy: allkeys-lru (least recently used)
- Max memory: 1GB (scales with usage)
- Persistence: RDB snapshots every 5 minutes
- Replication: Master-replica setup for production

#### IPFS (InterPlanetary File System)
**Purpose:** Decentralized storage for audit reports

**Benefits:**
- Permanent, tamper-proof storage
- Content-addressed (hash-based URLs)
- Decentralized (no single point of failure)
- Shareable via public gateways

**Storage Strategy:**
- Pin important reports to Pinata or Web3.Storage
- Generate PDF reports with embedded metadata
- Include QR codes linking to IPFS content
- Fallback to centralized storage if IPFS unavailable

### Blockchain Infrastructure

#### Node Providers
**Primary:** Alchemy
- 300M compute units/month (free tier)
- WebSocket support for real-time events
- Enhanced APIs for NFT metadata
- Archive node access

**Backup:** Infura
- 100k requests/day (free tier)
- Automatic failover if Alchemy down
- IPFS gateway access

**Configuration:**
- Retry logic with exponential backoff
- Request timeout: 30 seconds
- Load balancing between providers
- Health checks every 5 minutes

#### Supported Blockchains (Launch)
1. **Ethereum Mainnet** (Chain ID: 1)
2. **Base** (Chain ID: 8453)
3. **Arbitrum** (Chain ID: 42161)
4. **Optimism** (Chain ID: 10)
5. **Polygon** (Chain ID: 137)

**Future Support:**
- Avalanche, BNB Chain, Solana, Cosmos

#### Data Sources

**Etherscan API:**
- Contract source code verification
- Transaction history
- Token metadata
- Rate limit: 5 calls/second (free), 100/second (paid)

**The Graph:**
- Historical on-chain data queries
- Subgraphs for popular protocols
- GraphQL API interface

**Chainlink Oracles:**
- Price feed data
- VRF (verifiable randomness)
- Proof of Reserve data

**DeFiLlama API:**
- Protocol TVL (Total Value Locked)
- Historical yield data
- Protocol metadata
- Free, no rate limits

**CertiK API:**
- Audit status lookup
- Security scores
- SkyNet monitoring data

**Twitter/X API:**
- Social sentiment analysis
- Mention tracking for contracts
- Rate limit: 1500 requests/15 minutes

---

## Infrastructure & Hosting

### Hosting Platforms

#### Frontend Hosting (Vercel)
**Features:**
- Automatic deployments from GitHub
- Global CDN (300+ edge locations)
- Instant rollbacks
- Preview deployments for PRs
- Zero-config Next.js/Vite support

**Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20
- Environment variables via dashboard

**Free Tier Limits:**
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains supported

#### Backend Hosting (Railway)
**Features:**
- Containerized deployments
- PostgreSQL and Redis included
- Automatic SSL certificates
- Environment variable management
- GitHub integration

**Configuration:**
- Dockerfile for custom setup
- Automatic builds on git push
- Health check endpoint: `/health`
- Auto-scaling based on CPU/memory

**Pricing:**
- $5 free credit/month
- Pay-as-you-go after credit
- ~$20-50/month for MVP

#### Database Hosting
**PostgreSQL:** Railway managed database
- Automatic backups (daily)
- Point-in-time recovery
- Connection pooling
- SSL enforced

**Redis:** Railway managed Redis
- Persistence enabled
- No eviction for critical keys
- Monitoring dashboard

### CDN & Storage

**Cloudflare:**
- **CDN:** Static asset delivery (HTML, CSS, JS, images)
- **R2 Storage:** Voice files and reports (S3-compatible)
- **Images:** Automatic optimization and resizing
- **DNS:** Domain management with DNSSEC
- **DDoS Protection:** Included free

**Configuration:**
- Cache-Control headers for static assets
- Aggressive caching for audio files
- Purge cache on deployments
- Custom cache rules for API responses

### Monitoring & Observability

**Error Tracking (Sentry):**
- Real-time error notifications
- Source map upload for debugging
- Performance monitoring
- User impact tracking
- Integration with Slack/Discord

**Analytics (Posthog):**
- Privacy-friendly (self-hosted option)
- Event tracking (analyses, voice plays, shares)
- User journey funnels
- A/B testing support
- No cookies required

**Logging (Better Stack / Logtail):**
- Centralized log aggregation
- Search and filtering
- Alerting on error patterns
- Log retention: 30 days (free tier)

**Uptime Monitoring (BetterUptime):**
- HTTP checks every 30 seconds
- SSL certificate monitoring
- Status page for users
- SMS/email alerts on downtime
- 99.9% uptime SLA target

**Application Performance Monitoring:**
- Response time tracking
- Database query performance
- API endpoint latency
- Cache hit rates
- Queue processing times

### CI/CD Pipeline

**GitHub Actions Workflow:**

**On Pull Request:**
1. Lint code (ESLint, Prettier)
2. Type check (TypeScript)
3. Run unit tests
4. Run integration tests
5. Build for production
6. Deploy preview environment

**On Merge to Main:**
1. All PR checks
2. Run security audit (npm audit, Snyk)
3. Build Docker images
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Notify team on Slack

**Deployment Strategy:**
- Blue-green deployment for zero downtime
- Automatic rollback on health check failures
- Database migrations run before deployment
- Feature flags for gradual rollouts

---

## Security & Compliance

### Authentication & Authorization

**User Authentication:**
- JWT tokens with 7-day expiration
- Refresh tokens for extended sessions
- HttpOnly cookies to prevent XSS
- CSRF protection on state-changing requests

**API Authentication:**
- API keys with SHA-256 hashing
- Rate limiting per key
- Key rotation supported
- Scoped permissions (read-only, write, admin)

**Security Best Practices:**
- Passwords hashed with bcrypt (cost factor: 12)
- No sensitive data in logs
- Secrets stored in environment variables
- Regular dependency updates (Dependabot)

### Data Privacy

**GDPR Compliance:**
- User data deletion on request
- Data export functionality
- Cookie consent banner
- Privacy policy linked in footer

**Data Retention:**
- Analysis results: 7 days (then deleted)
- User accounts: Permanent (until deletion request)
- Audit logs: 90 days
- Voice files: 30 days

**Sensitive Data Handling:**
- No wallet private keys stored
- IP addresses anonymized after 7 days
- User emails encrypted at rest
- PII access logged in audit trail

### Rate Limiting

**Tier-Based Limits:**

**Free Tier:**
- 10 analyses per day
- 5 voice generations per day
- 1 request per 5 seconds

**Pro Tier:**
- 1,000 analyses per day
- 500 voice generations per day
- 10 requests per second

**Enterprise Tier:**
- Unlimited analyses
- Unlimited voice generations
- Custom rate limits

**Implementation:**
- Sliding window algorithm
- Per-user and per-IP tracking
- 429 status code on limit exceeded
- Rate limit headers in response

---

## Performance Optimization

### Caching Strategy

**Three-Tier Caching:**

**Tier 1: Browser Cache**
- Static assets: 1 year
- API responses: 5 minutes
- Voice files: 7 days

**Tier 2: Redis Cache**
- Analysis results: 24 hours
- Contract meta 7 days
- Voice URLs: 30 days
- Oracle  1 hour

**Tier 3: CDN Cache**
- Audio files: Permanent
- Images: Permanent
- API responses: Not cached (dynamic)

**Cache Invalidation:**
- Manual purge via admin dashboard
- Automatic on contract reanalysis
- TTL-based expiration
- Cache warming for popular contracts

### Database Optimization

**Query Performance:**
- Connection pooling (20 connections)
- Prepared statements for common queries
- Explain analyze for slow queries
- Index optimization based on query patterns

**Read Replicas:**
- Route read queries to replicas
- Write queries to primary
- Automatic failover on primary failure

**Partitioning:**
- Partition analyses table by date (monthly)
- Partition audit_logs by date (weekly)
- Automatic partition creation

### API Optimization

**Response Time Targets:**
- Simple queries: <100ms
- Analysis results (cached): <200ms
- New analysis: 15-35 seconds
- Voice generation: 2-4 seconds

**Optimization Techniques:**
- Response compression (gzip)
- Pagination for list endpoints
- Field selection (only return requested fields)
- Async processing for long operations
- WebSocket for real-time updates

---

## Scalability

### Horizontal Scaling

**Stateless Architecture:**
- All services are stateless (state in Redis/DB)
- Load balancer distributes requests
- Auto-scaling based on CPU/memory
- Container orchestration (Docker + Kubernetes ready)

**Scaling Targets:**
- 10,000 requests/hour (launch)
- 100,000 requests/hour (6 months)
- 1,000,000 requests/hour (12 months)

### Queue Management

**Job Queue (Bull):**
- Priority queue (high risk contracts first)
- Retry logic (3 attempts with exponential backoff)
- Dead letter queue for failed jobs
- Job timeout: 60 seconds
- Concurrency: 10 jobs in parallel

**Queue Workers:**
- Separate worker processes from API
- Auto-scale workers based on queue depth
- Worker health monitoring
- Graceful shutdown on deployment

### Database Scaling

**Vertical Scaling (First):**
- Upgrade instance size as needed
- PostgreSQL supports up to 96 cores

**Horizontal Scaling (Later):**
- Read replicas for queries
- Sharding by chain_id
- CQRS pattern (command-query separation)

---

## Testing Strategy

### Test Pyramid

**Unit Tests (70%):**
- Test individual functions and components
- Mock external dependencies
- Fast execution (<1 second total)
- Run on every commit

**Integration Tests (20%):**
- Test API endpoints end-to-end
- Use test database
- Mock blockchain calls
- Run before deployment

**End-to-End Tests (10%):**
- Test critical user flows
- Use Playwright or Cypress
- Run against staging environment
- Run before production deployment

### Test Coverage Goals

**Backend:**
- Target: 85% code coverage
- Critical paths: 100% coverage
- Tools: Jest, Supertest

**Frontend:**
- Target: 70% code coverage
- Components: 80% coverage
- Tools: Vitest, React Testing Library

**Contract Analysis:**
- Test against 100 known contracts (50 safe, 50 malicious)
- Measure accuracy, false positives, false negatives
- Continuous benchmark tracking

### Testing Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size within limits
- [ ] Lighthouse score >90
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] API documentation updated

**Post-Deployment:**
- [ ] Health check returns 200
- [ ] Sample analysis completes
- [ ] Voice generation works
- [ ] Telegram bot responds
- [ ] Browser extension loads
- [ ] Error rate <1%

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
- Node.js 20 LTS
- Python 3.11
- PostgreSQL 15
- Redis 7
- Docker (optional)

**Environment Setup:**
1. Clone repository
2. Copy `.env.example` to `.env`
3. Fill in API keys (Alchemy, OpenAI, ElevenLabs)
4. Install dependencies: `npm install`
5. Setup database: `npm run db:setup`
6. Start services: `npm run dev`

**Development Services:**
- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Database: `localhost:5432`
- Redis: `localhost:6379`

### Git Workflow

**Branch Strategy:**
- `main` - Production code
- `staging` - Pre-production testing
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

**Commit Convention:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

**Pull Request Process:**
1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Create PR with description
6. Pass CI checks
7. Code review (1 approval required)
8. Merge to main

---

## API Rate Limits & Costs

### Third-Party API Costs

**OpenAI GPT-4 Turbo:**
- Cost: $0.01 per 1k input tokens, $0.03 per 1k output tokens
- Per analysis: ~500 input + 800 output tokens = $0.029
- Monthly (1000 analyses): $29

**ElevenLabs:**
- Cost: $0.30 per 1k characters
- Per analysis: ~400 characters = $0.12
- Monthly (500 voices): $60
- Free tier: 10k characters/month

**Alchemy:**
- Free: 300M compute units/month
- Paid: $199/month for 2B compute units
- Per analysis: ~50k compute units

**OpenAI Whisper:**
- Cost: $0.006 per minute
- Per voice message: ~10 seconds = $0.001
- Negligible cost

**Total Cost Per Analysis:**
- GPT-4: $0.029
- ElevenLabs: $0.12
- Alchemy: ~$0.001
- **Total: ~$0.15 per analysis**

**Monthly Costs (1000 users, 10 analyses each):**
- Analyses: 10,000 × $0.15 = $1,500
- Hosting: $50
- Database: $25
- Monitoring: $20
- **Total: ~$1,600/month**

**Revenue (1000 users, 10% conversion to Pro):**
- Pro users: 100 × $9.99 = $999
- **Need higher conversion or B2B revenue**

---

## MVP Development Timeline (3 Days)

### Day 1: Foundation (Friday, Feb 6)
**Morning (9 AM - 1 PM):**
- Project setup (monorepo structure)
- Database schema creation
- Basic API server with health check
- Contract fetcher (Etherscan API)
- Simple risk scoring (5 basic checks)

**Afternoon (2 PM - 6 PM):**
- Integrate Slither for vulnerability detection
- PostgreSQL setup and migrations
- REST API: POST `/analyze` endpoint
- Simple React frontend with input form

**Evening (7 PM - 11 PM):**
- Test with 10 sample contracts
- Fix major bugs
- Basic styling for web UI
- Prepare for Day 2

**Deliverable:** Working API that analyzes contracts and returns risk scores

---

### Day 2: Intelligence (Saturday, Feb 7)
**Morning (9 AM - 1 PM):**
- GPT-4 integration for explanations
- Narration script generation
- ElevenLabs voice synthesis integration
- Test voice generation

**Afternoon (2 PM - 6 PM):**
- Build Telegram bot (Grammy)
- Implement `/start` and `/check` commands
- Voice message handling (Whisper API)
- Bot testing

**Evening (7 PM - 11 PM):**
- Add Chainlink oracle integration
- Improve risk scoring with oracle data
- Polish web UI (audio player, better UX)
- Create demo video script

**Deliverable:** Web app + Telegram bot with voice explanations working

---

### Day 3: Polish & Demo (Sunday, Feb 8)
**Morning (9 AM - 1 PM):**
- Build browser extension (Plasmo)
- Transaction interception logic
- Overlay UI design
- Test extension with MetaMask

**Afternoon (2 PM - 5 PM):**
- Record demo video:
  1. Problem intro
  2. Web app demo
  3. Telegram bot demo
  4. Browser extension demo
  5. Closing statement
- Deploy to production (Vercel + Railway)
- Prepare 10-slide pitch deck

**Evening (6 PM - 8 PM):**
- Final end-to-end testing
- Submit to DevPost/TAIKAI
- Practice pitch (3-5 times)
- Rest before demo day!

**Deliverable:** Complete MVP with demo video ready to present

---

## Troubleshooting Guide

### Common Issues

**Issue: Analysis takes too long (>60 seconds)**
- Check Etherscan API rate limits
- Verify Slither/Mythril timeout settings
- Ensure Redis cache is working
- Check database connection pool

**Issue: Voice generation fails**
- Verify ElevenLabs API key
- Check character limit (max 5000)
- Ensure CDN upload working
- Fallback to text-only mode

**Issue: Telegram bot not responding**
- Check bot token validity
- Verify webhook URL (if using webhooks)
- Check rate limits (30 messages/second)
- Review error logs in Better Stack

**Issue: Browser extension not injecting**
- Check content script permissions in manifest
- Verify MetaMask is installed
- Check for conflicting extensions
- Review console errors

**Issue: Database connection errors**
- Check connection string format
- Verify database is running
- Check firewall rules
- Increase connection pool size

---

## Security Checklist

**Before Launch:**
- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS configured (whitelist only)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF tokens on forms
- [ ] Rate limiting enabled
- [ ] API authentication required
- [ ] Database backups automated
- [ ] Error messages don't leak sensitive data
- [ ] Security headers set (CSP, HSTS, etc.)
- [ ] Dependencies scanned for vulnerabilities
- [ ] Penetration testing completed
- [ ] Privacy policy and ToS published

---

## Resources & Dependencies

### Required API Keys

**Blockchain:**
- Alchemy API key (free at alchemy.com)
- Etherscan API key (free at etherscan.io)

**AI/ML:**
- OpenAI API key (pay-as-you-go at openai.com)
- ElevenLabs API key (free tier at elevenlabs.io)

**Messaging:**
- Telegram Bot Token (free via @BotFather)

**Optional:**
- DeFiLlama (no key needed)
- CertiK API key (for audit data)
- Twitter API key (for sentiment)

### Development Tools

**Required:**
- VS Code or similar IDE
- Git for version control
- Node.js 20 LTS
- Python 3.11
- PostgreSQL 15
- Redis 7

**Recommended:**
- Docker Desktop (for local services)
- Postman (API testing)
- TablePlus (database GUI)
- Figma (UI design)

### Learning Resources

**Smart Contract Security:**
- Trail of Bits Blog
- ConsenSys Security Best Practices
- Secureum Bootcamp

**AI/ML:**
- OpenAI API Documentation
- LangChain Documentation
- ElevenLabs Voice Lab

**Web3 Development:**
- wagmi Documentation
- ethers.js Documentation
- Alchemy University

---

## Support & Maintenance

### Monitoring Alerts

**Critical Alerts (Immediate Action):**
- API downtime >1 minute
- Error rate >5%
- Database connection failures
- Analysis queue backed up >100 jobs

**Warning Alerts (Review within 1 hour):**
- Response time >2 seconds
- Cache hit rate <70%
- Disk space >80%
- API key approaching rate limit

**Info Alerts (Daily Review):**
- New scam contracts detected
- Usage approaching tier limits
- Slow database queries

### Backup Strategy

**Database Backups:**
- Automated daily backups (3 AM UTC)
- Point-in-time recovery enabled
- Retention: 30 days
- Test restore monthly

**Code Backups:**
- Git repository (GitHub)
- Mirror to GitLab (disaster recovery)
- Environment variables in 1Password

**Data Exports:**
- Weekly export of critical tables
- Store in separate cloud storage
- Encrypted backups

### Incident Response

**Severity Levels:**

**P0 (Critical):** Complete outage
- Response time: Immediate
- Resolution time: 1 hour
- Post-mortem required

**P1 (High):** Major feature broken
- Response time: 30 minutes
- Resolution time: 4 hours
- Post-mortem optional

**P2 (Medium):** Minor feature impaired
- Response time: 2 hours
- Resolution time: 24 hours
- No post-mortem

**P3 (Low):** Cosmetic issue
- Response time: 1 day
- Resolution time: 1 week
- Fix in next sprint

---

## Future Technical Improvements

### Short-term (3 months)
- WebSocket for real-time analysis updates
- Mobile apps (React Native)
- More blockchain network support
- Improved ML model (50+ features)
- Browser extension for Safari

### Medium-term (6 months)
- NFT collection batch analysis
- Real-time monitoring alerts
- GraphQL API
- Multi-language support (10+ languages)
- Custom detection rule builder

### Long-term (12 months)
- Zero-knowledge proof verification
- Decentralized analysis network
- AI model training on user feedback
- Cross-chain bridge security
- Smart contract formal verification

---

Built for ETH Oxford 2026 🚀
