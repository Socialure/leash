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

const CHAIN_DISPLAY: Record<string, { name: string; color: string }> = {
  "eip155:1": { name: "Ethereum", color: "#627eea" },
  "eip155:8453": { name: "Base", color: "#0052ff" },
  "eip155:10": { name: "Optimism", color: "#ff0420" },
  "eip155:42161": { name: "Arbitrum", color: "#28a0f0" },
  "eip155:137": { name: "Polygon", color: "#8247e5" },
  "eip155:56": { name: "BSC", color: "#f0b90b" },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": { name: "Solana", color: "#14f195" },
  "cosmos:cosmoshub-4": { name: "Cosmos", color: "#6f7390" },
  system: { name: "System", color: "#71717a" },
};

function chainLabel(chain: string) {
  return CHAIN_DISPLAY[chain]?.name || chain;
}
function chainColor(chain: string) {
  return CHAIN_DISPLAY[chain]?.color || "#71717a";
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [simResult, setSimResult] = useState<{ approved: boolean; reason?: string; signature?: string } | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-4xl">🐕</span>
              <span>Leash</span>
            </h1>
            <p className="text-muted mt-1 text-sm">
              AI Agent Spend Governance — powered by{" "}
              <a href="https://openwallet.sh" target="_blank" className="text-accent hover:underline">
                Open Wallet Standard
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddAgent(true)}
              className="px-4 py-2 bg-accent-dim hover:bg-accent text-white text-sm rounded-lg transition-colors"
            >
              + Add Agent
            </button>
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Agents" value={agents.filter((a) => a.status === "active").length.toString()} sub={`${agents.length} total`} />
        <StatCard
          label="Spend Today"
          value={`$${totalSpend.toFixed(0)}`}
          sub={`of $${totalLimit.toFixed(0)} limit`}
          accent
        />
        <StatCard label="Transactions" value={totalTx.toString()} sub="all agents" />
        <StatCard label="Blocked" value={deniedCount.toString()} sub="policy violations" danger={deniedCount > 0} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80 mb-2">Agents</h2>
          {agents.map((agent) => (
            <AgentCard
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

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-semibold text-foreground/80 mb-2">Activity Feed</h2>
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-muted text-sm text-center py-8">No activity yet</p>
            ) : (
              activity.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border text-sm animate-fade-in ${
                    log.status === "denied"
                      ? "bg-danger/5 border-danger/20"
                      : log.status === "approved"
                      ? "bg-card border-card-border"
                      : "bg-warning/5 border-warning/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{log.agentName}</span>
                      <span className="text-muted mx-1">·</span>
                      <span className="text-muted">{log.action}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        log.status === "approved"
                          ? "bg-success/10 text-success"
                          : log.status === "denied"
                          ? "bg-danger/10 text-danger"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    {log.chain !== "system" && (
                      <span style={{ color: chainColor(log.chain) }}>{chainLabel(log.chain)}</span>
                    )}
                    {log.amount > 0 && <span>${log.amount.toFixed(2)}</span>}
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {log.reason && (
                    <p className="text-xs text-danger/80 mt-1">{log.reason}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgent && <AddAgentModal onClose={() => setShowAddAgent(false)} onCreated={fetchData} />}
    </div>
  );
}

function StatCard({ label, value, sub, accent, danger }: { label: string; value: string; sub: string; accent?: boolean; danger?: boolean }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : danger ? "text-danger" : "text-foreground"}`}>
        {value}
      </p>
      <p className="text-xs text-muted mt-0.5">{sub}</p>
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
  simResult: { approved: boolean; reason?: string; signature?: string } | null;
}) {
  const pct = agent.spendLimit > 0 ? (agent.spendToday / agent.spendLimit) * 100 : 0;
  const barColor = pct > 90 ? "#f87171" : pct > 70 ? "#fbbf24" : agent.color;

  return (
    <div
      className={`bg-card border rounded-xl transition-all cursor-pointer ${
        isSelected ? "border-accent/50 ring-1 ring-accent/20" : "border-card-border hover:border-card-border/80"
      }`}
    >
      {/* Main Row */}
      <div className="p-4 flex items-center gap-4" onClick={onSelect}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: agent.color + "20" }}
        >
          {agent.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                agent.status === "active"
                  ? "bg-success/10 text-success"
                  : agent.status === "paused"
                  ? "bg-warning/10 text-warning"
                  : "bg-danger/10 text-danger"
              }`}
            >
              {agent.status}
            </span>
          </div>
          <p className="text-xs text-muted">{agent.role}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-mono">
            <span style={{ color: barColor }}>${agent.spendToday.toFixed(0)}</span>
            <span className="text-muted"> / ${agent.spendLimit}</span>
          </p>
          <p className="text-xs text-muted">{agent.txCount} txns</p>
        </div>
      </div>

      {/* Spend Bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Expanded Panel */}
      {isSelected && (
        <div className="border-t border-card-border p-4 space-y-4 animate-fade-in">
          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                agent.status === "active"
                  ? "bg-warning/10 text-warning hover:bg-warning/20"
                  : "bg-success/10 text-success hover:bg-success/20"
              }`}
            >
              {agent.status === "active" ? "⏸ Pause" : "▶ Resume"}
            </button>
            {[25, 50, 100, 250, 500, 1000].map((limit) => (
              <button
                key={limit}
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateLimit(limit);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  agent.spendLimit === limit
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-card-border/50 text-muted hover:text-foreground"
                }`}
              >
                ${limit}
              </button>
            ))}
          </div>

          {/* Wallet Info */}
          <div className="text-xs text-muted font-mono bg-background/50 rounded-lg p-2">
            <span className="text-foreground/50">wallet:</span> {agent.walletName}
            <span className="mx-2 text-foreground/20">|</span>
            <span className="text-foreground/50">id:</span> {agent.walletId.slice(0, 8)}...
          </div>

          {/* Simulate Transaction */}
          <div>
            <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Simulate Transaction</p>
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
              className={`p-3 rounded-lg text-sm animate-fade-in ${
                simResult.approved ? "bg-success/10 border border-success/20" : "bg-danger/10 border border-danger/20"
              }`}
            >
              <span className={simResult.approved ? "text-success" : "text-danger"}>
                {simResult.approved ? "✓ Approved" : "✗ Denied"}
              </span>
              {simResult.reason && <span className="text-muted ml-2">— {simResult.reason}</span>}
              {simResult.signature && (
                <p className="text-xs text-muted font-mono mt-1">sig: {simResult.signature}</p>
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
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        danger
          ? "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
          : "bg-card-border/50 text-foreground/70 hover:text-foreground hover:bg-card-border"
      }`}
    >
      {label}
      <span className="block text-[10px] text-muted">${amount}</span>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Add New Agent</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Treasury Bot"
              className="w-full mt-1 px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Role</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Automated yield farming"
              className="w-full mt-1 px-3 py-2 bg-background border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Daily Spend Limit</label>
            <div className="flex gap-2 mt-1">
              {[25, 50, 100, 250, 500, 1000].map((v) => (
                <button
                  key={v}
                  onClick={() => setLimit(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                    limit === v ? "bg-accent/20 text-accent border border-accent/30" : "bg-card-border/50 text-muted"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Chain Policy</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { id: "conservative", label: "🛡️ Conservative", sub: "ETH + Base" },
                { id: "defi-agent", label: "📊 DeFi", sub: "ETH + L2s" },
                { id: "multi-chain", label: "🌐 Multi-Chain", sub: "EVM + Solana" },
                { id: "solana-only", label: "☀️ Solana Only", sub: "Solana" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`p-2 rounded-lg text-left text-xs ${
                    preset === p.id
                      ? "bg-accent/10 border border-accent/30 text-accent"
                      : "bg-card-border/30 border border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-[10px] opacity-60">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-card-border/50 text-muted rounded-lg text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name || creating}
            className="flex-1 px-4 py-2 bg-accent-dim hover:bg-accent text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Agent"}
          </button>
        </div>

        <p className="text-[10px] text-muted text-center mt-3">
          Creates an OWS wallet + policy + API key for this agent
        </p>
      </div>
    </div>
  );
}
