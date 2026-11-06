import { describe, expect, it, vi } from 'vitest';
import { cacheScope, createAppQueryClient, disposeQueryClient } from './query-client';

describe('session cache', () => {
  it('isolates two users and clinics and clears on logout', async () => {
    const a = createAppQueryClient(cacheScope({ clinicId: 'one', userId: 'a', role: 'ADMIN' }));
    const b = createAppQueryClient(cacheScope({ clinicId: 'two', userId: 'b', role: 'ADMIN' }));
    a.setQueryData(['patients'], ['private']);
    expect(b.getQueryData(['patients'])).toBeUndefined();
    disposeQueryClient(a);
    expect(a.getQueryData(['patients'])).toBeUndefined();
    disposeQueryClient(b);
  });
  it('reuses reference data and still supports prefix invalidation', async () => {
    const client = createAppQueryClient('one/a'); const queryFn = vi.fn(async () => ['dentist']);
    await client.fetchQuery({ queryKey: ['professionals'], queryFn });
    await client.fetchQuery({ queryKey: ['professionals'], queryFn });
    expect(queryFn).toHaveBeenCalledTimes(1);
    await client.invalidateQueries({ queryKey: ['professionals'] });
    await client.fetchQuery({ queryKey: ['professionals'], queryFn });
    expect(queryFn).toHaveBeenCalledTimes(2); disposeQueryClient(client);
  });
  it('aborts in-flight data requests when disposing a session', async () => {
    const client = createAppQueryClient('old'); let signal: AbortSignal | undefined;
    const pending = client.fetchQuery({ queryKey: ['patients'], queryFn: context => {
      signal = context.signal; return new Promise<string>(() => {});
    } }).catch(() => undefined);
    disposeQueryClient(client); await pending;
    expect(signal?.aborted).toBe(true); expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
