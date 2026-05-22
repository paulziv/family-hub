"use client";

import { useEffect, useState } from "react";
import type { HomeAssistantStatus } from "@/lib/homeAssistant";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantStatus }
  | { status: "error"; message: string };

const DOMAIN_LABELS: Record<string, string> = {
  binary_sensor: "Binary Sensors",
  calendar: "Calendars",
  climate: "Climate",
  cover: "Covers",
  device_tracker: "Trackers",
  fan: "Fans",
  light: "Lights",
  lock: "Locks",
  person: "People",
  sensor: "Sensors",
  switch: "Switches",
};

export function Dashboard() {
  const [homeAssistant, setHomeAssistant] = useState<LoadState>({
    status: "loading",
  });

  async function loadHomeAssistantStatus(signal?: AbortSignal) {
    try {
      setHomeAssistant((current) =>
        current.status === "ready" ? current : { status: "loading" },
      );

      const response = await fetch("/api/home-assistant/status", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load Home Assistant status.");
      }

      const data = (await response.json()) as HomeAssistantStatus;
      setHomeAssistant({ status: "ready", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setHomeAssistant({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to load Home Assistant status.",
      });
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void loadHomeAssistantStatus(controller.signal);

    const refreshId = window.setInterval(() => {
      void loadHomeAssistantStatus(controller.signal);
    }, 60_000);

    return () => {
      window.clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  const smartHomeStatus = getSmartHomeStatus(homeAssistant);

  return (
    <main className="dashboard-container">
      <h1 className="page-title">Family Hub</h1>
      <div className="grid-layout">
        <section className="glass-panel">
          <div className="panel-actions">
            <h2 className="glass-header">Smart Home</h2>
            <button
              className="secondary-button"
              onClick={() => {
                void loadHomeAssistantStatus();
              }}
              type="button"
            >
              Refresh
            </button>
          </div>
          <p>Status: {smartHomeStatus}</p>
          <div className="panel-detail">
            <SmartHomeDetails state={homeAssistant} />
          </div>
        </section>

        <section className="glass-panel">
          <h2 className="glass-header">Tasks</h2>
          <p className="panel-muted">No tasks for today. Great job!</p>
        </section>

        <section className="glass-panel">
          <h2 className="glass-header">Calendar</h2>
          <p className="panel-muted">No upcoming events.</p>
        </section>
      </div>
    </main>
  );
}

function SmartHomeDetails({ state }: { state: LoadState }) {
  if (state.status === "loading") {
    return <p>Checking Home Assistant...</p>;
  }

  if (state.status === "error") {
    return <p>{state.message}</p>;
  }

  const { data } = state;

  if (!data.configured) {
    return <p>Configure HA_URL and HA_TOKEN to load devices.</p>;
  }

  if (!data.connected) {
    return <p>{data.error}</p>;
  }

  const visibleDomains = Object.entries(data.entitiesByDomain).filter(
    ([, count]) => count > 0,
  );

  return (
    <>
      <p>{data.entityCount} entities loaded</p>
      <p className="status-meta">
        Home Assistant {data.haVersion} · Updated{" "}
        {new Date(data.updatedAt).toLocaleTimeString()}
      </p>
      {visibleDomains.length > 0 ? (
        <dl className="entity-summary">
          {visibleDomains.map(([domain, count]) => (
            <div className="entity-summary-row" key={domain}>
              <dt>{DOMAIN_LABELS[domain] ?? domain}</dt>
              <dd>{count}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {data.warnings.map((warning) => (
        <p className="panel-warning" key={warning}>
          {warning}
        </p>
      ))}
    </>
  );
}

function getSmartHomeStatus(state: LoadState) {
  if (state.status === "loading") {
    return "Checking";
  }

  if (state.status === "error") {
    return "Unavailable";
  }

  if (!state.data.configured) {
    return "Missing Credentials";
  }

  return state.data.connected ? "Connected" : "Connection Failed";
}
