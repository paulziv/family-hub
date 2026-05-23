import { getHomeAssistantLights } from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const lights = await getHomeAssistantLights();

  return Response.json(lights);
}
