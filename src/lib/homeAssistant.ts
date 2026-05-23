import {
  Connection,
  createConnection,
  createLongLivedTokenAuth,
  getStates,
  type HassEntity,
} from "home-assistant-js-websocket";

const ENTITY_DOMAINS = [
  "binary_sensor",
  "calendar",
  "climate",
  "cover",
  "device_tracker",
  "fan",
  "light",
  "lock",
  "person",
  "sensor",
  "switch",
] as const;

const CONNECTION_TIMEOUT_MS = 8000;

type HomeAssistantConfig = {
  url: string;
  token: string;
};

export type HomeAssistantStatus =
  | {
      configured: false;
      connected: false;
      entityCount: 0;
      entitiesByDomain: Record<string, number>;
      warnings: string[];
      error: string;
    }
  | {
      configured: true;
      connected: true;
      entityCount: number;
      entitiesByDomain: Record<string, number>;
      warnings: string[];
      haVersion: string;
      updatedAt: string;
    }
  | {
      configured: true;
      connected: false;
      entityCount: 0;
      entitiesByDomain: Record<string, number>;
      warnings: string[];
      error: string;
    };

export type HomeAssistantTaskItem = {
  uid: string;
  summary: string;
  status: string;
  due?: string;
  dueDate?: string;
  dueDatetime?: string;
  description?: string;
};

export type HomeAssistantTaskList = {
  entityId: string;
  name: string;
  incompleteCount: number;
  items: HomeAssistantTaskItem[];
};

export type HomeAssistantCalendarEvent = {
  summary: string;
  start: string;
  end: string;
  isAllDay: boolean;
  description?: string;
  location?: string;
};

export type HomeAssistantCalendar = {
  entityId: string;
  name: string;
  events: HomeAssistantCalendarEvent[];
};

export type HomeAssistantLight = {
  entityId: string;
  name: string;
  state: string;
  area: string | null;
  brightnessPercent: number | null;
  colorMode: string | null;
  isAvailable: boolean;
};

export type HomeAssistantChoreOpsEntity = {
  entityId: string;
  name: string;
  state: string;
};

export type HomeAssistantChoreOpsResponse =
  | {
      configured: false;
      connected: false;
      choreopsInstalled: false;
      integrationConfigured: false;
      entities: [];
      serviceDomains: [];
      warnings: string[];
      error: string;
    }
  | {
      configured: true;
      connected: true;
      choreopsInstalled: boolean;
      integrationConfigured: boolean;
      entities: HomeAssistantChoreOpsEntity[];
      serviceDomains: string[];
      warnings: string[];
      updatedAt: string;
    }
  | {
      configured: true;
      connected: false;
      choreopsInstalled: false;
      integrationConfigured: false;
      entities: [];
      serviceDomains: [];
      warnings: string[];
      error: string;
    };

export type HomeAssistantTasksResponse =
  | {
      configured: false;
      connected: false;
      lists: [];
      warnings: string[];
      error: string;
    }
  | {
      configured: true;
      connected: true;
      lists: HomeAssistantTaskList[];
      warnings: string[];
      updatedAt: string;
    }
  | {
      configured: true;
      connected: false;
      lists: [];
      warnings: string[];
      error: string;
    };

export type HomeAssistantCalendarResponse =
  | {
      configured: false;
      connected: false;
      calendars: [];
      warnings: string[];
      error: string;
    }
  | {
      configured: true;
      connected: true;
      calendars: HomeAssistantCalendar[];
      warnings: string[];
      updatedAt: string;
    }
  | {
      configured: true;
      connected: false;
      calendars: [];
      warnings: string[];
      error: string;
    };

export type HomeAssistantLightsResponse =
  | {
      configured: false;
      connected: false;
      lights: [];
      warnings: string[];
      error: string;
    }
  | {
      configured: true;
      connected: true;
      lights: HomeAssistantLight[];
      warnings: string[];
      updatedAt: string;
    }
  | {
      configured: true;
      connected: false;
      lights: [];
      warnings: string[];
      error: string;
    };

let connectionPromise: Promise<Connection> | null = null;
let activeConnection: Connection | null = null;
let activeConnectionKey: string | null = null;

