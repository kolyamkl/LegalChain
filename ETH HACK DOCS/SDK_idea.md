SDK for Builders – Transaction Security Integration
Overview
LegalChain will provide an SDK for builders who want to integrate transaction security directly into their own apps and backends, without requiring any browser extension or separate UI. The SDK acts as a thin client around the public analysis API and is intended for wallets, dApps, backends, and bots that want to programmatically check smart contract interactions before execution.
Purpose
	•	Allow developers to embed LegalChain’s risk engine into their own products.
	•	Enable server-side or in-app transaction checks that run automatically in the background.
	•	Provide a higher-trust, no-extension option for mobile apps, custodial platforms, or backend services.
SDK Design
Target Environments
	•	Backend services (Node.js/TypeScript initially; later other languages).
	•	Wallets and dApps (Node.js/TypeScript SDK can also be used in browser/React frontends if desired).
	•	Bots and automation (Telegram bots, Discord bots, cron jobs, monitoring scripts).
Core Responsibilities
	•	Abstract away:
	•	Authentication and API keys.
	•	Network and retry logic.
	•	Request/response validation.
	•	Provide a simple programmatic interface to:
	•	Analyze contracts and transactions.
	•	Interpret risk scores and map them to allow/block decisions.
	•	Optionally normalize responses into a small “policy decision” object.
SDK Public Interface (Conceptual)
Initialization

import { LegalChainClient } from "@legalchain/sdk";

const client = new LegalChainClient({
  apiKey: process.env.LEGALCHAIN_API_KEY,
  baseUrl: "https://api.legalchain.app", // default
});

Config options:
	•	 apiKey: string  – required.
	•	 baseUrl?: string  – override for staging/test.
1. Analyze Contract by Address

const analysis = await client.analyzeContract({
  chainId: 1,
  address: "0x1234...",
  options: {
    userLevel: "beginner",     // optional
    generateVoice: false       // SDK typically defaults to false
  }
});
Returns a strongly typed object mirroring the primary analysis response (risk score, risk level, key findings, etc.).
2. Analyze Transaction

const result = await client.analyzeTransaction({
  chainId: 1,
  txHash: "0xabc...",
  options: {
    userLevel: "beginner"
  }
});

Internally:
	•	Resolves target contract from the transaction hash.
	•	Calls the underlying analysis endpoint.
	•	Returns an object including transaction context plus the usual analysis fields.
3. Policy Helper – Is This Safe?
To make decision logic trivial, the SDK exposes a helper:

const decision = await client.isTransactionSafe({
  chainId: 1,
  txHash: "0xabc...",
  policy: {
    maxRiskScore: 40,                     // block anything > 40
    blockOnCriticalVulns: true,
    blockOnUnknownContracts: true
  }
});

if (!decision.allowed) {
  console.log("Blocked transaction:", decision.reason);
} else {
  console.log("Allowed transaction with risk:", decision.riskScore);
}

Example  decision  shape:
{
  allowed: boolean;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "dangerous";
  reasons: string[];        // human-readable reasons for block/allow
  analysisId: string;       // linkable to web UI
}

SDK Usage Patterns
1. Wallet Integration (No Extension Needed)
	•	A wallet developer integrates the SDK into the wallet backend or the wallet app:
	•	Before sending or signing a transaction, call  isTransactionSafe .
	•	If  allowed === false , the wallet:
	•	Shows a warning to the user (with reason(s)).
	•	Optionally blocks the transaction by default with an “override” switch.
2. dApp Backend Guard
	•	A DeFi protocol or NFT marketplace integrates the SDK into their backend:
	•	Before allowing a user to interact with third-party contracts (e.g., custom pools, vaults), they:
	•	Run  analyzeContract .
	•	Exclude or flag contracts with high risk.
3. Monitoring and Automation
	•	Bots or monitoring services:
	•	Periodically scan new contracts interacting with the protocol.
	•	Auto-flag high-risk contracts and send alerts to Discord/Telegram.
Relationship to Public API
	•	The SDK is thin but opinionated:
	•	It wraps the public HTTP API.
	•	Provides typed responses and policy helpers.
    •	The public API remains fully documented so:
	•	Non-JS ecosystems (Python, Rust, Go) can build their own clients.
	•	Enterprise users can integrate via their existing infrastructure.
Access and Security
	•	Authentication
	•	Each builder gets an API key tied to a plan (free, pro, enterprise).
	•	API key is stored server-side or in secure configs, not client-exposed in untrusted environments.
	•	Rate Limits
	•	Enforced per API key; SDK should expose error types for “rate limited” vs “other error” so apps can degrade gracefully.
Roadmap Notes
	•	Hackathon Scope
	•	Initial SDK in Node.js/TypeScript.•	Support:
	•	 analyzeContract 
	•	 analyzeTransaction 
	•	 isTransactionSafe  policy helper.
	•	Post-Hackathon
	•	Add:
	•	Webhooks for async analysis.
	•	Language ports (Python, Go).
	•	Stronger configuration for policies per user cohort (e.g. beginners vs advanced users).