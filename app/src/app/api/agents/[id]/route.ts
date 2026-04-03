import { NextResponse } from "next/server";
import { getStore, addActivity } from "@/lib/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const store = getStore();
    const agent = store.agents.find((a) => a.id === id);
    if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    if (body.status) {
      agent.status = body.status;
      addActivity({
        agentId: agent.id,
        agentName: agent.name,
        action: `Status changed to ${body.status}`,
        chain: "system",
        amount: 0,
        status: body.status === "active" ? "approved" : "denied",
      });
    }
    if (body.spendLimit !== undefined) {
      agent.spendLimit = body.spendLimit;
      addActivity({
        agentId: agent.id,
        agentName: agent.name,
        action: `Spend limit updated to $${body.spendLimit}`,
        chain: "system",
        amount: 0,
        status: "approved",
      });
    }
    if (body.resetSpend) {
      agent.spendToday = 0;
    }

    return NextResponse.json({ agent });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
