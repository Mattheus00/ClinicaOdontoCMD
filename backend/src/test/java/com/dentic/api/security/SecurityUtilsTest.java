package com.dentic.api.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilsTest {

    private final UUID userId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        AuthAttributes.clear();
    }

    @Test
    void currentUserId_shouldReadPrincipalAsUuid() {
        authenticate(userId, "ROLE_ADMIN");

        assertEquals(userId, SecurityUtils.currentUserId().orElseThrow());
    }

    @Test
    void isAdmin_shouldDetectAdminRole() {
        authenticate(userId, "ROLE_ADMIN");

        assertTrue(SecurityUtils.isAdmin());
        assertFalse(SecurityUtils.isDentist());
    }

    @Test
    void isDentist_shouldDetectDentistRole() {
        authenticate(userId, "ROLE_DENTIST");

        assertTrue(SecurityUtils.isDentist());
        assertFalse(SecurityUtils.isAdmin());
    }

    @Test
    void requireAdmin_shouldRejectNonAdmin() {
        authenticate(userId, "ROLE_DENTIST");

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                SecurityUtils::requireAdmin
        );
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    @Test
    void requireProfessionalId_shouldReturnLinkedProfessional() {
        UUID professionalId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        AuthAttributes.setProfessionalId(professionalId);

        assertEquals(professionalId, SecurityUtils.requireProfessionalId());
    }

    @Test
    void requireProfessionalId_withoutLink_shouldThrowForbidden() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                SecurityUtils::requireProfessionalId
        );
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
    }

    private void authenticate(UUID principal, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority(role))
                )
        );
    }
}
