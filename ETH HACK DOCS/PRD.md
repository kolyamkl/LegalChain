# LegalChain – Full Product Requirements Document (PRD)

## 1. Product Overview

LegalChain is an AI-powered smart contract analysis platform that explains on-chain risk in natural language and voice, delivered across a web app, Telegram bot/mini app, and browser extension. It makes blockchain security accessible to non-technical users while still being useful for developers, DAOs, and investors.

Core pillars:
- **Security**: Automated contract risk analysis and scoring at code and behavior level.
- **Education**: Grammarly-style interactive Solidity security learning.
- **Voice**: ElevenLabs-powered voice explanations for accessibility and urgency.
- **Multi-platform**: Web app (deep analysis), Telegram (on-the-go checks), browser extension (real-time protection at transaction approval).

The **hackathon goal** is to deliver a working vertical slice of this vision (MVP) across all three platforms, with a clear path to post-hackathon expansion.

---

## 2. Product Scope

### 2.1 In-Scope (Hackathon MVP)

- **Backend Analysis Engine**
  - Core analysis pipeline:
    - Fetch contract code/metadata (EVM chains).
    - Basic static analysis (pattern and heuristic-based; optional use of external tools).
    - Simple oracle-style enrichment (age, tx count, holders).
    - AI-based natural language explanation using LLMs.
    - Optional voice generation using ElevenLabs.
  - Exposed via a REST API usable by web app, Telegram bot, and browser extension.

- **Web App**
  - Section A: Security Check (primary focus).
  - Section B: Education (minimal but working experience).

- **Telegram Bot + Mini App**
  - `/check` command for quick contract scans.
  - Lightweight “View Full Analysis” mini-app/web flow.

- **Browser Extension**
  - Chrome-focused extension:
    - Popup for manual address scan.
    - Best-effort inline alert on dApp pages.

- **Data Persistence**
  - Storage of analyses so they can be revisited and deep-linked.

### 2.2 Post-Hackathon (Planned Extensions)

- Multi-chain at scale (Ethereum, Base, Arbitrum, Polygon, Optimism).
- Rich static and dynamic analysis (Slither/Mythril, more structured ML).
- Full Grammarly-style IDE overlay with line-by-line highlights and hovers.
- Real-time monitoring and alerting dashboards.
- Enterprise integrations (wallets, DAOs, insurance, white-label).
- Rich educational platform (progress, certifications, case studies).
- Robust business model (subscriptions, API licensing, B2B).

The rest of this PRD describes all phases, with hackathon MVP clearly prioritized but designed so the architecture naturally extends to later phases.

---

## 3. User Types and Use Cases

### 3.1 User Types

- **Retail crypto users**: Interact with DeFi protocols and NFTs, approve transactions via wallets.
- **New Web3 users**: Non-technical, need simple explanations and warnings.
- **Developers**: Smart contract authors and auditors wanting quick feedback.
- **DAO members**: Evaluate governance proposals and protocol upgrades.
- **Investors & analysts**: High-level security overview for due diligence.
- **Educators & learners**: Learn Solidity security through examples and exercises.
- **Community moderators**: Protect their communities from scams.

### 3.2 Core Use Cases

1. **Transaction Pre-Approval Check (Extension / Web)**
   - User is about to approve a transaction in MetaMask or similar.
   - LegalChain identifies the target contract, scores risk, explains in plain language, and offers clear approve/reject guidance plus a link to a deep-dive view.

2. **Contract Due Diligence (Web App)**
   - User pastes contract address or tx hash into the web app.
   - Receives risk score, category breakdown, vulnerability list, and voice summary.
   - Optionally exports report and sets up monitoring.

3. **On-the-Go Scan (Telegram)**
   - User sends `/check <address>` from their phone.
   - Receives concise risk summary, bullet points, and “View Full Analysis” mini-app link.

4. **Developer Self-Audit (Web App Education / Security)**
   - Developer pastes their own Solidity code.
   - Gets highlighted issues, severity, and suggested fixes.
   - Uses educational patterns and quizzes to understand vulnerabilities.

5. **Learning Solidity Security (Education Section)**
   - Learner picks predefined patterns (e.g., reentrancy).
   - Sees vulnerable vs fixed code, explanation, voice tutorial, and quiz.
   - Tracks progress and earns badges over time (post-hackathon).

---

## 4. System Architecture

### 4.1 High-Level Components

