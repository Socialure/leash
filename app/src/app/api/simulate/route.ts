import { NextResponse } from "next/server";
import { ows } from "@/lib/ows";
import { getStore, addActivity } from "@/lib/store";

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

    // Sign a message as proof the wallet is real
    let signature = "";
    try {
      const msg = `leash:${agent.name}:${chain}:${amount}:${Date.now()}`;
      const result = ows.signMessage(agent.walletName, "evm", msg);
      signature = result.signature.slice(0, 20) + "...";
    } catch {
      // Signing optional for demo
    }

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
      newSpendToday: agent.spendToday,
      txCount: agent.txCount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
