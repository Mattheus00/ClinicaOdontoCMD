package com.dentic.api.odontogram.web;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.odontogram.OdontogramRules;
import com.dentic.api.odontogram.domain.ToothProcedure;
import com.dentic.api.odontogram.domain.ToothProcedureAudit;
import com.dentic.api.odontogram.repository.ToothProcedureAuditRepository;
import com.dentic.api.odontogram.repository.ToothProcedureRepository;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.patient.domain.PatientAccessLog;
import com.dentic.api.patient.repository.PatientAccessLogRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Predicate;

@RestController
@RequestMapping("/api")
public class ToothProcedureController {

    private final ToothProcedureRepository procedures;
    private final ToothProcedureAuditRepository audits;
    private final PatientRepository patients;
    private final AppointmentRepository appointments;
    private final ProfessionalRepository professionals;
    private final ClinicRepository clinics;
    private final PatientAccessLogRepository accessLogs;
    private final ZoneId clinicZone;

    public ToothProcedureController(
            ToothProcedureRepository procedures,
            ToothProcedureAuditRepository audits,
            PatientRepository patients,
            AppointmentRepository appointments,
            ProfessionalRepository professionals,
            ClinicRepository clinics,
            PatientAccessLogRepository accessLogs,
            @Value("${dentic.clinic-time-zone:America/Sao_Paulo}") String clinicTimeZone
    ) {
        this.procedures = procedures;
        this.audits = audits;
        this.patients = patients;
        this.appointments = appointments;
        this.professionals = professionals;
        this.clinics = clinics;
        this.accessLogs = accessLogs;
        this.clinicZone = ZoneId.of(clinicTimeZone);
    }

    @ModelAttribute
    void requireClinicStaff() {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isSecretary() && !SecurityUtils.isDentist()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
    }

    @GetMapping("/patients/{patientId}/odontogram")
    @Transactional(readOnly = true)
    public OdontogramResponse odontogram(
            @PathVariable UUID patientId,
            @RequestParam(required = false) UUID appointmentId
    ) {
        Patient patient = requirePatient(patientId);
        logAccess(patientId, "VIEW", "odontogram");
        return buildOdontogram(patient, appointmentId);
    }

    @GetMapping("/patients/{patientId}/odontogram/appointments")
    @Transactional(readOnly = true)
    public List<AppointmentOption> appointmentOptions(@PathVariable UUID patientId) {
        requirePatient(patientId);
        UUID ownProfessionalId = SecurityUtils.isDentist() ? SecurityUtils.professionalIdOrNull() : null;
        return appointments.findByPatientIdOrderByScheduledAtDesc(patientId).stream()
                .filter(appointment -> appointment.getClinic().getId().equals(tenant()))
                .filter(appointment -> !"CANCELLED".equalsIgnoreCase(appointment.getStatus()))
                .map(appointment -> AppointmentOption.from(appointment, canRegisterOn(appointment, ownProfessionalId)))
                .toList();
    }

