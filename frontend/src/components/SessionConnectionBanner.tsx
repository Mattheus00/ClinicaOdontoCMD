import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { isInvalidSession, refreshAccessToken } from '../services/api';

export function SessionConnectionBanner() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const { logout } = useAuth();
  const client = useQueryClient();
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('app:session-unavailable', show);
    return () => window.removeEventListener('app:session-unavailable', show);
  }, []);
  if (!visible) return null;
  return <div className="session-connection-banner" role="alert"><span>Não foi possível renovar a conexão. Seu trabalho nesta tela foi mantido. Reconecte antes de salvar.</span><button className="btn btn-secondary" disabled={busy} onClick={async () => {
    setBusy(true);
    try { await refreshAccessToken(); setVisible(false); await client.invalidateQueries({ predicate: query => query.queryKey[0] !== 'appointment-report-draft' }); }
    catch (error) { if (isInvalidSession(error)) logout(); }
    finally { setBusy(false); }
  }}>{busy ? 'Reconectando…' : 'Tentar reconectar'}</button></div>;
}
