package com.dentic.api.security;

import java.util.UUID;

public final class AuthAttributes {
    private static final ThreadLocal<UUID> PROFESSIONAL_ID = new ThreadLocal<>();

    private AuthAttributes() {}

    public static void setProfessionalId(UUID id) {
        PROFESSIONAL_ID.set(id);
    }

    public static UUID getProfessionalId() {
        return PROFESSIONAL_ID.get();
    }

    public static void clear() {
        PROFESSIONAL_ID.remove();
    }
}
