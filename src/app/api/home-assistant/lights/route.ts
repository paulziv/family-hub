import {
  getHomeAssistantLights,
  setHomeAssistantLightState,
} from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const lights = await getHomeAssistantLights();

  return Response.json(lights);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      entityId?: string;
    };

    if (body.action !== "turn_on" && body.action !== "turn_off") {
      return Response.json({ error: "Unsupported light action." }, { status: 400 });
    }

    if (!body.entityId?.startsWith("light.")) {
      return Response.json(
        { error: "A light entityId is required." },
        { status: 400 },
      );
    }

    await setHomeAssistantLightState(body.entityId, body.action);

    const lights = await getHomeAssistantLights();

    return Response.json(lights);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update Home Assistant light.",
      },
      { status: 500 },
    );
  }
}
