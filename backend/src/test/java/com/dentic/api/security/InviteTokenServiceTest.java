package com.dentic.api.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class InviteTokenServiceTest {

    private final InviteTokenService service = new InviteTokenService();

    @Test
    void generateToken_shouldProduceUniqueValues() {
        String first = service.generateToken();
        String second = service.generateToken();

        assertNotNull(first);
        assertNotNull(second);
        assertNotEquals(first, second);
        assertTrue(first.length() > 20);
    }

    @Test
    void hash_shouldBeDeterministic() {
        String token = "invite-token-example";

        assertEquals(service.hash(token), service.hash(token));
        assertNotEquals(token, service.hash(token));
    }

    @Test
    void hash_shouldDifferForDifferentTokens() {
        assertNotEquals(service.hash("token-a"), service.hash("token-b"));
    }
}
