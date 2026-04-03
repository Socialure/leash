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

  const totalSpend = agents.reduce((s, a) => s + a.spendToday, 0);
  const totalLimit = agents.reduce((s, a) => s + a.spendLimit, 0);
  const totalTx = agents.reduce((s, a) => s + a.txCount, 0);
  const deniedCount = activity.filter((a) => a.status === "denied").length;
  const activeCount = agents.filter((a) => a.status === "active").length;
  const spendPct = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-sm text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header ─── */}
      <header className="border-b border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-none">
              Leash
            </h1>
            <p className="text-xs text-muted mt-1 font-mono uppercase tracking-widest">
              Agent Spend Governance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener"
              className="text-xs text-muted hover:text-foreground transition-colors font-mono hidden sm:block"
            >
              OWS
            </a>
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-4 py-2 bg-foreground text-background text-xs font-medium rounded hover:bg-foreground/90 transition-colors"
            >
              + Add Agent
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-4 gap-px bg-card-border mb-10">
          <StatCell label="Active" value={activeCount.toString()} detail={`${agents.length} total`} />
          <StatCell
            label="Spend Today"
            value={`$${totalSpend.toFixed(0)}`}
            detail={`${spendPct.toFixed(0)}% of $${totalLimit.toFixed(0)}`}
            barPct={spendPct}
          />
          <StatCell label="Transactions" value={totalTx.toString()} detail="all agents" />
          <StatCell label="Blocked" value={deniedCount.toString()} detail="policy violations" danger={deniedCount > 0} />
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          {/* Agents */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
                Agents
              </h2>
              <span className="font-mono text-xs text-muted">
                {activeCount}/{agents.length}
              </span>
            </div>
            <div className="space-y-0 border-t border-card-border">
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

          {/* Activity Log */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
                Activity Log
              </h2>
              <span className="font-mono text-xs text-muted">{activity.length}</span>
            </div>
            <div className="border-t border-card-border">
              {activity.length === 0 ? (
                <p className="text-muted text-sm py-12 text-center">No activity yet</p>
              ) : (
                activity.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 border-b border-card-border/60 animate-fade-in"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.agentName}</span>
                          <span className="text-muted">·</span>
                          <span className="text-sm text-muted">{log.action}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {log.chain !== "system" && (
                            <span className="font-mono text-xs text-muted">
                              {CHAINS[log.chain]?.abbr || log.chain}
                            </span>
                          )}
                          {log.amount > 0 && (
                            <span className="font-mono text-xs text-muted">
                              ${log.amount.toFixed(2)}
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted/50">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <StatusTag status={log.status} />
                    </div>
                    {log.reason && (
                      <p className="text-xs text-danger mt-1.5 font-mono">
                        {log.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Architecture Section ─── */}
      <section className="border-t border-card-border mt-16">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted mb-10 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-4 gap-px bg-card-border">
            {[
              { step: "01", title: "Register", desc: "Create an OWS wallet, assign a chain policy and scoped API key for each AI agent." },
              { step: "02", title: "Policy", desc: "Define chain allowlists and daily spend limits. Agents can only transact within bounds." },
              { step: "03", title: "Transact", desc: "Agent submits a spend request. Policy engine validates chain + limit before signing." },
              { step: "04", title: "Audit", desc: "Every approve/deny is logged. Real-time activity feed with full audit trail." },
            ].map((s) => (
              <div key={s.step} className="bg-card p-6">
                <span className="font-mono text-xs text-muted">{s.step}</span>
                <h3 className="text-lg font-bold mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 font-mono text-xs text-muted">
              <span>@open-wallet-standard/core</span>
              <span className="text-card-border">|</span>
              <span>Zerion API</span>
              <span className="text-card-border">|</span>
              <span>Next.js</span>
              <span className="text-card-border">|</span>
              <span>Base Sepolia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-card-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between font-mono text-xs text-muted">
          <span>Leash — Built with Open Wallet Standard</span>
          <span>OWS Hackathon 2026</span>
        </div>
      </footer>

      {showAddAgent && (
        <AddAgentModal onClose={() => setShowAddAgent(false)} onCreated={fetchData} />
      )}
    </div>
  );
}

/* ──────────── Components ──────────── */

function StatusTag({ status }: { status: string }) {
  const styles = {
    approved: "text-success",
    denied: "text-danger",
    pending: "text-warning",
  }[status] || "text-muted";

  return (
    <span className={`font-mono text-xs uppercase tracking-wider ${styles}`}>
      {status === "approved" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse-dot" />
      )}
      {status === "denied" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-danger mr-1.5" />
      )}
      {status}
    </span>
  );
}

function StatCell({
  label,
  value,
  detail,
  danger,
  barPct,
}: {
  label: string;
  value: string;
  detail: string;
  danger?: boolean;
  barPct?: number;
}) {
  return (
    <div className="bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">{label}</p>
      <p className={`text-3xl font-bold tracking-tight tabular-nums ${danger ? "text-danger" : ""}`}>
        {value}
      </p>
      <p className="font-mono text-xs text-muted mt-1">{detail}</p>
      {barPct !== undefined && (
        <div className="mt-3 h-0.5 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(barPct, 100)}%`,
              backgroundColor: barPct > 80 ? "var(--danger)" : barPct > 60 ? "var(--warning)" : "var(--success)",
            }}
          />
        </div>
      )}
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
    <div className={`border-b border-card-border ${isSelected ? "bg-surface" : ""}`}>
      {/* Main Row */}
      <div className="py-4 flex items-center gap-5 cursor-pointer group" onClick={onSelect}>
        {/* Name Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold">{agent.name}</h3>
            <span className={`font-mono text-[10px] uppercase tracking-wider ${
              agent.status === "active" ? "text-success" : agent.status === "paused" ? "text-warning" : "text-danger"
            }`}>
              {agent.status === "active" && <span className="inline-block w-1 h-1 rounded-full bg-success mr-1 animate-pulse-dot" />}
              {agent.status}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">{agent.role}</p>
        </div>

        {/* Spend Column */}
        <div className="text-right w-40">
          <p className="font-mono text-sm tabular-nums">
            <span className={pct > 80 ? "text-danger" : ""}>${agent.spendToday.toFixed(0)}</span>
            <span className="text-muted/40"> / </span>
            <span className="text-muted">${agent.spendLimit}</span>
          </p>
          <div className="mt-1.5 h-0.5 bg-card-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: pct > 80 ? "var(--danger)" : pct > 60 ? "var(--warning)" : "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* Tx Count */}
        <div className="w-16 text-right">
          <span className="font-mono text-xs text-muted">{agent.txCount} tx</span>
        </div>

        {/* Arrow */}
        <span className="text-muted/40 group-hover:text-muted transition-colors text-xs">
          {isSelected ? "−" : "+"}
        </span>
      </div>

      {/* Expanded Panel */}
      {isSelected && (
        <div className="pb-5 px-0 space-y-5 animate-fade-in">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                agent.status === "active"
                  ? "border-warning text-warning hover:bg-warning/5"
                  : "border-success text-success hover:bg-success/5"
              }`}
            >
              {agent.status === "active" ? "Pause" : "Resume"}
            </button>
            <span className="text-card-border">|</span>
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest">Limit:</span>
            {[25, 50, 100, 250, 500, 1000].map((limit) => (
              <button
                key={limit}
                onClick={(e) => { e.stopPropagation(); onUpdateLimit(limit); }}
                className={`px-2 py-1 font-mono text-xs transition-colors ${
                  agent.spendLimit === limit
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                ${limit}
              </button>
            ))}
          </div>

          {/* Wallet */}
          <div className="font-mono text-xs text-muted bg-surface py-3 px-3 border border-card-border space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="uppercase tracking-widest text-[10px] w-10">OWS</span>
              <span className="text-foreground">{agent.walletName}</span>
              <span className="text-card-border">·</span>
              <span className="text-[10px]">{agent.walletId.slice(0, 16)}...</span>
            </div>
            {agent.mpWallet && (
              <div className="flex items-center gap-3">
                <span className="uppercase tracking-widest text-[10px] w-10">MP</span>
                <a
                  href={`https://sepolia.basescan.org/address/${agent.mpWallet}`}
                  target="_blank"
                  rel="noopener"
                  className="text-accent hover:underline"
                >
                  {agent.mpWallet.slice(0, 6)}...{agent.mpWallet.slice(-4)}
                </a>
                <span className="text-[10px] text-muted/50">Base Sepolia</span>
              </div>
            )}
          </div>

          {/* Simulate */}
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-3">
              Simulate Transaction
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SimBtn label="Swap on Base" chain="eip155:8453" amount={15} action="Token swap" onSim={onSimulate} loading={simulating} />
              <SimBtn label="Bridge to ETH" chain="eip155:1" amount={50} action="Bridge transfer" onSim={onSimulate} loading={simulating} />
              <SimBtn label="BSC (blocked)" chain="eip155:56" amount={30} action="Swap attempt" onSim={onSimulate} loading={simulating} danger />
              <SimBtn label="Over limit" chain="eip155:8453" amount={9999} action="Large transfer" onSim={onSimulate} loading={simulating} danger />
            </div>
          </div>

          {/* Result */}
          {simResult && (
            <div className={`p-3 border text-sm animate-fade-in ${
              simResult.approved ? "border-success bg-success/5" : "border-danger bg-danger/5"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs uppercase tracking-wider ${simResult.approved ? "text-success" : "text-danger"}`}>
                  {simResult.approved ? "Approved" : "Denied"}
                </span>
                {simResult.reason && <span className="text-xs text-muted">— {simResult.reason}</span>}
              </div>
              {simResult.signature && (
                <p className="font-mono text-[10px] text-muted mt-1">sig: {simResult.signature}</p>
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
      className={`px-3 py-2.5 text-xs font-mono border transition-colors disabled:opacity-30 text-left ${
        danger
          ? "border-danger/30 text-danger hover:bg-danger/5"
          : "border-card-border text-foreground hover:bg-surface"
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-card border border-card-border p-8 w-full max-w-lg animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Register Agent</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-lg transition-colors">×</button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-2">Agent Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury Bot"
              className="w-full px-3 py-2.5 bg-background border border-card-border text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted/40"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-2">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Automated yield farming"
              className="w-full px-3 py-2.5 bg-background border border-card-border text-sm focus:outline-none focus:border-foreground transition-colors placeholder:text-muted/40"
            />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-2">Daily Spend Limit</label>
            <div className="flex gap-2">
              {[25, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                    limit === v ? "bg-foreground text-background" : "text-muted border border-card-border hover:text-foreground"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-2">Chain Policy</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "conservative", label: "Conservative", sub: "ETH + Base only" },
                { id: "defi-agent", label: "DeFi", sub: "ETH + all L2s" },
                { id: "multi-chain", label: "Multi-Chain", sub: "EVM + Solana" },
                { id: "solana-only", label: "Solana Only", sub: "Solana ecosystem" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3 text-left border transition-colors ${
                    preset === p.id
                      ? "border-foreground bg-surface"
                      : "border-card-border text-muted hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  <div className="text-xs font-medium">{p.label}</div>
                  <div className="font-mono text-[10px] text-muted mt-0.5">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-muted border border-card-border text-xs font-mono uppercase tracking-wider hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name || creating}
            className="flex-1 px-4 py-2.5 bg-foreground text-background text-xs font-mono uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-30"
          >
            {creating ? "Creating..." : "Create Agent"}
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted text-center mt-4">
          Creates OWS wallet + chain policy + scoped API key
        </p>
      </div>
    </div>
  );
}
