import { useEffect, useRef } from 'react';
import { onCLS, onINP, onLCP } from 'web-vitals';

type Sample = { name: string; value: number; unit: 'ms' | 'score'; at: number };
const samples: Sample[] = [];

/** Bounded, memory-only diagnostics: never store URLs, identifiers, tokens or payloads. */
export function recordPerformance(name: string, value: number, unit: Sample['unit'] = 'ms') {
  if (!Number.isFinite(value) || value < 0) return;
  const sample = { name, value: Math.round(value * 100) / 100, unit, at: Date.now() };
  samples.push(sample);
  if (samples.length > 200) samples.shift();
  window.dispatchEvent(new CustomEvent('app:performance', { detail: sample }));
}

export function startPerformanceCollection() {
  onLCP(metric => recordPerformance('LCP', metric.value));
  onINP(metric => recordPerformance('INP', metric.value));
  onCLS(metric => recordPerformance('CLS', metric.value, 'score'));
  // Manual export for a support session. No automatic network calls or persistence.
  Object.defineProperty(window, '__denticPerformance', {
    configurable: true, value: () => samples.map(sample => ({ ...sample })),
  });
}

/** Time from mounting the destination screen to painting its main data, including cache hits. */
export function useDataReadyMetric(screen: string, ready: boolean) {
  const started = useRef(performance.now());
  const sent = useRef(false);
  useEffect(() => {
    if (!ready || sent.current) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        if (!sent.current) recordPerformance(`data_ready:${screen}`, performance.now() - started.current);
        sent.current = true;
      });
    });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [ready, screen]);
}
