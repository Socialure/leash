"use client";

import { useEffect, useState, useCallback } from "react";

interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  walletId: string;
  walletName: string;
  policyIds: string[];
  spendToday: number;
  spendLimit: number;
  txCount: number;
  status: "active" | "paused" | "revoked";
  color: string;
  mpWallet?: string;
}

interface ActivityLog {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  chain: string;
  amount: number;
  status: "approved" | "denied" | "pending";
  reason?: string;
  timestamp: string;
}

const CHAINS: Record<string, { name: string; abbr: string }> = {
  "eip155:1": { name: "Ethereum", abbr: "ETH" },
  "eip155:8453": { name: "Base", abbr: "BASE" },
  "eip155:10": { name: "Optimism", abbr: "OP" },
  "eip155:42161": { name: "Arbitrum", abbr: "ARB" },
  "eip155:137": { name: "Polygon", abbr: "POLY" },
  "eip155:56": { name: "BSC", abbr: "BSC" },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": { name: "Solana", abbr: "SOL" },
  "cosmos:cosmoshub-4": { name: "Cosmos", abbr: "ATOM" },
  system: { name: "System", abbr: "SYS" },
};

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [simResult, setSimResult] = useState<Record<string, any> | null>(null);
  const [treasury, setTreasury] = useState<{ address: string; balance: string; basescanUrl: string } | null>(null);

  useEffect(() => {
    fetch("/api/treasury")
      .then((r) => r.json())
      .then((d) => setTreasury(d.treasury))
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/agents");
    const data = await res.json();
    setAgents(data.agents || []);
    setActivity(data.activityLog || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleAgent = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  const updateLimit = async (id: string, newLimit: number) => {
    await fetch(`/api/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spendLimit: newLimit }),
    });
    fetchData();
  };

  const simulateTx = async (agentId: string, chain: string, amount: number, action: string) => {
    setSimulating(true);
    setSimResult(null);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, chain, amount, action }),
    });
    const data = await res.json();
    setSimResult(data);
    setSimulating(false);
    fetchData();
  };

  const totalSpend = agents.reduce((s, a) => s + a.spendToday, 0);
  const totalLimit = agents.reduce((s, a) => s + a.spendLimit, 0);
  const totalTx = agents.reduce((s, a) => s + a.txCount, 0);
  const deniedCount = activity.filter((a) => a.status === "denied").length;
  const activeCount = agents.filter((a) => a.status === "active").length;
  const spendPct = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-xs tracking-widest uppercase text-muted">Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ─── */}
      <header className="border-b border-card-border/60">
        <div className="max-w-[1120px] mx-auto px-8 py-6 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-[28px] font-bold tracking-tight leading-none">
                Leash
              </h1>
              <span className="font-mono text-[10px] text-muted uppercase tracking-[0.2em]">
                v0.1
              </span>
            </div>
            <p className="text-[13px] text-muted mt-1.5">
              Agent spend governance — powered by{" "}
              <a href="https://openwallet.sh" target="_blank" rel="noopener" className="text-foreground hover:text-accent transition-colors underline decoration-card-border underline-offset-2">
                Open Wallet Standard
              </a>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/demo"
              className="px-5 py-2.5 bg-card border border-card-border text-foreground text-[11px] font-mono uppercase tracking-[0.15em] hover:bg-card-hover transition-colors"
            >
              ▶ Live Demo
            </a>
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-5 py-2.5 bg-foreground text-background text-[11px] font-mono uppercase tracking-[0.15em] hover:bg-foreground/85 transition-colors"
            >
              Register Agent
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1120px] mx-auto w-full px-8 py-10">
        {/* ─── Overview Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-card-border mb-12">
          <div className="bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Agents</p>
            <p className="text-3xl font-bold tabular-nums">{activeCount}</p>
            <p className="font-mono text-[11px] text-muted mt-1">{agents.length} registered</p>
          </div>
          <div className="bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Spend Today</p>
            <p className="text-3xl font-bold tabular-nums">${totalSpend.toFixed(0)}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-[3px] bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(spendPct, 100)}%`,
                    backgroundColor: spendPct > 80 ? "var(--danger)" : spendPct > 60 ? "var(--warning)" : "var(--foreground)",
                  }}
                />
              </div>
              <span className="font-mono text-[10px] text-muted tabular-nums">{spendPct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Transactions</p>
            <p className="text-3xl font-bold tabular-nums">{totalTx}</p>
            <p className="font-mono text-[11px] text-muted mt-1">across all agents</p>
          </div>
          <div className="bg-card p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Blocked</p>
            <p className={`text-3xl font-bold tabular-nums ${deniedCount > 0 ? "text-danger" : ""}`}>{deniedCount}</p>
            <p className="font-mono text-[11px] text-muted mt-1">policy violations</p>
          </div>
        </div>

        {/* ─── MoonPay Treasury Banner ─── */}
        {treasury && (
          <div className="mt-6 mb-10 border border-card-border/60 bg-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xl">🏦</span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted mb-0.5">Agent Treasury · Base Sepolia · MoonPay HD Wallet</p>
                <div className="flex items-center gap-3">
                  <a
                    href={treasury.basescanUrl}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-[12px] text-accent hover:underline underline-offset-2"
                  >
                    {treasury.address.slice(0, 10)}…{treasury.address.slice(-8)}
                  </a>
                  <span className="text-card-border text-[10px]">·</span>
                  <span className="font-mono text-[11px] text-muted">{treasury.balance} ETH</span>
                </div>
              </div>
            </div>
            <a
              href="/demo"
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-card-border text-muted hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              ▶ Watch Demo
            </a>
          </div>
        )}

        {/* ─── Two Column Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          {/* Left: Agents */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-bold">Agents</h2>
              <span className="font-mono text-[11px] text-muted">{activeCount} active / {agents.length} total</span>
            </div>
            <div className="border-t border-card-border">
              {agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent === agent.id}
                  onSelect={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                  onToggle={() => toggleAgent(agent.id, agent.status)}
                  onUpdateLimit={(v) => updateLimit(agent.id, v)}
                  onSimulate={(chain, amount, action) => simulateTx(agent.id, chain, amount, action)}
                  simulating={simulating && selectedAgent === agent.id}
                  simResult={selectedAgent === agent.id ? simResult : null}
                />
              ))}
            </div>
          </div>

          {/* Right: Activity Log */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-bold">Activity</h2>
              <span className="font-mono text-[11px] text-muted">{activity.length} events</span>
            </div>
            <div className="border-t border-card-border max-h-[600px] overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-muted text-sm py-16 text-center">No activity yet. Simulate a transaction.</p>
              ) : (
                activity.map((log) => (
                  <div key={log.id} className="py-3 border-b border-card-border/50 animate-fade-in">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium">{log.agentName}</span>
                          <span className="text-card-border">·</span>
                          <span className="text-[13px] text-muted truncate">{log.action}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {log.chain !== "system" && (
                            <span className="font-mono text-[10px] text-muted uppercase">{CHAINS[log.chain]?.abbr || log.chain}</span>
                          )}
                          {log.amount > 0 && (
                            <span className="font-mono text-[10px] text-muted">${log.amount.toFixed(2)}</span>
                          )}
                          <span className="font-mono text-[10px] text-muted/40">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <StatusDot status={log.status} />
                    </div>
                    {log.reason && (
                      <p className="text-[11px] text-danger mt-1 font-mono pl-0">{log.reason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── How It Works ─── */}
      <section className="border-t border-card-border mt-20">
        <div className="max-w-[1120px] mx-auto px-8 py-20">
          <div className="flex items-baseline justify-between mb-12">
            <h2 className="text-2xl font-bold">How It Works</h2>
            <span className="font-mono text-[11px] text-muted uppercase tracking-[0.15em]">Architecture</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-card-border">
            {[
              { n: "01", title: "Register", desc: "Create an OWS wallet for each agent. The wallet is local, standards-compliant, and chain-agnostic." },
              { n: "02", title: "Policy", desc: "Define chain allowlists and daily spend limits. Policies are JSON — version-controlled and auditable." },
              { n: "03", title: "Transact", desc: "Agent submits a spend request. The policy engine validates chain + amount before the wallet signs." },
              { n: "04", title: "Audit", desc: "Every approve and deny is logged with chain, amount, and reason. Full audit trail in real-time." },
            ].map((s) => (
              <div key={s.n} className="bg-card p-6">
                <span className="font-mono text-[11px] text-accent">{s.n}</span>
                <h3 className="text-base font-bold mt-3 mb-2">{s.title}</h3>
                <p className="text-[13px] text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Stack */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted">
            {["@open-wallet-standard/core", "MoonPay CLI", "Zerion API", "Next.js", "Base Sepolia"].map((t, i) => (
              <span key={t} className="flex items-center gap-6">
                {i > 0 && <span className="text-card-border mr-0">·</span>}
                <span>{t}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── On-Chain Section ─── */}
      <section className="border-t border-card-border bg-card">
        <div className="max-w-[1120px] mx-auto px-8 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold">On-Chain</h2>
            <span className="font-mono text-[11px] text-muted uppercase tracking-[0.15em]">Base Sepolia</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {agents.filter(a => a.mpWallet).map((agent) => (
              <div key={agent.id} className="border border-card-border p-5 bg-background">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{agent.name}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${
                    agent.status === "active" ? "text-success" : "text-muted"
                  }`}>{agent.status}</span>
                </div>
                <div className="font-mono text-[12px] text-muted space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest w-8 text-muted/60">addr</span>
                    <a
                      href={`https://sepolia.basescan.org/address/${agent.mpWallet}`}
                      target="_blank"
                      rel="noopener"
                      className="text-foreground hover:text-accent transition-colors underline decoration-card-border underline-offset-2"
                    >
                      {agent.mpWallet?.slice(0, 6)}...{agent.mpWallet?.slice(-4)}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest w-8 text-muted/60">ows</span>
                    <span className="text-foreground/70">{agent.walletName}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-card-border/50 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted">
                    ${agent.spendToday.toFixed(2)} / ${agent.spendLimit}
                  </span>
                  <span className="font-mono text-[10px] text-muted/50">{agent.txCount} tx</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-card-border">
        <div className="max-w-[1120px] mx-auto px-8 py-5 flex items-center justify-between font-mono text-[11px] text-muted">
          <span>Leash — Built with Open Wallet Standard</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Socialure/leash" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">GitHub</a>
            <span className="text-card-border">·</span>
            <span>OWS Hackathon 2026</span>
          </div>
        </div>
      </footer>

      {showAddAgent && (
        <AddAgentModal onClose={() => setShowAddAgent(false)} onCreated={fetchData} />
      )}
    </div>
  );
}

/* ──────────── Components ──────────── */

function StatusDot({ status }: { status: string }) {
  const color = status === "approved" ? "bg-success" : status === "denied" ? "bg-danger" : "bg-warning";
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${status === "approved" ? "animate-pulse-dot" : ""}`} />
      <span className={`font-mono text-[10px] uppercase tracking-wider ${
        status === "approved" ? "text-success" : status === "denied" ? "text-danger" : "text-warning"
      }`}>
        {status}
      </span>
    </div>
  );
}

function AgentRow({
  agent,
  isSelected,
  onSelect,
  onToggle,
  onUpdateLimit,
  onSimulate,
  simulating,
  simResult,
}: {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onUpdateLimit: (v: number) => void;
  onSimulate: (chain: string, amount: number, action: string) => void;
  simulating: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simResult: Record<string, any> | null;
}) {
  const pct = agent.spendLimit > 0 ? (agent.spendToday / agent.spendLimit) * 100 : 0;

  return (
    <div className={`border-b border-card-border transition-colors ${isSelected ? "bg-card" : ""}`}>
      {/* Main Row */}
      <div className="py-4 flex items-center gap-4 cursor-pointer group" onClick={onSelect}>
        {/* Status indicator */}
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          agent.status === "active" ? "bg-success animate-pulse-dot" : agent.status === "paused" ? "bg-warning" : "bg-danger"
        }`} />

        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-medium leading-tight">{agent.name}</h3>
          <p className="text-[12px] text-muted mt-0.5">{agent.role}</p>
        </div>

        {/* Spend bar */}
        <div className="w-44 hidden sm:block">
          <div className="flex items-baseline justify-between mb-1">
            <span className={`font-mono text-[12px] tabular-nums ${pct > 80 ? "text-danger font-medium" : ""}`}>
              ${agent.spendToday.toFixed(0)}
            </span>
            <span className="font-mono text-[11px] text-muted tabular-nums">
              ${agent.spendLimit}
            </span>
          </div>
          <div className="h-[3px] bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: pct > 80 ? "var(--danger)" : pct > 60 ? "var(--warning)" : "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* Tx count */}
        <span className="font-mono text-[11px] text-muted w-12 text-right tabular-nums">{agent.txCount} tx</span>

        {/* Expand */}
        <span className="text-muted/30 group-hover:text-muted transition-colors text-[11px] w-4 text-center">
          {isSelected ? "−" : "+"}
        </span>
      </div>

      {/* Expanded Panel */}
      {isSelected && (
        <div className="pb-5 pl-5 pr-0 space-y-4 animate-fade-in">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.1em] border transition-colors ${
                agent.status === "active"
                  ? "border-warning/40 text-warning hover:bg-warning/5"
                  : "border-success/40 text-success hover:bg-success/5"
              }`}
            >
              {agent.status === "active" ? "Pause" : "Resume"}
            </button>
            <span className="text-card-border px-1">|</span>
            <span className="font-mono text-[10px] text-muted uppercase tracking-[0.15em]">Limit</span>
            {[25, 50, 100, 250, 500, 1000].map((limit) => (
              <button
                key={limit}
                onClick={(e) => { e.stopPropagation(); onUpdateLimit(limit); }}
                className={`px-2 py-1 font-mono text-[11px] transition-colors ${
                  agent.spendLimit === limit
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                ${limit}
              </button>
            ))}
          </div>

          {/* Wallet info */}
          <div className="font-mono text-[11px] bg-surface/50 border border-card-border/60 px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted/60 w-8">ows</span>
              <span className="text-foreground/80">{agent.walletName}</span>
              <span className="text-card-border">·</span>
              <span className="text-muted/50 text-[10px]">{agent.walletId.slice(0, 16)}…</span>
            </div>
            {agent.mpWallet && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.15em] text-muted/60 w-8">mp</span>
                <a
                  href={`https://sepolia.basescan.org/address/${agent.mpWallet}`}
                  target="_blank"
                  rel="noopener"
                  className="text-accent hover:underline underline-offset-2"
                >
                  {agent.mpWallet.slice(0, 6)}…{agent.mpWallet.slice(-4)}
                </a>
                <span className="text-[10px] text-muted/40">Base Sepolia</span>
              </div>
            )}
          </div>

          {/* Simulate */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Simulate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-card-border">
              <SimBtn label="Swap · Base" chain="eip155:8453" amount={15} action="Token swap" onSim={onSimulate} loading={simulating} />
              <SimBtn label="Bridge · ETH" chain="eip155:1" amount={50} action="Bridge transfer" onSim={onSimulate} loading={simulating} />
              <SimBtn label="BSC · Blocked" chain="eip155:56" amount={30} action="Swap attempt" onSim={onSimulate} loading={simulating} danger />
              <SimBtn label="Over Limit" chain="eip155:8453" amount={9999} action="Large transfer" onSim={onSimulate} loading={simulating} danger />
            </div>
          </div>

          {/* Result */}
          {simResult && (
            <div className={`p-3 border text-[13px] animate-fade-in ${
              simResult.approved ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[11px] uppercase tracking-wider font-medium ${simResult.approved ? "text-success" : "text-danger"}`}>
                  {simResult.approved ? "✓ Approved" : "✗ Denied"}
                </span>
                {simResult.reason && <span className="text-[12px] text-muted">— {simResult.reason}</span>}
              </div>
              {simResult.signature && (
                <p className="font-mono text-[10px] text-muted/60 mt-1">sig: {simResult.signature}</p>
              )}
              {simResult.txHash && simResult.approved && (
                <p className="font-mono text-[10px] text-muted/60 mt-0.5">tx: {simResult.txHash.slice(0, 20)}…</p>
              )}
              {simResult.mpWallet && (
                <a
                  href={`https://sepolia.basescan.org/address/${simResult.mpWallet}`}
                  target="_blank" rel="noopener"
                  className="font-mono text-[10px] text-accent hover:underline underline-offset-2 block mt-0.5"
                >
                  mp wallet: {simResult.mpWallet.slice(0, 8)}… ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SimBtn({
  label, chain, amount, action, onSim, loading, danger,
}: {
  label: string; chain: string; amount: number; action: string;
  onSim: (chain: string, amount: number, action: string) => void;
  loading: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSim(chain, amount, action); }}
      disabled={loading}
      className={`px-3 py-2.5 text-[11px] font-mono transition-colors disabled:opacity-30 text-left ${
        danger
          ? "bg-danger/3 text-danger hover:bg-danger/8"
          : "bg-card text-foreground hover:bg-card-hover"
      }`}
    >
      <span className="block">{label}</span>
      <span className="block text-[10px] text-muted mt-0.5">${amount}</span>
    </button>
  );
}

function AddAgentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [limit, setLimit] = useState(100);
  const [preset, setPreset] = useState("conservative");
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!name) return;
    setCreating(true);
    await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, spendLimit: limit, policyPreset: preset }),
    });
    setCreating(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-card-border p-8 w-full max-w-lg animate-fade-in-scale shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold">Register Agent</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg transition-colors">×</button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Agent Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury Bot"
              className="w-full px-3 py-2.5 bg-background border border-card-border text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Automated yield farming"
              className="w-full px-3 py-2.5 bg-background border border-card-border text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Daily Spend Limit</label>
            <div className="flex gap-[1px] bg-card-border">
              {[25, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`flex-1 py-2 font-mono text-[11px] transition-colors ${
                    limit === v ? "bg-foreground text-background" : "bg-card text-muted hover:text-foreground"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Chain Policy</label>
            <div className="grid grid-cols-2 gap-[1px] bg-card-border">
              {[
                { id: "conservative", label: "Conservative", sub: "ETH + Base" },
                { id: "defi-agent", label: "DeFi", sub: "ETH + L2s" },
                { id: "multi-chain", label: "Multi-Chain", sub: "EVM + Solana" },
                { id: "solana-only", label: "Solana", sub: "SOL only" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3 text-left transition-colors ${
                    preset === p.id
                      ? "bg-foreground text-background"
                      : "bg-card text-muted hover:text-foreground"
                  }`}
                >
                  <div className="text-[12px] font-medium">{p.label}</div>
                  <div className="font-mono text-[10px] mt-0.5 opacity-60">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-[1px] bg-card-border mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-card text-muted text-[11px] font-mono uppercase tracking-[0.15em] hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name || creating}
            className="flex-1 px-4 py-3 bg-foreground text-background text-[11px] font-mono uppercase tracking-[0.15em] hover:bg-foreground/85 transition-colors disabled:opacity-30"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted text-center mt-4">
          Creates OWS wallet · chain policy · scoped API key
        </p>
      </div>
    </div>
  );
}
