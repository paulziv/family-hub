import {
  addHomeAssistantTask,
  completeHomeAssistantTask,
  getHomeAssistantTasks,
} from "@/lib/homeAssistant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const tasks = await getHomeAssistantTasks();

  return Response.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as
      | {
          action: "add";
          entityId: string;
          summary: string;
        }
      | {
          action: "complete";
          entityId: string;
          item: string;
        };

    if (body.action === "add") {
      if (!body.entityId || !body.summary?.trim()) {
        return Response.json(
          { error: "entityId and summary are required." },
          { status: 400 },
        );
      }

      await addHomeAssistantTask(body.entityId, body.summary.trim());
    } else if (body.action === "complete") {
      if (!body.entityId || !body.item?.trim()) {
        return Response.json(
          { error: "entityId and item are required." },
          { status: 400 },
        );
      }

      await completeHomeAssistantTask(body.entityId, body.item.trim());
    } else {
      return Response.json({ error: "Unsupported action." }, { status: 400 });
    }

    const tasks = await getHomeAssistantTasks();

    return Response.json(tasks);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update Home Assistant tasks.",
      },
      { status: 500 },
    );
  }
}
