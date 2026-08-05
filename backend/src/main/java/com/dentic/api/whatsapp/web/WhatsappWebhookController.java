package com.dentic.api.whatsapp.web;

import com.dentic.api.security.WebhookSignatureVerifier;
import com.dentic.api.whatsapp.service.WhatsAppMessageHandler;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/whatsapp")
public class WhatsappWebhookController {

    private final WhatsAppMessageHandler messageHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${dentic.webhooks.whatsapp.secret:}")
    private String webhookSecret;

    public WhatsappWebhookController(WhatsAppMessageHandler messageHandler) {
        this.messageHandler = messageHandler;
    }

    @PostMapping
    public ResponseEntity<String> receiveMessage(
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody byte[] rawPayload
    ) {
        if (!WebhookSignatureVerifier.verify(signature, rawPayload, webhookSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid webhook signature");
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(rawPayload, new TypeReference<>() {});
            messageHandler.processMessageAsync(payload);
            return ResponseEntity.ok("Received");
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Invalid JSON payload");
        }
    }
}
