package com.dentic.api.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class WebhookSignatureVerifier {

    private WebhookSignatureVerifier() {}

    public static boolean verify(String signature, byte[] payload, String secret) {
        if (secret == null || secret.isBlank() || signature == null || payload == null) return false;

        String normalized = signature.startsWith("sha256=") ? signature.substring("sha256=".length()) : signature;
        if (!normalized.matches("[0-9a-fA-F]{64}")) return false;

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = HexFormat.of().parseHex(normalized);
            return MessageDigest.isEqual(expected, mac.doFinal(payload));
        } catch (Exception exception) {
            return false;
        }
    }
}
