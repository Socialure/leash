import { NextResponse } from "next/server";
import { ows } from "@/lib/ows";
import { getStore, addActivity } from "@/lib/store";
import type { AgentProfile } from "@/lib/ows";

const AGENT_COLORS = ["#a78bfa", "#34d399", "#fbbf24", "#f87171", "#38bdf8", "#fb923c"];
const AGENT_AVATARS = ["🤖", "🧠", "⚡", "🔮", "🎯", "🦾"];

export async function GET() {
  const store = getStore();
  // Auto-initialize demo agents if empty
  if (!store.initialized) {
    await initializeDemoAgents(store);
  }
  return NextResponse.json({
    agents: store.agents,
    activityLog: store.activityLog.slice(0, 50),
  });
}

export async function POST(req: Request) {
  try {
    const { name, role, spendLimit, policyPreset } = await req.json();
    const store = getStore();
    if (!store.initialized) await initializeDemoAgents(store);

    // Create OWS wallet for this agent
    const walletName = `leash-${name.toLowerCase().replace(/\s+/g, "-")}`;
    const wallet = ows.createWallet(walletName);

    // Create policy
    const policyId = `policy-${name.toLowerCase().replace(/\s+/g, "-")}`;
    const chainIds = policyPreset === "solana-only"
      ? ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"]
      : policyPreset === "multi-chain"
      ? ["eip155:1", "eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", "cosmos:cosmoshub-4"]
      : ["eip155:1", "eip155:8453", "eip155:10"];

    const policy = {
      version: 1,
      id: policyId,
      name: `${name} Policy`,
      created_at: new Date().toISOString(),
      action: "deny",
      rules: [{ type: "allowed_chains", chain_ids: chainIds }],
    };
    ows.createPolicy(JSON.stringify(policy));

    // Create API key
    const apiKey = ows.createApiKey(name, [wallet.id], [policyId], "");

    const idx = store.agents.length;
    const agent: AgentProfile = {
      id: crypto.randomUUID(),
      name,
      role: role || "General Agent",
      avatar: AGENT_AVATARS[idx % AGENT_AVATARS.length],
      walletId: wallet.id,
      walletName,
      apiKeyId: apiKey.id,
      policyIds: [policyId],
      spendToday: 0,
      spendLimit: spendLimit || 100,
      txCount: 0,
      status: "active",
      color: AGENT_COLORS[idx % AGENT_COLORS.length],
    };
    store.agents.push(agent);

    addActivity({
      agentId: agent.id,
      agentName: agent.name,
      action: "Agent registered",
      chain: "system",
      amount: 0,
      status: "approved",
    });

    return NextResponse.json({ agent, apiKeyToken: apiKey.token });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function initializeDemoAgents(store: ReturnType<typeof getStore>) {
  const demoAgents = [
    { name: "Research Bot", role: "Data Collection & Analysis", spendLimit: 50, emoji: "🧠", color: "#a78bfa", preset: "conservative" },
    { name: "DeFi Trader", role: "Automated Trading & Yield", spendLimit: 500, emoji: "📊", color: "#34d399", preset: "defi-agent" },
    { name: "NFT Scout", role: "NFT Discovery & Bidding", spendLimit: 200, emoji: "🎯", color: "#fbbf24", preset: "multi-chain" },
    { name: "Bridge Agent", role: "Cross-chain Transfers", spendLimit: 1000, emoji: "⚡", color: "#38bdf8", preset: "multi-chain" },
  ];

  for (const da of demoAgents) {
    try {
      const walletName = `leash-${da.name.toLowerCase().replace(/\s+/g, "-")}`;

      // Check if wallet already exists
      let wallet;
      try {
        wallet = ows.getWallet(walletName);
      } catch {
        wallet = ows.createWallet(walletName);
      }

      const policyId = `policy-${da.name.toLowerCase().replace(/\s+/g, "-")}`;
      const chainMap: Record<string, string[]> = {
        conservative: ["eip155:1", "eip155:8453"],
        "defi-agent": ["eip155:1", "eip155:8453", "eip155:42161", "eip155:10"],
        "multi-chain": ["eip155:1", "eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
      };

      try {
        ows.getPolicy(policyId);
      } catch {
        ows.createPolicy(JSON.stringify({
          version: 1,
          id: policyId,
          name: `${da.name} Policy`,
          created_at: new Date().toISOString(),
          action: "deny",
          rules: [{ type: "allowed_chains", chain_ids: chainMap[da.preset] || chainMap.conservative }],
        }));
      }

      const fakeSpend = Math.random() * da.spendLimit * 0.7;
      const fakeTx = Math.floor(Math.random() * 20) + 1;

      store.agents.push({
        id: crypto.randomUUID(),
        name: da.name,
        role: da.role,
        avatar: da.emoji,
        walletId: wallet.id,
        walletName,
        policyIds: [policyId],
        spendToday: Math.round(fakeSpend * 100) / 100,
        spendLimit: da.spendLimit,
        txCount: fakeTx,
        status: "active",
        color: da.color,
      });
    } catch (e) {
      console.error(`Failed to init demo agent ${da.name}:`, e);
    }
  }

  // Add some demo activity
  const actions = [
    { action: "Signed swap tx", chain: "eip155:8453", amount: 12.5, status: "approved" as const },
    { action: "Bridge request", chain: "eip155:1", amount: 45.0, status: "approved" as const },
    { action: "NFT bid placed", chain: "eip155:1", amount: 89.0, status: "approved" as const },
    { action: "Token transfer", chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", amount: 25.0, status: "approved" as const },
    { action: "Swap on restricted chain", chain: "eip155:56", amount: 100.0, status: "denied" as const, reason: "Chain not in allowlist" },
    { action: "Exceeded daily limit", chain: "eip155:8453", amount: 600.0, status: "denied" as const, reason: "Spend limit exceeded" },
    { action: "Data API payment", chain: "eip155:8453", amount: 0.50, status: "approved" as const },
    { action: "Yield harvest", chain: "eip155:42161", amount: 8.20, status: "approved" as const },
  ];

  for (const act of actions) {
    const agentIdx = Math.floor(Math.random() * store.agents.length);
    const agent = store.agents[agentIdx];
    addActivity({
      agentId: agent.id,
      agentName: agent.name,
      ...act,
    });
  }

  store.initialized = true;
}
