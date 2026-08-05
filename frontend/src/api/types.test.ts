import { describe, expect, it } from 'vitest';
import { asPage } from '../api/types';

describe('asPage', () => {
  it('normalizes paginated API responses', () => {
    const page = asPage<{ id: string }>({
      content: [{ id: '1' }],
      totalPages: 2,
      totalElements: 3,
      number: 1,
      size: 20,
    });

    expect(page.content).toHaveLength(1);
    expect(page.totalPages).toBe(2);
    expect(page.number).toBe(1);
  });

  it('returns empty page for invalid payloads', () => {
    const page = asPage<{ id: string }>(null);

    expect(page.content).toEqual([]);
    expect(page.totalPages).toBe(0);
    expect(page.totalElements).toBe(0);
  });
});
