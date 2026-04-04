import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { ows } from "@/lib/ows";
import { getStore, addActivity } from "@/lib/store";

// MoonPay wallet mapping for agents (created via `mp wallet create`)
const MP_WALLET_MAP: Record<string, string> = {
  "leash-nft-scout": "0x8d0ef8711f9815De3Fe252a4f77C74beF5f839fd",
  "leash-defi-trader": "0xE85e55a4414b5AD2e32B7aB09F5AF8b86d2ad8dc",
  "leash-research-bot": "0xCd33C711947e7a2e352798b5299Ce8FDfF4CF347",
  "leash-treasury": "0x867Ff24933cA6b14aDb8421575770F5111843D76",
};

function getMpSignature(walletName: string, message: string): string {
  try {
    const safeMsg = message.replace(/"/g, "'");
    const raw = execSync(
      `mp message sign --wallet "${walletName}" --chain base-sepolia --message "${safeMsg}" 2>/dev/null`,
      { timeout: 12000, encoding: "utf-8" }
    );
    const match = raw.match(/signature:\s*(0x[a-fA-F0-9]+)/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

// Simulate an agent attempting a transaction — checks policy + spend limits
export async function POST(req: Request) {
  try {
    const { agentId, chain, amount, action } = await req.json();
    const store = getStore();
    const agent = store.agents.find((a) => a.id === agentId);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    if (agent.status !== "active") {
      addActivity({
        agentId: agent.id,
        agentName: agent.name,
        action: action || "Transaction attempt",
        chain,
        amount,
        status: "denied",
        reason: `Agent is ${agent.status}`,
      });
      return NextResponse.json({ approved: false, reason: `Agent is ${agent.status}` });
    }

    // Check spend limit
    if (agent.spendToday + amount > agent.spendLimit) {
      addActivity({
        agentId: agent.id,
        agentName: agent.name,
        action: action || "Transaction",
        chain,
        amount,
        status: "denied",
        reason: `Would exceed daily limit ($${agent.spendLimit})`,
      });
      return NextResponse.json({
        approved: false,
        reason: `Would exceed daily limit. Current: $${agent.spendToday.toFixed(2)}, Limit: $${agent.spendLimit}`,
      });
    }

    // Check chain policy via OWS
    let policyAllowed = true;
    let policyReason = "";
    for (const pid of agent.policyIds) {
      try {
        const policy = ows.getPolicy(pid);
        const rules = policy.rules || [];
        for (const rule of rules) {
          if (rule.type === "allowed_chains" && rule.chain_ids) {
            if (!rule.chain_ids.includes(chain)) {
              policyAllowed = false;
              policyReason = `Chain ${chain} not in allowlist for policy "${policy.name}"`;
            }
          }
        }
      } catch {
        // Policy not found — skip
      }
    }

    if (!policyAllowed) {
      addActivity({
        agentId: agent.id,
        agentName: agent.name,
        action: action || "Transaction",
        chain,
        amount,
        status: "denied",
        reason: policyReason,
      });
      return NextResponse.json({ approved: false, reason: policyReason });
    }

    // Sign via MoonPay CLI if wallet exists, else fall back to OWS
    let signature = "";
    let mpWallet = "";
    let mpSigned = false;
    const mpWalletName = agent.mpWallet ? Object.entries(MP_WALLET_MAP).find(([, addr]) => addr === agent.mpWallet)?.[0] : null;
    if (mpWalletName) {
      const msg = `leash:${agent.name}:${chain}:${amount}:${Date.now()}`;
      const mpSig = getMpSignature(mpWalletName, msg);
      if (mpSig) {
        signature = mpSig.slice(0, 22) + "…";
        mpWallet = agent.mpWallet || "";
        mpSigned = true;
      }
    }
    if (!signature) {
      try {
        const msg = `leash:${agent.name}:${chain}:${amount}:${Date.now()}`;
        const result = ows.signMessage(agent.walletName, "evm", msg);
        signature = result.signature.slice(0, 22) + "…";
      } catch {
        signature = `0x${Math.random().toString(16).slice(2, 12)}…`;
      }
    }

    // Generate a realistic-looking tx hash for the demo
    const fakeTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    // Approved — update state
    agent.spendToday = Math.round((agent.spendToday + amount) * 100) / 100;
    agent.txCount += 1;

    addActivity({
      agentId: agent.id,
      agentName: agent.name,
      action: action || "Transaction",
      chain,
      amount,
      status: "approved",
    });

    return NextResponse.json({
      approved: true,
      signature,
      mpWallet,
      mpSigned,
      txHash: fakeTxHash,
      newSpendToday: agent.spendToday,
      txCount: agent.txCount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
