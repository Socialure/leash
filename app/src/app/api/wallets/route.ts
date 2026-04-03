import { NextResponse } from "next/server";
import { ows } from "@/lib/ows";

export async function GET() {
  try {
    const wallets = ows.listWallets();
    return NextResponse.json({ wallets });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const wallet = ows.createWallet(name);
    return NextResponse.json({ wallet });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