- **Backend Service**
  - API server (Node.js/TypeScript or Python).
  - Integrations:
    - Blockchain node provider (Alchemy/Infura).
    - Block explorer APIs (Etherscan-like).
    - LLM API for analysis and explanations.
    - ElevenLabs API for voice synthesis.
    - Optional: DeFiLlama, Chainlink, CertiK, GitHub for enrichment.

- **Frontend**
  - Web app (React/Next.js).
  - Telegram bot + mini app (web-based UI).
  - Browser extension (Chrome, Manifest V3).

- **Storage**
  - PostgreSQL (core entities, analyses, users, education content).
  - Redis (caching for repeated analyses and audio lookups).
  - Object storage (audio files, if not fully remote).

### 4.2 Deployment (Typical)

- Web frontend on a static hosting platform (e.g., Vercel).
- Backend + DB on a cloud platform (Railway/Render/AWS).
- Separate environments:
  - Hackathon demo (single environment).
  - Later: staging and production.

---

## 5. Data Model

### 5.1 ContractAnalysis

```ts
ContractAnalysis {
  id: string;
  chain_id: number;
  contract_address: string | null;
  tx_hash: string | null;
  source_code: string | null;
  abi: any | null;
  compiler_version: string | null;

  risk_score: number; // 0–100
  risk_level: "low" | "medium" | "high" | "dangerous";
  confidence: number | null; // 0–1

  summary_short: string;
  key_findings: {
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
  }[];

  vulnerability_findings: VulnerabilityFinding[];

  oracle_ OracleData | null;
  history_ HistoryData | null;

  voice_asset_url: string | null;
  analysis_version: string;

  created_at: Date;
  updated_at: Date;
}
5.2 VulnerabilityFinding
VulnerabilityFinding {
  id: string;
  contract_analysis_id: string;

  line_start: number | null;
  line_end: number | null;
  code_snippet: string | null;

  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "reentrancy"
    | "overflow"
    | "access_control"
    | "honeypot"
    | "fee_misconfig"
    | "backdoor"
    | "upgrade_risk"
    | "other";

  fix_suggestion: string | null;
  education_link: string | null;
}
5.3 OracleData (Extensible)
OracleData {
  tvl_usd: number | null;
  volume_24h_usd: number | null;
  age_days: number | null;
  tx_count: number | null;
  holders_count: number | null;

  audit_status: "none" | "audited" | "in_progress" | "unknown";
  audit_provider: string | null;

  social_sentiment_score: number | null; // e.g. -1..1
  github_repo: string | null;
  github_activity_score: number | null;
}

5.4 HistoryData (Optional/MVP Lite)
HistoryData {
  first_seen_at: Date | null;
  last_seen_at: Date | null;
  recent_tx_sample: {
    hash: string;
    timestamp: string;
    from: string;
    to: string;
    value: string;
    method: string | null;
  }[];
}

5.5 EducationPattern
EducationPattern {
  id: string;
  slug: string; // "reentrancy-basic"
  title: string;
  category: string; // "reentrancy", "access_control", etc.

  vulnerable_code: string;
  fixed_code: string;
  explanation: string;

  quiz_question: string;
  quiz_options: string[];
  quiz_correct_index: number;
}

5.6 User (Post-Hackathon)
User {
  id: string;
  email: string | null;
  wallet_address: string | null;
  created_at: Date;
  plan: "free" | "pro" | "enterprise";
}

6. Backend API
6.1 POST /api/analyze
Purpose
Universal analysis endpoint for web app, Telegram bot, and browser extension.
Request:
{
  "input_type": "address",
  "chain_id": 1,
  "value": "0x1234...",
  "options": {
    "generate_voice": true,
    "user_level": "beginner"
  }
}
•	 input_type :  "address" | "tx_hash" | "source_code" .
	•	 chain_id : network ID (MVP: 1; later multiple).
	•	 value : address, tx hash, or raw Solidity code.
	•	 options.generate_voice : boolean.
	•	 options.user_level :  "beginner" | "intermediate" | "expert" .
Processing Steps (Hackathon MVP)
	1.	Validate input.
	2.	Resolve contract:
	•	If  address : fetch contract code + metadata from block explorer.
	•	If  tx_hash : fetch transaction, derive  to  (contract), then fetch contract.
	•	If  source_code : use code directly.
	3.	Run basic static analysis:
	•	Pattern-based checks (detect known scam patterns and vulnerability patterns).
	•	Optional CLI tool integration if available.
	4.	Gather simple oracle-like
	•	Age: from first tx.
	•	Tx count, holders: from explorer/RPC.
	5.	Build technical findings structure.
    6.	Call LLM with structured prompt:
	•	Generate  summary_short .
	•	Generate  key_findings .
	•	Optional detailed explanation text.
	7.	Compute  risk_score  (0–100) and  risk_level :
	•	Rule-based weighting of severity, centralization, age, activity.
	8.	If  generate_voice :
	•	Compose ~60s script.
	•	Call ElevenLabs and obtain  audio_url .
	9.	Persist  ContractAnalysis  and related findings.
	10.	Return response
Response (simplified):
{
  "analysis_id": "string",
  "risk_score": 78,
  "risk_level": "high",
  "summary_short": "This contract presents significant centralization and rug-pull risk.",
  "key_findings": [
    {
      "title": "Owner can drain funds",
      "severity": "critical",
      "description": "The owner address can withdraw all funds without restriction."
    }
  ],
  "oracle_data": {
    "tvl_usd": 150000,
    "age_days": 3,
    "tx_count": 220,
    "holders_count": 45,
    "audit_status": "none",
    "audit_provider": null
  },
  "vulnerabilities": [],
  "voice": {
    "enabled": true,
    "audio_url": "https://.../file.mp3"
  }
}

6.2 GET /api/analysis/:id
	•	Returns a previously stored  ContractAnalysis  with nested  vulnerability_findings .
	•	Used by:
	•	Web app deep links.
	•	Telegram mini app.
	•	Browser extension “Open full analysis” link.
6.3 GET /api/analysis/by-contract
Query params:
	•	 chain_id 
	•	 contract_address 
Returns:
	•	Latest  ContractAnalysis  if available, else 404.
Used to:
	•	Avoid recomputing for known contracts.
	•	Provide instant results across platforms.
6.4 POST /api/analyze/education
Purpose
Analyze arbitrary Solidity code in the education context.
Request:
{
  "source_code": "pragma solidity ^0.8.0; ...",
  "options": {
    "generate_voice": false,
    "user_level": "beginner"
  }
}

Reponse:
{
  "issues": [
    {
      "title": "Missing balance check",
      "severity": "critical",
      "description": "transfer function does not verify sender balance.",
      "line_start": 10,
      "line_end": 12
    }
  ],
  "summary": "This contract has critical balance and access control issues.",
  "overview": "Explanation text..."
}

6.5 GET /api/education/patterns
Returns a list of available educational patterns.
[
  {
    "slug": "reentrancy-example",
    "title": "Reentrancy Vulnerability Example",
    "category": "reentrancy"
  },
  {
    "slug": "access-control-bug",
    "title": "Access Control Bug Example",
    "category": "access_control"
  }
]
6.6 GET /api/education/patterns/:slug
Returns the full educational pattern described above.
6.7 POST /api/telegram/webhook
	•	Telegram bot webhook:
	•	Handle  /start ,  /check ,  /help .
	•	On  /check <value> :
	•	Detect type (address/tx).
	•	Call  /api/analyze .
	•	Send formatted message with:
	•	Risk score.
	•	Summary.
	•	2–3 key findings.
	•	Button “View Full Analysis” with link to web mini app (e.g.,  /analyze?analysis_id=... ).

7. Web App
7.1 Global
	•	Tech: React/Next.js.
	•	Routes:
	•	 /  – Security Check.
	•	 /education  – Education.
	•	 /analyze?analysis_id=...  – View existing analysis.
	•	Layout:
	•	Top nav: Logo, “Security Check”, “Education”, “(Login)” placeholder.
7.2 Section A – Security Check
7.2.1 Input Panel
	•	Fields:
	•	Main input:
	•	Placeholder: “Paste contract address, transaction hash, or Solidity code”.
	•	Dropdown:
	•	“Auto-detect”, “Address”, “Tx Hash”, “Source Code”.
	•	Chain selector:
	•	For MVP: Ethereum (others disabled or hidden).
	•	Button: “Analyze”.
7.2.2 Tabs and Views
Tabs:
	•	Overview.
	•	Vulnerabilities.
	•	Oracle Data.
	•	Transaction History.
    •	Comparison (post-hackathon; MVP can show a “coming soon” notice).
Overview Tab
	•	Risk score widget:
	•	Score (0–100) with color:
	•	0–20: green.
	•	21–40: yellow.
	•	41–70: orange.
	•	71–100: red.
	•	Short summary text.
	•	3–5 key findings.
	•	Voice controls:
	•	Play/pause.
	•	Simple timeline.
Vulnerabilities Tab
	•	List of vulnerability cards:
	•	Title, severity badge, description.
	•	Optional snippet (expand/collapse).
	•	Suggested fix text.
	•	Education link (“Learn more”) when available.
	•	Code viewer:
            Side-by-side with vulnerability list.
		    MVP: simple line highlight; later: Grammarly-style hover overlays.
    Oracle Data Tab
	•	Cards and small charts where possible:
	•	TVL, volume, age, tx count, holders, audit status.
	•	Later: visual trend timeline.
    Transaction History Tab
	•	Recent tx sample list:
	•	Hash, timestamp, method, direction, value.
	•	Later: filters and more analytics.
    Comparison Tab (Post-Hackathon)
	•	Compare similar contracts:
	•	Risk score differences.
	•	Key shared vulnerabilities and differences.
7.3 Section B – Education
7.3.1 Library
	•	List of patterns:
	•	“Simple ERC-20 Token”
	•	“Uniswap-Style DEX”
	•	“Lending Protocol”
	•	“NFT ERC-721”
	•	“Staking Contract”
	•	“Honeypot Token (Vulnerable)”
	•	“Reentrancy Vulnerability Example”
	•	“Access Control Bug Example”
	•	“Integer Overflow Example”
	•	On selection:
	•	Show:
	•	Vulnerable code.
	•	Fixed code.
	•	Explanation (attack scenario, impacts, mitigation).
	•	Quiz question.
7.3.2 Custom Code
	•	Code editor:
	•	Solidity syntax highlighting.
	•	Button: “Analyze”.
    •	Results:
	    •	Issues list with severity and explanation.
	    •	Optional voice explanation for summary (later).
7.3.3 Gamification (Post-Hackathon)
	•	Badges (e.g., “Reentrancy Expert”).
	•	Progress bar for patterns completed.
	•	Certificates for course completion.
8. Telegram Bot + Mini App
8.1 Commands
	•	 /start : Welcome + how-to.
	•	 /check <address_or_tx> : Core analysis.
	•	 /learn : Shortcut into education content (e.g., send links).
	•	 /history : Show last N addresses checked (post-hackathon).
    •	 /help : List commands.
8.2 Message Flow (MVP)
/check flow
	•	User:  /check 0x1234... 
	•	Bot:
	•	“Scanning contract…”
	•	After analysis:
	•	“Risk score: 45/100 (Caution)”
	•	Bullet list of key findings.
	•	Buttons:
	•	“Listen summary” (optional: send audio file or voice message).
	•	“View full analysis” → open web mini app.
8.3 Mini App
	•	Implemented as the same web app with responsive mobile UI.
	•	Entry route:  /analyze?analysis_id=... .
	•	Layout optimized for vertical scrolling and tap interactions.
9. Browser Extension
9.1 Goals
	•	Provide fast, inline risk feedback while a user interacts with a dApp.
	•	Function in two ways:
	•	Popup address scanner.
	•	(Best-effort) inline alert widget on dApps.
9.2 Architecture
Files:
	•	 manifest.json  (Manifest V3).
	•	 background.js  /  background.ts .
	•	 content_script.js .
	•	 popup.html  +  popup.js .
Manifest key points
	•	 permissions :  "storage" ,  "scripting" ,  "activeTab" .
	•	 host_permissions : minimal necessary to inject script on dApp sites.
	•	 action : defines popup.
9.3 Popup Flow
	•	User clicks extension icon.
	•	Popup UI:
	•	Input: contract address.
	•	Button: “Scan”.
	•	On click:
	•	Popup sends message to background.
	•	Background calls  /api/analyze  with  generate_voice: false .
	•	Display:
	•	Risk score + color.
	•	Summary.
	•	2–3 bullet warnings.
	•	“Open full analysis” → new tab with  /analyze?analysis_id=... .
9.4 Inline Alert Flow (Progressive)
	•	Content script:
	•	Injected into pages.
	•	Attempts to detect:
	•	Contract addresses in DOM (e.g., “Contract: 0x…”).
	•	Known dApp-specific selectors.
	•	When contract found:
	•	Sends to background for analysis (with caching).
	•	Renders a floating widget (HTML + CSS) on page:
	•	“LegalChain Risk: X/100 (Level)”.
	•	Short text.
	•	Link “View details” to web app.
For hackathon: popup is mandatory; inline detection is nice-to-have and can be limited to 1–2 demo dApps.
10. Analysis Pipeline
10.1 Step 1: Code Retrieval (2–5s)
	•	If address:
	•	Fetch source and ABI from explorer.
	•	Determine contract verification status.
	•	If tx hash:
	•	Fetch transaction.
	•	Derive contract address.
	•	Proceed as above.
	•	If source code:
	•	Use directly.
10.2 Step 2: Static Analysis (5–15s)
	•	Pattern scans for:
	•	Reentrancy (unprotected external calls with state changes).
	•	Honeypots (restrictions on selling, whitelists).
	•	Suspicious owner powers (emergency withdraw, pause).
	•	Hidden fees or taxes.
	•	Optional integration with external analyzers where available.
10.3 Step 3: Oracle Enrichment (3–7s)
	•	Age, tx count, holders from explorer/RPC.
	•	Optional:
        •	TVL and volume from DeFi aggregators.
	    •	Audit status from known security firms.
	    •	GitHub activity from linked repositories.
10.4 Step 4: Risk Scoring (2–3s)
	•	Rule-based scoring:
	•	Start at 50, then:
	•	+10–30 for each critical vulnerability.
	•	+10–20 for centralization patterns.
	•	+10 for very young contract with high inflow.
	•	-10–20 for audited, long-lived, stable contracts.
	•	Output:
	•	 risk_score  0–100.
	•	 risk_level  from thresholds.
10.5 Step 5: Natural Language Generation (3–5s)
	•	Prompt LLM with:
	•	Technical findings.
	•	Oracle data.
	•	User level.
	•	Output:
	•	 summary_short .
	•	 key_findings .
	•	Optional detailed paragraphs.
10.6 Step 6: Voice Synthesis (2–4s)
	•	Generate ~60s script.
	•	Select voice/tone based on risk:
	•	Low: calm.
	•	Medium: informative/cautious.
	•	High: urgent.
	•	Dangerous: very serious, slower pacing.
	•	Call ElevenLabs.
	•	Cache audio URL.
11. Business Model & Plans (Post-Hackathon)
11.1 Pricing Tiers
	•	Free
	•	Limited monthly analyses.
	•	Limited voice usage.
	•	Basic extension and Telegram features.
	•	Access to core educational content.
	•	Pro (e.g., $9.99/month)
	•	Unlimited analyses and extension scans.
	•	Priority voice generation.
	•	Report exports (PDF).
	•	Watchlists and alerts.
	•	API access (limited quota).
	•	Full education features and progress tracking.
    •	Enterprise
	•	White-label for wallets and protocols.
	•	Custom integrations.
	•	SLA & priority support.
	•	Custom educational content.
11.2 Revenue Streams
	•	Subscriptions.
	•	API licensing.
	•	Partnership commissions/referrals (auditors, insurance).
	•	Educational courses and certifications.
	•	B2B licensing for DAO tools and infrastructure providers.
12. Non-Functional Requirements
	•	Performance
	•	Target: end-to-end analysis within 15–40 seconds.
	•	Reliability
	•	GRACEFUL degradation:
	•	If some data sources fail, still return partial analysis.
	•	Security
	•	No handling of private keys.
	•	Robust input validation and sanitization.
	•	Scalability
	•	Use caching for popular contracts.
    •	Queue-based processing later if demand grows.
13. Hackathon Implementation Priorities
	1.	Backend MVP
	•	 /api/analyze  with address + source code support.
	•	Basic static analysis patterns.
	•	LLM summary.
	•	Optional voice generation.
	2.	Web App
	•	Security Check (Overview + Vulnerabilities basic UI).
	•	Education library with a few hardcoded patterns.
	•	Responsive design (works well on desktop + mobile).
	3.	Telegram Bot
	•	 /start ,  /check ,  /help .
	•	Messages with risk score and summary.
	•	“View Full Analysis” link into web.
	4.	Browser Extension
	•	Popup flow (paste address → see score).
	•	Link to web app.
	•	Optional inline widget for 1–2 demo dApps.
	5.	Polish
	•	Simple branding and color scheme.
    •	Demo flows scripted for judges (show all three surfaces).
    
