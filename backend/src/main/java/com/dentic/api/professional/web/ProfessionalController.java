package com.dentic.api.professional.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.onboarding.repository.UserRepository;
import com.dentic.api.patient.repository.OdontogramEntryRepository;
import com.dentic.api.patient.repository.PatientPaymentRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.patient.repository.TreatmentRecordRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.InviteTokenService;
import com.dentic.api.security.RefreshTokenRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/professionals")
public class ProfessionalController {

    private final ProfessionalRepository professionals;
    private final ClinicRepository clinics;
    private final UserRepository users;
    private final InviteTokenService inviteTokens;
    private final AppointmentRepository appointments;
    private final PatientRepository patients;
    private final PatientPaymentRepository patientPayments;
    private final TreatmentRecordRepository treatmentRecords;
    private final OdontogramEntryRepository odontogramEntries;
    private final RefreshTokenRepository refreshTokens;
    private final String frontendUrl;

    public ProfessionalController(
            ProfessionalRepository professionals,
            ClinicRepository clinics,
            UserRepository users,
            InviteTokenService inviteTokens,
            AppointmentRepository appointments,
            PatientRepository patients,
            PatientPaymentRepository patientPayments,
            TreatmentRecordRepository treatmentRecords,
            OdontogramEntryRepository odontogramEntries,
            RefreshTokenRepository refreshTokens,
            @Value("${dentic.frontend.url:http://localhost:5173}") String frontendUrl
    ) {
        this.professionals = professionals;
        this.clinics = clinics;
        this.users = users;
        this.inviteTokens = inviteTokens;
        this.appointments = appointments;
        this.patients = patients;
        this.patientPayments = patientPayments;
        this.treatmentRecords = treatmentRecords;
        this.odontogramEntries = odontogramEntries;
        this.refreshTokens = refreshTokens;
        this.frontendUrl = frontendUrl.replaceAll("/$", "");
    }

    @ModelAttribute
    void denyDentistAccess() {
        if (SecurityUtils.isDentist()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<ProfessionalResponse> list() {
        List<ProfessionalResponse> data = professionals.findByClinicId(tenant()).stream()
                .map(professional -> ProfessionalResponse.from(
                        professional,
                        null,
                        appointments.countByProfessionalId(professional.getId())
                ))
                .toList();
        return new PageResponse<>(data, data.isEmpty() ? 0 : 1, data.size(), 0, 100);
    }

    @PostMapping
    @Transactional
    public ProfessionalResponse create(@RequestBody ProfessionalRequest request) {
        SecurityUtils.requireAdmin();
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Informe o nome do dentista.");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("Informe o e-mail do dentista.");
        }
        String email = normalizeEmail(request.email());
        UUID clinicId = tenant();
        assertEmailAvailable(clinicId, email, null);

        Professional value = new Professional();
        value.setClinic(clinics.getReferenceById(clinicId));
        value.setName(request.name().trim());
        value.setEmail(email);
        value.setSpecialty(blankToNull(request.specialty()));
        String rawToken = inviteTokens.generateToken();
        value.setInviteTokenHash(inviteTokens.hash(rawToken));
        value.setInviteExpiresAt(OffsetDateTime.now().plusDays(7));
        Professional saved = professionals.save(value);
        return ProfessionalResponse.from(saved, buildInviteUrl(rawToken), appointments.countByProfessionalId(saved.getId()));
    }

    @PostMapping("/{id}/regenerate-invite")
    @Transactional
    public ProfessionalResponse regenerateInvite(
            @PathVariable UUID id,
            @RequestBody(required = false) RegenerateInviteRequest request
    ) {
        SecurityUtils.requireAdmin();
        Professional value = requireProfessional(id);
        if (value.hasActiveAccess()) {
            throw new IllegalArgumentException("Este dentista já concluiu o primeiro acesso.");
        }
        applyEmailIfNeeded(value, request == null ? null : request.email());
        String rawToken = inviteTokens.generateToken();
        value.setInviteTokenHash(inviteTokens.hash(rawToken));
        value.setInviteExpiresAt(OffsetDateTime.now().plusDays(7));
        return ProfessionalResponse.from(professionals.save(value), buildInviteUrl(rawToken), appointments.countByProfessionalId(value.getId()));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        SecurityUtils.requireAdmin();
        Professional value = requireProfessional(id);

        UUID linkedUserId = value.getUser() != null ? value.getUser().getId() : null;
        value.setUser(null);
        professionals.saveAndFlush(value);

        patients.clearPreferredProfessional(id);
        treatmentRecords.clearProfessional(id);
        odontogramEntries.clearProfessional(id);
        patientPayments.clearAppointmentByProfessionalId(id);
        appointments.deleteByProfessionalId(id);

        professionals.deleteById(id);

        if (linkedUserId != null) {
            refreshTokens.deleteByUser_Id(linkedUserId);
            users.deleteById(linkedUserId);
        }
    }

    private Professional requireProfessional(UUID id) {
        return professionals.findByIdAndClinicId(id, tenant())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dentista não encontrado"));
    }

    private String buildInviteUrl(String rawToken) {
        return frontendUrl + "/convite/" + rawToken;
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private void assertEmailAvailable(UUID clinicId, String email, UUID ignoreProfessionalId) {
        boolean duplicateProfessional = professionals.findByClinicId(clinicId).stream()
                .anyMatch(item -> item.getEmail() != null
                        && email.equalsIgnoreCase(item.getEmail())
                        && (ignoreProfessionalId == null || !item.getId().equals(ignoreProfessionalId)));
        if (duplicateProfessional) {
            throw new IllegalArgumentException("Já existe um dentista com este e-mail.");
        }
        if (users.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Este e-mail já possui acesso no sistema.");
        }
    }

    private void applyEmailIfNeeded(Professional value, String emailOverride) {
        if (value.getEmail() != null && !value.getEmail().isBlank()) {
            return;
        }
        if (emailOverride == null || emailOverride.isBlank()) {
            throw new IllegalArgumentException("Informe o e-mail do dentista antes de gerar o convite.");
        }
        String email = normalizeEmail(emailOverride);
        assertEmailAvailable(value.getClinic().getId(), email, value.getId());
        value.setEmail(email);
    }

    public record ProfessionalRequest(String name, String email, String specialty) {}

    public record RegenerateInviteRequest(String email) {}

    public record ProfessionalResponse(
            UUID id,
            String name,
            String email,
            String specialty,
            String accessStatus,
            OffsetDateTime inviteExpiresAt,
            String inviteUrl,
            long appointmentCount
    ) {
        static ProfessionalResponse from(Professional professional, String inviteUrl, long appointmentCount) {
            String status = professional.hasActiveAccess() ? "ACTIVE" : "PENDING";
            return new ProfessionalResponse(
                    professional.getId(),
                    professional.getName(),
                    professional.getEmail(),
                    professional.getSpecialty(),
                    status,
                    professional.getInviteExpiresAt(),
                    inviteUrl,
                    appointmentCount
            );
        }
    }

    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}
}
