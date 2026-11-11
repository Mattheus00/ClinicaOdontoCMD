package com.dentic.api.appointment.web;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.PatientPayment;
import com.dentic.api.patient.repository.PatientPaymentRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.professional.domain.WorkingHours;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.professional.repository.WorkingHoursRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
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
    private final WorkingHoursRepository workingHours;
    private final ZoneId clinicTimeZone;

    private static final Set<String> BLOCKING_STATUSES = Set.of(
            "PENDING", "SCHEDULED", "CONFIRMED", "pending", "confirmed"
    );

    public AppointmentController(
            AppointmentRepository appointments,
            PatientRepository patients,
            ProfessionalRepository professionals,
            ProcedureRepository procedures,
            PatientPaymentRepository payments,
            ClinicRepository clinics,
            StaffNotificationRepository staffNotifications,
            WorkingHoursRepository workingHours,
            @Value("${dentic.clinic-time-zone:America/Sao_Paulo}") String clinicTimeZone
    ) {
        this.appointments = appointments;
        this.patients = patients;
        this.professionals = professionals;
        this.procedures = procedures;
        this.payments = payments;
        this.clinics = clinics;
        this.staffNotifications = staffNotifications;
        this.workingHours = workingHours;
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

    @GetMapping("/availability")
    @Transactional(readOnly = true)
    public AvailabilityResponse availability(
            @RequestParam UUID professionalId,
            @RequestParam String date,
            @RequestParam(required = false) Integer durationMinutes
    ) {
        UUID clinic = tenant();
        var professional = professionals.findById(professionalId)
                .filter(v -> v.getClinic().getId().equals(clinic))
                .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));
        if (SecurityUtils.isDentist() && !professional.getId().equals(SecurityUtils.requireProfessionalId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        LocalDate day = LocalDate.parse(date);
        short duration = resolveDurationMinutes(durationMinutes);
        List<LocalTimeRange> windows = resolveWorkingWindows(professional.getId(), day.getDayOfWeek());
        if (windows.isEmpty()) {
            return new AvailabilityResponse(day.toString(), List.of());
        }
        OffsetDateTime dayStart = day.atStartOfDay(clinicTimeZone).toOffsetDateTime();
        OffsetDateTime dayEnd = day.plusDays(1).atStartOfDay(clinicTimeZone).toOffsetDateTime();
        List<Appointment> dayAppointments = appointments
                .findByProfessionalIdAndScheduledAtBetween(professional.getId(), dayStart, dayEnd)
                .stream()
                .filter(item -> BLOCKING_STATUSES.contains(item.getStatus()))
                .toList();
        List<String> slots = new ArrayList<>();
        LocalDateTime nowLocal = LocalDateTime.now(clinicTimeZone);
        for (LocalTimeRange window : windows) {
            LocalDateTime cursor = LocalDateTime.of(day, window.start());
            LocalDateTime windowEnd = LocalDateTime.of(day, window.end());
            while (!cursor.plusMinutes(duration).isAfter(windowEnd)) {
                LocalDateTime slotStart = cursor;
                LocalDateTime slotEnd = slotStart.plusMinutes(duration);
                boolean past = !slotStart.isAfter(nowLocal);
                boolean conflict = dayAppointments.stream().anyMatch(item -> {
                    LocalDateTime existingStart = item.getScheduledAt()
                            .atZoneSameInstant(clinicTimeZone)
                            .toLocalDateTime();
                    LocalDateTime existingEnd = existingStart.plusMinutes(item.getDurationMinutes());
                    return slotStart.isBefore(existingEnd) && slotEnd.isAfter(existingStart);
                });
                if (!past && !conflict) {
                    slots.add(String.format("%02d:%02d", slotStart.getHour(), slotStart.getMinute()));
                }
                cursor = slotStart.plusMinutes(duration);
            }
        }
        return new AvailabilityResponse(day.toString(), slots);
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
        rejectPastAppointment(start);
        Appointment value = new Appointment();
        value.setClinic(clinics.getReferenceById(clinic));
        value.setPatient(patient);
        value.setProfessional(professional);
        value.setProcedure(procedure);
        value.setScheduledAt(start);
        value.setDurationMinutes(resolveDurationMinutes(request.durationMinutes()));
        value.setStatus("SCHEDULED");
        try {
            Appointment saved = appointments.save(value);
            notifyDentist(
                    saved,
                    "APPOINTMENT_SCHEDULED",
                    "Nova consulta na sua agenda",
                    dentistAppointmentMessage(saved, "foi marcada")
            );
            return ResponseEntity.ok(AppointmentResponse.from(saved));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw conflictUnavailable(professional.getName(), start);
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
        UUID previousProfessionalId = value.getProfessional() == null ? null : value.getProfessional().getId();
        OffsetDateTime previousStart = value.getScheduledAt();
        OffsetDateTime start = localAppointmentTime(request.startsAt());
        rejectPastAppointment(start);
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
            Appointment saved = appointments.save(value);
            boolean dentistChanged = previousProfessionalId == null
                    || saved.getProfessional() == null
                    || !previousProfessionalId.equals(saved.getProfessional().getId());
            boolean timeChanged = previousStart == null || !previousStart.equals(saved.getScheduledAt());
            if (dentistChanged) {
                notifyDentist(
                        saved,
                        "APPOINTMENT_SCHEDULED",
                        "Nova consulta na sua agenda",
                        dentistAppointmentMessage(saved, "foi marcada")
                );
            } else if (timeChanged) {
                notifyDentist(
                        saved,
                        "APPOINTMENT_RESCHEDULED",
                        "Consulta remarcada",
                        dentistAppointmentMessage(saved, "foi remarcada")
                );
            }
            return ResponseEntity.ok(AppointmentResponse.from(saved));
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            String dentistName = value.getProfessional() == null ? "O dentista" : value.getProfessional().getName();
            throw conflictUnavailable(dentistName, start);
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
        try {
            appointments.save(value);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            String dentistName = value.getProfessional() == null ? "O dentista" : value.getProfessional().getName();
            throw conflictUnavailable(dentistName, value.getScheduledAt());
        }
        markBookingNotificationsRead(value.getId());
        notifyDentist(
                value,
                "APPOINTMENT_SCHEDULED",
                "Consulta confirmada na sua agenda",
                dentistAppointmentMessage(value, "foi confirmada")
        );
        return ResponseEntity.ok(AppointmentResponse.from(value));
    }

    @PostMapping("/{id}/confirm")
    @Transactional
    public ResponseEntity<AppointmentResponse> confirm(
            @PathVariable UUID id,
            @RequestBody(required = false) ConfirmRequest request
    ) {
        Appointment value = requireAppointmentInTenant(id);
        requireCanManageAppointment(value);

        if ("CANCELLED".equals(value.getStatus())) {
            throw new IllegalArgumentException("Não é possível confirmar um agendamento cancelado.");
        }
        if ("PENDING".equals(value.getStatus())) {
            throw new IllegalArgumentException("Aceite a solicitação antes de confirmar o atendimento.");
        }
        if (value.getProcedure() == null) {
            throw new IllegalArgumentException("Este agendamento não possui procedimento vinculado.");
        }

        if (request != null && request.report() != null) {
            value.setReport(normalizeReport(request.report()));
        }

        // Completion is a clinical action. Receipts are recorded explicitly in patient billing.

        if (!"COMPLETED".equals(value.getStatus())) {
            value.setStatus("COMPLETED");
        }
        appointments.save(value);
        return ResponseEntity.ok(AppointmentResponse.from(value));
    }

    @PatchMapping("/{id}/report")
    @Transactional
    public ResponseEntity<AppointmentResponse> updateReport(
            @PathVariable UUID id,
            @RequestBody ReportRequest request
    ) {
        Appointment value = requireAppointmentInTenant(id);
        requireCanManageAppointment(value);

        if ("CANCELLED".equals(value.getStatus())) {
            throw new IllegalArgumentException("Não é possível editar o relatório de um agendamento cancelado.");
        }
        value.setReport(normalizeReport(request == null ? null : request.report()));
        return ResponseEntity.ok(AppointmentResponse.from(appointments.save(value)));
    }

    private Appointment requireAppointmentInTenant(UUID id) {
        return appointments.findById(id)
                .filter(v -> v.getClinic().getId().equals(tenant()))
                .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado"));
    }

    private void requireCanManageAppointment(Appointment value) {
        if (SecurityUtils.isDentist()) {
            if (!value.getProfessional().getId().equals(SecurityUtils.requireProfessionalId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
            }
        } else {
            SecurityUtils.requireAdminOrSecretary();
        }
    }

    private static String normalizeReport(String report) {
        if (report == null) return null;
        String trimmed = report.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void markBookingNotificationsRead(UUID appointmentId) {
        OffsetDateTime now = OffsetDateTime.now();
        for (StaffNotification notification : staffNotifications.findByAppointment_IdAndClinic_Id(appointmentId, tenant())) {
            if (notification.getReadAt() == null) {
                notification.setReadAt(now);
            }
        }
    }

    private void notifyDentist(Appointment appointment, String type, String title, String message) {
        if (appointment.getProfessional() == null) return;
        StaffNotification notification = new StaffNotification();
        notification.setClinic(appointment.getClinic());
        notification.setAppointment(appointment);
        notification.setRecipientProfessional(appointment.getProfessional());
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        staffNotifications.save(notification);
    }

    private String dentistAppointmentMessage(Appointment appointment, String verb) {
        String patientName = appointment.getPatient() == null ? "Paciente" : appointment.getPatient().getName();
        String procedureName = appointment.getProcedure() == null ? "consulta" : appointment.getProcedure().getName();
        String whenLabel = appointment.getScheduledAt()
                .atZoneSameInstant(clinicTimeZone)
                .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm"));
        return patientName + " — " + procedureName + " " + verb + " para " + whenLabel + ".";
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

    private void rejectPastAppointment(OffsetDateTime start) {
        if (start.isBefore(OffsetDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("Não é possível agendar no passado. Escolha outro horário.");
        }
    }

    private ResponseStatusException conflictUnavailable(String dentistName, OffsetDateTime start) {
        String when = start.atZoneSameInstant(clinicTimeZone)
                .format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"));
        String name = dentistName == null || dentistName.isBlank() ? "O dentista" : dentistName;
        return new ResponseStatusException(
                HttpStatus.CONFLICT,
                name + " já tem consulta às " + when + ". Escolha outro horário."
        );
    }

    private List<LocalTimeRange> resolveWorkingWindows(UUID professionalId, DayOfWeek dayOfWeek) {
        short day = (short) (dayOfWeek.getValue() % 7);
        List<WorkingHours> configured = workingHours.findByProfessionalId(professionalId).stream()
                .filter(item -> Objects.equals(item.getDayOfWeek(), day))
                .sorted(Comparator.comparing(WorkingHours::getStartTime))
                .toList();
        if (!configured.isEmpty()) {
            return configured.stream()
                    .map(item -> new LocalTimeRange(item.getStartTime(), item.getEndTime()))
                    .toList();
        }
        if (dayOfWeek == DayOfWeek.SUNDAY) return List.of();
        if (dayOfWeek == DayOfWeek.SATURDAY) {
            return List.of(new LocalTimeRange(LocalTime.of(9, 0), LocalTime.of(13, 0)));
        }
        return List.of(new LocalTimeRange(LocalTime.of(9, 0), LocalTime.of(18, 0)));
    }

    private record LocalTimeRange(LocalTime start, LocalTime end) {}

    public record AppointmentRequest(UUID patientId, UUID professionalId, UUID procedureId, String startsAt, Integer durationMinutes) {}

    public record RescheduleRequest(String startsAt, UUID professionalId, Integer durationMinutes) {}

    public record ConfirmRequest(String report) {}

    public record ReportRequest(String report) {}

    public record PatientData(UUID id, String name, String phone) {}

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
            String createdVia,
            String report
    ) {
        static AppointmentResponse from(Appointment value) {
            var procedure = value.getProcedure();
            var patient = value.getPatient();
            return new AppointmentResponse(
                    value.getId(),
                    new PatientData(patient.getId(), patient.getName(), patient.getPhone()),
                    new ProfessionalData(value.getProfessional().getId(), value.getProfessional().getName()),
                    procedure == null ? null : new ProcedureData(procedure.getId(), procedure.getName(), procedure.getPrice()),
                    value.getScheduledAt(),
                    value.getScheduledAt().plusMinutes(value.getDurationMinutes()),
                    value.getDurationMinutes(),
                    value.getStatus(),
                    value.getCreatedVia(),
                    value.getReport()
            );
        }
    }

    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}

    public record AvailabilityResponse(String date, List<String> slots) {}
}
