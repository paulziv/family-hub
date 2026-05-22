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
  usingLegacyPublicNames: boolean;
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

let connectionPromise: Promise<Connection> | null = null;
let activeConnection: Connection | null = null;
let activeConnectionKey: string | null = null;

function getConfig(): HomeAssistantConfig | null {
  const url = process.env.HA_URL || process.env.NEXT_PUBLIC_HA_URL;
  const token = process.env.HA_TOKEN || process.env.NEXT_PUBLIC_HA_TOKEN;

  if (!url || !token) {
    return null;
  }

  return {
    url,
    token,
    usingLegacyPublicNames:
      (!process.env.HA_URL && Boolean(process.env.NEXT_PUBLIC_HA_URL)) ||
      (!process.env.HA_TOKEN && Boolean(process.env.NEXT_PUBLIC_HA_TOKEN)),
  };
}

function getWarnings(config: HomeAssistantConfig): string[] {
  if (!config.usingLegacyPublicNames) {
    return [];
  }

  return [
    "Using legacy NEXT_PUBLIC Home Assistant env names. Rename them to HA_URL and HA_TOKEN before production.",
  ];
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
