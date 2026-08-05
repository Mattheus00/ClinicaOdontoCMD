package com.dentic.api.security;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.User;
import com.dentic.api.onboarding.repository.UserRepository;
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
    private final UserRepository users;
    public JwtAuthenticationFilter(JwtProvider jwtProvider, UserRepository users) {
        this.jwtProvider = jwtProvider;
        this.users = users;
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        try {
            String value = request.getHeader("Authorization");
            if (value != null && value.startsWith("Bearer ") && jwtProvider.validateToken(value.substring(7))) {
                String token = value.substring(7);
                UUID userId = jwtProvider.getUserIdFromToken(token);
                UUID clinicId = jwtProvider.getClinicIdFromToken(token);
                String role = jwtProvider.getRoleFromToken(token);
                User user = users.findById(userId).orElse(null);
                if (user != null
                        && user.getClinic() != null
                        && clinicId.equals(user.getClinic().getId())
                        && role.equalsIgnoreCase(user.getRole())) {
                    TenantContext.setCurrentTenant(clinicId);
                    UUID professionalId = jwtProvider.getProfessionalIdFromToken(token);
                    if (professionalId != null) {
                        AuthAttributes.setProfessionalId(professionalId);
                    }
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
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
