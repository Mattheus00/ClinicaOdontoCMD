package com.dentic.api.onboarding.web;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.InviteTokenService;
import com.dentic.api.security.JwtProvider;
import com.dentic.api.security.RefreshToken;
import com.dentic.api.security.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private ClinicRepository clinics;
    @Mock
    private UserRepository users;
    @Mock
    private ProfessionalRepository professionals;
    @Mock
    private PasswordEncoder passwords;
    @Mock
    private JwtProvider jwt;
    @Mock
    private RefreshTokenRepository refreshTokens;
    @Mock
    private InviteTokenService inviteTokens;

    @InjectMocks
    private AuthController controller;

    private User user;
    private final UUID clinicId = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        Clinic clinic = new Clinic();
        clinic.setId(clinicId);

        user = new User();
        user.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        user.setClinic(clinic);
        user.setEmail("admin@clinic.com");
        user.setPasswordHash("hashed-password");
        user.setRole("ADMIN");
    }

    @Test
    void login_withInvalidCredentials_shouldReturnUnauthorized() {
        when(users.findByEmail("admin@clinic.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.login(
                new AuthController.LoginRequest("admin@clinic.com", "wrong-password", false),
                new MockHttpServletResponse()
        );

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void login_withRememberMe_shouldIssueLongLivedRefreshToken() {
        when(users.findByEmail("admin@clinic.com")).thenReturn(Optional.of(user));
        when(passwords.matches("secret123", user.getPasswordHash())).thenReturn(true);
        when(jwt.generateToken(user.getId(), clinicId, user.getRole())).thenReturn("access-token");

        MockHttpServletResponse response = new MockHttpServletResponse();
        ResponseEntity<?> result = controller.login(
                new AuthController.LoginRequest("admin@clinic.com", "secret123", true),
                response
        );

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals("access-token", ((Map<?, ?>) result.getBody()).get("accessToken"));

        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokens).save(tokenCaptor.capture());
        assertTrue(tokenCaptor.getValue().getExpiresAt().isAfter(OffsetDateTime.now().plusDays(29)));

        String cookie = response.getHeader("Set-Cookie");
        assertNotNull(cookie);
        assertTrue(cookie.contains("Max-Age=2592000"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("Secure"));
        assertTrue(cookie.contains("SameSite=Lax"));
    }

    @Test
    void login_withoutRememberMe_shouldIssueShortLivedRefreshToken() {
        when(users.findByEmail("admin@clinic.com")).thenReturn(Optional.of(user));
        when(passwords.matches("secret123", user.getPasswordHash())).thenReturn(true);
        when(jwt.generateToken(user.getId(), clinicId, user.getRole())).thenReturn("access-token");

        MockHttpServletResponse response = new MockHttpServletResponse();
        controller.login(
                new AuthController.LoginRequest("admin@clinic.com", "secret123", false),
                response
        );

        String cookie = response.getHeader("Set-Cookie");
        assertNotNull(cookie);
        assertTrue(cookie.contains("Max-Age=86400"));
    }
}
