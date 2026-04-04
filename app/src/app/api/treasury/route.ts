import { NextResponse } from "next/server";
import { execSync } from "child_process";

// Real treasury wallet — created via MoonPay CLI (mp wallet create --name leash-treasury)
const TREASURY_WALLET = "leash-treasury";
const TREASURY_ADDRESS = "0x867Ff24933cA6b14aDb8421575770F5111843D76";
const TREASURY_CHAIN = "base-sepolia";
const BASE_SEPOLIA_RPC = "https://sepolia.base.org";

async function getBaseSepBalance(address: string): Promise<string> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [address, "latest"],
    id: 1,
  });
  const res = await fetch(BASE_SEPOLIA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    next: { revalidate: 60 },
  });
  const data = await res.json();
  const wei = BigInt(data.result);
  const eth = Number(wei) / 1e18;
  return eth.toFixed(6);
}

async function getTxCount(address: string): Promise<number> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getTransactionCount",
    params: [address, "latest"],
    id: 1,
  });
  const res = await fetch(BASE_SEPOLIA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return parseInt(data.result, 16);
}

// Get all MoonPay wallets and their addresses
function getMpWallets() {
  try {
    const raw = execSync("mp wallet list 2>/dev/null", { timeout: 8000, encoding: "utf-8" });
    const wallets: Record<string, Record<string, string>> = {};
    let currentWallet = "";
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (t.startsWith("- name:") || t.startsWith("name:")) {
        currentWallet = t.replace("- name:", "").replace("name:", "").trim();
        wallets[currentWallet] = {};
      } else if (currentWallet && t.includes(":")) {
        const [key, ...rest] = t.split(":");
        wallets[currentWallet][key.trim()] = rest.join(":").trim();
      }
    }
    return wallets;
  } catch {
    return {};
  }
}

export async function GET() {
  try {
    const [balance, txCount] = await Promise.all([
      getBaseSepBalance(TREASURY_ADDRESS),
      getTxCount(TREASURY_ADDRESS),
    ]);

    const mpWallets = getMpWallets();

    // Map agent wallets
    const agentWallets = [
      { name: "leash-treasury", role: "Agent Treasury", address: "0x867Ff24933cA6b14aDb8421575770F5111843D76", emoji: "🏦" },
      { name: "leash-nft-scout", role: "NFT Scout", address: "0x8d0ef8711f9815De3Fe252a4f77C74beF5f839fd", emoji: "🖼️" },
      { name: "leash-defi-trader", role: "DeFi Trader", address: "0xE85e55a4414b5AD2e32B7aB09F5AF8b86d2ad8dc", emoji: "📈" },
      { name: "leash-research-bot", role: "Research Bot", address: "0xCd33C711947e7a2e352798b5299Ce8FDfF4CF347", emoji: "🔬" },
    ];

    return NextResponse.json({
      treasury: {
        name: TREASURY_WALLET,
        address: TREASURY_ADDRESS,
        chain: TREASURY_CHAIN,
        balance,
        txCount,
        basescanUrl: `https://sepolia.basescan.org/address/${TREASURY_ADDRESS}`,
        source: "moonpay-cli + base-sepolia-rpc",
      },
      agentWallets,
      mpWalletCount: Object.keys(mpWallets).length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
