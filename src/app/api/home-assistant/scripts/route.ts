import {
  getHomeAssistantScripts,
  runHomeAssistantScript,
} from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const scripts = await getHomeAssistantScripts();

  return Response.json(scripts);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      entityId?: string;
    };

    if (!body.entityId?.startsWith("script.")) {
      return Response.json(
        { error: "A script entityId is required." },
        { status: 400 },
      );
    }

    await runHomeAssistantScript(body.entityId);

    const scripts = await getHomeAssistantScripts();

    return Response.json(scripts);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to run Home Assistant script.";

    return Response.json(
      { error: message },
      {
        status: message.includes("not approved") ? 403 : 500,
      },
    );
  }
}
