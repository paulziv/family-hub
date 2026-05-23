"use client";

import { useEffect, useState } from "react";
import type {
  HomeAssistantCalendarResponse,
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
  const [newTaskSummary, setNewTaskSummary] = useState("");
  const [taskActionMessage, setTaskActionMessage] = useState<string | null>(null);
  const [taskActionPending, setTaskActionPending] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();

    void loadHomeAssistantStatus(controller.signal);
    void loadTasks(controller.signal);
    void loadCalendar(controller.signal);

    const refreshId = window.setInterval(() => {
      void loadHomeAssistantStatus(controller.signal);
      void loadTasks(controller.signal);
      void loadCalendar(controller.signal);
    }, 60_000);

    return () => {
      window.clearInterval(refreshId);
      controller.abort();
    };
  }, []);

  const smartHomeStatus = getSmartHomeStatus(homeAssistant);
  const overviewStats = buildOverviewStats(homeAssistant, tasks, calendar);

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
              detail="ChoreOps"
              tone="pending"
              body="Waiting for ChoreOps profile, chores, and rewards to be configured in Home Assistant."
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
      value: "Pending",
      note: "ChoreOps will power chores, points, and rewards for Colton.",
    },
  ];
}
