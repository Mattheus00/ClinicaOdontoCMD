import { describe, expect, it } from 'vitest';
import { layoutConcurrentAppointments } from './schedule-layout';

describe('layoutConcurrentAppointments', () => {
  it('places same-time appointments side by side', () => {
    const layout = layoutConcurrentAppointments([
      {
        id: 'a',
        startsAt: '2026-07-27T10:00:00',
        endsAt: '2026-07-27T10:30:00',
      },
      {
        id: 'b',
        startsAt: '2026-07-27T10:00:00',
        endsAt: '2026-07-27T10:30:00',
      },
    ]);

    expect(layout.get('a')).toEqual({ columnIndex: 0, columnCount: 2 });
    expect(layout.get('b')).toEqual({ columnIndex: 1, columnCount: 2 });
  });

  it('keeps non-overlapping appointments full width', () => {
    const layout = layoutConcurrentAppointments([
      {
        id: 'a',
        startsAt: '2026-07-27T10:00:00',
        endsAt: '2026-07-27T10:30:00',
      },
      {
        id: 'b',
        startsAt: '2026-07-27T11:00:00',
        endsAt: '2026-07-27T11:30:00',
      },
    ]);

    expect(layout.get('a')).toEqual({ columnIndex: 0, columnCount: 1 });
    expect(layout.get('b')).toEqual({ columnIndex: 0, columnCount: 1 });
  });
});
