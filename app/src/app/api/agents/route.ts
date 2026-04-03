import { NextResponse } from "next/server";
import { ows } from "@/lib/ows";
import { getStore, addActivity } from "@/lib/store";
import type { AgentProfile } from "@/lib/ows";

const AGENT_COLORS = ["#c44e2a", "#2d7a4f", "#b8860b", "#1a1a1a", "#5b7fa5", "#8b5e3c"];
const AGENT_AVATARS = ["R", "D", "N", "B", "T", "S"];

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
    { name: "Research Bot", role: "Data Collection & Analysis", spendLimit: 50, emoji: "R", color: "#c44e2a", preset: "conservative", mpWallet: "0xCd33C711947e7a2e352798b5299Ce8FDfF4CF347" },
    { name: "DeFi Trader", role: "Automated Trading & Yield", spendLimit: 500, emoji: "D", color: "#2d7a4f", preset: "defi-agent", mpWallet: "0xE85e55a4414b5AD2e32B7aB09F5AF8b86d2ad8dc" },
    { name: "NFT Scout", role: "NFT Discovery & Bidding", spendLimit: 200, emoji: "N", color: "#b8860b", preset: "multi-chain", mpWallet: "0x8d0ef8711f9815De3Fe252a4f77C74beF5f839fd" },
    { name: "Bridge Agent", role: "Cross-chain Transfers", spendLimit: 1000, emoji: "B", color: "#1a1a1a", preset: "multi-chain", mpWallet: "0x867Ff24933cA6b14aDb8421575770F5111843D76" },
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
        mpWallet: (da as Record<string, unknown>).mpWallet as string | undefined,
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
