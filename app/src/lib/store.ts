// In-memory store for demo state (persists across API calls within the same server session)
import type { AgentProfile } from "./ows";

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

interface DemoState {
  agents: AgentProfile[];
  activityLog: ActivityLog[];
  initialized: boolean;
}

// Global singleton
const globalStore = globalThis as unknown as { __leashStore?: DemoState };

export function getStore(): DemoState {
  if (!globalStore.__leashStore) {
    globalStore.__leashStore = {
      agents: [],
      activityLog: [],
      initialized: false,
    };
  }
  return globalStore.__leashStore;
}

export function addActivity(log: Omit<ActivityLog, "id" | "timestamp">) {
  const store = getStore();
  store.activityLog.unshift({
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });
  // Keep last 100
  if (store.activityLog.length > 100) store.activityLog.length = 100;
}

export type { ActivityLog, DemoState };
