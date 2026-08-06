package com.dentic.api.booking.service;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.procedure.domain.Procedure;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.domain.WorkingHours;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.professional.repository.WorkingHoursRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class PublicBookingService {

    private static final Set<String> BLOCKING_STATUSES = Set.of("SCHEDULED", "CONFIRMED", "pending", "confirmed");
    private static final short DEFAULT_DURATION = 30;

    private final ClinicRepository clinics;
    private final ProfessionalRepository professionals;
    private final ProcedureRepository procedures;
    private final PatientRepository patients;
    private final AppointmentRepository appointments;
    private final WorkingHoursRepository workingHours;
    private final ZoneId clinicTimeZone;

    public PublicBookingService(
            ClinicRepository clinics,
            ProfessionalRepository professionals,
            ProcedureRepository procedures,
            PatientRepository patients,
            AppointmentRepository appointments,
            WorkingHoursRepository workingHours,
            @Value("${dentic.clinic-time-zone:America/Sao_Paulo}") String clinicTimeZone
    ) {
        this.clinics = clinics;
        this.professionals = professionals;
        this.procedures = procedures;
        this.patients = patients;
        this.appointments = appointments;
        this.workingHours = workingHours;
        this.clinicTimeZone = ZoneId.of(clinicTimeZone);
    }

    @Transactional(readOnly = true)
    public BookingPageResponse getBookingPage(String slug) {
        Clinic clinic = requireActiveClinic(slug);
        List<ProfessionalOption> dentistOptions = professionals.findByClinicId(clinic.getId()).stream()
                .sorted(Comparator.comparing(Professional::getName, String.CASE_INSENSITIVE_ORDER))
                .map(item -> new ProfessionalOption(item.getId(), item.getName(), item.getSpecialty()))
                .toList();
        List<ProcedureOption> procedureOptions = procedures.findByClinicIdOrderByNameAsc(clinic.getId()).stream()
                .map(item -> new ProcedureOption(item.getId(), item.getName(), item.getPrice()))
                .toList();
        return new BookingPageResponse(clinic.getName(), clinic.getBookingSlug(), dentistOptions, procedureOptions);
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse getAvailability(String slug, UUID professionalId, LocalDate date) {
        Clinic clinic = requireActiveClinic(slug);
        if (date == null) {
            throw new IllegalArgumentException("Informe a data.");
        }
        if (date.isBefore(LocalDate.now(clinicTimeZone))) {
            throw new IllegalArgumentException("Escolha uma data a partir de hoje.");
        }
        if (date.isAfter(LocalDate.now(clinicTimeZone).plusDays(60))) {
            throw new IllegalArgumentException("Agendamentos online ficam disponíveis até 60 dias à frente.");
        }

        Professional professional = professionals.findById(professionalId)
                .filter(item -> item.getClinic().getId().equals(clinic.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Dentista não encontrado."));

        List<LocalTimeRange> windows = resolveWorkingWindows(professional.getId(), date.getDayOfWeek());
        if (windows.isEmpty()) {
            return new AvailabilityResponse(date.toString(), List.of());
        }

        OffsetDateTime dayStart = date.atStartOfDay(clinicTimeZone).toOffsetDateTime();
        OffsetDateTime dayEnd = date.plusDays(1).atStartOfDay(clinicTimeZone).toOffsetDateTime();
        List<Appointment> dayAppointments = appointments
                .findByProfessionalIdAndScheduledAtBetween(professional.getId(), dayStart, dayEnd)
                .stream()
                .filter(item -> BLOCKING_STATUSES.contains(item.getStatus()))
                .toList();

        List<String> slots = new ArrayList<>();
        LocalDateTime nowLocal = LocalDateTime.now(clinicTimeZone);
        for (LocalTimeRange window : windows) {
            LocalDateTime cursor = LocalDateTime.of(date, window.start());
            LocalDateTime windowEnd = LocalDateTime.of(date, window.end());
            while (!cursor.plusMinutes(DEFAULT_DURATION).isAfter(windowEnd)) {
                final LocalDateTime slotStart = cursor;
                final LocalDateTime slotEnd = slotStart.plusMinutes(DEFAULT_DURATION);
                boolean past = !slotStart.isAfter(nowLocal);
                boolean conflict = dayAppointments.stream().anyMatch(item -> overlaps(item, slotStart, slotEnd));
                if (!past && !conflict) {
                    slots.add(slotStart.toString());
                }
                cursor = slotStart.plusMinutes(DEFAULT_DURATION);
            }
        }
        return new AvailabilityResponse(date.toString(), slots);
    }

    @Transactional
    public PublicBookingConfirmation book(String slug, PublicBookRequest request) {
        Clinic clinic = requireActiveClinic(slug);
        validateBookRequest(request);

        Professional professional = professionals.findById(request.professionalId())
                .filter(item -> item.getClinic().getId().equals(clinic.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Dentista não encontrado."));
        Procedure procedure = procedures.findByIdAndClinicId(request.procedureId(), clinic.getId())
                .orElseThrow(() -> new IllegalArgumentException("Procedimento não encontrado."));

        LocalDateTime startsAt;
        try {
            startsAt = LocalDateTime.parse(request.startsAt());
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Horário inválido.");
        }
        if (startsAt.toLocalDate().isBefore(LocalDate.now(clinicTimeZone))) {
            throw new IllegalArgumentException("Escolha um horário futuro.");
        }

        AvailabilityResponse availability = getAvailability(slug, professional.getId(), startsAt.toLocalDate());
        if (!availability.slots().contains(startsAt.toString())) {
            throw new IllegalArgumentException("Este horário não está mais disponível. Escolha outro.");
        }

        String phone = normalizePhone(request.phone());
        Patient patient = patients.findByClinicIdAndPhone(clinic.getId(), phone).orElseGet(Patient::new);
        boolean isNew = patient.getId() == null;
        if (isNew) {
            patient.setClinic(clinic);
            patient.setPhone(phone);
            patient.setPhoneIsWhatsapp(true);
            patient.setConsentGivenAt(OffsetDateTime.now());
            patient.setConsentVersion("1.0");
        }
        patient.setName(request.name().trim());
        if (request.email() != null && !request.email().isBlank()) {
            patient.setEmail(request.email().trim());
        }
        patient.setReferralSource("instagram");
        patient.setPreferredProfessional(professional);
        if (request.notes() != null && !request.notes().isBlank()) {
            patient.setNotes(request.notes().trim());
        }
        patient = patients.save(patient);

        Appointment appointment = new Appointment();
        appointment.setClinic(clinic);
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setProcedure(procedure);
        appointment.setScheduledAt(startsAt.atZone(clinicTimeZone).toOffsetDateTime());
        appointment.setDurationMinutes(DEFAULT_DURATION);
        appointment.setStatus("SCHEDULED");
        appointment.setCreatedVia("instagram");
        appointment = appointments.save(appointment);

        return new PublicBookingConfirmation(
                appointment.getId(),
                clinic.getName(),
                professional.getName(),
                procedure.getName(),
                appointment.getScheduledAt(),
                patient.getName()
        );
    }

    private Clinic requireActiveClinic(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Link de agendamento não encontrado.");
        }
        Clinic clinic = clinics.findByBookingSlug(slug.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link de agendamento não encontrado."));
        if (!"active".equalsIgnoreCase(clinic.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Esta clínica não está aceitando agendamentos online.");
        }
        return clinic;
    }

    private List<LocalTimeRange> resolveWorkingWindows(UUID professionalId, DayOfWeek dayOfWeek) {
        short day = (short) (dayOfWeek.getValue() % 7); // Sunday=0 in schema comments
        // Schema: 0=Sunday ... 6=Saturday. DayOfWeek.SUNDAY.getValue()=7 → 0.
        List<WorkingHours> configured = workingHours.findByProfessionalId(professionalId).stream()
                .filter(item -> Objects.equals(item.getDayOfWeek(), day))
                .sorted(Comparator.comparing(WorkingHours::getStartTime))
                .toList();
        if (!configured.isEmpty()) {
            return configured.stream()
                    .map(item -> new LocalTimeRange(item.getStartTime(), item.getEndTime()))
                    .toList();
        }
        return defaultWindows(dayOfWeek);
    }

    private static List<LocalTimeRange> defaultWindows(DayOfWeek dayOfWeek) {
        if (dayOfWeek == DayOfWeek.SUNDAY) {
            return List.of();
        }
        if (dayOfWeek == DayOfWeek.SATURDAY) {
            return List.of(new LocalTimeRange(LocalTime.of(9, 0), LocalTime.of(13, 0)));
        }
        return List.of(new LocalTimeRange(LocalTime.of(9, 0), LocalTime.of(18, 0)));
    }

    private boolean overlaps(Appointment appointment, LocalDateTime slotStart, LocalDateTime slotEnd) {
        LocalDateTime existingStart = appointment.getScheduledAt()
                .atZoneSameInstant(clinicTimeZone)
                .toLocalDateTime();
        LocalDateTime existingEnd = existingStart.plusMinutes(appointment.getDurationMinutes());
        return slotStart.isBefore(existingEnd) && slotEnd.isAfter(existingStart);
    }

    private static void validateBookRequest(PublicBookRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dados do agendamento são obrigatórios.");
        }
        if (request.name() == null || request.name().trim().length() < 2) {
            throw new IllegalArgumentException("Informe seu nome.");
        }
        if (request.phone() == null || normalizePhone(request.phone()).length() < 10) {
            throw new IllegalArgumentException("Informe um telefone válido com DDD.");
        }
        if (request.professionalId() == null) {
            throw new IllegalArgumentException("Escolha o dentista.");
        }
        if (request.procedureId() == null) {
            throw new IllegalArgumentException("Escolha o procedimento.");
        }
        if (request.startsAt() == null || request.startsAt().isBlank()) {
            throw new IllegalArgumentException("Escolha o horário.");
        }
    }

    private static String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("\\D+", "");
    }

    private record LocalTimeRange(LocalTime start, LocalTime end) {}

    public record ProfessionalOption(UUID id, String name, String specialty) {}

    public record ProcedureOption(UUID id, String name, BigDecimal price) {}

    public record BookingPageResponse(
            String clinicName,
            String bookingSlug,
            List<ProfessionalOption> professionals,
            List<ProcedureOption> procedures
    ) {}

    public record AvailabilityResponse(String date, List<String> slots) {}

    public record PublicBookRequest(
            String name,
            String phone,
            String email,
            UUID professionalId,
            UUID procedureId,
            String startsAt,
            String notes
    ) {}

    public record PublicBookingConfirmation(
            UUID appointmentId,
            String clinicName,
            String professionalName,
            String procedureName,
            OffsetDateTime startsAt,
            String patientName
    ) {}
}
