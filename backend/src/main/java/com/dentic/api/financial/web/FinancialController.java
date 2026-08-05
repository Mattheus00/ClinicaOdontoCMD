package com.dentic.api.financial.web;

import com.dentic.api.financial.service.FinancialDashboardService;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.security.SecurityUtils;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/financial")
public class FinancialController {

    private final FinancialDashboardService dashboardService;

    public FinancialController(FinancialDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public FinancialDashboardService.FinancialDashboardResponse dashboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDate periodFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate periodTo = to != null ? to : LocalDate.now();
        UUID scopedProfessionalId = SecurityUtils.isDentist() ? SecurityUtils.requireProfessionalId() : null;
        return dashboardService.dashboard(clinicId(), periodFrom, periodTo, scopedProfessionalId);
    }

    private UUID clinicId() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }
}
