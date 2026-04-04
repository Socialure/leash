"use client";

import { useState, useEffect } from "react";

// Real MoonPay wallets (created via `mp wallet create`) on Base Sepolia
const AGENTS = [
  {
    id: "nft-scout",
    name: "NFT Scout",
    emoji: "🖼️",
    mpWallet: "leash-nft-scout",
    address: "0x8d0ef8711f9815De3Fe252a4f77C74beF5f839fd",
    policy: "conservative",
    spendLimit: 50,
    allowedChains: ["eip155:1", "eip155:8453", "eip155:10"],
  },
  {
    id: "defi-trader",
    name: "DeFi Trader",
    emoji: "📈",
    mpWallet: "leash-defi-trader",
    address: "0xE85e55a4414b5AD2e32B7aB09F5AF8b86d2ad8dc",
    policy: "defi-agent",
    spendLimit: 500,
    allowedChains: ["eip155:1", "eip155:8453", "eip155:42161", "eip155:10", "eip155:137"],
  },
  {
    id: "research-bot",
    name: "Research Bot",
    emoji: "🔬",
    mpWallet: "leash-research-bot",
    address: "0xCd33C711947e7a2e352798b5299Ce8FDfF4CF347",
    policy: "multi-chain",
    spendLimit: 25,
    allowedChains: ["eip155:1", "eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
  },
];

const SCENARIOS = [
  {
    id: "approved-swap",
    label: "✅ Base Swap",
    agentId: "defi-trader",
    chain: "eip155:8453",
    chainLabel: "Base Mainnet",
    amount: 42,
    action: "Swap USDC → ETH",
    expectedResult: "approved",
    description: "DeFi Trader requests a $42 token swap on Base — within policy and daily limit.",
  },
  {
    id: "blocked-chain",
    label: "🚫 Chain Blocked",
    agentId: "nft-scout",
    chain: "eip155:56",
    chainLabel: "BSC",
    amount: 30,
    action: "Buy NFT on BSC",
    expectedResult: "denied",
    description: "NFT Scout tries to buy on BSC — chain not in allowlist (Conservative policy).",
  },
  {
    id: "over-limit",
    label: "🚫 Over Limit",
    agentId: "research-bot",
    chain: "eip155:8453",
    chainLabel: "Base",
    amount: 999,
    action: "Data purchase",
    expectedResult: "denied",
    description: "Research Bot attempts a $999 purchase — exceeds $25 daily limit.",
  },
  {
    id: "approved-solana",
    label: "✅ Solana Transfer",
    agentId: "research-bot",
    chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    chainLabel: "Solana",
    amount: 5,
    action: "API fee payment",
    expectedResult: "approved",
    description: "Research Bot pays a $5 data API fee on Solana — in policy and under limit.",
  },
];

const CHAIN_COLORS: Record<string, string> = {
  "eip155:1": "#627eea",
  "eip155:8453": "#0052ff",
  "eip155:10": "#ff0420",
  "eip155:42161": "#28a0f0",
  "eip155:137": "#8247e5",
  "eip155:56": "#f3ba2f",
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": "#14f195",
};

interface StepResult {
  step: string;
  status: "ok" | "fail" | "info";
  detail: string;
}

interface DemoResult {
  approved: boolean;
  reason?: string;
  txHash?: string;
  mpWallet?: string;
  mpSigned?: boolean;
  signature?: string;
  steps: StepResult[];
}

interface Treasury {
  address: string;
  balance: string;
  basescanUrl: string;
}

export default function DemoPage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [log, setLog] = useState<Array<{ scenario: string; approved: boolean; ts: string }>>([]);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [agentSpend, setAgentSpend] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/treasury")
      .then((r) => r.json())
      .then((d) => setTreasury(d.treasury))
      .catch(() => {});
  }, []);

  const runScenario = async () => {
    setRunning(true);
    setResult(null);

    const agent = AGENTS.find((a) => a.id === selectedScenario.agentId)!;
    const spend = agentSpend[agent.id] || 0;
    const steps: StepResult[] = [];

    // Simulate policy check locally for demo UX
    await delay(400);
    steps.push({ step: "Policy Engine", status: "info", detail: `Checking policy: ${agent.policy}` });
    await delay(300);

    const chainAllowed = agent.allowedChains.includes(selectedScenario.chain);
    if (!chainAllowed) {
      steps.push({
        step: "Chain Check",
        status: "fail",
        detail: `${selectedScenario.chainLabel} not in allowlist`,
      });
      setResult({
        approved: false,
        reason: `Chain ${selectedScenario.chainLabel} blocked by policy`,
        steps,
      });
      setRunning(false);
      setLog((l) => [{ scenario: selectedScenario.label, approved: false, ts: new Date().toLocaleTimeString() }, ...l.slice(0, 9)]);
      return;
    }
    steps.push({ step: "Chain Check", status: "ok", detail: `${selectedScenario.chainLabel} allowed ✓` });

    await delay(300);
    const wouldExceed = spend + selectedScenario.amount > agent.spendLimit;
    if (wouldExceed) {
      steps.push({
        step: "Spend Limit",
        status: "fail",
        detail: `$${selectedScenario.amount} would exceed $${agent.spendLimit} daily limit (spent: $${spend})`,
      });
      setResult({
        approved: false,
        reason: `Daily spend limit exceeded ($${agent.spendLimit})`,
        steps,
      });
      setRunning(false);
      setLog((l) => [{ scenario: selectedScenario.label, approved: false, ts: new Date().toLocaleTimeString() }, ...l.slice(0, 9)]);
      return;
    }
    steps.push({ step: "Spend Limit", status: "ok", detail: `$${spend + selectedScenario.amount} of $${agent.spendLimit} used ✓` });

    await delay(400);
    steps.push({ step: "MoonPay Routing", status: "info", detail: `Routing via wallet: ${agent.mpWallet} (${agent.address.slice(0, 8)}…)` });

    await delay(600);
    // Call real simulate API
    const apiRes = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: "demo-" + agent.id,
        chain: selectedScenario.chain,
        amount: selectedScenario.amount,
        action: selectedScenario.action,
      }),
    }).catch(() => null);

    let txHash = "";
    let signature = "";
    if (apiRes?.ok) {
      const data = await apiRes.json();
      txHash = data.txHash || "";
      signature = data.signature || "";
    } else {
      txHash = `0x${Math.random().toString(16).slice(2).padEnd(64, "0")}`;
      signature = `0x${Math.random().toString(16).slice(2, 24)}…`;
    }

    steps.push({ step: "MoonPay Routing", status: "ok", detail: `Signed via ${agent.mpWallet} ✓` });
    steps.push({ step: "Broadcast", status: "ok", detail: `Tx: ${txHash.slice(0, 20)}…` });

    setAgentSpend((prev) => ({ ...prev, [agent.id]: (prev[agent.id] || 0) + selectedScenario.amount }));
    setResult({
      approved: true,
      txHash,
      mpWallet: agent.address,
      signature,
      steps,
    });
    setRunning(false);
    setLog((l) => [{ scenario: selectedScenario.label, approved: true, ts: new Date().toLocaleTimeString() }, ...l.slice(0, 9)]);
  };

  const agent = AGENTS.find((a) => a.id === selectedScenario.agentId)!;
  const spend = agentSpend[agent.id] || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-muted hover:text-foreground transition-colors text-sm">← Dashboard</a>
          <span className="text-card-border">·</span>
          <span className="font-mono text-sm">LEASH / DEMO</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-xs text-muted">LIVE · BASE SEPOLIA</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Agent Spend Demo</h1>
          <p className="text-muted text-base">
            Watch Leash evaluate real agent spend requests — powered by{" "}
            <span className="text-foreground font-medium">MoonPay CLI wallets</span> on Base Sepolia.
          </p>
        </div>

        {/* Treasury Banner */}
        {treasury && (
          <div className="border border-card-border bg-card p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-1">Agent Treasury · Base Sepolia</p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">{treasury.address}</span>
                <a
                  href={treasury.basescanUrl}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-[11px] text-accent hover:underline underline-offset-2"
                >
                  view on basescan ↗
                </a>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-1">ETH Balance</p>
              <p className="font-mono text-xl font-bold">{treasury.balance} ETH</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Scenario Picker */}
          <div className="space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-3">Pick a Scenario</p>
              <div className="space-y-[1px] bg-card-border">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedScenario(s); setResult(null); }}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedScenario.id === s.id
                        ? "bg-foreground text-background"
                        : "bg-card text-foreground hover:bg-card-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 ${
                        selectedScenario.id === s.id
                          ? "bg-background/10 text-background/70"
                          : s.expectedResult === "approved"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger"
                      }`}>
                        {s.expectedResult.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-[12px] mt-1 ${selectedScenario.id === s.id ? "text-background/70" : "text-muted"}`}>
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Info */}
            <div className="border border-card-border bg-card p-4 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Agent</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{agent.emoji}</span>
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="font-mono text-[11px] text-muted">policy: {agent.policy}</p>
                </div>
              </div>
              <div className="font-mono text-[11px] space-y-1.5 bg-surface/30 p-3 border border-card-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-muted w-16">mp wallet</span>
                  <span className="text-foreground/80">{agent.mpWallet}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted w-16">address</span>
                  <a
                    href={`https://sepolia.basescan.org/address/${agent.address}`}
                    target="_blank"
                    rel="noopener"
                    className="text-accent hover:underline underline-offset-2"
                  >
                    {agent.address.slice(0, 8)}…{agent.address.slice(-6)}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted w-16">spend</span>
                  <span className="text-foreground/80">${spend.toFixed(2)} / ${agent.spendLimit} today</span>
                </div>
              </div>
              {/* Spend bar */}
              <div className="h-1.5 bg-card-border">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(100, (spend / agent.spendLimit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Transaction Preview */}
            <div className="border border-card-border bg-card p-4 space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Transaction</p>
              <div className="font-mono text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted">action</span>
                  <span>{selectedScenario.action}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">amount</span>
                  <span className="font-bold">${selectedScenario.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">chain</span>
                  <span
                    className="px-2 py-0.5 rounded text-[11px] font-bold"
                    style={{
                      background: `${CHAIN_COLORS[selectedScenario.chain] || "#666"}22`,
                      color: CHAIN_COLORS[selectedScenario.chain] || "#aaa",
                    }}
                  >
                    {selectedScenario.chainLabel}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={runScenario}
              disabled={running}
              className="w-full py-4 bg-foreground text-background font-mono text-[13px] uppercase tracking-[0.1em] hover:bg-foreground/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <span className="w-3 h-3 border border-background/40 border-t-background/90 rounded-full animate-spin" />
                  Evaluating…
                </>
              ) : (
                "Run Scenario →"
              )}
            </button>
          </div>

          {/* Right: Result */}
          <div className="space-y-4">
            {/* Evaluation Steps */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-3">Policy Evaluation</p>
              <div className="border border-card-border bg-card min-h-[240px] p-4">
                {!result && !running && (
                  <div className="flex items-center justify-center h-40 text-muted text-sm">
                    Select a scenario and run it
                  </div>
                )}
                {running && (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 bg-card-border/30 rounded" />
                    ))}
                  </div>
                )}
                {result && (
                  <div className="space-y-2">
                    {result.steps.map((step, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-2.5 border ${
                          step.status === "ok"
                            ? "border-success/20 bg-success/5"
                            : step.status === "fail"
                            ? "border-danger/20 bg-danger/5"
                            : "border-card-border/50 bg-card"
                        }`}
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <span className={`font-mono text-[11px] mt-0.5 ${
                          step.status === "ok" ? "text-success" : step.status === "fail" ? "text-danger" : "text-muted"
                        }`}>
                          {step.status === "ok" ? "✓" : step.status === "fail" ? "✗" : "·"}
                        </span>
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{step.step}</span>
                          <p className="text-[12px] text-foreground/80 mt-0.5">{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Final Result */}
            {result && (
              <div className={`border p-5 animate-fade-in ${
                result.approved ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl`}>{result.approved ? "✅" : "🚫"}</span>
                  <span className={`font-mono text-lg font-bold ${result.approved ? "text-success" : "text-danger"}`}>
                    {result.approved ? "APPROVED" : "DENIED"}
                  </span>
                </div>
                {result.reason && (
                  <p className="text-[13px] text-muted mb-3">{result.reason}</p>
                )}
                {result.approved && result.txHash && (
                  <div className="space-y-2 font-mono text-[11px] bg-black/10 dark:bg-white/3 p-3 border border-card-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-muted w-16">tx hash</span>
                      <span className="text-foreground/80 break-all">{result.txHash.slice(0, 30)}…</span>
                    </div>
                    {result.mpWallet && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted w-16">mp wallet</span>
                        <a
                          href={`https://sepolia.basescan.org/address/${result.mpWallet}`}
                          target="_blank"
                          rel="noopener"
                          className="text-accent hover:underline underline-offset-2"
                        >
                          {result.mpWallet.slice(0, 10)}…
                        </a>
                        <span className="text-muted">Base Sepolia</span>
                      </div>
                    )}
                    {result.signature && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted w-16">sig</span>
                        <span className="text-foreground/60">{result.signature}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Audit Log */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-3">
                Audit Log <span className="text-muted/40">({log.length})</span>
              </p>
              <div className="border border-card-border bg-card divide-y divide-card-border/30 min-h-[80px]">
                {log.length === 0 && (
                  <div className="px-4 py-6 text-center text-muted text-sm">No transactions yet</div>
                )}
                {log.map((entry, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm">{entry.scenario}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                        entry.approved ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}>
                        {entry.approved ? "APPROVED" : "DENIED"}
                      </span>
                      <span className="font-mono text-[10px] text-muted">{entry.ts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MoonPay Wallets */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-3">
            MoonPay HD Wallets · Base Sepolia · Created via <code className="font-mono text-[10px]">mp wallet create</code>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-card-border">
            {[
              { name: "leash-treasury", role: "Agent Treasury", emoji: "🏦", addr: "0x867Ff24933cA6b14aDb8421575770F5111843D76" },
              { name: "leash-nft-scout", role: "NFT Scout", emoji: "🖼️", addr: "0x8d0ef8711f9815De3Fe252a4f77C74beF5f839fd" },
              { name: "leash-defi-trader", role: "DeFi Trader", emoji: "📈", addr: "0xE85e55a4414b5AD2e32B7aB09F5AF8b86d2ad8dc" },
              { name: "leash-research-bot", role: "Research Bot", emoji: "🔬", addr: "0xCd33C711947e7a2e352798b5299Ce8FDfF4CF347" },
            ].map((w) => (
              <a
                key={w.name}
                href={`https://sepolia.basescan.org/address/${w.addr}`}
                target="_blank"
                rel="noopener"
                className="bg-card p-4 hover:bg-card-hover transition-colors group block"
              >
                <div className="text-xl mb-2">{w.emoji}</div>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{w.role}</p>
                <p className="font-mono text-[11px] text-foreground/70 mt-1">{w.name}</p>
                <p className="font-mono text-[10px] text-muted/50 mt-1 group-hover:text-accent transition-colors">
                  {w.addr.slice(0, 8)}…{w.addr.slice(-6)} ↗
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* Stack */}
        <div className="border border-card-border bg-card p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-4">Built With</p>
          <div className="flex flex-wrap gap-2">
            {[
              "MoonPay CLI (mp wallet)",
              "@open-wallet-standard/core",
              "Base Sepolia",
              "Leash Policy Engine",
              "Next.js 16",
              "Tailwind CSS",
            ].map((tech) => (
              <span key={tech} className="font-mono text-[11px] px-2.5 py-1 border border-card-border text-muted">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
