package com.dentic.api.onboarding.web;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.dto.RegisterRequest;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.InviteTokenService;
import com.dentic.api.security.JwtProvider;
import com.dentic.api.security.RefreshToken;
import com.dentic.api.security.RefreshTokenRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final int SESSION_TOKEN_DAYS = 1;
    private static final int REMEMBER_TOKEN_DAYS = 30;

    private final ClinicRepository clinics;
    private final UserRepository users;
    private final ProfessionalRepository professionals;
    private final PasswordEncoder passwords;
    private final JwtProvider jwt;
    private final RefreshTokenRepository refreshTokens;
    private final InviteTokenService inviteTokens;

    @Value("${dentic.cookie.secure:true}")
    private boolean secureCookie = true;

    public AuthController(
            ClinicRepository clinics,
            UserRepository users,
            ProfessionalRepository professionals,
            PasswordEncoder passwords,
            JwtProvider jwt,
            RefreshTokenRepository refreshTokens,
            InviteTokenService inviteTokens
    ) {
        this.clinics = clinics;
        this.users = users;
        this.professionals = professionals;
        this.passwords = passwords;
        this.jwt = jwt;
        this.refreshTokens = refreshTokens;
        this.inviteTokens = inviteTokens;
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (clinics.findByEmail(email).isPresent() || users.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Já existe uma conta com este e-mail."));
        }
        Clinic clinic = new Clinic();
        clinic.setName(request.getClinicName().trim());
        clinic.setPhone(request.getPhone());
        clinic.setEmail(email);
        clinic.setTrialEndsAt(OffsetDateTime.now().plusDays(14));
        clinics.save(clinic);
        User user = new User();
        user.setClinic(clinic);
        user.setName("Administrador");
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(request.getPassword()));
        user.setRole("ADMIN");
        user.setEmailConfirmed(true);
        users.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Clínica cadastrada. Você já pode entrar."));
    }

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();
        String password = request.password() == null ? "" : request.password();
        User user = users.findByEmail(email).orElse(null);
        if (user == null || !passwords.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Credenciais inválidas."));
        }
        boolean rememberMe = Boolean.TRUE.equals(request.rememberMe());
        UUID professionalId = professionals.findProfessionalIdByUserId(user.getId()).orElse(null);
        return ResponseEntity.ok(issueTokens(user, response, professionalId, rememberMe));
    }

    @GetMapping("/invite/{token}")
    @Transactional(readOnly = true)
    public InvitePreviewResponse previewInvite(@PathVariable String token) {
        Professional professional = requireValidInvite(token);
        String email = requireProfessionalEmail(professional);
        return new InvitePreviewResponse(
                professional.getName(),
                professional.getClinic().getName(),
                email
        );
    }

    @PostMapping("/invite/{token}/accept")
    @Transactional
    public ResponseEntity<?> acceptInvite(
            @PathVariable String token,
            @RequestBody InviteAcceptRequest request,
            HttpServletResponse response
    ) {
        if (request.password() == null || request.password().length() < 12) {
            throw new IllegalArgumentException("Use uma senha com ao menos 12 caracteres.");
        }
        Professional professional = requireValidInvite(token);
        if (professional.hasActiveAccess()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este convite já foi utilizado.");
        }
        String email = requireProfessionalEmail(professional);
        if (users.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este e-mail já possui acesso no sistema.");
        }

        User user = new User();
        user.setClinic(professional.getClinic());
        user.setName(professional.getName());
        user.setEmail(email);
        user.setPasswordHash(passwords.encode(request.password()));
        user.setRole("DENTIST");
        user.setEmailConfirmed(true);
        users.save(user);

        professional.setUser(user);
        professional.setInviteAcceptedAt(OffsetDateTime.now());
        professional.setInviteTokenHash(null);
        professional.setInviteExpiresAt(null);
        professionals.save(professional);

        return ResponseEntity.ok(issueTokens(user, response, professional.getId(), false));
    }

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String token = cookie(request, "refresh_token");
        if (token == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        RefreshToken stored = refreshTokens.findByTokenHash(hash(token))
                .filter(item -> !item.isRevoked() && item.getExpiresAt().isAfter(OffsetDateTime.now()))
                .orElse(null);
        if (stored == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        boolean rememberMe = isRememberMeToken(stored);
        stored.setRevoked(true);
        refreshTokens.save(stored);
        UUID professionalId = professionals.findProfessionalIdByUserId(stored.getUser().getId()).orElse(null);
        return ResponseEntity.ok(issueTokens(stored.getUser(), response, professionalId, rememberMe));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String token = cookie(request, "refresh_token");
        if (token != null) {
            refreshTokens.findByTokenHash(hash(token)).ifPresent(item -> {
                item.setRevoked(true);
                refreshTokens.save(item);
            });
        }
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/confirm-email")
    public ResponseEntity<Map<String, String>> confirmEmail() {
        return ResponseEntity.ok(Map.of("message", "E-mail confirmado."));
    }

    private Professional requireValidInvite(String token) {
        String tokenHash = inviteTokens.hash(token);
        Professional professional = professionals.findInviteByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Convite inválido ou expirado."));
        if (professional.getInviteExpiresAt() == null || professional.getInviteExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Este convite expirou.");
        }
        return professional;
    }

    private String requireProfessionalEmail(Professional professional) {
        if (professional.getEmail() == null || professional.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Este convite não possui e-mail. Peça ao administrador para informar o e-mail e gerar um novo link."
            );
        }
        return professional.getEmail().trim().toLowerCase();
    }

    private Map<String, String> issueTokens(User user, HttpServletResponse response, UUID professionalId, boolean rememberMe) {
        int days = rememberMe ? REMEMBER_TOKEN_DAYS : SESSION_TOKEN_DAYS;
        String value = UUID.randomUUID() + UUID.randomUUID().toString();
        RefreshToken refresh = new RefreshToken();
        refresh.setUser(user);
        refresh.setTokenHash(hash(value));
        refresh.setExpiresAt(OffsetDateTime.now().plusDays(days));
        refreshTokens.save(refresh);
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(value, Duration.ofDays(days)));
        String accessToken = professionalId == null
                ? jwt.generateToken(user.getId(), user.getClinic().getId(), user.getRole())
                : jwt.generateToken(user.getId(), user.getClinic().getId(), user.getRole(), professionalId);
        return Map.of("accessToken", accessToken);
    }

    private boolean isRememberMeToken(RefreshToken token) {
        return ChronoUnit.DAYS.between(token.getCreatedAt(), token.getExpiresAt()) > SESSION_TOKEN_DAYS;
    }

    private Map<String, String> issueTokens(User user, HttpServletResponse response) {
        return issueTokens(user, response, null, false);
    }

    private Map<String, String> issueTokens(User user, HttpServletResponse response, UUID professionalId) {
        return issueTokens(user, response, professionalId, false);
    }

    private String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }

    private String refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from("refresh_token", value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build()
                .toString();
    }

    private String hash(String value) {
        try {
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public record InvitePreviewResponse(String professionalName, String clinicName, String email) {}

    public record LoginRequest(
            @jakarta.validation.constraints.Email @jakarta.validation.constraints.NotBlank String email,
            @jakarta.validation.constraints.NotBlank String password,
            Boolean rememberMe
    ) {}

    public record InviteAcceptRequest(String password) {}
}
