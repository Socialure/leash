# 🐕 Leash — AI Agent Spend Governance

**Put your AI agents on a leash.** Policy-gated wallet management for autonomous AI agents, powered by the [Open Wallet Standard](https://openwallet.sh).

![Leash Dashboard](https://img.shields.io/badge/OWS-Hackathon-purple)

## What is Leash?

Leash is a governance dashboard for managing AI agent spending. It solves the critical problem: **how do you let AI agents spend money without giving them unlimited access?**

Each agent gets:
- 🔐 **Its own OWS wallet** — encrypted, policy-gated, multi-chain
- 📋 **Chain allowlists** — restrict which blockchains an agent can operate on
- 💰 **Spend limits** — daily caps enforced before any transaction is signed
- 🔑 **API keys** — scoped access tokens tied to specific wallets + policies
- 📊 **Real-time monitoring** — live activity feed with approve/deny audit trail

## Live Demo

**[→ leash-zi0u.onrender.com](https://leash-zi0u.onrender.com)**

The dashboard comes pre-loaded with 4 demo agents:
- **Research Bot** — $50/day limit, conservative (ETH + Base only)
- **DeFi Trader** — $500/day limit, DeFi chains (ETH + L2s)
- **NFT Scout** — $200/day limit, multi-chain (EVM + Solana)
- **Bridge Agent** — $1000/day limit, multi-chain

Click any agent to:
- Simulate transactions (approved vs denied)
- Adjust spend limits in real-time
- Pause/resume agents instantly
- See OWS wallet details

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Wallet Engine**: `@open-wallet-standard/core` (native Rust FFI)
- **Policy Engine**: OWS built-in policy evaluation
- **Signing**: Real cryptographic signatures via OWS

## Quick Start

```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

## How It Works

1. **Agent Registration** — Creates an OWS wallet + chain policy + API key
2. **Transaction Request** — Agent submits a spend request (chain, amount, action)
3. **Policy Check** — OWS policy engine evaluates chain allowlist
4. **Spend Limit Check** — Leash enforces daily spend caps
5. **Sign or Deny** — If approved, OWS signs the transaction; if denied, logs the violation

## OWS Integration

Leash uses the full OWS SDK:
- `createWallet()` — multi-chain wallet creation (EVM, Solana, Bitcoin, Cosmos, etc.)
- `createPolicy()` — chain allowlist policies with deny action
- `createApiKey()` — scoped API keys linking wallets to policies
- `signMessage()` — real cryptographic signing for approved transactions
- `listWallets()`, `listPolicies()`, `listApiKeys()` — full vault management

## Built For

**OWS Hackathon 2026** — Track #2: Agent Spend Governance & Identity

Built by [Socialure](https://github.com/Socialure) with human-agent collaboration.

## License

MIT
