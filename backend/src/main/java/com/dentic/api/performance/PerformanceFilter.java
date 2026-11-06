package com.dentic.api.performance;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;
import java.io.*;
import java.util.Locale;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class PerformanceFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(PerformanceFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var timing = new RequestTiming();
        String id = UUID.randomUUID().toString();
        RequestTiming.CURRENT.set(timing);
        response.setHeader("X-Request-Id", id);
        var wrapped = new TimedResponse(response, timing);
        try {
            chain.doFilter(request, wrapped);
        } finally {
            wrapped.finish();
            Object route = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
            // Never log raw URLs: they can contain names, identifiers or invitation tokens.
            log.info("request_timing id={} method={} route={} status={} total_ms={} db_acquire_ms={} db_connections={}",
                    id, request.getMethod(), route == null ? "unmapped" : route, response.getStatus(),
                    Math.round(timing.elapsedMs()), timing.connectionNanos / 1_000_000, timing.connections);
            RequestTiming.CURRENT.remove();
        }
    }

    /** Stamp before the first byte without buffering/copying the response body. */
    private static final class TimedResponse extends HttpServletResponseWrapper {
        private final RequestTiming timing;
        private ServletOutputStream stream;
        private PrintWriter writer;
        private boolean stamped;
        TimedResponse(HttpServletResponse response, RequestTiming timing) { super(response); this.timing = timing; }
        void finish() { stamp(); if (writer != null) writer.flush(); }
        void stamp() {
            if (!stamped && !isCommitted()) {
                setHeader("Server-Timing", String.format(Locale.ROOT, "app;dur=%.2f, dbpool;dur=%.2f",
                        timing.elapsedMs(), timing.connectionNanos / 1_000_000d));
                stamped = true;
            }
        }
        @Override public ServletOutputStream getOutputStream() throws IOException {
            if (stream == null) {
                var delegate = super.getOutputStream();
                stream = new ServletOutputStream() {
                    public boolean isReady() { return delegate.isReady(); }
                    public void setWriteListener(WriteListener listener) { delegate.setWriteListener(listener); }
                    public void write(int b) throws IOException { stamp(); delegate.write(b); }
                    public void write(byte[] b, int off, int len) throws IOException { stamp(); delegate.write(b, off, len); }
                    public void flush() throws IOException { stamp(); delegate.flush(); }
                    public void close() throws IOException { stamp(); delegate.close(); }
                };
            }
            return stream;
        }
        @Override public PrintWriter getWriter() throws IOException {
            if (writer == null) writer = new PrintWriter(new OutputStreamWriter(getOutputStream(), getCharacterEncoding()));
            return writer;
        }
        @Override public void flushBuffer() throws IOException { stamp(); if (writer != null) writer.flush(); super.flushBuffer(); }
        @Override public void sendError(int code) throws IOException { stamp(); super.sendError(code); }
        @Override public void sendError(int code, String message) throws IOException { stamp(); super.sendError(code, message); }
        @Override public void sendRedirect(String location) throws IOException { stamp(); super.sendRedirect(location); }
    }
}
