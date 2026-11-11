package com.dentic.api.onboarding.web;

import com.dentic.api.booking.service.BookingSlugService;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.professional.repository.WorkingHoursRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    private final ClinicRepository clinics;
    private final BookingSlugService bookingSlugs;
    private final ProfessionalRepository professionals;
    private final ProcedureRepository procedures;
    private final WorkingHoursRepository workingHours;

    public ClinicController(
            ClinicRepository clinics,
            BookingSlugService bookingSlugs,
            ProfessionalRepository professionals,
            ProcedureRepository procedures,
            WorkingHoursRepository workingHours
    ) {
        this.clinics = clinics;
        this.bookingSlugs = bookingSlugs;
        this.professionals = professionals;
        this.procedures = procedures;
        this.workingHours = workingHours;
    }

    @PatchMapping("/me")
    public ResponseEntity<String> updateMyClinic() {
        SecurityUtils.requireAdmin();
        return ResponseEntity.ok("Clinic details updated");
    }

    @GetMapping("/me/booking-link")
    @Transactional
    public BookingLinkResponse getBookingLink() {
        SecurityUtils.requireAdminOrSecretary();
        Clinic clinic = requireClinic();
        String slug = bookingSlugs.ensureSlug(clinic);
        return toResponse(clinic.getName(), slug, readiness(clinic.getId()));
    }

    @PostMapping("/me/booking-link/regenerate")
    @Transactional
    public BookingLinkResponse regenerateBookingLink() {
        SecurityUtils.requireAdminOrSecretary();
        Clinic clinic = requireClinic();
        String slug = bookingSlugs.regenerateSlug(clinic);
        return toResponse(clinic.getName(), slug, readiness(clinic.getId()));
    }

    @GetMapping("/me/booking-readiness")
    @Transactional(readOnly = true)
    public BookingReadinessResponse getBookingReadiness() {
        SecurityUtils.requireAdminOrSecretary();
        Clinic clinic = requireClinic();
        return readiness(clinic.getId());
    }

    private BookingReadinessResponse readiness(UUID clinicId) {
        List<Professional> all = professionals.findByClinicId(clinicId);
        long activeDentists = all.stream().filter(Professional::hasActiveAccess).count();
        long totalDentists = all.size();
        long procedureCount = procedures.findByClinicIdOrderByNameAsc(clinicId).size();
        boolean hasWorkingHours = all.stream()
                .anyMatch(p -> !workingHours.findByProfessionalId(p.getId()).isEmpty());
        boolean ready = activeDentists > 0 && procedureCount > 0;
        return new BookingReadinessResponse(
                ready,
                totalDentists,
                activeDentists,
                procedureCount,
                hasWorkingHours,
                hasWorkingHours
                        ? "Expediente personalizado configurado"
                        : "Usando expediente padrão (seg–sex 9–18, sáb 9–13)"
        );
    }

    private Clinic requireClinic() {
        UUID clinicId = TenantContext.getCurrentTenant();
        if (clinicId == null) {
            throw new IllegalStateException("Sessão inválida");
        }
        return clinics.findById(clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Clínica não encontrada."));
    }

    private static BookingLinkResponse toResponse(String clinicName, String slug, BookingReadinessResponse readiness) {
        String path = "/agendar/" + slug;
        String caption = "Agende sua consulta online com a " + clinicName + " ✨\n" + path;
        return new BookingLinkResponse(slug, path, caption, clinicName, readiness);
    }

    public record BookingReadinessResponse(
            boolean ready,
            long totalDentists,
            long activeDentists,
            long procedureCount,
            boolean hasCustomWorkingHours,
            String workingHoursLabel
    ) {}

    public record BookingLinkResponse(
            String slug,
            String path,
            String caption,
            String clinicName,
            BookingReadinessResponse readiness
    ) {}
}
