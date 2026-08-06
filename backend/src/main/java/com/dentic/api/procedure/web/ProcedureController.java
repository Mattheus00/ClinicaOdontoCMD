package com.dentic.api.procedure.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.procedure.domain.Procedure;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/procedures")
public class ProcedureController {

    private final ProcedureRepository procedures;
    private final ClinicRepository clinics;

    public ProcedureController(ProcedureRepository procedures, ClinicRepository clinics) {
        this.procedures = procedures;
        this.clinics = clinics;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<ProcedureResponse> list() {
        SecurityUtils.requireAdminOrSecretary();
        List<ProcedureResponse> data = procedures.findByClinicIdOrderByNameAsc(tenant()).stream()
                .map(ProcedureResponse::from)
                .toList();
        return new PageResponse<>(data, data.isEmpty() ? 0 : 1, data.size(), 0, 500);
    }

    @PostMapping
    @Transactional
    public ProcedureResponse create(@RequestBody ProcedureRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        Procedure value = new Procedure();
        value.setClinic(clinics.getReferenceById(tenant()));
        apply(value, request);
        return ProcedureResponse.from(procedures.save(value));
    }

    @PutMapping("/{id}")
    @Transactional
    public ProcedureResponse update(@PathVariable UUID id, @RequestBody ProcedureRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        Procedure value = requireProcedure(id);
        apply(value, request);
        return ProcedureResponse.from(procedures.save(value));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        SecurityUtils.requireAdmin();
        Procedure value = requireProcedure(id);
        procedures.delete(value);
    }

    private Procedure requireProcedure(UUID id) {
        return procedures.findByIdAndClinicId(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Procedimento não encontrado"));
    }

    private void apply(Procedure value, ProcedureRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Informe o nome do procedimento.");
        }
        if (request.price() == null || request.price().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Informe um valor válido.");
        }
        value.setName(request.name().trim());
        value.setPrice(request.price());
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    public record ProcedureRequest(String name, BigDecimal price) {}

    public record ProcedureResponse(UUID id, String name, BigDecimal price) {
        static ProcedureResponse from(Procedure procedure) {
            return new ProcedureResponse(procedure.getId(), procedure.getName(), procedure.getPrice());
        }
    }

    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}
}
