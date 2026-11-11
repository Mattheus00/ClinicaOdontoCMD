package com.dentic.api.billing.web;

import com.dentic.api.billing.service.BillingService;
import com.dentic.api.security.SecurityUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BillingController {
    private final BillingService billing;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BillingController(BillingService billing) {
        this.billing = billing;
    }

    @GetMapping("/billing/plans")
    public ResponseEntity<List<Map<String, Object>>> plans() {
        return ResponseEntity.ok(billing.listPlans());
    }

    @GetMapping("/billing/subscription")
    public ResponseEntity<Map<String, Object>> subscription() {
        return ResponseEntity.ok(billing.currentSubscription());
    }

    @GetMapping("/billing/invoices")
    public ResponseEntity<List<Map<String, Object>>> invoices() {
        return ResponseEntity.ok(billing.listInvoices());
    }

    @PostMapping("/billing/subscribe")
    public ResponseEntity<Map<String, Object>> subscribe(@RequestBody SubscribeRequest request) {
        SecurityUtils.requireAdmin();
        String slug = request == null ? null : firstNonBlank(request.planSlug(), request.planId());
        String coupon = request == null ? null : firstNonBlank(request.coupon(), request.couponCode());
        return ResponseEntity.ok(billing.subscribe(slug, coupon));
    }

    @PostMapping("/billing/cancel")
    public ResponseEntity<Map<String, Object>> cancel() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok(billing.cancel());
    }

    @PostMapping("/webhooks/abacate")
    public ResponseEntity<String> handleAbacateWebhook(
            @RequestParam(value = "webhookSecret", required = false) String webhookSecret,
            @RequestBody byte[] rawPayload
    ) {
        try {
            JsonNode payload = objectMapper.readTree(rawPayload == null ? "{}".getBytes() : rawPayload);
            billing.handleAbacateWebhook(webhookSecret, payload);
            return ResponseEntity.ok("ok");
        } catch (org.springframework.web.server.ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid webhook payload");
        }
    }

    public record SubscribeRequest(String planSlug, String planId, String coupon, String couponCode) {}

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
