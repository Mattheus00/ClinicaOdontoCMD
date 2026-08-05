package com.dentic.api.professional.domain;

import com.dentic.api.onboarding.domain.User;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ProfessionalTest {

    @Test
    void hasActiveAccess_withoutUser_shouldReturnFalse() {
        Professional professional = new Professional();

        assertFalse(professional.hasActiveAccess());
    }

    @Test
    void hasActiveAccess_withUserButWithoutAcceptedInvite_shouldReturnFalse() {
        Professional professional = new Professional();
        professional.setUser(new User());

        assertFalse(professional.hasActiveAccess());
    }

    @Test
    void hasActiveAccess_withUserAndAcceptedInvite_shouldReturnTrue() {
        Professional professional = new Professional();
        professional.setUser(new User());
        professional.setInviteAcceptedAt(OffsetDateTime.now());

        assertTrue(professional.hasActiveAccess());
    }
}
