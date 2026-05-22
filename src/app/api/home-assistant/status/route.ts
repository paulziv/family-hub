import { getHomeAssistantStatus } from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const status = await getHomeAssistantStatus();

  return Response.json(status);
}
