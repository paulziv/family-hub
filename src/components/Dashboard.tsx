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
