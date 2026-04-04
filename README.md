# 🐕 Leash — AI Agent Spend Governance Dashboard

**Put your AI agents on a leash.** Policy-gated wallet management for autonomous AI agents, powered by the [Open Wallet Standard](https://openwallet.sh).

> **Marketing site**: [leash-zi0u.onrender.com](https://leash-zi0u.onrender.com) | **Website repo**: [Socialure/leash-website](https://github.com/Socialure/leash-website)

## What is Leash?

Leash is a **local dashboard** you install on your machine to manage AI agent spending. It solves the critical problem: **how do you let AI agents spend money without giving them unlimited access?**

Each agent gets:
- 🔐 **Its own OWS wallet** — encrypted, policy-gated, multi-chain
- 📋 **Chain allowlists** — restrict which blockchains an agent can operate on
- 💰 **Spend limits** — daily caps enforced before any transaction is signed
- 🔑 **API keys** — scoped access tokens tied to specific wallets + policies
- 📊 **Real-time monitoring** — live activity feed with approve/deny audit trail

## Quick Start

```bash
git clone https://github.com/Socialure/leash
cd leash/app
npm install
npm run dev
```

Open **http://localhost:3847** — the dashboard loads instantly.

## Register an Agent

```bash
curl -X POST http://localhost:3847/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name": "My Agent", "role": "trader", "spendLimit": 100, "chains": ["eip155:8453"]}'
```

Save the `id` and `apiKey` from the response.

## Simulate a Transaction

```bash
curl -X POST http://localhost:3847/api/simulate \
  -H "Content-Type: application/json" \
  -d '{"agentId": "<your-agent-id>", "chain": "eip155:8453", "amount": 10, "action": "swap"}'
```

Leash approves or denies based on the agent's spend policy. Raw keys never leave the vault.

## Check Treasury / Wallet Balance

```bash
curl http://localhost:3847/api/treasury
```

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API routes
- **Wallet Engine**: OWS-compatible HD wallets (Base Sepolia)
- **Policy Engine**: Spend limit + chain allowlist enforcement
- **Signing**: Real cryptographic signatures

## Project Structure

```
app/
  src/
    app/
      dashboard/    ← Main dashboard UI
      demo/         ← Interactive demo page
      api/          ← REST API (agents, simulate, treasury, etc.)
    lib/            ← Wallet vault, policy engine
```

## License

MIT — Open source. Built for the OWS Hackathon.
