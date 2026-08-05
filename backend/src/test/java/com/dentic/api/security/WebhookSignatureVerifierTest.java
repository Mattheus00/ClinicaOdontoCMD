package com.dentic.api.security;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class WebhookSignatureVerifierTest {

    @Test
    void rejectsMissingOrInvalidSignature() {
        byte[] payload = "{\"event\":\"paid\"}".getBytes(StandardCharsets.UTF_8);

        assertFalse(WebhookSignatureVerifier.verify(null, payload, "secret"));
        assertFalse(WebhookSignatureVerifier.verify("sha256=00", payload, "secret"));
        assertFalse(WebhookSignatureVerifier.verify(null, payload, ""));
    }

    @Test
    void acceptsExactHmacSignature() {
        byte[] payload = "{\"event\":\"paid\"}".getBytes(StandardCharsets.UTF_8);

        assertTrue(WebhookSignatureVerifier.verify(
                "sha256=d10706b9b0313fa2f968e2643f982865d2b912ad94a13de0b9c4af48fb3930a9",
                payload,
                "secret"
        ));
    }
}