function getConfig(): HomeAssistantConfig | null {
  const url = process.env.HA_URL;
  const token = process.env.HA_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

function getWarnings(_: HomeAssistantConfig): string[] {
  return [];
}

function getApiBaseUrl(config: HomeAssistantConfig) {
  return config.url.replace(/\/$/, "");
}

function getApiHeaders(config: HomeAssistantConfig) {
  return {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error("Home Assistant connection timed out."));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function getConnectionKey(config: HomeAssistantConfig) {
  return `${config.url}::${config.token}`;
}

function resetConnection() {
  activeConnection?.close();
  activeConnection = null;
  connectionPromise = null;
  activeConnectionKey = null;
}

async function getConnection(config: HomeAssistantConfig): Promise<Connection> {
  const connectionKey = getConnectionKey(config);

  if (activeConnectionKey && activeConnectionKey !== connectionKey) {
    resetConnection();
  }

  if (!connectionPromise) {
    const auth = createLongLivedTokenAuth(config.url, config.token);
    connectionPromise = createConnection({ auth })
      .then((connection) => {
        activeConnection = connection;
        activeConnectionKey = connectionKey;

        connection.addEventListener("disconnected", () => {
          if (activeConnection === connection) {
            activeConnection = null;
            connectionPromise = null;
            activeConnectionKey = null;
          }
        });

        return connection;
      })
      .catch((error) => {
        connectionPromise = null;
        activeConnection = null;
        activeConnectionKey = null;
        throw error;
      });
  }

  return connectionPromise;
}

function summarizeEntities(entities: HassEntity[]): Record<string, number> {
  const summary = Object.fromEntries(
    ENTITY_DOMAINS.map((domain) => [domain, 0]),
  );

  for (const entity of entities) {
    const domain = entity.entity_id.split(".", 1)[0];

    if (domain in summary) {
      summary[domain] += 1;
    }
  }

  return summary;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to connect to Home Assistant.";
}

type TodoServiceResponse = {
  changed_states: unknown[];
  service_response?: Record<
    string,
    {
      items?: Array<{
        uid?: string;
        summary?: string;
        status?: string;
        due?: string;
        due_date?: string;
        due_datetime?: string;
        description?: string;
      }>;
    }
  >;
};

function mapTaskItems(
  items: NonNullable<
    NonNullable<TodoServiceResponse["service_response"]>[string]["items"]
  > = [],
): HomeAssistantTaskItem[] {
  return items.map((item) => ({
    uid: item.uid ?? item.summary ?? crypto.randomUUID(),
    summary: item.summary ?? "Untitled task",
    status: item.status ?? "unknown",
    due: item.due,
    dueDate: item.due_date,
    dueDatetime: item.due_datetime,
    description: item.description,
  }));
}

type CalendarListItem = {
  entity_id: string;
  name: string;
};

type ConfigEntry = {
  domain: string;
  title: string;
};

type ServiceRegistryDomain = {
  domain: string;
  services: Record<string, unknown>;
};

type CalendarEventApiItem = {
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
};

function mapCalendarEvent(
  event: CalendarEventApiItem,
): HomeAssistantCalendarEvent | null {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;

  if (!start || !end || !event.summary) {
    return null;
  }

  return {
    summary: event.summary,
    start,
    end,
    isAllDay: Boolean(event.start?.date && !event.start?.dateTime),
    description: event.description,
    location: event.location,
  };
}

async function callTodoService(
  config: HomeAssistantConfig,
  service: string,
  payload: Record<string, unknown>,
  options?: { expectResponse?: boolean },
) {
  const query = options?.expectResponse ? "?return_response" : "";
  const response = await fetch(
    `${getApiBaseUrl(config)}/api/services/todo/${service}${query}`,
    {
      method: "POST",
      headers: getApiHeaders(config),
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Home Assistant ${service} failed with ${response.status}.`);
  }

  if (!options?.expectResponse) {
    return null;
  }

  return (await response.json()) as TodoServiceResponse;
}

async function fetchHomeAssistantJson<T>(
  config: HomeAssistantConfig,
  path: string,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl(config)}${path}`, {
    headers: getApiHeaders(config),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Home Assistant request failed for ${path} (${response.status}).`);
  }

  return (await response.json()) as T;
}

function getEntityName(entity: HassEntity) {
  return (
    (entity.attributes.friendly_name as string | undefined) ?? entity.entity_id
  );
}

function matchesChoreOpsEntity(entity: HassEntity) {
  const haystack = `${entity.entity_id} ${getEntityName(entity)}`.toLowerCase();

  return (
    haystack.includes("choreops") ||
    haystack.includes("reward") ||
    haystack.includes("allowance") ||
    haystack.includes("streak") ||
    haystack.includes("badge") ||
    haystack.includes("points")
  );
}

function mapLightEntity(entity: HassEntity): HomeAssistantLight {
  const brightness = entity.attributes.brightness;
  return {
    entityId: entity.entity_id,
    name: getEntityName(entity),
    state: entity.state,
    area:
      (entity.attributes.room as string | undefined) ??
      (entity.attributes.area as string | undefined) ??
      null,
    brightnessPercent:
      typeof brightness === "number" ? Math.round((brightness / 255) * 100) : null,
    colorMode: (entity.attributes.color_mode as string | undefined) ?? null,
    isAvailable: entity.state !== "unavailable",
  };
}

export async function getHomeAssistantStatus(): Promise<HomeAssistantStatus> {
  const config = getConfig();

  if (!config) {
    return {
      configured: false,
      connected: false,
      entityCount: 0,
      entitiesByDomain: {},
      warnings: [],
      error: "Missing HA_URL or HA_TOKEN.",
    };
  }

  try {
    const connection = await withTimeout(
      getConnection(config),
      CONNECTION_TIMEOUT_MS,
    );
    const entities = await withTimeout(getStates(connection), CONNECTION_TIMEOUT_MS);

    return {
      configured: true,
      connected: true,
      entityCount: entities.length,
      entitiesByDomain: summarizeEntities(entities),
      warnings: getWarnings(config),
      haVersion: connection.haVersion,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    resetConnection();

    return {
      configured: true,
      connected: false,
      entityCount: 0,
      entitiesByDomain: {},
      warnings: getWarnings(config),
      error: toErrorMessage(error),
    };
  }
}

export async function getHomeAssistantTasks(): Promise<HomeAssistantTasksResponse> {
  const config = getConfig();

  if (!config) {
    return {
      configured: false,
      connected: false,
      lists: [],
      warnings: [],
      error: "Missing HA_URL or HA_TOKEN.",
    };
  }

  try {
    const connection = await withTimeout(
      getConnection(config),
      CONNECTION_TIMEOUT_MS,
    );
    const entities = await withTimeout(getStates(connection), CONNECTION_TIMEOUT_MS);
    const todoEntities = entities.filter((entity) =>
      entity.entity_id.startsWith("todo."),
    );

    const lists = await Promise.all(
      todoEntities.map(async (entity) => {
        const response = await callTodoService(
          config,
          "get_items",
          {
            entity_id: entity.entity_id,
            status: ["needs_action"],
          },
          { expectResponse: true },
        );
        const items = mapTaskItems(
          response?.service_response?.[entity.entity_id]?.items,
        );

        return {
          entityId: entity.entity_id,
          name:
            (entity.attributes.friendly_name as string | undefined) ??
            entity.entity_id,
          incompleteCount: Number(entity.state) || items.length,
          items,
        };
      }),
    );

    return {
      configured: true,
      connected: true,
      lists,
      warnings: getWarnings(config),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    resetConnection();

    return {
      configured: true,
      connected: false,
      lists: [],
      warnings: getWarnings(config),
      error: toErrorMessage(error),
    };
  }
}

export async function addHomeAssistantTask(entityId: string, summary: string) {
  const config = getConfig();

  if (!config) {
    throw new Error("Missing HA_URL or HA_TOKEN.");
  }

  await callTodoService(config, "add_item", {
    entity_id: entityId,
    item: summary,
  });
}

export async function completeHomeAssistantTask(
  entityId: string,
  item: string,
) {
  const config = getConfig();

  if (!config) {
    throw new Error("Missing HA_URL or HA_TOKEN.");
  }

  await callTodoService(config, "update_item", {
    entity_id: entityId,
    item,
    status: "completed",
  });
}

export async function getHomeAssistantCalendar(): Promise<HomeAssistantCalendarResponse> {
  const config = getConfig();

  if (!config) {
    return {
      configured: false,
      connected: false,
      calendars: [],
      warnings: [],
      error: "Missing HA_URL or HA_TOKEN.",
    };
  }

  try {
    await withTimeout(getConnection(config), CONNECTION_TIMEOUT_MS);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const calendarResponse = await fetch(`${getApiBaseUrl(config)}/api/calendars`, {
      headers: getApiHeaders(config),
      cache: "no-store",
    });

    if (!calendarResponse.ok) {
      throw new Error(
        `Home Assistant calendars failed with ${calendarResponse.status}.`,
      );
    }

    const calendars = (await calendarResponse.json()) as CalendarListItem[];
    const calendarData = await Promise.all(
      calendars.map(async (calendar) => {
        const eventsResponse = await fetch(
          `${getApiBaseUrl(config)}/api/calendars/${calendar.entity_id}?start=${encodeURIComponent(
            now.toISOString(),
          )}&end=${encodeURIComponent(windowEnd.toISOString())}`,
          {
            headers: getApiHeaders(config),
            cache: "no-store",
          },
        );

        if (!eventsResponse.ok) {
          throw new Error(
            `Home Assistant calendar events failed with ${eventsResponse.status}.`,
          );
        }

        const events = ((await eventsResponse.json()) as CalendarEventApiItem[])
          .map(mapCalendarEvent)
          .filter((event): event is HomeAssistantCalendarEvent => Boolean(event));

        return {
          entityId: calendar.entity_id,
          name: calendar.name,
          events,
        };
      }),
    );

    return {
      configured: true,
      connected: true,
      calendars: calendarData,
      warnings: getWarnings(config),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    resetConnection();

    return {
      configured: true,
      connected: false,
      calendars: [],
      warnings: getWarnings(config),
      error: toErrorMessage(error),
    };
  }
}

export async function getHomeAssistantLights(): Promise<HomeAssistantLightsResponse> {
  const config = getConfig();

  if (!config) {
    return {
      configured: false,
      connected: false,
      lights: [],
      warnings: [],
      error: "Missing HA_URL or HA_TOKEN.",
    };
  }

  try {
    const connection = await withTimeout(
      getConnection(config),
      CONNECTION_TIMEOUT_MS,
    );
    const entities = await withTimeout(getStates(connection), CONNECTION_TIMEOUT_MS);
    const lights = entities
      .filter((entity) => entity.entity_id.startsWith("light."))
      .map(mapLightEntity)
      .sort((left, right) => {
        if (left.isAvailable !== right.isAvailable) {
          return left.isAvailable ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      });

    return {
      configured: true,
      connected: true,
      lights,
      warnings: getWarnings(config),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    resetConnection();

    return {
      configured: true,
      connected: false,
      lights: [],
      warnings: getWarnings(config),
      error: toErrorMessage(error),
    };
  }
}

export async function getHomeAssistantChoreOps(): Promise<HomeAssistantChoreOpsResponse> {
  const config = getConfig();

  if (!config) {
    return {
      configured: false,
      connected: false,
      choreopsInstalled: false,
      integrationConfigured: false,
      entities: [],
      serviceDomains: [],
      warnings: [],
      error: "Missing HA_URL or HA_TOKEN.",
    };
  }

  try {
    await withTimeout(getConnection(config), CONNECTION_TIMEOUT_MS);

    const [entities, configEntries, services] = await Promise.all([
      fetchHomeAssistantJson<HassEntity[]>(config, "/api/states"),
      fetchHomeAssistantJson<ConfigEntry[]>(
        config,
        "/api/config/config_entries/entry",
      ),
      fetchHomeAssistantJson<ServiceRegistryDomain[]>(config, "/api/services"),
    ]);

    const choreopsEntities = entities
      .filter(matchesChoreOpsEntity)
      .map((entity) => ({
        entityId: entity.entity_id,
        name: getEntityName(entity),
        state: entity.state,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const choreopsEntry = configEntries.some((entry) => entry.domain === "choreops");
    const serviceDomains = services
      .filter((domain) => domain.domain.toLowerCase().includes("chore"))
      .map((domain) => domain.domain)
      .sort();
    const choreopsInstalled = choreopsEntities.some((entity) =>
      entity.entityId === "update.choreops_update",
    );

    return {
      configured: true,
      connected: true,
      choreopsInstalled,
      integrationConfigured: choreopsEntry,
      entities: choreopsEntities,
      serviceDomains,
      warnings: getWarnings(config),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    resetConnection();

    return {
      configured: true,
      connected: false,
      choreopsInstalled: false,
      integrationConfigured: false,
      entities: [],
      serviceDomains: [],
      warnings: getWarnings(config),
      error: toErrorMessage(error),
    };
  }
}
