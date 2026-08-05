import { describe, expect, it } from 'vitest';
import { readApiError } from './api-error';

describe('readApiError', () => {
  it('returns backend message when present', () => {
    const error = {
      response: {
        data: { message: 'Credenciais inválidas.' },
      },
    };

    expect(readApiError(error, 'fallback')).toBe('Credenciais inválidas.');
  });

  it('returns string response body when provided', () => {
    const error = {
      response: {
        data: 'Serviço indisponível',
      },
    };

    expect(readApiError(error, 'fallback')).toBe('Serviço indisponível');
  });

  it('returns fallback for unknown errors', () => {
    expect(readApiError(new Error('network'), 'Não foi possível concluir.')).toBe('Não foi possível concluir.');
  });
});
