"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
  const [simResult, setSimResult] = useState<{
    approved: boolean;
    reason?: string;
    signature?: string;
  } | null>(null);

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

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
  }, [isDark]);

  const totalSpend = agents.reduce((s, a) => s + a.spendToday, 0);
  const totalLimit = agents.reduce((s, a) => s + a.spendLimit, 0);
  const totalTx = agents.reduce((s, a) => s + a.txCount, 0);
  const deniedCount = activity.filter((a) => a.status === "denied").length;
  const activeCount = agents.filter((a) => a.status === "active").length;
  const spendPct = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted">Loading</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ─── Ambient background glow ─── */}
      <div className="page-ambient" aria-hidden="true" />

      {/* ─── Header ─── */}
      <header className="border-b border-card-border steel-bg sticky top-0 z-50">
        <div className="swirl-layer" />
        <div className="swirl-layer-2" />
        {/* Animated top border line */}
        <div className="header-line" />
        <div className="max-w-[1200px] mx-auto px-8 flex items-stretch justify-between relative z-10">
          {/* Wordmark */}
          <div className="flex items-center border-r border-card-border pr-8 py-5">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[20px] font-bold tracking-[-0.02em] leading-none steel-text">LEASH</span>
            </div>
          </div>

          {/* Center descriptor */}
          <div className="hidden md:flex items-center px-8 border-r border-card-border flex-1">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
              Agent Spend Governance
            </p>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-5 pl-8 py-5">
            {/* Dark/Light toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="theme-toggle"
              aria-label="Toggle dark/light mode"
            >
              <div className="theme-toggle-track">
                <div className="theme-toggle-thumb" />
              </div>
              <span className="theme-toggle-label">{isDark ? "Dark" : "Light"}</span>
            </button>

            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener"
              className="hidden sm:block font-mono text-[10px] tracking-[0.12em] uppercase text-muted hover:text-foreground transition-colors"
            >
              Open Wallet ↗
            </a>
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-5 py-2 bg-foreground text-background text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground/85 transition-colors btn-shimmer"
            >
              Register Agent
            </button>
          </div>
        </div>
        {/* Bottom shimmer line */}
        <div className="header-line opacity-30" />
      </header>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-8 relative z-10">

        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-card-border">
          {[
            {
              label: "Active Agents",
              value: activeCount.toString(),
              sub: `${agents.length} registered`,
              danger: false,
              bar: false,
              pct: 0,
              accent: "steel",
            },
            {
              label: "Spend Today",
              value: `$${totalSpend.toFixed(0)}`,
              sub: `${spendPct.toFixed(0)}% of $${totalLimit} limit`,
              danger: false,
              bar: true,
              pct: spendPct,
              accent: "accent2",
            },
            {
              label: "Transactions",
              value: totalTx.toString(),
              sub: "across all agents",
              danger: false,
              bar: false,
              pct: 0,
              accent: "steel",
            },
            {
              label: "Blocked",
              value: deniedCount.toString(),
              sub: "policy violations",
              danger: deniedCount > 0,
              bar: false,
              pct: 0,
              accent: "danger",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`py-8 px-6 animate-fade-in stagger-${i + 1} transition-colors hover:bg-card-hover ${i < 3 ? "border-r border-card-border" : ""}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-1 h-1 rounded-full flex-shrink-0"
                  style={{
                    background: stat.danger
                      ? "var(--danger)"
                      : i === 1
                      ? "var(--accent2)"
                      : "var(--steel)",
                    boxShadow: stat.danger
                      ? "0 0 4px var(--danger)"
                      : i === 1
                      ? "0 0 4px var(--accent2)"
                      : "0 0 4px var(--steel)",
                  }}
                />
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">
                  {stat.label}
                </p>
              </div>
              <p
                className={`text-[38px] font-bold leading-none tabular-nums tracking-[-0.03em] stat-num animate-count-up stagger-${i + 1} ${
                  stat.danger ? "danger-text" : ""
                }`}
              >
                {stat.value}
              </p>
              {stat.bar && (
                <div className="mt-3 mb-1 h-[2px] bg-card-border w-full overflow-hidden rounded-full">
                  <div
                    className="h-full bar-animated bar-glow"
                    style={{
                      width: `${Math.min(stat.pct, 100)}%`,
                      backgroundColor:
                        stat.pct > 80
                          ? "var(--danger)"
                          : stat.pct > 60
                          ? "var(--warning)"
                          : "var(--accent2)",
                      color:
                        stat.pct > 80
                          ? "var(--danger)"
                          : stat.pct > 60
                          ? "var(--warning)"
                          : "var(--accent2)",
                    }}
                  />
                </div>
              )}
              <p className="font-mono text-[10px] text-muted mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ─── Agents + Activity ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">

          {/* Agents column */}
          <div className="border-r border-card-border">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-card-border">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">Agents</span>
              <span className="font-mono text-[9px] text-muted">{activeCount}/{agents.length}</span>
            </div>
            <div>
              {agents.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="font-mono text-[11px] text-muted">No agents registered.</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <AgentRow
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent === agent.id}
                    onSelect={() =>
                      setSelectedAgent(selectedAgent === agent.id ? null : agent.id)
                    }
                    onToggle={() => toggleAgent(agent.id, agent.status)}
                    onUpdateLimit={(v) => updateLimit(agent.id, v)}
                    onSimulate={(chain, amount, action) =>
                      simulateTx(agent.id, chain, amount, action)
                    }
                    simulating={simulating && selectedAgent === agent.id}
                    simResult={selectedAgent === agent.id ? simResult : null}
                  />
                ))
              )}
            </div>
          </div>

          {/* Activity column */}
          <div>
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-card-border">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">Activity</span>
              <span className="font-mono text-[9px] text-muted">{activity.length} events</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {activity.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="font-mono text-[11px] text-muted leading-relaxed">
                    No activity yet.
                    <br />
                    Simulate a transaction.
                  </p>
                </div>
              ) : (
                activity.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-3.5 border-b border-card-border animate-fade-in-left hover:bg-card-hover transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium leading-tight">{log.agentName}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {log.chain !== "system" && (
                            <span className="font-mono text-[9px] text-muted uppercase tracking-wider">
                              {CHAINS[log.chain]?.abbr || log.chain}
                            </span>
                          )}
                          {log.amount > 0 && (
                            <span className="font-mono text-[9px] text-muted">
                              ${log.amount.toFixed(2)}
                            </span>
                          )}
                          <span className="font-mono text-[9px] text-muted/40">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="font-mono text-[9px] text-danger mt-1">{log.reason}</p>
                        )}
                      </div>
                      <StatusDot status={log.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── How It Works ─── */}
      <section className="border-t border-card-border relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center justify-between px-8 py-4 border-b border-card-border">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">Architecture</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">How It Works</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-card-border">
            {[
              {
                n: "01",
                title: "Register",
                desc: "Create an OWS wallet for each agent. Local, standards-compliant, chain-agnostic.",
              },
              {
                n: "02",
                title: "Policy",
                desc: "Define chain allowlists and daily spend limits. JSON — version-controlled and auditable.",
              },
              {
                n: "03",
                title: "Transact",
                desc: "Agent submits a spend request. Policy engine validates chain + amount before signing.",
              },
              {
                n: "04",
                title: "Audit",
                desc: "Every approve and deny is logged with chain, amount, and reason. Real-time trail.",
              },
            ].map((s, i) => (
              <div
                key={s.n}
                className={`px-8 py-10 animate-fade-in stagger-${i + 1} hover:bg-card-hover transition-colors ${i < 3 ? "border-r border-card-border" : ""}`}
              >
                <span className="font-mono text-[9px] arch-num tracking-[0.2em]">{s.n}</span>
                <h3 className="text-[20px] font-bold mt-4 mb-3 tracking-[-0.02em]">{s.title}</h3>
                <p className="text-[12px] text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Stack */}
          <div className="px-8 py-4 flex flex-wrap items-center gap-x-5 gap-y-1">
            {["@open-wallet-standard/core", "MoonPay CLI", "Zerion API", "Next.js", "Base Sepolia"].map(
              (t, i) => (
                <span key={t} className="flex items-center gap-5">
                  {i > 0 && <span className="text-card-border">·</span>}
                  <span className="font-mono text-[10px] text-muted">{t}</span>
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ─── On-Chain ─── */}
      {agents.filter((a) => a.mpWallet).length > 0 && (
        <section className="border-t border-card-border relative z-10">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center justify-between px-8 py-4 border-b border-card-border">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">On-Chain</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted">Base Sepolia</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {agents
                .filter((a) => a.mpWallet)
                .map((agent, i) => (
                  <div
                    key={agent.id}
                    className={`px-8 py-6 border-b border-card-border ${
                      i % 2 === 0 ? "border-r border-card-border" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="text-[13px] font-medium">{agent.name}</span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.2em] ${
                          agent.status === "active" ? "text-success" : "text-muted"
                        }`}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] uppercase tracking-wider text-muted w-6">addr</span>
                        <a
                          href={`https://sepolia.basescan.org/address/${agent.mpWallet}`}
                          target="_blank"
                          rel="noopener"
                          className="text-foreground/60 hover:text-accent transition-colors"
                        >
                          {agent.mpWallet?.slice(0, 6)}…{agent.mpWallet?.slice(-4)}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] uppercase tracking-wider text-muted w-6">ows</span>
                        <span className="text-foreground/40">{agent.walletName}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between">
                      <span className="font-mono text-[10px] text-muted tabular-nums">
                        ${agent.spendToday.toFixed(2)} / ${agent.spendLimit}
                      </span>
                      <span className="font-mono text-[9px] text-muted/40">{agent.txCount} tx</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ─── */}
      <footer className="border-t border-card-border mt-auto relative z-10">
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-center justify-between font-mono text-[10px] text-muted">
          <span className="tracking-[0.1em] uppercase">Leash — Open Wallet Standard</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Socialure/leash"
              target="_blank"
              rel="noopener"
              className="hover:text-foreground transition-colors"
            >
              GitHub ↗
            </a>
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
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          status === "approved"
            ? "bg-success animate-pulse-dot"
            : status === "denied"
            ? "bg-danger"
            : "bg-warning"
        }`}
        style={{
          boxShadow: status === "approved"
            ? "0 0 5px var(--success)"
            : status === "denied"
            ? "0 0 5px var(--danger)"
            : "0 0 5px var(--warning)",
        }}
      />
      <span
        className={`font-mono text-[9px] uppercase tracking-[0.15em] ${
          status === "approved"
            ? "text-success"
            : status === "denied"
            ? "text-danger"
            : "text-warning"
        }`}
      >
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
  simResult: { approved: boolean; reason?: string; signature?: string } | null;
}) {
  const pct = agent.spendLimit > 0 ? (agent.spendToday / agent.spendLimit) * 100 : 0;

  return (
    <div className={`border-b border-card-border transition-all ${isSelected ? "bg-card" : ""}`}>
      {/* Main row */}
      <div
        className="px-6 py-4 flex items-center gap-4 cursor-pointer group hover:bg-card-hover transition-colors card-hover-glow"
        onClick={onSelect}
      >
        <div
          className={`w-1 h-1 rounded-full flex-shrink-0 ${
            agent.status === "active"
              ? "bg-success animate-pulse-dot"
              : agent.status === "paused"
              ? "bg-warning"
              : "bg-danger"
          }`}
        />

        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-medium leading-tight">{agent.name}</h3>
          <p className="text-[11px] text-muted mt-0.5 truncate">{agent.role}</p>
        </div>

        {/* Spend bar */}
        <div className="w-36 hidden sm:block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span
              className={`font-mono text-[11px] tabular-nums ${
                pct > 80 ? "text-danger" : ""
              }`}
            >
              ${agent.spendToday.toFixed(0)}
            </span>
            <span className="font-mono text-[10px] text-muted tabular-nums">${agent.spendLimit}</span>
          </div>
          <div className="h-[2px] bg-card-border w-full overflow-hidden rounded-full">
            <div
              className="h-full bar-animated bar-glow"
              style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor:
                  pct > 80
                    ? "var(--danger)"
                    : pct > 60
                    ? "var(--warning)"
                    : "var(--accent2)",
                color:
                  pct > 80
                    ? "var(--danger)"
                    : pct > 60
                    ? "var(--warning)"
                    : "var(--accent2)",
              }}
            />
          </div>
        </div>

        <span className="font-mono text-[10px] text-muted w-10 text-right tabular-nums">
          {agent.txCount}
          <span className="text-muted/40"> tx</span>
        </span>

        <span className="font-mono text-[10px] text-muted/30 group-hover:text-muted/60 transition-colors w-4 text-center">
          {isSelected ? "−" : "+"}
        </span>
      </div>

      {/* Expanded panel */}
      {isSelected && (
        <div className="px-6 pb-6 space-y-4 animate-fade-in border-t border-card-border bg-card">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.15em] border transition-colors ${
                agent.status === "active"
                  ? "border-warning/30 text-warning hover:bg-warning/5"
                  : "border-success/30 text-success hover:bg-success/5"
              }`}
            >
              {agent.status === "active" ? "Pause" : "Resume"}
            </button>
            <span className="text-card-border px-1 font-mono text-xs">|</span>
            <span className="font-mono text-[9px] text-muted uppercase tracking-[0.2em]">Limit</span>
            {[25, 50, 100, 250, 500, 1000].map((limit) => (
              <button
                key={limit}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLimit(limit);
                }}
                className={`px-2 py-1 font-mono text-[10px] transition-colors ${
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
          <div className="font-mono text-[10px] border border-card-border px-3 py-2.5 space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted/50 w-6">ows</span>
              <span className="text-foreground/60">{agent.walletName}</span>
              <span className="text-card-border">·</span>
              <span className="text-muted/40">{agent.walletId.slice(0, 16)}…</span>
            </div>
            {agent.mpWallet && (
              <div className="flex items-center gap-3">
                <span className="text-[9px] uppercase tracking-[0.15em] text-muted/50 w-6">mp</span>
                <a
                  href={`https://sepolia.basescan.org/address/${agent.mpWallet}`}
                  target="_blank"
                  rel="noopener"
                  className="text-accent hover:underline underline-offset-2"
                >
                  {agent.mpWallet.slice(0, 6)}…{agent.mpWallet.slice(-4)}
                </a>
                <span className="text-muted/40 text-[9px]">Base Sepolia</span>
              </div>
            )}
          </div>

          {/* Simulate */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted mb-2">Simulate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-card-border">
              <SimBtn
                label="Swap · Base"
                chain="eip155:8453"
                amount={15}
                action="Token swap"
                onSim={onSimulate}
                loading={simulating}
              />
              <SimBtn
                label="Bridge · ETH"
                chain="eip155:1"
                amount={50}
                action="Bridge transfer"
                onSim={onSimulate}
                loading={simulating}
              />
              <SimBtn
                label="BSC · Blocked"
                chain="eip155:56"
                amount={30}
                action="Swap attempt"
                onSim={onSimulate}
                loading={simulating}
                danger
              />
              <SimBtn
                label="Over Limit"
                chain="eip155:8453"
                amount={9999}
                action="Large transfer"
                onSim={onSimulate}
                loading={simulating}
                danger
              />
            </div>
          </div>

          {/* Sim result */}
          {simResult && (
            <div
              className={`px-3 py-2.5 border text-[12px] animate-fade-in ${
                simResult.approved
                  ? "border-success/20 bg-success/5"
                  : "border-danger/20 bg-danger/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.15em] font-medium ${
                    simResult.approved ? "text-success" : "text-danger"
                  }`}
                >
                  {simResult.approved ? "✓ Approved" : "✗ Denied"}
                </span>
                {simResult.reason && (
                  <span className="text-[11px] text-muted">— {simResult.reason}</span>
                )}
              </div>
              {simResult.signature && (
                <p className="font-mono text-[9px] text-muted/50 mt-1">sig: {simResult.signature}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SimBtn({
  label,
  chain,
  amount,
  action,
  onSim,
  loading,
  danger,
}: {
  label: string;
  chain: string;
  amount: number;
  action: string;
  onSim: (chain: string, amount: number, action: string) => void;
  loading: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSim(chain, amount, action);
      }}
      disabled={loading}
      className={`px-3 py-3 text-[10px] font-mono transition-colors disabled:opacity-30 text-left border-r border-card-border last:border-r-0 ${
        danger
          ? "text-danger/60 hover:text-danger hover:bg-danger/5"
          : "text-muted hover:text-foreground hover:bg-card-hover"
      }`}
    >
      <span className="block">{label}</span>
      <span className="block text-[9px] text-muted/50 mt-0.5">${amount}</span>
    </button>
  );
}

function AddAgentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
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
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-card-border p-8 w-full max-w-lg animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted mb-1">New</p>
            <h3 className="text-xl font-bold tracking-[-0.02em]">Register Agent</h3>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-muted hover:text-foreground text-lg transition-colors w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted block mb-2">
              Agent Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury Bot"
              className="w-full px-3 py-2.5 bg-card border border-card-border text-[13px] focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted block mb-2">
              Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Automated yield farming"
              className="w-full px-3 py-2.5 bg-card border border-card-border text-[13px] focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted block mb-2">
              Daily Spend Limit
            </label>
            <div className="flex border border-card-border">
              {[25, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`flex-1 py-2 font-mono text-[10px] transition-colors border-r border-card-border last:border-r-0 ${
                    limit === v
                      ? "bg-foreground text-background"
                      : "bg-card text-muted hover:text-foreground"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted block mb-2">
              Chain Policy
            </label>
            <div className="grid grid-cols-2 border border-card-border">
              {[
                { id: "conservative", label: "Conservative", sub: "ETH + Base" },
                { id: "defi-agent", label: "DeFi", sub: "ETH + L2s" },
                { id: "multi-chain", label: "Multi-Chain", sub: "EVM + Solana" },
                { id: "solana-only", label: "Solana", sub: "SOL only" },
              ].map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3 text-left transition-colors border-r border-b border-card-border ${
                    i % 2 === 1 ? "border-r-0" : ""
                  } ${i >= 2 ? "border-b-0" : ""} ${
                    preset === p.id
                      ? "bg-foreground text-background"
                      : "bg-card text-muted hover:text-foreground"
                  }`}
                >
                  <div className="text-[12px] font-medium">{p.label}</div>
                  <div className="font-mono text-[9px] mt-0.5 opacity-60">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex border border-card-border mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-muted text-[10px] font-mono uppercase tracking-[0.2em] hover:text-foreground transition-colors border-r border-card-border"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name || creating}
            className="flex-1 px-4 py-3 bg-foreground text-background text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-foreground/85 transition-colors disabled:opacity-30"
          >
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        <p className="font-mono text-[9px] text-muted text-center mt-4 tracking-[0.1em]">
          Creates OWS wallet · chain policy · scoped API key
        </p>
      </div>
    </div>
  );
}
