package com.dentic.api.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private final UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID clinicId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID professionalId = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider("test-secret-key-with-more-than-32-characters-long");
    }

    @Test
    void generateToken_shouldBeValidAndExposeClaims() {
        String token = jwtProvider.generateToken(userId, clinicId, "admin");

        assertTrue(jwtProvider.validateToken(token));
        assertEquals(userId, jwtProvider.getUserIdFromToken(token));
        assertEquals(clinicId, jwtProvider.getClinicIdFromToken(token));
        assertEquals("ADMIN", jwtProvider.getRoleFromToken(token));
        assertNull(jwtProvider.getProfessionalIdFromToken(token));
    }

    @Test
    void generateToken_withProfessional_shouldIncludeProfessionalClaim() {
        String token = jwtProvider.generateToken(userId, clinicId, "dentist", professionalId);

        assertTrue(jwtProvider.validateToken(token));
        assertEquals(professionalId, jwtProvider.getProfessionalIdFromToken(token));
        assertEquals("DENTIST", jwtProvider.getRoleFromToken(token));
    }

    @Test
    void validateToken_withTamperedToken_shouldReturnFalse() {
        String token = jwtProvider.generateToken(userId, clinicId, "admin");
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertFalse(jwtProvider.validateToken(tampered));
    }

    @Test
    void validateToken_withMalformedToken_shouldReturnFalse() {
        assertFalse(jwtProvider.validateToken("invalid.token"));
    }
}
