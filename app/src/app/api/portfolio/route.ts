import { NextResponse } from "next/server";

// Zerion API integration — real onchain wallet portfolio data
const ZERION_BASE = "https://api.zerion.io/v1";

// Well-known wallets for demo purposes
const DEMO_ADDRESSES: Record<string, string> = {
  "research-bot": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "defi-trader": "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  "nft-scout": "0x1DB3439a222C519ab44bb1144fC28167b4Fa6EE6",
  "bridge-agent": "0xC07b695eC19DE38f1e62e825585B2818077B96cC",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet") || "";
  const address = DEMO_ADDRESSES[wallet] || wallet;

  if (!address) {
    return NextResponse.json({ error: "wallet param required" }, { status: 400 });
  }

  const apiKey = process.env.ZERION_API_KEY;
  if (!apiKey) {
    // Return realistic mock data when no API key
    return NextResponse.json({
      address,
      source: "demo",
      totalValue: parseFloat((Math.random() * 8000 + 500).toFixed(2)),
      positions: [
        { symbol: "ETH", name: "Ethereum", chain: "ethereum", value: parseFloat((Math.random() * 5000).toFixed(2)), quantity: parseFloat((Math.random() * 3).toFixed(4)) },
        { symbol: "USDC", name: "USD Coin", chain: "base", value: parseFloat((Math.random() * 2000).toFixed(2)), quantity: parseFloat((Math.random() * 2000).toFixed(2)) },
      ],
    });
  }

  try {
    const res = await fetch(
      `${ZERION_BASE}/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd&page[size]=5`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Zerion API: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const positions = (data.data || []).map((p: Record<string, unknown>) => {
      const attrs = p.attributes as Record<string, unknown>;
      const fungible = attrs.fungible_info as Record<string, unknown>;
      const impl = (fungible?.implementations as Record<string, unknown>[])?.find(() => true);
      return {
        symbol: (fungible?.symbol as string) || "???",
        name: (fungible?.name as string) || "Unknown",
        chain: (impl as Record<string, string>)?.chain_id || "ethereum",
        value: (attrs.value as number) || 0,
        quantity: (attrs.quantity as Record<string, number>)?.float || 0,
      };
    });

    const totalValue = positions.reduce((s: number, p: { value: number }) => s + p.value, 0);

    return NextResponse.json({
      address,
      source: "zerion",
      totalValue: parseFloat(totalValue.toFixed(2)),
      positions,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
