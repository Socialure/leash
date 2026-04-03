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

const CHAIN_DISPLAY: Record<string, { name: string; color: string; icon: string }> = {
  "eip155:1": { name: "Ethereum", color: "#627eea", icon: "Ξ" },
  "eip155:8453": { name: "Base", color: "#0052ff", icon: "B" },
  "eip155:10": { name: "Optimism", color: "#ff0420", icon: "O" },
  "eip155:42161": { name: "Arbitrum", color: "#28a0f0", icon: "A" },
  "eip155:137": { name: "Polygon", color: "#8247e5", icon: "P" },
  "eip155:56": { name: "BSC", color: "#f0b90b", icon: "₿" },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": { name: "Solana", color: "#14f195", icon: "S" },
  "cosmos:cosmoshub-4": { name: "Cosmos", color: "#6f7390", icon: "⚛" },
  system: { name: "System", color: "#63636e", icon: "⚙" },
};

function chainLabel(chain: string) {
  return CHAIN_DISPLAY[chain]?.name || chain;
}
function chainColor(chain: string) {
  return CHAIN_DISPLAY[chain]?.color || "#63636e";
}
function chainIcon(chain: string) {
  return CHAIN_DISPLAY[chain]?.icon || "•";
}

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

  const simulateTx = async (
    agentId: string,
    chain: string,
    amount: number,
    action: string,
  ) => {
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <span className="text-muted text-sm">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-card-border/50 bg-background/80 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <span className="text-lg">🐕</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none">
                Leash
              </h1>
              <p className="text-[11px] text-muted mt-0.5">
                Agent Spend Governance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener"
              className="text-[11px] text-muted hover:text-foreground/70 transition-colors hidden sm:block"
            >
              Powered by OWS
            </a>
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium rounded-lg transition-all border border-accent/20 hover:border-accent/30"
            >
              + Add Agent
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Active Agents"
            value={activeCount.toString()}
            sub={`${agents.length} total registered`}
            icon="◉"
            iconColor="#a78bfa"
          />
          <StatCard
            label="Spend Today"
            value={`$${totalSpend.toFixed(0)}`}
            sub={`${spendPct.toFixed(0)}% of $${totalLimit.toFixed(0)} limit`}
            icon="↗"
            iconColor="#34d399"
            barPct={spendPct}
            barColor={spendPct > 80 ? "#ef4444" : spendPct > 60 ? "#fbbf24" : "#34d399"}
          />
          <StatCard
            label="Transactions"
            value={totalTx.toString()}
            sub="across all agents"
            icon="⟐"
            iconColor="#38bdf8"
          />
          <StatCard
            label="Blocked"
            value={deniedCount.toString()}
            sub="policy violations"
            icon="⊘"
            iconColor={deniedCount > 0 ? "#ef4444" : "#63636e"}
            danger={deniedCount > 0}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agents Column */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
                Agents
              </h2>
              <span className="text-xs text-muted/60">
                {activeCount} active · {agents.length - activeCount} paused
              </span>
            </div>
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent === agent.id}
                onSelect={() =>
                  setSelectedAgent(
                    selectedAgent === agent.id ? null : agent.id,
                  )
                }
                onToggle={() => toggleAgent(agent.id, agent.status)}
                onUpdateLimit={(v) => updateLimit(agent.id, v)}
                onSimulate={(chain, amount, action) =>
                  simulateTx(agent.id, chain, amount, action)
                }
                simulating={simulating && selectedAgent === agent.id}
                simResult={selectedAgent === agent.id ? simResult : null}
              />
            ))}
          </div>

          {/* Activity Feed */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider">
                Activity
              </h2>
              <span className="text-xs text-muted/60">
                {activity.length} events
              </span>
            </div>
            <div className="bg-card/50 border border-card-border rounded-xl overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto divide-y divide-card-border/50">
                {activity.length === 0 ? (
                  <p className="text-muted text-sm text-center py-12">
                    No activity yet
                  </p>
                ) : (
                  activity.map((log) => (
                    <div
                      key={log.id}
                      className="px-4 py-3 hover:bg-card-hover/30 transition-colors animate-fade-in"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate">
                              {log.agentName}
                            </span>
                            <span className="text-muted/40">·</span>
                            <span className="text-xs text-muted truncate">
                              {log.action}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {log.chain !== "system" && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  color: chainColor(log.chain),
                                  backgroundColor:
                                    chainColor(log.chain) + "10",
                                }}
                              >
                                {chainIcon(log.chain)} {chainLabel(log.chain)}
                              </span>
                            )}
                            {log.amount > 0 && (
                              <span className="text-[10px] text-muted font-mono">
                                ${log.amount.toFixed(2)}
                              </span>
                            )}
                            <span className="text-[10px] text-muted/50">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={log.status} />
                      </div>
                      {log.reason && (
                        <p className="text-[10px] text-danger/70 mt-1.5 pl-0">
                          ↳ {log.reason}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 mt-4">
        <div className="gradient-line mb-8" />
        <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-6 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "01",
              title: "Register Agent",
              desc: "Create an OWS wallet, chain policy, and scoped API key for each AI agent.",
              icon: "🔐",
            },
            {
              step: "02",
              title: "Set Policies",
              desc: "Define chain allowlists and daily spend limits. Agents can only transact within bounds.",
              icon: "📋",
            },
            {
              step: "03",
              title: "Agent Transacts",
              desc: "Agent submits a spend request. Policy engine checks chain + limit before signing.",
              icon: "⚡",
            },
            {
              step: "04",
              title: "Audit & Monitor",
              desc: "Every approve/deny is logged. Real-time activity feed with full audit trail.",
              icon: "📊",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="bg-card/40 border border-card-border/50 rounded-xl p-5 hover:border-card-border/80 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-[10px] font-mono text-accent/40 group-hover:text-accent/60 transition-colors">
                  {s.step}
                </span>
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{s.title}</h3>
              <p className="text-xs text-muted/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* OWS Integration Badge */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 bg-card/40 border border-card-border/50 rounded-xl px-5 py-3">
            <span className="text-[11px] text-muted/50">Powered by</span>
            <span className="text-sm font-semibold text-foreground/80">Open Wallet Standard</span>
            <span className="text-[10px] text-muted/40 font-mono">@open-wallet-standard/core</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-muted/30">
            <span className="px-2 py-1 bg-card/30 rounded border border-card-border/30">createWallet()</span>
            <span className="px-2 py-1 bg-card/30 rounded border border-card-border/30">createPolicy()</span>
            <span className="px-2 py-1 bg-card/30 rounded border border-card-border/30">createApiKey()</span>
            <span className="px-2 py-1 bg-card/30 rounded border border-card-border/30">signMessage()</span>
            <span className="px-2 py-1 bg-card/30 rounded border border-card-border/30">listWallets()</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border/30 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-muted/50">
          <span>
            Built with{" "}
            <a
              href="https://openwallet.sh"
              target="_blank"
              rel="noopener"
              className="text-accent/50 hover:text-accent transition-colors"
            >
              Open Wallet Standard
            </a>
          </span>
          <span>OWS Hackathon 2026</span>
        </div>
      </footer>

      {showAddAgent && (
        <AddAgentModal
          onClose={() => setShowAddAgent(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}

/* ──────────── Components ──────────── */

function StatusBadge({ status }: { status: string }) {
  const config = {
    approved: { bg: "bg-success/8", text: "text-success", dot: "bg-success" },
    denied: { bg: "bg-danger/8", text: "text-danger", dot: "bg-danger" },
    pending: { bg: "bg-warning/8", text: "text-warning", dot: "bg-warning" },
  }[status] || { bg: "bg-muted/8", text: "text-muted", dot: "bg-muted" };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${config.dot} ${status === "denied" ? "" : "animate-pulse-dot"}`}
      />
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  iconColor,
  danger,
  barPct,
  barColor,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
  iconColor: string;
  danger?: boolean;
  barPct?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-card/60 border border-card-border rounded-xl p-4 relative overflow-hidden group hover:border-card-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <p className="text-[11px] text-muted uppercase tracking-wider font-medium">
          {label}
        </p>
        <span
          className="text-sm opacity-40 group-hover:opacity-60 transition-opacity"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
      </div>
      <p
        className={`text-2xl font-bold mt-2 tracking-tight ${danger ? "text-danger" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted/70 mt-1">{sub}</p>
      {barPct !== undefined && (
        <div className="mt-3 h-1 bg-card-border/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(barPct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      )}
    </div>
  );
}

function AgentCard({
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
  simResult: {
    approved: boolean;
    reason?: string;
    signature?: string;
  } | null;
}) {
  const pct =
    agent.spendLimit > 0 ? (agent.spendToday / agent.spendLimit) * 100 : 0;
  const barColor =
    pct > 90 ? "#ef4444" : pct > 70 ? "#fbbf24" : agent.color;

  return (
    <div
      className={`bg-card/60 border rounded-xl transition-all ${
        isSelected
          ? "border-accent/30 glow-accent"
          : "border-card-border hover:border-card-border/80"
      }`}
    >
      {/* Main Row */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer"
        onClick={onSelect}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border"
          style={{
            backgroundColor: agent.color + "08",
            borderColor: agent.color + "20",
          }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                agent.status === "active"
                  ? "bg-success/8 text-success"
                  : agent.status === "paused"
                    ? "bg-warning/8 text-warning"
                    : "bg-danger/8 text-danger"
              }`}
            >
              <span
                className={`w-1 h-1 rounded-full ${
                  agent.status === "active"
                    ? "bg-success animate-pulse-dot"
                    : agent.status === "paused"
                      ? "bg-warning"
                      : "bg-danger"
                }`}
              />
              {agent.status}
            </span>
          </div>
          <p className="text-xs text-muted/70 mt-0.5">{agent.role}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-mono tabular-nums">
            <span style={{ color: barColor }}>
              ${agent.spendToday.toFixed(0)}
            </span>
            <span className="text-muted/40"> / </span>
            <span className="text-muted/60">${agent.spendLimit}</span>
          </p>
          <p className="text-[11px] text-muted/50 mt-0.5">
            {agent.txCount} txns
          </p>
        </div>
      </div>

      {/* Spend Bar */}
      <div className="px-4 pb-3">
        <div className="h-1 bg-card-border/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      </div>

      {/* Expanded Panel */}
      {isSelected && (
        <div className="border-t border-card-border/50 p-4 space-y-4 animate-fade-in">
          {/* Controls Row */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                agent.status === "active"
                  ? "bg-warning/5 text-warning border-warning/20 hover:bg-warning/10"
                  : "bg-success/5 text-success border-success/20 hover:bg-success/10"
              }`}
            >
              {agent.status === "active" ? "⏸ Pause" : "▶ Resume"}
            </button>
            <div className="h-7 w-px bg-card-border/50" />
            {[25, 50, 100, 250, 500, 1000].map((limit) => (
              <button
                key={limit}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLimit(limit);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  agent.spendLimit === limit
                    ? "bg-accent/10 text-accent border border-accent/25"
                    : "text-muted/60 hover:text-muted border border-transparent hover:border-card-border"
                }`}
              >
                ${limit}
              </button>
            ))}
          </div>

          {/* Wallet Info */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted/50 bg-surface/50 rounded-lg px-3 py-2 border border-card-border/30">
            <span className="text-muted/30">wallet</span>
            <span className="text-foreground/40">{agent.walletName}</span>
            <span className="text-muted/20">|</span>
            <span className="text-muted/30">id</span>
            <span className="text-foreground/40">
              {agent.walletId.slice(0, 12)}...
            </span>
          </div>

          {/* Simulate Transaction */}
          <div>
            <p className="text-[11px] text-muted/60 mb-2 font-medium uppercase tracking-wider">
              Simulate Transaction
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SimButton
                label="Swap on Base"
                chain="eip155:8453"
                amount={15}
                action="Token swap"
                onSim={onSimulate}
                loading={simulating}
              />
              <SimButton
                label="Bridge to ETH"
                chain="eip155:1"
                amount={50}
                action="Bridge transfer"
                onSim={onSimulate}
                loading={simulating}
              />
              <SimButton
                label="BSC (blocked)"
                chain="eip155:56"
                amount={30}
                action="Swap attempt"
                onSim={onSimulate}
                loading={simulating}
                danger
              />
              <SimButton
                label="Over limit"
                chain="eip155:8453"
                amount={9999}
                action="Large transfer"
                onSim={onSimulate}
                loading={simulating}
                danger
              />
            </div>
          </div>

          {/* Sim Result */}
          {simResult && (
            <div
              className={`p-3 rounded-lg text-sm animate-fade-in border ${
                simResult.approved
                  ? "bg-success/5 border-success/15"
                  : "bg-danger/5 border-danger/15"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${simResult.approved ? "text-success" : "text-danger"}`}
                >
                  {simResult.approved ? "✓ Approved" : "✗ Denied"}
                </span>
                {simResult.reason && (
                  <span className="text-xs text-muted/60">
                    — {simResult.reason}
                  </span>
                )}
              </div>
              {simResult.signature && (
                <p className="text-[10px] text-muted/40 font-mono mt-1.5">
                  sig: {simResult.signature}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SimButton({
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
      className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 border ${
        danger
          ? "bg-danger/3 text-danger/80 hover:bg-danger/8 border-danger/15 hover:border-danger/25"
          : "bg-card-border/20 text-foreground/60 hover:text-foreground/80 hover:bg-card-border/40 border-card-border/30"
      }`}
    >
      <span className="block">{label}</span>
      <span className="block text-[10px] text-muted/50 mt-0.5 font-mono">
        ${amount}
      </span>
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
      body: JSON.stringify({
        name,
        role,
        spendLimit: limit,
        policyPreset: preset,
      }),
    });
    setCreating(false);
    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 glass flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold">Register Agent</h3>
          <button
            onClick={onClose}
            className="text-muted/40 hover:text-muted text-lg transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted uppercase tracking-wider font-medium">
              Agent Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury Bot"
              className="w-full mt-1.5 px-3 py-2.5 bg-surface border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted uppercase tracking-wider font-medium">
              Role / Description
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Automated yield farming"
              className="w-full mt-1.5 px-3 py-2.5 bg-surface border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/10 transition-all placeholder:text-muted/30"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted uppercase tracking-wider font-medium">
              Daily Spend Limit
            </label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {[25, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    limit === v
                      ? "bg-accent/10 text-accent border border-accent/25"
                      : "text-muted/50 border border-card-border/50 hover:border-card-border"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted uppercase tracking-wider font-medium">
              Chain Policy
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                {
                  id: "conservative",
                  label: "Conservative",
                  sub: "ETH + Base only",
                  icon: "🛡️",
                },
                {
                  id: "defi-agent",
                  label: "DeFi",
                  sub: "ETH + all L2s",
                  icon: "📊",
                },
                {
                  id: "multi-chain",
                  label: "Multi-Chain",
                  sub: "EVM + Solana",
                  icon: "🌐",
                },
                {
                  id: "solana-only",
                  label: "Solana Only",
                  sub: "Solana ecosystem",
                  icon: "☀️",
                },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    preset === p.id
                      ? "bg-accent/5 border-accent/25 text-accent"
                      : "bg-surface/30 border-card-border/50 text-muted/70 hover:text-foreground/70 hover:border-card-border"
                  }`}
                >
                  <div className="text-xs font-medium flex items-center gap-1.5">
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </div>
                  <div className="text-[10px] opacity-50 mt-0.5">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-muted/60 hover:text-muted rounded-lg text-xs font-medium transition-colors border border-card-border/30 hover:border-card-border"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name || creating}
            className="flex-1 px-4 py-2.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-xs font-medium transition-all disabled:opacity-30 border border-accent/20 hover:border-accent/30"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-accent/30 border-t-accent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Agent"
            )}
          </button>
        </div>

        <p className="text-[10px] text-muted/30 text-center mt-3">
          Creates an OWS wallet + spend policy + API key
        </p>
      </div>
    </div>
  );
}
