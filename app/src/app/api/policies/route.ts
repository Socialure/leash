import { NextResponse } from "next/server";
import { ows } from "@/lib/ows";

export async function GET() {
  try {
    const policies = ows.listPolicies();
    return NextResponse.json({ policies });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id, name, chainIds, action = "deny" } = await req.json();
    if (!id || !name || !chainIds?.length) {
      return NextResponse.json({ error: "id, name, and chainIds required" }, { status: 400 });
    }
    const policy = {
      version: 1,
      id,
      name,
      created_at: new Date().toISOString(),
      action,
      rules: [{ type: "allowed_chains", chain_ids: chainIds }],
    };
    ows.createPolicy(JSON.stringify(policy));
    return NextResponse.json({ policy: ows.getPolicy(id) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    ows.deletePolicy(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