    @GetMapping("/patients/{patientId}/tooth-procedures")
    @Transactional(readOnly = true)
    public List<ToothProcedureResponse> history(
            @PathVariable UUID patientId,
            @RequestParam(required = false) String tooth,
            @RequestParam(required = false) UUID appointmentId,
            @RequestParam(defaultValue = "true") boolean includeCancelled
    ) {
        requirePatient(patientId);
        logAccess(patientId, "VIEW", "tooth-procedures");
        String toothFilter = tooth == null || tooth.isBlank() ? null : tooth.trim();
        if (toothFilter != null && !OdontogramRules.isValidTooth(toothFilter)) {
            throw new IllegalArgumentException("Dente inválido: " + toothFilter + ".");
        }
        Predicate<ToothProcedure> asOf = appointmentId == null
                ? procedure -> true
                : OdontogramRules.asOf(requireAppointment(appointmentId, patientId), clinicZone);
        return procedures.findByPatientIdAndClinicIdOrderByCreatedAtDesc(patientId, tenant()).stream()
                .filter(procedure -> toothFilter == null || toothFilter.equals(procedure.getToothNumber()))
                .filter(procedure -> includeCancelled || !procedure.isCancelled())
                .filter(asOf)
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/patients/{patientId}/tooth-procedures")
    @Transactional
    public RegisterResponse register(@PathVariable UUID patientId, @RequestBody RegisterRequest request) {
        requireWriter();
        Patient patient = requirePatient(patientId);
        List<String> teeth = OdontogramRules.normalizeTeeth(request.teeth());
        String procedureType = OdontogramRules.normalizeProcedureType(request.procedureType());
        String status = OdontogramRules.normalizeStatus(request.status(), procedureType);
        String faces = OdontogramRules.normalizeFaces(request.faces());
        String notes = OdontogramRules.normalizeNotes(request.notes());

        Appointment appointment = request.appointmentId() == null ? null : requireAppointment(request.appointmentId(), patientId);
        Professional professional = resolveAuthor(appointment);
        UUID userId = SecurityUtils.currentUserId().orElse(null);

        List<ToothProcedureResponse> created = new ArrayList<>();
        for (String tooth : teeth) {
            ToothProcedure procedure = new ToothProcedure();
            procedure.setClinic(clinics.getReferenceById(tenant()));
            procedure.setPatient(patient);
            procedure.setAppointment(appointment);
            procedure.setProfessional(professional);
            procedure.setToothNumber(tooth);
            procedure.setProcedureType(procedureType);
            procedure.setFaces(faces);
            procedure.setStatus(status);
            procedure.setNotes(notes);
            procedure.setCreatedBy(userId);
            ToothProcedure saved = procedures.save(procedure);
            audit(saved, "CREATE", null, OdontogramRules.describe(saved), null);
            created.add(toResponse(saved));
        }
        logAccess(patientId, "UPDATE", "odontogram");
        return new RegisterResponse(created, buildOdontogram(patient, null));
    }

    @PatchMapping("/tooth-procedures/{id}")
    @Transactional
    public ToothProcedureResponse update(@PathVariable UUID id, @RequestBody UpdateRequest request) {
        ToothProcedure procedure = requireEditable(id);
        String before = OdontogramRules.describe(procedure);

        if (request.procedureType() != null) {
            procedure.setProcedureType(OdontogramRules.normalizeProcedureType(request.procedureType()));
        }
        if (request.status() != null) {
            procedure.setStatus(OdontogramRules.normalizeStatus(request.status(), procedure.getProcedureType()));
        }
        if (request.faces() != null) {
            procedure.setFaces(OdontogramRules.normalizeFaces(request.faces()));
        }
        if (request.notes() != null) {
            procedure.setNotes(OdontogramRules.normalizeNotes(request.notes()));
        }

        String after = OdontogramRules.describe(procedure);
        if (before.equals(after)) {
            return toResponse(procedure);
        }
        ToothProcedure saved = procedures.save(procedure);
        audit(saved, "UPDATE", before, after, OdontogramRules.normalizeNotes(request.reason()));
        logAccess(saved.getPatient().getId(), "UPDATE", "odontogram");
        return toResponse(saved);
    }

    @DeleteMapping("/tooth-procedures/{id}")
    @Transactional
    public ToothProcedureResponse cancel(@PathVariable UUID id, @RequestParam(required = false) String reason) {
        ToothProcedure procedure = requireEditable(id);
        String cleanReason = OdontogramRules.normalizeNotes(reason);
        if (cleanReason == null || cleanReason.length() < 3) {
            throw new IllegalArgumentException("Informe o motivo do cancelamento.");
        }
        procedure.setCancelledAt(OffsetDateTime.now());
        procedure.setCancelledBy(SecurityUtils.currentUserId().orElse(null));
        procedure.setCancelReason(cleanReason);
        ToothProcedure saved = procedures.save(procedure);
        audit(saved, "CANCEL", OdontogramRules.describe(saved), null, cleanReason);
        logAccess(saved.getPatient().getId(), "UPDATE", "odontogram");
        return toResponse(saved);
    }

    @GetMapping("/tooth-procedures/{id}/audit")
    @Transactional(readOnly = true)
    public List<AuditResponse> auditTrail(@PathVariable UUID id) {
        procedures.findByIdAndClinicId(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Registro não encontrado."));
        return audits.findByToothProcedureIdAndClinicIdOrderByCreatedAtDesc(id, tenant()).stream()
                .map(AuditResponse::from)
                .toList();
    }

    private OdontogramResponse buildOdontogram(Patient patient, UUID appointmentId) {
        Appointment asOf = appointmentId == null ? null : requireAppointment(appointmentId, patient.getId());
        Predicate<ToothProcedure> include = asOf == null ? procedure -> true : OdontogramRules.asOf(asOf, clinicZone);
        List<ToothProcedure> all = procedures.findByPatientIdAndClinicIdOrderByCreatedAtDesc(patient.getId(), tenant());
        List<ToothStateResponse> teeth = OdontogramRules.latestByTooth(all, include).values().stream()
                .map(ToothStateResponse::from)
                .toList();
        UUID ownProfessionalId = SecurityUtils.isDentist() ? SecurityUtils.professionalIdOrNull() : null;
        return new OdontogramResponse(
                new PatientInfo(patient.getId(), patient.getName(), patient.getBirthDate()),
                asOf == null ? null : AppointmentOption.from(asOf, canRegisterOn(asOf, ownProfessionalId)),
                teeth
        );
    }

    private Professional resolveAuthor(Appointment appointment) {
        if (SecurityUtils.isDentist()) {
            UUID ownId = SecurityUtils.requireProfessionalId();
            if (appointment != null && (appointment.getProfessional() == null
                    || !ownId.equals(appointment.getProfessional().getId()))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Você só pode registrar procedimentos nas suas próprias consultas.");
            }
            return professionals.findByIdAndClinicId(ownId, tenant())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Profissional não vinculado ao usuário."));
        }
        if (appointment != null && appointment.getProfessional() != null) {
            return appointment.getProfessional();
        }
        UUID ownId = SecurityUtils.professionalIdOrNull();
        return ownId == null ? null : professionals.findByIdAndClinicId(ownId, tenant()).orElse(null);
    }

    private ToothProcedure requireEditable(UUID id) {
        requireWriter();
        ToothProcedure procedure = procedures.findByIdAndClinicId(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Registro não encontrado."));
        if (procedure.isCancelled()) {
            throw new IllegalArgumentException("Este registro já foi cancelado.");
        }
        if (!canEdit(procedure)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente o dentista que registrou ou um administrador pode alterar este registro.");
        }
        return procedure;
    }

    private static void requireWriter() {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isDentist()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Somente dentistas e administradores podem registrar procedimentos.");
        }
    }

    private static boolean canEdit(ToothProcedure procedure) {
        if (procedure.isCancelled()) return false;
        if (SecurityUtils.isAdmin()) return true;
        if (!SecurityUtils.isDentist()) return false;
        UUID ownId = SecurityUtils.professionalIdOrNull();
        return ownId != null && procedure.getProfessional() != null && ownId.equals(procedure.getProfessional().getId());
    }

    private static boolean canRegisterOn(Appointment appointment, UUID ownProfessionalId) {
        if (SecurityUtils.isAdmin()) return true;
        if (!SecurityUtils.isDentist() || ownProfessionalId == null) return false;
        return appointment.getProfessional() != null && ownProfessionalId.equals(appointment.getProfessional().getId());
    }

    private Patient requirePatient(UUID id) {
        return patients.findByIdAndClinic_Id(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado"));
    }

    private Appointment requireAppointment(UUID appointmentId, UUID patientId) {
        Appointment appointment = appointments.findById(appointmentId)
                .filter(value -> value.getClinic().getId().equals(tenant()))
                .filter(value -> value.getPatient() != null && value.getPatient().getId().equals(patientId))
                .orElseThrow(() -> new IllegalArgumentException("Consulta não encontrada para este paciente."));
        if ("CANCELLED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException("Esta consulta foi cancelada.");
        }
        return appointment;
    }

    private void audit(ToothProcedure procedure, String action, String before, String after, String reason) {
        ToothProcedureAudit entry = new ToothProcedureAudit();
        entry.setClinicId(tenant());
        entry.setToothProcedureId(procedure.getId());
        entry.setAction(action);
        entry.setUserId(SecurityUtils.currentUserId().orElse(null));
        entry.setBeforeState(before);
        entry.setAfterState(after);
        entry.setReason(reason);
        audits.save(entry);
    }

    private void logAccess(UUID patientId, String action, String resource) {
        SecurityUtils.currentUserId().ifPresent(userId -> {
            PatientAccessLog log = new PatientAccessLog();
            log.setClinicId(tenant());
            log.setPatientId(patientId);
            log.setUserId(userId);
            log.setAction(action);
            log.setResource(resource);
            accessLogs.save(log);
        });
    }

    private ToothProcedureResponse toResponse(ToothProcedure procedure) {
        return ToothProcedureResponse.from(procedure, canEdit(procedure));
    }

    private static UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    public record RegisterRequest(
            List<String> teeth,
            String procedureType,
            List<String> faces,
            String status,
            String notes,
            UUID appointmentId
    ) {}

    public record UpdateRequest(String procedureType, List<String> faces, String status, String notes, String reason) {}

    public record PatientInfo(UUID id, String name, LocalDate birthDate) {}

    public record AppointmentOption(
            UUID id,
            OffsetDateTime startsAt,
            String status,
            UUID professionalId,
            String professionalName,
            boolean canRegister
    ) {
        static AppointmentOption from(Appointment appointment, boolean canRegister) {
            Professional professional = appointment.getProfessional();
            return new AppointmentOption(
                    appointment.getId(),
                    appointment.getScheduledAt(),
                    appointment.getStatus() == null ? null : appointment.getStatus().toUpperCase(Locale.ROOT),
                    professional == null ? null : professional.getId(),
                    professional == null ? null : professional.getName(),
                    canRegister
            );
        }
    }

    public record ToothStateResponse(
            String toothNumber,
            String status,
            String procedureType,
            List<String> faces,
            UUID procedureId,
            OffsetDateTime recordedAt,
            String professionalName
    ) {
        static ToothStateResponse from(ToothProcedure procedure) {
            return new ToothStateResponse(
                    procedure.getToothNumber(),
                    procedure.getStatus(),
                    procedure.getProcedureType(),
                    OdontogramRules.splitFaces(procedure.getFaces()),
                    procedure.getId(),
                    procedure.getCreatedAt(),
                    procedure.getProfessional() == null ? null : procedure.getProfessional().getName()
            );
        }
    }

    public record OdontogramResponse(PatientInfo patient, AppointmentOption asOf, List<ToothStateResponse> teeth) {}

    public record ToothProcedureResponse(
            UUID id,
            String toothNumber,
            String procedureType,
            List<String> faces,
            String status,
            String notes,
            UUID appointmentId,
            OffsetDateTime appointmentAt,
            UUID professionalId,
            String professionalName,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            boolean cancelled,
            OffsetDateTime cancelledAt,
            String cancelReason,
            boolean canEdit
    ) {
        static ToothProcedureResponse from(ToothProcedure procedure, boolean canEdit) {
            Appointment appointment = procedure.getAppointment();
            Professional professional = procedure.getProfessional();
            return new ToothProcedureResponse(
                    procedure.getId(),
                    procedure.getToothNumber(),
                    procedure.getProcedureType(),
                    OdontogramRules.splitFaces(procedure.getFaces()),
                    procedure.getStatus(),
                    procedure.getNotes(),
                    appointment == null ? null : appointment.getId(),
                    appointment == null ? null : appointment.getScheduledAt(),
                    professional == null ? null : professional.getId(),
                    professional == null ? null : professional.getName(),
                    procedure.getCreatedAt(),
                    procedure.getUpdatedAt(),
                    procedure.isCancelled(),
                    procedure.getCancelledAt(),
                    procedure.getCancelReason(),
                    canEdit
            );
        }
    }

    public record RegisterResponse(List<ToothProcedureResponse> created, OdontogramResponse odontogram) {}

    public record AuditResponse(
            UUID id,
            String action,
            UUID userId,
            String before,
            String after,
            String reason,
            OffsetDateTime createdAt
    ) {
        static AuditResponse from(ToothProcedureAudit audit) {
            return new AuditResponse(
                    audit.getId(),
                    audit.getAction(),
                    audit.getUserId(),
                    audit.getBeforeState(),
                    audit.getAfterState(),
                    audit.getReason(),
                    audit.getCreatedAt()
            );
        }
    }
}
