import { getHomeAssistantCalendar } from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const calendar = await getHomeAssistantCalendar();

  return Response.json(calendar);
}
