package com.dentic.api.appointment.web;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.PatientPayment;
import com.dentic.api.patient.repository.PatientPaymentRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.SecurityUtils;
import com.dentic.api.staffnotification.domain.StaffNotification;
import com.dentic.api.staffnotification.repository.StaffNotificationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentRepository appointments;
    private final PatientRepository patients;
    private final ProfessionalRepository professionals;
    private final ProcedureRepository procedures;
    private final PatientPaymentRepository payments;
    private final ClinicRepository clinics;
    private final StaffNotificationRepository staffNotifications;
    private final ZoneId clinicTimeZone;

    public AppointmentController(
            AppointmentRepository appointments,
            PatientRepository patients,
            ProfessionalRepository professionals,
            ProcedureRepository procedures,
            PatientPaymentRepository payments,
            ClinicRepository clinics,
            StaffNotificationRepository staffNotifications,
            @Value("${dentic.clinic-time-zone:America/Sao_Paulo}") String clinicTimeZone
    ) {
        this.appointments = appointments;
        this.patients = patients;
        this.professionals = professionals;
        this.procedures = procedures;
        this.payments = payments;
        this.clinics = clinics;
        this.staffNotifications = staffNotifications;
        this.clinicTimeZone = ZoneId.of(clinicTimeZone);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<AppointmentResponse> list(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) UUID professionalId
    ) {
        UUID scopedProfessionalId = SecurityUtils.isDentist()
                ? SecurityUtils.requireProfessionalId()
                : professionalId;
        LocalDate startDay = from != null ? LocalDate.parse(from) : (date != null ? LocalDate.parse(date) : LocalDate.now());
        LocalDate endDayExclusive = to != null ? LocalDate.parse(to).plusDays(1) : (date != null ? LocalDate.parse(date).plusDays(1) : startDay.plusDays(1));
        List<Appointment> found = appointments.findAgendaWithDetails(
                tenant(),
                startDay.atStartOfDay(clinicTimeZone).toOffsetDateTime(),
                endDayExclusive.atStartOfDay(clinicTimeZone).toOffsetDateTime(),
                scopedProfessionalId
        );
        List<AppointmentResponse> data = found.stream().map(AppointmentResponse::from).toList();
        return new PageResponse<>(data, data.isEmpty() ? 0 : 1, data.size(), 0, 500);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<AppointmentResponse> create(@RequestBody AppointmentRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        UUID clinic = tenant();
        var patient = patients.findById(request.patientId())
                .filter(v -> v.getClinic().getId().equals(clinic))
                .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado"));
        var professional = professionals.findById(request.professionalId())
                .filter(v -> v.getClinic().getId().equals(clinic))
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));
        var procedure = procedures.findByIdAndClinicId(request.procedureId(), clinic)
                .orElseThrow(() -> new IllegalArgumentException("Procedimento não encontrado"));

        OffsetDateTime start = localAppointmentTime(request.startsAt());
        Appointment value = new Appointment();
        value.setClinic(clinics.getReferenceById(clinic));
        value.setPatient(patient);
        value.setProfessional(professional);
        value.setProcedure(procedure);
        value.setScheduledAt(start);
        value.setDurationMinutes(resolveDurationMinutes(request.durationMinutes()));
        value.setStatus("SCHEDULED");
        try {
            return ResponseEntity.ok(AppointmentResponse.from(appointments.save(value)));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Este horário não está mais disponível. Escolha outro.");
        }
    }

    @PatchMapping("/{id}/reschedule")
    @Transactional
    public ResponseEntity<AppointmentResponse> reschedule(@PathVariable UUID id, @RequestBody RescheduleRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        Appointment value = appointments.findById(id)
                .filter(v -> v.getClinic().getId().equals(tenant()))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));
        if ("CANCELLED".equals(value.getStatus())) {
            throw new IllegalArgumentException("Não é possível remarcar um agendamento cancelado.");
        }
        if ("PENDING".equals(value.getStatus())) {
            throw new IllegalArgumentException("Aceite a solicitação antes de remarcar.");
        }
        if ("COMPLETED".equals(value.getStatus()) || "NO_SHOW".equals(value.getStatus())) {
            throw new IllegalArgumentException("Não é possível remarcar um agendamento finalizado.");
        }
        OffsetDateTime start = localAppointmentTime(request.startsAt());
        value.setScheduledAt(start);
        if (request.durationMinutes() != null) {
            value.setDurationMinutes(resolveDurationMinutes(request.durationMinutes()));
        }
        if (request.professionalId() != null) {
            var professional = professionals.findById(request.professionalId())
                    .filter(v -> v.getClinic().getId().equals(tenant()))
                    .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));
            value.setProfessional(professional);
        }
        try {
            return ResponseEntity.ok(AppointmentResponse.from(appointments.save(value)));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Este horário não está mais disponível. Escolha outro.");
        }
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public ResponseEntity<Void> cancel(@PathVariable UUID id) {
        SecurityUtils.requireAdminOrSecretary();
        Appointment value = appointments.findById(id)
                .filter(v -> v.getClinic().getId().equals(tenant()))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));
        value.setStatus("CANCELLED");
        appointments.save(value);
        markBookingNotificationsRead(value.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/accept")
    @Transactional
    public ResponseEntity<AppointmentResponse> accept(@PathVariable UUID id) {
        SecurityUtils.requireAdminOrSecretary();
        Appointment value = appointments.findById(id)
                .filter(v -> v.getClinic().getId().equals(tenant()))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));
        if (!"PENDING".equals(value.getStatus())) {
            throw new IllegalArgumentException("Somente solicitações pendentes podem ser aceitas.");
        }
        value.setStatus("SCHEDULED");
        appointments.save(value);
        markBookingNotificationsRead(value.getId());
        return ResponseEntity.ok(AppointmentResponse.from(value));
    }

    @PostMapping("/{id}/confirm")
    @Transactional
    public ResponseEntity<AppointmentResponse> confirm(@PathVariable UUID id) {
        Appointment value = appointments.findById(id)
                .filter(v -> v.getClinic().getId().equals(tenant()))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));

        if ("CANCELLED".equals(value.getStatus())) {
            throw new IllegalArgumentException("Não é possível confirmar um agendamento cancelado.");
        }
        if ("PENDING".equals(value.getStatus())) {
            throw new IllegalArgumentException("Aceite a solicitação antes de confirmar o atendimento.");
        }
        if (value.getProcedure() == null) {
            throw new IllegalArgumentException("Este agendamento não possui procedimento vinculado.");
        }
        if (SecurityUtils.isDentist()) {
            if (!value.getProfessional().getId().equals(SecurityUtils.requireProfessionalId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
            }
        } else {
            SecurityUtils.requireAdminOrSecretary();
        }

        payments.findByAppointmentId(id).orElseGet(() -> {
            PatientPayment payment = new PatientPayment();
            payment.setPatient(value.getPatient());
            payment.setAppointment(value);
            payment.setAmount(value.getProcedure().getPrice());
            payment.setMethod("CASH");
            payment.setStatus("PAID");
            payment.setNotes("Pagamento do procedimento: " + value.getProcedure().getName());
            payment.setPaidAt(LocalDate.now(clinicTimeZone));
            return payments.save(payment);
        });

        if (!"COMPLETED".equals(value.getStatus())) {
            value.setStatus("COMPLETED");
            appointments.save(value);
        }
        return ResponseEntity.ok(AppointmentResponse.from(value));
    }

    private void markBookingNotificationsRead(UUID appointmentId) {
        OffsetDateTime now = OffsetDateTime.now();
        for (StaffNotification notification : staffNotifications.findByAppointment_IdAndClinic_Id(appointmentId, tenant())) {
            if (notification.getReadAt() == null) {
                notification.setReadAt(now);
            }
        }
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    private short resolveDurationMinutes(Integer durationMinutes) {
        int value = durationMinutes == null ? 30 : durationMinutes;
        if (value < 15 || value > 480 || value % 15 != 0) {
            throw new IllegalArgumentException("Informe uma duração entre 15 minutos e 8 horas.");
        }
        return (short) value;
    }

    private OffsetDateTime localAppointmentTime(String value) {
        return LocalDateTime.parse(value).atZone(clinicTimeZone).toOffsetDateTime();
    }

    public record AppointmentRequest(UUID patientId, UUID professionalId, UUID procedureId, String startsAt, Integer durationMinutes) {}

    public record RescheduleRequest(String startsAt, UUID professionalId, Integer durationMinutes) {}

    public record PatientData(UUID id, String name) {}

    public record ProfessionalData(UUID id, String name) {}

    public record ProcedureData(UUID id, String name, java.math.BigDecimal price) {}

    public record AppointmentResponse(
            UUID id,
            PatientData patient,
            ProfessionalData professional,
            ProcedureData procedure,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt,
            short durationMinutes,
            String status,
            String createdVia
    ) {
        static AppointmentResponse from(Appointment value) {
            var procedure = value.getProcedure();
            return new AppointmentResponse(
                    value.getId(),
                    new PatientData(value.getPatient().getId(), value.getPatient().getName()),
                    new ProfessionalData(value.getProfessional().getId(), value.getProfessional().getName()),
                    procedure == null ? null : new ProcedureData(procedure.getId(), procedure.getName(), procedure.getPrice()),
                    value.getScheduledAt(),
                    value.getScheduledAt().plusMinutes(value.getDurationMinutes()),
                    value.getDurationMinutes(),
                    value.getStatus(),
                    value.getCreatedVia()
            );
        }
    }

    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}
}
