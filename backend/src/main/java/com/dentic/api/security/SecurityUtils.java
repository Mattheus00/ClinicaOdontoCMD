package com.dentic.api.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<UUID> currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return Optional.empty();
        try {
            return Optional.of(UUID.fromString(auth.getPrincipal().toString()));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    public static String currentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(value -> value.startsWith("ROLE_"))
                .map(value -> value.substring("ROLE_".length()))
                .findFirst()
                .orElse(null);
    }

    public static boolean isDentist() {
        return "DENTIST".equals(currentRole());
    }

    public static boolean isAdmin() {
        return "ADMIN".equals(currentRole());
    }

    public static boolean isSecretary() {
        return "SECRETARY".equals(currentRole());
    }

    public static void requireAdmin() {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
    }

    public static void requireAdminOrSecretary() {
        if (!isAdmin() && !isSecretary()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
    }

    public static UUID requireProfessionalId() {
        UUID professionalId = AuthAttributes.getProfessionalId();
        if (professionalId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profissional não vinculado ao usuário.");
        }
        return professionalId;
    }

    public static UUID professionalIdOrNull() {
        return AuthAttributes.getProfessionalId();
    }
}
