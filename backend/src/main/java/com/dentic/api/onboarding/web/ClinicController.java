package com.dentic.api.onboarding.web;

import com.dentic.api.booking.service.BookingSlugService;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/clinics")
public class ClinicController {

    private final ClinicRepository clinics;
    private final BookingSlugService bookingSlugs;

    public ClinicController(ClinicRepository clinics, BookingSlugService bookingSlugs) {
        this.clinics = clinics;
        this.bookingSlugs = bookingSlugs;
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
        return toResponse(clinic.getName(), slug);
    }

    @PostMapping("/me/booking-link/regenerate")
    @Transactional
    public BookingLinkResponse regenerateBookingLink() {
        SecurityUtils.requireAdminOrSecretary();
        Clinic clinic = requireClinic();
        String slug = bookingSlugs.regenerateSlug(clinic);
        return toResponse(clinic.getName(), slug);
    }

    private Clinic requireClinic() {
        UUID clinicId = TenantContext.getCurrentTenant();
        if (clinicId == null) {
            throw new IllegalStateException("Sessão inválida");
        }
        return clinics.findById(clinicId)
                .orElseThrow(() -> new IllegalArgumentException("Clínica não encontrada."));
    }

    private static BookingLinkResponse toResponse(String clinicName, String slug) {
        String path = "/agendar/" + slug;
        String caption = "Agende sua consulta online com a " + clinicName + " ✨\n" + path;
        return new BookingLinkResponse(slug, path, caption, clinicName);
    }

    public record BookingLinkResponse(String slug, String path, String caption, String clinicName) {}
}
