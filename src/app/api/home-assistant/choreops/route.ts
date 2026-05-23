import { getHomeAssistantChoreOps } from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const choreops = await getHomeAssistantChoreOps();

  return Response.json(choreops);
}
