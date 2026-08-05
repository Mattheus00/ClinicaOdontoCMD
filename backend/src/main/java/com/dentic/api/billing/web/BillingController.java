package com.dentic.api.billing.web;

import com.dentic.api.security.SecurityUtils;
import com.dentic.api.security.WebhookSignatureVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BillingController {

    @Value("${dentic.webhooks.billing.secret:}")
    private String webhookSecret;

    @GetMapping("/billing/subscription")
    public ResponseEntity<Map<String, Object>> subscription() {
        return ResponseEntity.ok(Map.of("planName", "Período de teste", "status", "TRIAL", "price", 0, "currency", "BRL", "features", List.of("Agenda e pacientes", "Profissionais", "Atendimento organizado")));
    }

    @GetMapping("/billing/invoices")
    public ResponseEntity<List<Object>> invoices() { return ResponseEntity.ok(List.of()); }

    @PostMapping("/billing/subscribe")
    public ResponseEntity<String> subscribe() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok("Subscription created.");
    }

    @PostMapping("/webhooks/billing")
    public ResponseEntity<String> handleBillingWebhook(
            @RequestHeader(value = "X-Billing-Signature", required = false) String signature,
            @RequestBody byte[] rawPayload
    ) {
        if (!WebhookSignatureVerifier.verify(signature, rawPayload, webhookSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid webhook signature");
        }
        return ResponseEntity.ok("Webhook received.");
    }
}
