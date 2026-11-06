package com.dentic.api.performance;

/** Request-local numbers only: no SQL, parameters, tokens or patient information. */
final class RequestTiming {
    static final ThreadLocal<RequestTiming> CURRENT = new ThreadLocal<>();
    final long started = System.nanoTime();
    long connectionNanos;
    int connections;
    double elapsedMs() { return (System.nanoTime() - started) / 1_000_000d; }
}
