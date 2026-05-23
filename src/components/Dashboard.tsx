"use client";

import { useEffect, useState } from "react";
import type {
  HomeAssistantCalendarResponse,
  HomeAssistantChoreOpsResponse,
  HomeAssistantLightsResponse,
  HomeAssistantStatus,
  HomeAssistantTasksResponse,
} from "@/lib/homeAssistant";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantStatus }
  | { status: "error"; message: string };

type TasksState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantTasksResponse }
  | { status: "error"; message: string };

type CalendarState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantCalendarResponse }
  | { status: "error"; message: string };

type ChoreOpsState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantChoreOpsResponse }
  | { status: "error"; message: string };

type LightsState =
  | { status: "loading" }
  | { status: "ready"; data: HomeAssistantLightsResponse }
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
  const [tasks, setTasks] = useState<TasksState>({ status: "loading" });
  const [calendar, setCalendar] = useState<CalendarState>({ status: "loading" });
  const [choreOps, setChoreOps] = useState<ChoreOpsState>({ status: "loading" });
  const [lights, setLights] = useState<LightsState>({ status: "loading" });
  const [newTaskSummary, setNewTaskSummary] = useState("");
  const [taskActionMessage, setTaskActionMessage] = useState<string | null>(null);
  const [taskActionPending, setTaskActionPending] = useState(false);
  const [now, setNow] = useState(() => new Date());

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

  async function loadTasks(signal?: AbortSignal) {
    try {
      setTasks((current) =>
        current.status === "ready" ? current : { status: "loading" },
      );

      const response = await fetch("/api/home-assistant/tasks", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load tasks.");
      }

      const data = (await response.json()) as HomeAssistantTasksResponse;
      setTasks({ status: "ready", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setTasks({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load tasks.",
      });
    }
  }

  async function updateTasks(body: Record<string, string>) {
    setTaskActionPending(true);
    setTaskActionMessage(null);

    try {
      const response = await fetch("/api/home-assistant/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as
        | HomeAssistantTasksResponse
        | { error: string };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "Unable to update task.");
      }

      setTasks({ status: "ready", data: payload as HomeAssistantTasksResponse });
    } catch (error) {
      setTaskActionMessage(
        error instanceof Error ? error.message : "Unable to update task.",
      );
    } finally {
      setTaskActionPending(false);
    }
  }

  async function loadCalendar(signal?: AbortSignal) {
    try {
      setCalendar((current) =>
        current.status === "ready" ? current : { status: "loading" },
      );

      const response = await fetch("/api/home-assistant/calendar", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load calendar.");
      }

      const data = (await response.json()) as HomeAssistantCalendarResponse;
      setCalendar({ status: "ready", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setCalendar({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to load calendar.",
      });
    }
  }

  async function loadChoreOps(signal?: AbortSignal) {
    try {
      setChoreOps((current) =>
        current.status === "ready" ? current : { status: "loading" },
      );

      const response = await fetch("/api/home-assistant/choreops", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load ChoreOps status.");
      }

      const data = (await response.json()) as HomeAssistantChoreOpsResponse;
      setChoreOps({ status: "ready", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setChoreOps({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unable to load ChoreOps status.",
      });
    }
  }

  async function loadLights(signal?: AbortSignal) {
    try {
      setLights((current) =>
        current.status === "ready" ? current : { status: "loading" },
      );

      const response = await fetch("/api/home-assistant/lights", {
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Unable to load lights.");
      }

      const data = (await response.json()) as HomeAssistantLightsResponse;
      setLights({ status: "ready", data });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }

      setLights({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load lights.",
      });
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    void loadHomeAssistantStatus(controller.signal);
    void loadTasks(controller.signal);
    void loadCalendar(controller.signal);
    void loadChoreOps(controller.signal);
    void loadLights(controller.signal);

    const refreshId = window.setInterval(() => {
      void loadHomeAssistantStatus(controller.signal);
      void loadTasks(controller.signal);
      void loadCalendar(controller.signal);
      void loadChoreOps(controller.signal);
      void loadLights(controller.signal);
    }, 60_000);

    return () => {
      window.clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const smartHomeStatus = getSmartHomeStatus(homeAssistant);
  const overviewStats = buildOverviewStats(
    homeAssistant,
    tasks,
    calendar,
    choreOps,
    lights,
  );
  const householdSignals = buildHouseholdSignals(homeAssistant);

  return (
    <main className="dashboard-container">
      <section className="hero-shell">
        <div>
          <p className="eyebrow">Home Assistant command center</p>
          <h1 className="page-title">Family Hub</h1>
          <p className="hero-copy">
            One place for household status, shared tasks, upcoming events, and
            kid workflows as they come online.
          </p>
          <div className="hero-meta-row">
            <div className="hero-time-block">
              <span className="hero-time">{formatHeroTime(now)}</span>
              <span className="hero-date">{formatHeroDate(now)}</span>
            </div>
            <div className="hero-note-block">
              <span className="hero-note-label">House pulse</span>
              <span className="hero-note-copy">
                Tasks, calendars, and kid workflows refresh every minute.
              </span>
            </div>
          </div>
        </div>
        <div className="hero-chip-row">
          <StatusChip label="Home" value={smartHomeStatus} tone={getStatusTone(smartHomeStatus)} />
          <StatusChip
            label="Tasks"
            value={getTasksSummary(tasks)}
            tone={tasks.status === "error" ? "warn" : "neutral"}
          />
          <StatusChip
            label="Calendar"
            value={getCalendarSummary(calendar)}
            tone={calendar.status === "error" ? "warn" : "neutral"}
          />
          <StatusChip
            label="Colton"
            value={getChoreOpsSummary(choreOps)}
            tone={getChoreOpsTone(choreOps)}
          />
          <StatusChip
            label="Lights"
            value={getLightsSummary(lights)}
            tone={getLightsTone(lights)}
          />
        </div>
      </section>

      <section className="overview-grid">
        {overviewStats.map((stat) => (
          <article className="overview-card" key={stat.label}>
            <p className="overview-label">{stat.label}</p>
            <p className="overview-value">{stat.value}</p>
            <p className="overview-note">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="today-grid">
        <article className="today-card">
          <p className="today-label">Next task moment</p>
          <p className="today-title">{getTodayTaskHeadline(tasks)}</p>
          <p className="today-copy">
            {getTodayTaskCopy(tasks)}
          </p>
        </article>
        <article className="today-card">
          <p className="today-label">Upcoming calendar</p>
          <p className="today-title">{getTodayCalendarHeadline(calendar)}</p>
          <p className="today-copy">
            {getTodayCalendarCopy(calendar)}
          </p>
        </article>
        <article className="today-card">
          <p className="today-label">Kid workflow</p>
          <p className="today-title">{getTodayChoreHeadline(choreOps)}</p>
          <p className="today-copy">
            {getTodayChoreCopy(choreOps)}
          </p>
        </article>
        <article className="today-card">
          <p className="today-label">Lighting status</p>
          <p className="today-title">{getTodayLightsHeadline(lights)}</p>
          <p className="today-copy">{getTodayLightsCopy(lights)}</p>
        </article>
      </section>

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
          <h2 className="glass-header">Household Signals</h2>
          <SignalPanel signals={householdSignals} />
        </section>

        <section className="glass-panel glass-panel-wide">
          <h2 className="glass-header">Lights</h2>
          <LightsPanel
            onRefresh={() => {
              void loadLights();
            }}
            state={lights}
          />
        </section>

        <section className="glass-panel">
          <h2 className="glass-header">Tasks</h2>
          <TaskPanel
            actionMessage={taskActionMessage}
            actionPending={taskActionPending}
            newTaskSummary={newTaskSummary}
            onAddTask={async (entityId) => {
              const summary = newTaskSummary.trim();

              if (!summary) {
                setTaskActionMessage("Enter a task first.");
                return;
              }

              await updateTasks({
                action: "add",
                entityId,
                summary,
              });
              setNewTaskSummary("");
            }}
            onCompleteTask={async (entityId, item) => {
              await updateTasks({
                action: "complete",
                entityId,
                item,
              });
            }}
            onRefresh={() => {
              void loadTasks();
            }}
            onSummaryChange={setNewTaskSummary}
            state={tasks}
          />
        </section>

        <section className="glass-panel">
          <h2 className="glass-header">Calendar</h2>
          <CalendarPanel
            onRefresh={() => {
              void loadCalendar();
            }}
            state={calendar}
          />
        </section>

        <section className="glass-panel glass-panel-wide">
          <h2 className="glass-header">Family Focus</h2>
          <div className="focus-grid">
            <FocusCard
              title="Colton Chores"
              detail={getChoreOpsSummary(choreOps)}
              tone={getChoreOpsFocusTone(choreOps)}
              body={getChoreOpsBody(choreOps)}
            />
            <FocusCard
              title="Shared Task List"
              detail={getTasksSummary(tasks)}
              tone={tasks.status === "ready" ? "good" : tasks.status === "error" ? "warn" : "pending"}
              body="The household list is live through Home Assistant todo entities and can already be used from this dashboard."
            />
            <FocusCard
              title="Family Calendar"
              detail={getCalendarSummary(calendar)}
              tone={calendar.status === "ready" ? "good" : calendar.status === "error" ? "warn" : "pending"}
              body="The calendar panel is ready. It will begin surfacing real events as soon as Home Assistant exposes calendar entities."
            />
          </div>
        </section>

        <section className="glass-panel glass-panel-wide">
          <h2 className="glass-header">Colton Module</h2>
          <ChoreOpsPanel
            onRefresh={() => {
              void loadChoreOps();
            }}
            state={choreOps}
          />
        </section>

        <section className="glass-panel glass-panel-wide">
          <h2 className="glass-header">Next Modules</h2>
          <ul className="module-list">
            <ModuleRow
              title="Colton reward dashboard"
              status="Next"
              note="Show chores, points, streaks, and rewards once ChoreOps is configured."
            />
            <ModuleRow
              title="Presence and routines"
              status="Planned"
              note="Use person, device_tracker, and calendar overlap to show who is home and what routine should run."
            />
            <ModuleRow
              title="Household alerts"
              status="Planned"
              note="Surface battery, door, lock, leak, and climate exceptions instead of raw entity counts."
            />
            <ModuleRow
              title="Parent controls"
              status="Planned"
              note="Approvals for kid chores, rewards, and important automations should live in one panel."
            />
          </ul>
        </section>
      </div>
    </main>
  );
}

function StatusChip({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "good" | "neutral" | "warn";
  value: string;
}) {
  return (
    <div className={`status-chip status-chip-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function SignalPanel({
  signals,
}: {
  signals: Array<{ label: string; note: string; value: string }>;
}) {
  return (
    <div className="signal-grid">
      {signals.map((signal) => (
        <article className="signal-card" key={signal.label}>
          <p className="signal-label">{signal.label}</p>
          <p className="signal-value">{signal.value}</p>
          <p className="signal-note">{signal.note}</p>
        </article>
      ))}
    </div>
  );
}

function LightsPanel({
  onRefresh,
  state,
}: {
  onRefresh: () => void;
  state: LightsState;
}) {
  if (state.status === "loading") {
    return <p>Loading lights...</p>;
  }

  if (state.status === "error") {
    return <p>{state.message}</p>;
  }

  const { data } = state;

  if (!data.configured) {
    return <p>Configure HA_URL and HA_TOKEN to load lights.</p>;
  }

  if (!data.connected) {
    return <p>{data.error}</p>;
  }

  const available = data.lights.filter((light) => light.isAvailable);
  const unavailable = data.lights.filter((light) => !light.isAvailable);

  return (
    <div className="lights-panel">
      <div className="panel-actions">
        <p className="panel-muted">
          {available.length} available · {unavailable.length} unavailable
        </p>
        <button className="secondary-button" onClick={onRefresh} type="button">
          Refresh
        </button>
      </div>

      <div className="lights-overview-grid">
        <StatusMetric label="Total lights" value={String(data.lights.length)} />
        <StatusMetric label="Available" value={String(available.length)} />
        <StatusMetric label="Unavailable" value={String(unavailable.length)} />
        <StatusMetric
          label="On now"
          value={String(data.lights.filter((light) => light.state === "on").length)}
        />
      </div>

      <ul className="lights-grid">
        {data.lights.slice(0, 24).map((light) => (
          <li
            className={`light-card ${light.isAvailable ? "light-card-live" : "light-card-offline"}`}
            key={light.entityId}
          >
            <div className="light-card-top">
              <p className="light-name">{light.name}</p>
              <span className="module-status">{light.state}</span>
            </div>
            <p className="light-meta">{light.area ?? "No area assigned"}</p>
            <p className="light-meta">
              {light.brightnessPercent !== null
                ? `${light.brightnessPercent}% brightness`
                : light.colorMode ?? "On/off light"}
            </p>
          </li>
        ))}
      </ul>

      {data.lights.length > 24 ? (
        <p className="panel-muted">
          Showing 24 of {data.lights.length} lights. This keeps the iPad layout usable while
          still surfacing the full lighting footprint.
        </p>
      ) : null}
    </div>
  );
}

type TaskPanelProps = {
  actionMessage: string | null;
  actionPending: boolean;
  newTaskSummary: string;
  onAddTask: (entityId: string) => Promise<void>;
  onCompleteTask: (entityId: string, item: string) => Promise<void>;
  onRefresh: () => void;
  onSummaryChange: (value: string) => void;
  state: TasksState;
};

function TaskPanel({
  actionMessage,
  actionPending,
  newTaskSummary,
  onAddTask,
  onCompleteTask,
  onRefresh,
  onSummaryChange,
  state,
}: TaskPanelProps) {
  if (state.status === "loading") {
    return <p>Loading tasks...</p>;
  }

  if (state.status === "error") {
    return <p>{state.message}</p>;
  }

  const { data } = state;

  if (!data.configured) {
    return <p>Configure HA_URL and HA_TOKEN to load tasks.</p>;
  }

  if (!data.connected) {
    return <p>{data.error}</p>;
  }

  if (data.lists.length === 0) {
    return (
      <>
        <p className="panel-muted">No Home Assistant to-do lists found.</p>
        {data.warnings.map((warning) => (
          <p className="panel-warning" key={warning}>
            {warning}
          </p>
        ))}
      </>
    );
  }

  const primaryList = data.lists[0];

  return (
    <div className="task-panel">
      <div className="panel-actions">
        <p className="panel-muted">
          {primaryList.name} · {primaryList.incompleteCount} open
        </p>
        <button className="secondary-button" onClick={onRefresh} type="button">
          Refresh
        </button>
      </div>

      <form
        className="task-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onAddTask(primaryList.entityId);
        }}
      >
        <input
          className="task-input"
          disabled={actionPending}
          onChange={(event) => {
            onSummaryChange(event.target.value);
          }}
          placeholder="Add a task"
          value={newTaskSummary}
        />
        <button className="secondary-button" disabled={actionPending} type="submit">
          Add
        </button>
      </form>

      {actionMessage ? <p className="panel-warning">{actionMessage}</p> : null}

      {primaryList.items.length > 0 ? (
        <ul className="task-list">
          {primaryList.items.map((task) => (
            <li className="task-list-item" key={task.uid}>
              <div>
                <p className="task-summary">{task.summary}</p>
                {task.description ? (
                  <p className="task-meta">{task.description}</p>
                ) : null}
              </div>
              <button
                className="secondary-button"
                disabled={actionPending}
                onClick={() => {
                  void onCompleteTask(primaryList.entityId, task.uid);
                }}
                type="button"
              >
                Done
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-muted">No open tasks. Great job!</p>
      )}

      {data.warnings.map((warning) => (
        <p className="panel-warning" key={warning}>
          {warning}
        </p>
      ))}
    </div>
  );
}

function CalendarPanel({
  onRefresh,
  state,
}: {
  onRefresh: () => void;
  state: CalendarState;
}) {
  if (state.status === "loading") {
    return <p>Loading calendar...</p>;
  }

  if (state.status === "error") {
    return <p>{state.message}</p>;
  }

  const { data } = state;

  if (!data.configured) {
    return <p>Configure HA_URL and HA_TOKEN to load calendars.</p>;
  }

  if (!data.connected) {
    return <p>{data.error}</p>;
  }

  if (data.calendars.length === 0) {
    return (
      <>
        <div className="panel-actions">
          <p className="panel-muted">Upcoming events for the next 7 days</p>
          <button className="secondary-button" onClick={onRefresh} type="button">
            Refresh
          </button>
        </div>
        <p className="panel-muted">No Home Assistant calendars found.</p>
        {data.warnings.map((warning) => (
          <p className="panel-warning" key={warning}>
            {warning}
          </p>
        ))}
      </>
    );
  }

  const upcomingEvents = data.calendars
    .flatMap((calendar) =>
      calendar.events.map((event) => ({
        ...event,
        calendarName: calendar.name,
      })),
    )
    .sort((left, right) => left.start.localeCompare(right.start))
    .slice(0, 8);

  return (
    <div className="calendar-panel">
      <div className="panel-actions">
        <p className="panel-muted">Upcoming events for the next 7 days</p>
        <button className="secondary-button" onClick={onRefresh} type="button">
          Refresh
        </button>
      </div>

      {upcomingEvents.length > 0 ? (
        <ul className="calendar-list">
          {upcomingEvents.map((event) => (
            <li
              className="calendar-list-item"
              key={`${event.calendarName}-${event.summary}-${event.start}`}
            >
              <div>
                <p className="task-summary">{event.summary}</p>
                <p className="task-meta">
                  {event.calendarName} · {formatCalendarRange(event.start, event.end, event.isAllDay)}
                </p>
                {event.location ? (
                  <p className="task-meta">Location: {event.location}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel-muted">No upcoming events in the next 7 days.</p>
      )}

      {data.warnings.map((warning) => (
        <p className="panel-warning" key={warning}>
          {warning}
        </p>
      ))}
    </div>
  );
}

function FocusCard({
  body,
  detail,
  title,
  tone,
}: {
  body: string;
  detail: string;
  title: string;
  tone: "good" | "pending" | "warn";
}) {
  return (
    <article className={`focus-card focus-card-${tone}`}>
      <p className="focus-title">{title}</p>
      <p className="focus-detail">{detail}</p>
      <p className="focus-body">{body}</p>
    </article>
  );
}

function ChoreOpsPanel({
  onRefresh,
  state,
}: {
  onRefresh: () => void;
  state: ChoreOpsState;
}) {
  if (state.status === "loading") {
    return <p>Loading ChoreOps status...</p>;
  }

  if (state.status === "error") {
    return <p>{state.message}</p>;
  }

  const { data } = state;

  if (!data.configured) {
    return <p>Configure HA_URL and HA_TOKEN to inspect ChoreOps.</p>;
  }

  if (!data.connected) {
    return <p>{data.error}</p>;
  }

  return (
    <div className="choreops-panel">
      <div className="panel-actions">
        <p className="panel-muted">ChoreOps integration readiness</p>
        <button className="secondary-button" onClick={onRefresh} type="button">
          Refresh
        </button>
      </div>

      <div className="choreops-status-grid">
        <StatusMetric
          label="Package"
          value={data.choreopsInstalled ? "Installed" : "Missing"}
        />
        <StatusMetric
          label="Integration"
          value={data.integrationConfigured ? "Configured" : "Not added"}
        />
        <StatusMetric
          label="Service domains"
          value={String(data.serviceDomains.length)}
        />
        <StatusMetric
          label="Runtime entities"
          value={String(data.entities.length)}
        />
      </div>

      {data.integrationConfigured ? (
        <p className="panel-muted">
          ChoreOps is configured in Home Assistant. As profile, reward, and chore
          entities appear, this panel can graduate into the full Colton workflow.
        </p>
      ) : (
        <ol className="checklist">
          <li>Add the ChoreOps integration in Home Assistant.</li>
          <li>Create the Colton profile.</li>
          <li>Add starter chores and rewards.</li>
          <li>Return here and refresh to detect the runtime surface.</li>
        </ol>
      )}

      {data.serviceDomains.length > 0 ? (
        <div className="entity-block">
          <p className="entity-block-title">Detected service domains</p>
          <div className="pill-row">
            {data.serviceDomains.map((domain) => (
              <span className="module-status" key={domain}>
                {domain}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {data.entities.length > 0 ? (
        <div className="entity-block">
          <p className="entity-block-title">Detected ChoreOps-related entities</p>
          <ul className="entity-list">
            {data.entities.slice(0, 8).map((entity) => (
              <li className="entity-list-item" key={entity.entityId}>
                <div>
                  <p className="task-summary">{entity.name}</p>
                  <p className="task-meta">{entity.entityId}</p>
                </div>
                <span className="module-status">{entity.state}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="status-metric">
      <p className="overview-label">{label}</p>
      <p className="status-metric-value">{value}</p>
    </article>
  );
}

function ModuleRow({
  note,
  status,
  title,
}: {
  note: string;
  status: string;
  title: string;
}) {
  return (
    <li className="module-row">
      <div>
        <p className="module-title">{title}</p>
        <p className="module-note">{note}</p>
      </div>
      <span className="module-status">{status}</span>
    </li>
  );
}

function formatCalendarRange(start: string, end: string, isAllDay: boolean) {
  if (isAllDay) {
    return new Date(`${start}T00:00:00`).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${startDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
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

function getStatusTone(
  value: string,
): "good" | "neutral" | "warn" {
  if (value === "Connected") {
    return "good";
  }

  if (value === "Connection Failed" || value === "Unavailable") {
    return "warn";
  }

  return "neutral";
}

function getTasksSummary(state: TasksState) {
  if (state.status === "loading") {
    return "Loading";
  }

  if (state.status === "error") {
    return "Issue";
  }

  if (!state.data.connected || state.data.lists.length === 0) {
    return "None";
  }

  return `${state.data.lists.reduce((sum, list) => sum + list.incompleteCount, 0)} open`;
}

function getCalendarSummary(state: CalendarState) {
  if (state.status === "loading") {
    return "Loading";
  }

  if (state.status === "error") {
    return "Issue";
  }

  if (!state.data.connected || state.data.calendars.length === 0) {
    return "No calendars";
  }

  const eventCount = state.data.calendars.reduce(
    (sum, calendar) => sum + calendar.events.length,
    0,
  );

  return `${eventCount} upcoming`;
}

function buildOverviewStats(
  homeAssistant: LoadState,
  tasks: TasksState,
  calendar: CalendarState,
  choreOps: ChoreOpsState,
  lights: LightsState,
) {
  const deviceCount =
    homeAssistant.status === "ready" && homeAssistant.data.connected
      ? String(homeAssistant.data.entityCount)
      : "—";
  const taskCount =
    tasks.status === "ready" && tasks.data.connected
      ? String(tasks.data.lists.reduce((sum, list) => sum + list.incompleteCount, 0))
      : "—";
  const calendarCount =
    calendar.status === "ready" && calendar.data.connected
      ? String(
          calendar.data.calendars.reduce(
            (sum, entry) => sum + entry.events.length,
            0,
          ),
        )
      : "—";
  const choreOpsValue =
    choreOps.status === "ready" && choreOps.data.connected
      ? choreOps.data.integrationConfigured
        ? "Ready"
        : choreOps.data.choreopsInstalled
          ? "Install setup"
          : "Missing"
      : "—";
  const lightsValue =
    lights.status === "ready" && lights.data.connected
      ? String(lights.data.lights.filter((light) => light.isAvailable).length)
      : "—";

  return [
    {
      label: "Home entities",
      value: deviceCount,
      note: "The current Home Assistant footprint exposed to Family Hub.",
    },
    {
      label: "Open tasks",
      value: taskCount,
      note: "Shared todos pulled from Home Assistant list entities.",
    },
    {
      label: "Upcoming events",
      value: calendarCount,
      note: "Events in the next 7 days across connected calendars.",
    },
    {
      label: "Kid system",
      value: choreOpsValue,
      note: "ChoreOps will power chores, points, and rewards for Colton.",
    },
    {
      label: "Live lights",
      value: lightsValue,
      note: "Available light entities surfaced for the lighting module.",
    },
  ];
}

function getChoreOpsSummary(state: ChoreOpsState) {
  if (state.status === "loading") {
    return "Loading";
  }

  if (state.status === "error") {
    return "Issue";
  }

  if (!state.data.connected) {
    return "Offline";
  }

  if (state.data.integrationConfigured) {
    return `${state.data.entities.length} entities`;
  }

  if (state.data.choreopsInstalled) {
    return "Needs setup";
  }

  return "Not installed";
}

function getChoreOpsTone(state: ChoreOpsState): "good" | "neutral" | "warn" {
  if (state.status === "error") {
    return "warn";
  }

  if (state.status === "ready" && state.data.connected && state.data.integrationConfigured) {
    return "good";
  }

  return "neutral";
}

function getChoreOpsFocusTone(state: ChoreOpsState): "good" | "pending" | "warn" {
  if (state.status === "error") {
    return "warn";
  }

  if (state.status === "ready" && state.data.connected && state.data.integrationConfigured) {
    return "good";
  }

  return "pending";
}

function getChoreOpsBody(state: ChoreOpsState) {
  if (state.status === "loading") {
    return "Checking Home Assistant for the ChoreOps runtime surface.";
  }

  if (state.status === "error") {
    return "The ChoreOps readiness check is failing. Resolve Home Assistant connectivity first.";
  }

  if (!state.data.connected) {
    return "Home Assistant is not reachable, so ChoreOps readiness cannot be determined.";
  }

  if (state.data.integrationConfigured) {
    return "ChoreOps is configured in Home Assistant. The next step is to map Colton-specific chores, rewards, and approvals into the dashboard UI.";
  }

  if (state.data.choreopsInstalled) {
    return "The ChoreOps package is installed, but the Home Assistant integration entry has not been completed yet.";
  }

  return "ChoreOps is not visible yet in Home Assistant. Install and configure it to begin the kid workflow.";
}

function formatHeroTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatHeroDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function buildHouseholdSignals(homeAssistant: LoadState) {
  if (homeAssistant.status !== "ready" || !homeAssistant.data.connected) {
    return [
      {
        label: "Occupancy",
        value: "—",
        note: "Waiting for Home Assistant connection.",
      },
      {
        label: "Lighting",
        value: "—",
        note: "Lighting counts appear when Home Assistant is reachable.",
      },
      {
        label: "Climate",
        value: "—",
        note: "Climate devices appear here when connected.",
      },
    ];
  }

  const domains = homeAssistant.data.entitiesByDomain;

  return [
    {
      label: "Occupancy",
      value: String((domains.person ?? 0) + (domains.device_tracker ?? 0)),
      note: "People and trackers currently exposed to the dashboard.",
    },
    {
      label: "Lighting",
      value: String(domains.light ?? 0),
      note: "Lights currently visible through Home Assistant.",
    },
    {
      label: "Climate",
      value: String(domains.climate ?? 0),
      note: "Climate devices ready for future comfort controls.",
    },
    {
      label: "Security",
      value: String((domains.lock ?? 0) + (domains.cover ?? 0)),
      note: "Locks and covers ready for future access panels.",
    },
  ];
}

function getTodayTaskHeadline(state: TasksState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "Task sync pending";
  }

  const firstList = state.data.lists[0];

  if (!firstList) {
    return "No task lists yet";
  }

  return firstList.items[0]?.summary ?? "Queue is clear";
}

function getTodayTaskCopy(state: TasksState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "The shared household list will appear here once Home Assistant task data is available.";
  }

  const total = state.data.lists.reduce((sum, list) => sum + list.incompleteCount, 0);

  return total > 0
    ? `${total} open household tasks across ${state.data.lists.length} list${state.data.lists.length === 1 ? "" : "s"}.`
    : "No open household tasks right now.";
}

function getTodayCalendarHeadline(state: CalendarState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "Calendar sync pending";
  }

  const nextEvent = state.data.calendars
    .flatMap((calendar) => calendar.events)
    .sort((left, right) => left.start.localeCompare(right.start))[0];

  return nextEvent?.summary ?? "No upcoming events";
}

function getTodayCalendarCopy(state: CalendarState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "Upcoming family events will show here once calendars are available in Home Assistant.";
  }

  const total = state.data.calendars.reduce(
    (sum, calendar) => sum + calendar.events.length,
    0,
  );

  return total > 0
    ? `${total} event${total === 1 ? "" : "s"} in the next 7 days.`
    : "No events scheduled in the next 7 days.";
}

function getTodayChoreHeadline(state: ChoreOpsState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "ChoreOps check pending";
  }

  if (state.data.integrationConfigured) {
    return "Colton workflow ready";
  }

  if (state.data.choreopsInstalled) {
    return "Finish ChoreOps setup";
  }

  return "Install ChoreOps";
}

function getTodayChoreCopy(state: ChoreOpsState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "The kid workflow module will update automatically once Home Assistant is reachable.";
  }

  if (state.data.integrationConfigured) {
    return `${state.data.entities.length} related entities detected so far. The dashboard is ready for the next kid-facing layer.`;
  }

  if (state.data.choreopsInstalled) {
    return "The package exists in Home Assistant, but the integration entry still needs profile, chore, and reward setup.";
  }

  return "ChoreOps has not appeared yet in Home Assistant runtime data.";
}

function getLightsSummary(state: LightsState) {
  if (state.status === "loading") {
    return "Loading";
  }

  if (state.status === "error") {
    return "Issue";
  }

  if (!state.data.connected) {
    return "Offline";
  }

  return `${state.data.lights.filter((light) => light.isAvailable).length} live`;
}

function getLightsTone(state: LightsState): "good" | "neutral" | "warn" {
  if (state.status === "error") {
    return "warn";
  }

  if (state.status === "ready" && state.data.connected) {
    return "good";
  }

  return "neutral";
}

function getTodayLightsHeadline(state: LightsState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "Light sync pending";
  }

  const live = state.data.lights.filter((light) => light.isAvailable).length;
  const total = state.data.lights.length;

  return `${live} of ${total} lights reachable`;
}

function getTodayLightsCopy(state: LightsState) {
  if (state.status !== "ready" || !state.data.connected) {
    return "The lighting panel will report fixture availability as soon as Home Assistant light data loads.";
  }

  const unavailable = state.data.lights.filter((light) => !light.isAvailable).length;

  return unavailable > 0
    ? `${unavailable} lights are currently unavailable, so the panel emphasizes availability alongside fixture names.`
    : "All visible lights are currently reachable from Home Assistant.";
}
