package com.dentic.api.security;

import com.dentic.api.multitenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String value = request.getHeader("Authorization");
            if (value != null && value.startsWith("Bearer ")) {
                String token = value.substring(7);
                if (jwtProvider.validateToken(token)) {
                    // Trust signed, short-lived claims — avoids a DB round-trip on every API call.
                    // Role/clinic revocation is enforced on refresh (15 min access token TTL).
                    UUID userId = jwtProvider.getUserIdFromToken(token);
                    UUID clinicId = jwtProvider.getClinicIdFromToken(token);
                    String role = jwtProvider.getRoleFromToken(token);
                    TenantContext.setCurrentTenant(clinicId);
                    UUID professionalId = jwtProvider.getProfessionalIdFromToken(token);
                    if (professionalId != null) {
                        AuthAttributes.setProfessionalId(professionalId);
                    }
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    ));
                }
            }
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
            AuthAttributes.clear();
        }
    }
}
