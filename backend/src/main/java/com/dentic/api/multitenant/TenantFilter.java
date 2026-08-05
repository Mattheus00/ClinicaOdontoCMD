package com.dentic.api.multitenant;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(1) // Executa após o filtro de autenticação (JWT)
public class TenantFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        
        // Em um cenário real, extrairemos o tenantId do token JWT via SecurityContextHolder.
        // Como o JWT ainda será configurado no próximo passo, deixaremos a estrutura pronta.
        Object tenantIdAttr = req.getAttribute("tenantId");
        if (tenantIdAttr != null) {
            TenantContext.setCurrentTenant(UUID.fromString(tenantIdAttr.toString()));
        }

        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
