import { NextResponse } from "next/server";
import { execSync } from "child_process";

// MoonPay CLI integration — list real wallets created via mp CLI
export async function GET() {
  try {
    const result = execSync("mp wallet list --json 2>/dev/null || echo '[]'", {
      timeout: 10000,
      encoding: "utf-8",
    });

    // Parse YAML-ish output from mp CLI
    const wallets = parseWalletList(result);
    return NextResponse.json({ wallets, source: "moonpay-cli" });
  } catch {
    return NextResponse.json({ wallets: [], source: "error" });
  }
}

function parseWalletList(raw: string): Array<{ name: string; ethereum: string; base: string; solana: string }> {
  const wallets: Array<{ name: string; ethereum: string; base: string; solana: string }> = [];
  const lines = raw.trim().split("\n");
  let current: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("name:")) {
      if (current.name) wallets.push({
        name: current.name,
        ethereum: current.ethereum || "",
        base: current.base || current.ethereum || "",
        solana: current.solana || "",
      });
      current = { name: trimmed.replace("name:", "").trim() };
    } else if (trimmed.startsWith("ethereum:")) {
      current.ethereum = trimmed.replace("ethereum:", "").trim();
    } else if (trimmed.startsWith("base:")) {
      current.base = trimmed.replace("base:", "").trim();
    } else if (trimmed.startsWith("solana:")) {
      current.solana = trimmed.replace("solana:", "").trim();
    }
  }
  if (current.name) wallets.push({
    name: current.name,
    ethereum: current.ethereum || "",
    base: current.base || current.ethereum || "",
    solana: current.solana || "",
  });

  return wallets;
}
