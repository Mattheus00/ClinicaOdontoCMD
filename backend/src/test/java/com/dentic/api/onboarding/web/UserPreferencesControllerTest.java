package com.dentic.api.onboarding.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserPreferencesControllerTest {
    @AfterEach void clear() { TenantContext.clear(); SecurityContextHolder.clearContext(); }
    @Test void savesOnlyTheAuthenticatedUsersPreferenceAndDoesNotDowngradeVersion() {
        UUID clinicId = UUID.randomUUID(), userId = UUID.randomUUID();
        TenantContext.setCurrentTenant(clinicId);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        Clinic clinic = new Clinic(); clinic.setId(clinicId);
        User user = new User(); user.setId(userId); user.setClinic(clinic); user.setTutorialVersion(2);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        var controller = new UserPreferencesController(users);
        assertEquals(2, controller.save(new UserPreferencesController.Preferences(1)).tutorialVersion());
        verify(users).save(user);
    }
    @Test void rejectsAUserWhoseClinicDoesNotMatchTheSessionTenant() {
        UUID userId = UUID.randomUUID();
        TenantContext.setCurrentTenant(UUID.randomUUID());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        Clinic clinic = new Clinic(); clinic.setId(UUID.randomUUID());
        User user = new User(); user.setClinic(clinic);
        UserRepository users = mock(UserRepository.class);
        when(users.findById(userId)).thenReturn(Optional.of(user));
        assertThrows(ResponseStatusException.class, () -> new UserPreferencesController(users).get());
        verify(users, never()).save(any());
    }
}
