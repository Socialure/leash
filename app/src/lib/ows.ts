// OWS SDK wrapper — all wallet/policy/key operations go through here
import {
  createWallet,
  listWallets,
  getWallet,
  deleteWallet,
  createPolicy,
  listPolicies,
  getPolicy,
  deletePolicy,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  signMessage,
  type WalletInfo,
  type ApiKeyResult,
} from "@open-wallet-standard/core";

export type { WalletInfo, ApiKeyResult };

// Re-export everything we need
export const ows = {
  createWallet,
  listWallets,
  getWallet,
  deleteWallet,
  createPolicy,
  listPolicies,
  getPolicy,
  deletePolicy,
  createApiKey,
  listApiKeys,
  revokeApiKey,
  signMessage,
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
}

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
