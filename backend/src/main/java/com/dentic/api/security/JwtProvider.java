package com.dentic.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JwtProvider {
    private final byte[] secret;
    public JwtProvider(@Value("${dentic.jwt.secret}") String secret) { this.secret = secret.getBytes(StandardCharsets.UTF_8); }
    public String generateToken(UUID userId, UUID clinicId, String role) {
        return generateToken(userId, clinicId, role, null);
    }

    public String generateToken(UUID userId, UUID clinicId, String role, UUID professionalId) {
        try {
            String header = encode("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
            StringBuilder payloadJson = new StringBuilder();
            payloadJson.append("{\"sub\":\"").append(userId)
                    .append("\",\"clinic_id\":\"").append(clinicId)
                    .append("\",\"role\":\"").append(role.toUpperCase())
                    .append("\",\"exp\":").append(Instant.now().plusSeconds(900).getEpochSecond());
            if (professionalId != null) {
                payloadJson.append(",\"professional_id\":\"").append(professionalId).append("\"");
            }
            payloadJson.append("}");
            String payload = encode(payloadJson.toString());
            return header + "." + payload + "." + sign(header + "." + payload);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create token", exception);
        }
    }
    public boolean validateToken(String token) { try { String[] parts = token.split("\\."); return parts.length == 3 && java.security.MessageDigest.isEqual(sign(parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8), parts[2].getBytes(StandardCharsets.UTF_8)) && Long.parseLong(value(token, "exp")) > Instant.now().getEpochSecond(); } catch (Exception exception) { return false; } }
    public UUID getClinicIdFromToken(String token) { return UUID.fromString(value(token, "clinic_id")); }
    public UUID getUserIdFromToken(String token) { return UUID.fromString(value(token, "sub")); }
    public String getRoleFromToken(String token) { return value(token, "role"); }
    public UUID getProfessionalIdFromToken(String token) {
        try {
            return UUID.fromString(value(token, "professional_id"));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
    private String value(String token, String name) { String json = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]), StandardCharsets.UTF_8); Matcher matcher = Pattern.compile("\\\"" + name + "\\\"\\s*:\\s*(?:\\\"([^\\\"]+)\\\"|(\\d+))").matcher(json); if (!matcher.find()) throw new IllegalArgumentException("Missing claim"); return matcher.group(1) != null ? matcher.group(1) : matcher.group(2); }
    private String sign(String data) throws Exception { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(secret, "HmacSHA256")); return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8))); }
    private String encode(String value) { return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8)); }
}
