// OWS SDK wrapper — all wallet/policy/key operations go through here
// Falls back to in-memory mock if native module is unavailable (e.g., Render Linux)

import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Ensure ~/.ows/wallets/ exists before first SDK call
function ensureOwsHome() {
  try {
    mkdirSync(join(homedir(), ".ows", "wallets"), { recursive: true });
  } catch {
    // ignore — may be read-only, will use mock fallback
  }
}

export interface WalletInfo {
  id: string;
  name: string;
  accounts: Array<{
    chainId: string;
    address: string;
    derivationPath: string;
  }>;
  createdAt?: string;
}

export interface ApiKeyResult {
  id: string;
  name: string;
  token: string;
  walletIds: string[];
  policyIds: string[];
  createdAt?: string;
}

export interface PolicyInfo {
  id: string;
  name: string;
  rules: Array<{
    type: string;
    chain_ids?: string[];
    vendors?: string[];
  }>;
  version: number;
  action?: string;
}

// ─── In-memory mock (used when native module unavailable) ───
const mockWallets = new Map<string, WalletInfo>();
const mockPolicies = new Map<string, PolicyInfo>();
const mockApiKeys = new Map<string, ApiKeyResult>();

function mockCreateWallet(name: string): WalletInfo {
  const existing = Array.from(mockWallets.values()).find(w => w.name === name);
  if (existing) return existing;
  const addr = `0x${Math.random().toString(16).slice(2, 42).padEnd(40, '0')}`;
  const wallet: WalletInfo = {
    id: `wallet-${name}-${Date.now()}`,
    name,
    accounts: [
      { chainId: "eip155:1", address: addr, derivationPath: "m/44'/60'/0'/0/0" },
      { chainId: "eip155:8453", address: addr, derivationPath: "m/44'/60'/0'/0/0" },
      { chainId: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", address: `mock${Math.random().toString(36).slice(2, 16)}`, derivationPath: "m/44'/501'/0'/0'" },
    ],
    createdAt: new Date().toISOString(),
  };
  mockWallets.set(wallet.id, wallet);
  return wallet;
}

function mockGetWallet(nameOrId: string): WalletInfo {
  const byId = mockWallets.get(nameOrId);
  if (byId) return byId;
  const byName = Array.from(mockWallets.values()).find(w => w.name === nameOrId);
  if (byName) return byName;
  throw new Error(`Wallet not found: ${nameOrId}`);
}

function mockCreatePolicy(jsonStr: string): PolicyInfo {
  const data = JSON.parse(jsonStr);
  const policy: PolicyInfo = {
    id: data.id,
    name: data.name,
    rules: data.rules || [],
    version: data.version || 1,
    action: data.action || "deny",
  };
  mockPolicies.set(policy.id, policy);
  return policy;
}

function mockGetPolicy(id: string): PolicyInfo {
  const policy = mockPolicies.get(id);
  if (!policy) throw new Error(`Policy not found: ${id}`);
  return policy;
}

function mockCreateApiKey(name: string, walletIds: string[], policyIds: string[], _secret: string): ApiKeyResult {
  const key: ApiKeyResult = {
    id: `key-${name}-${Date.now()}`,
    name,
    token: `ows_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
    walletIds,
    policyIds,
    createdAt: new Date().toISOString(),
  };
  mockApiKeys.set(key.id, key);
  return key;
}

function mockSignMessage(walletName: string, _chain: string, message: string): { signature: string } {
  const sig = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${message.slice(0, 4)}`;
  return { signature: sig };
}

// Mock policy object with `.rules` property (native SDK returns an object with parsed rules)
function wrapPolicyForRuntime(policy: PolicyInfo) {
  return { ...policy, rules: policy.rules || [] };
}

// ─── Native SDK loader (lazy, with fallback) ───
type OWSSdk = {
  createWallet: (name: string) => WalletInfo;
  getWallet: (nameOrId: string) => WalletInfo;
  listWallets: () => WalletInfo[];
  createPolicy: (json: string) => PolicyInfo;
  getPolicy: (id: string) => PolicyInfo;
  listPolicies: () => PolicyInfo[];
  deletePolicy: (id: string) => void;
  createApiKey: (name: string, walletIds: string[], policyIds: string[], secret: string) => ApiKeyResult;
  listApiKeys: () => ApiKeyResult[];
  revokeApiKey: (id: string) => void;
  signMessage: (walletName: string, chain: string, message: string) => { signature: string };
  deleteWallet: (id: string) => void;
};

let _native: OWSSdk | null = null;
let _useMock = false;

function getNative(): OWSSdk | null {
  if (_useMock) return null;
  if (_native) return _native;
  try {
    ensureOwsHome();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@open-wallet-standard/core");
    _native = mod as OWSSdk;
    return _native;
  } catch (e) {
    console.warn("[OWS] Native module unavailable, using in-memory mock:", e instanceof Error ? e.message : String(e));
    _useMock = true;
    return null;
  }
}

// ─── Public OWS interface ───
export const ows = {
  createWallet(name: string): WalletInfo {
    try {
      const native = getNative();
      if (native) return native.createWallet(name);
    } catch (e) {
      console.warn("[OWS] createWallet fallback:", e instanceof Error ? e.message : String(e));
    }
    return mockCreateWallet(name);
  },

  getWallet(nameOrId: string): WalletInfo {
    try {
      const native = getNative();
      if (native) return native.getWallet(nameOrId);
    } catch {
      // fall through to mock
    }
    return mockGetWallet(nameOrId);
  },

  listWallets(): WalletInfo[] {
    try {
      const native = getNative();
      if (native) return native.listWallets();
    } catch {
      // fall through
    }
    return Array.from(mockWallets.values());
  },

  createPolicy(json: string): PolicyInfo {
    try {
      const native = getNative();
      if (native) return native.createPolicy(json);
    } catch (e) {
      console.warn("[OWS] createPolicy fallback:", e instanceof Error ? e.message : String(e));
    }
    return mockCreatePolicy(json);
  },

  getPolicy(id: string): PolicyInfo {
    try {
      const native = getNative();
      if (native) {
        const p = native.getPolicy(id);
        // Native SDK returns rules as a JSON string on some versions — normalize it
        if (p && typeof (p as unknown as Record<string, unknown>).rules === "string") {
          try {
            (p as unknown as Record<string, unknown>).rules = JSON.parse((p as unknown as Record<string, unknown>).rules as string);
          } catch { /* ignore */ }
        }
        return p;
      }
    } catch {
      // fall through to mock
    }
    return wrapPolicyForRuntime(mockGetPolicy(id));
  },

  listPolicies(): PolicyInfo[] {
    try {
      const native = getNative();
      if (native) return native.listPolicies();
    } catch {
      // fall through
    }
    return Array.from(mockPolicies.values());
  },

  deletePolicy(id: string): void {
    try {
      const native = getNative();
      if (native) { native.deletePolicy(id); return; }
    } catch { /* ignore */ }
    mockPolicies.delete(id);
  },

  createApiKey(name: string, walletIds: string[], policyIds: string[], secret: string): ApiKeyResult {
    try {
      const native = getNative();
      if (native) return native.createApiKey(name, walletIds, policyIds, secret);
    } catch (e) {
      console.warn("[OWS] createApiKey fallback:", e instanceof Error ? e.message : String(e));
    }
    return mockCreateApiKey(name, walletIds, policyIds, secret);
  },

  listApiKeys(): ApiKeyResult[] {
    try {
      const native = getNative();
      if (native) return native.listApiKeys();
    } catch {
      // fall through
    }
    return Array.from(mockApiKeys.values());
  },

  revokeApiKey(id: string): void {
    try {
      const native = getNative();
      if (native) { native.revokeApiKey(id); return; }
    } catch { /* ignore */ }
    mockApiKeys.delete(id);
  },

  signMessage(walletName: string, chain: string, message: string): { signature: string } {
    try {
      const native = getNative();
      if (native) return native.signMessage(walletName, chain, message);
    } catch {
      // fall through
    }
    return mockSignMessage(walletName, chain, message);
  },

  deleteWallet(id: string): void {
    try {
      const native = getNative();
      if (native) { native.deleteWallet(id); return; }
    } catch { /* ignore */ }
    mockWallets.delete(id);
  },
};

// Agent profile type (stored in memory for the demo)
export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  avatar: string; // emoji
  walletId: string;
  walletName: string;
  apiKeyId?: string;
  policyIds: string[];
  spendToday: number;
  spendLimit: number;
  txCount: number;
  status: "active" | "paused" | "revoked";
  color: string;
  mpWallet?: string;
  allowedVendors?: string[]; // vendor allowlist — e.g. ["Uniswap", "Aave"]
}

// Common DeFi/protocol vendors for allowlisting
export const VENDOR_PRESETS = [
  { id: "uniswap", name: "Uniswap", category: "DEX" },
  { id: "aave", name: "Aave", category: "Lending" },
  { id: "compound", name: "Compound", category: "Lending" },
  { id: "1inch", name: "1inch", category: "Aggregator" },
  { id: "curve", name: "Curve", category: "Stable DEX" },
  { id: "balancer", name: "Balancer", category: "DEX" },
  { id: "gmx", name: "GMX", category: "Perps" },
  { id: "lido", name: "Lido", category: "Staking" },
  { id: "opensea", name: "OpenSea", category: "NFT" },
  { id: "blur", name: "Blur", category: "NFT" },
  { id: "chainlink", name: "Chainlink", category: "Oracle" },
  { id: "stargate", name: "Stargate", category: "Bridge" },
] as const;

// Policy template presets
export const POLICY_PRESETS = [
  {
    id: "conservative",
    name: "Conservative",
    description: "EVM mainnet only, low-risk chains",
    chains: ["eip155:1", "eip155:8453", "eip155:10"],
    icon: "🛡️",
  },
  {
    id: "multi-chain",
    name: "Multi-Chain Explorer",
    description: "EVM + Solana + Cosmos",
    chains: ["eip155:1", "eip155:8453", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", "cosmos:cosmoshub-4"],
    icon: "🌐",
  },
  {
    id: "defi-agent",
    name: "DeFi Agent",
    description: "EVM chains for DeFi operations",
    chains: ["eip155:1", "eip155:8453", "eip155:42161", "eip155:10", "eip155:137"],
    icon: "📊",
  },
  {
    id: "solana-only",
    name: "Solana Only",
    description: "Restricted to Solana ecosystem",
    chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
    icon: "☀️",
  },
] as const;

// Chain display info
export const CHAIN_INFO: Record<string, { name: string; color: string; icon: string }> = {
  "eip155:1": { name: "Ethereum", color: "#627eea", icon: "Ξ" },
  "eip155:8453": { name: "Base", color: "#0052ff", icon: "B" },
  "eip155:10": { name: "Optimism", color: "#ff0420", icon: "O" },
  "eip155:42161": { name: "Arbitrum", color: "#28a0f0", icon: "A" },
  "eip155:137": { name: "Polygon", color: "#8247e5", icon: "P" },
  "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": { name: "Solana", color: "#14f195", icon: "S" },
  "cosmos:cosmoshub-4": { name: "Cosmos", color: "#6f7390", icon: "⚛" },
};
