import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setAuthHandlers, refreshAccessToken, invalidateSessionRequests } from './api';

describe('session recovery', () => {
  const logout = vi.fn();
  const setAccessToken = vi.fn();
  beforeEach(() => {
    invalidateSessionRequests();
    logout.mockClear(); setAccessToken.mockClear();
    vi.stubGlobal('window', new EventTarget());
    setAuthHandlers({ getAccessToken: () => 'old-token', setAccessToken, logout });
  });
  afterEach(() => { setAuthHandlers(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  const expiredRequest = () => api.get('/test-private', { adapter: async config => {
    throw new AxiosError('expired', 'ERR_BAD_REQUEST', config, undefined, { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config });
  } });

  it('keeps the session and announces recovery when refresh fails due to network', async () => {
    const unavailable = vi.fn(); window.addEventListener('app:session-unavailable', unavailable);
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    await expect(expiredRequest()).rejects.toThrow('Network Error');
    expect(logout).not.toHaveBeenCalled(); expect(unavailable).toHaveBeenCalledOnce();
  });
  it('keeps the session when refresh returns 503', async () => {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, undefined, { status: 503, statusText: 'Unavailable', data: {}, headers: {}, config }));
    await expect(expiredRequest()).rejects.toThrow('unavailable'); expect(logout).not.toHaveBeenCalled();
  });
  it('logs out when the server rejects the refresh credential', async () => {
    const config = { headers: {} } as InternalAxiosRequestConfig;
    vi.spyOn(axios, 'post').mockRejectedValue(new AxiosError('invalid session', 'ERR_BAD_REQUEST', config, undefined, { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config }));
    await expect(expiredRequest()).rejects.toThrow('invalid session'); expect(logout).toHaveBeenCalledOnce();
  });
  it('does not restore a previous identity after logout while refresh is in flight', async () => {
    let resolve!: (value: {data: {accessToken: string}}) => void;
    vi.spyOn(axios, 'post').mockImplementation(() => new Promise(done => { resolve = done; }));
    const pending = refreshAccessToken();
    invalidateSessionRequests();
    resolve({ data: { accessToken: 'stale-identity' } });
    await expect(pending).rejects.toThrow('Session changed');
    expect(setAccessToken).not.toHaveBeenCalled();
  });

});
