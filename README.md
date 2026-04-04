# 🐕 Leash — A Open Wallet Standard UI Dashboard

**Put your AI agents on a leash.** A GUI dashboard for the [Open Wallet Standard](https://openwallet.sh) — policy-gated wallet management for autonomous AI agents. Install Leash locally and get the full OWS interface alongside it.

> **Website**: [leash.directivecreator.com](https://leash.directivecreator.com)

## What is Leash?

Leash is a **local GUI dashboard** that installs with the Open Wallet Standard, giving you a visual interface to manage AI agent spending. It solves the critical problem: **how do you let AI agents spend money without giving them unlimited access?**

Leash acts as the UI layer for OWS — when you install Leash, you get:
- 🖥️ **A full OWS dashboard** — visual interface for all your agent wallets and policies
- 🔐 **OWS-compatible wallets** — encrypted, policy-gated, multi-chain wallets per agent
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

Leash approves or denies based on the agent's spend policy. Raw keys never leave the vault because of the power of the Open Wallet Standard.

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
