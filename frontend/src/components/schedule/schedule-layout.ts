export type EventLayout = {
  columnIndex: number;
  columnCount: number;
};

type TimedEvent = {
  id: string;
  startMs: number;
  endMs: number;
};

function overlaps(a: TimedEvent, b: TimedEvent) {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

function buildOverlapClusters(events: TimedEvent[]): TimedEvent[][] {
  if (!events.length) return [];

  const clusters: TimedEvent[][] = [];
  const visited = new Set<string>();

  for (const event of events) {
    if (visited.has(event.id)) continue;

    const cluster: TimedEvent[] = [];
    const queue = [event];
    visited.add(event.id);

    while (queue.length) {
      const current = queue.pop()!;
      cluster.push(current);

      for (const candidate of events) {
        if (visited.has(candidate.id)) continue;
        if (!overlaps(current, candidate)) continue;
        visited.add(candidate.id);
        queue.push(candidate);
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

function layoutCluster(events: TimedEvent[]): Map<string, EventLayout> {
  const layout = new Map<string, EventLayout>();
  if (!events.length) return layout;

  const sorted = [...events].sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const columnEnds: number[] = [];
  const columnById = new Map<string, number>();

  for (const event of sorted) {
    let columnIndex = columnEnds.findIndex((endMs) => endMs <= event.startMs);
    if (columnIndex === -1) {
      columnIndex = columnEnds.length;
      columnEnds.push(event.endMs);
    } else {
      columnEnds[columnIndex] = event.endMs;
    }
    columnById.set(event.id, columnIndex);
  }

  const columnCount = Math.max(columnEnds.length, 1);
  for (const event of sorted) {
    layout.set(event.id, {
      columnIndex: columnById.get(event.id) ?? 0,
      columnCount,
    });
  }

  return layout;
}

export function layoutConcurrentAppointments(
  appointments: Array<{ id: string; startsAt: string; endsAt: string }>,
): Map<string, EventLayout> {
  const events: TimedEvent[] = appointments.map((appointment) => ({
    id: appointment.id,
    startMs: new Date(appointment.startsAt).getTime(),
    endMs: new Date(appointment.endsAt).getTime(),
  }));

  const layout = new Map<string, EventLayout>();
  for (const cluster of buildOverlapClusters(events)) {
    for (const [id, value] of layoutCluster(cluster)) {
      layout.set(id, value);
    }
  }

  for (const event of events) {
    if (!layout.has(event.id)) {
      layout.set(event.id, { columnIndex: 0, columnCount: 1 });
    }
  }

  return layout;
}
