package com.dentic.api.performance;

import org.slf4j.LoggerFactory;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.lang.management.ManagementFactory;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class AvailabilityController {
    private final ApplicationAvailability availability;
    public AvailabilityController(ApplicationAvailability availability) { this.availability = availability; }
    @GetMapping("/live") public Map<String, String> live() { return Map.of("status", "UP"); }
    @GetMapping("/ready") public ResponseEntity<Map<String, String>> ready() {
        boolean ready = availability.getReadinessState() == ReadinessState.ACCEPTING_TRAFFIC;
        return ResponseEntity.status(ready ? 200 : 503).body(Map.of("status", ready ? "UP" : "STARTING"));
    }
    @EventListener
    public void started(ApplicationReadyEvent event) {
        LoggerFactory.getLogger(AvailabilityController.class).info("startup_ready spring_ms={} jvm_uptime_ms={}",
                event.getTimeTaken().toMillis(), ManagementFactory.getRuntimeMXBean().getUptime());
    }
}
