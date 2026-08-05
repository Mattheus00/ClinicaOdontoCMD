import { useCallback, useEffect, useRef } from 'react';
import type { ToothSelectEvent } from '../../../features/odontogram/odontogram.types';
import './OdontogramVisual.css';

type Props = {
  statuses: Map<string, string>;
  selectedTeeth: Set<string>;
  focusedTooth: string | null;
  onSelectTooth: (event: ToothSelectEvent) => void;
};

export default function OdontogramVisual({ statuses, selectedTeeth, focusedTooth, onSelectTooth }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);

  const syncIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !readyRef.current) return;
    win.postMessage(
      {
        type: 'odontogram-sync',
        statuses: Object.fromEntries(statuses),
        selected: Array.from(selectedTeeth),
        focused: focusedTooth,
      },
      window.location.origin,
    );
  }, [statuses, selectedTeeth, focusedTooth]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type === 'odontogram-ready') {
        readyRef.current = true;
        syncIframe();
        return;
      }
      if (event.data?.type === 'odontogram-tooth-select' && typeof event.data.fdi === 'string') {
        onSelectTooth({ tooth: event.data.fdi });
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSelectTooth, syncIframe]);

  useEffect(() => {
    syncIframe();
  }, [syncIframe]);

  return (
    <div className="odo-visual-wrap">
      <iframe
        ref={iframeRef}
        src="/odontogram/viewer.html"
        title="Odontograma clínico"
        className="odo-visual-iframe"
      />
    </div>
  );
}
