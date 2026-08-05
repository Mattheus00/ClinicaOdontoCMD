package com.dentic.api.financial.service;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.patient.domain.PatientPayment;
import com.dentic.api.patient.domain.TreatmentPlan;
import com.dentic.api.patient.repository.PatientPaymentRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.patient.repository.TreatmentPlanRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FinancialDashboardService {

    private static final UUID UNASSIGNED_KEY = UUID.fromString("00000000-0000-0000-0000-000000000000");

    private final PatientRepository patients;
    private final TreatmentPlanRepository plans;
    private final PatientPaymentRepository payments;
    private final AppointmentRepository appointments;
    private final ProfessionalRepository professionals;

    public FinancialDashboardService(
            PatientRepository patients,
            TreatmentPlanRepository plans,
            PatientPaymentRepository payments,
            AppointmentRepository appointments,
            ProfessionalRepository professionals
    ) {
        this.patients = patients;
        this.plans = plans;
        this.payments = payments;
        this.appointments = appointments;
        this.professionals = professionals;
    }

    @Transactional(readOnly = true)
    public FinancialDashboardResponse dashboard(UUID clinicId, LocalDate from, LocalDate to, UUID scopedProfessionalId) {
        if (scopedProfessionalId != null) {
            return dentistDashboard(clinicId, from, to, scopedProfessionalId);
        }
        return clinicDashboard(clinicId, from, to);
    }

    private FinancialDashboardResponse dentistDashboard(UUID clinicId, LocalDate from, LocalDate to, UUID professionalId) {
        List<Patient> clinicPatients = patients.findByClinicId(clinicId);
        Map<UUID, UUID> professionalByPatient = resolveProfessionals(clinicPatients);
        List<PatientPayment> clinicPayments = payments.findAllByClinicId(clinicId);

        MutableTotals totals = new MutableTotals();
        Set<UUID> patientIds = new HashSet<>();

        for (PatientPayment payment : clinicPayments) {
            UUID attributed = resolvePaymentProfessional(payment, professionalByPatient);
            if (!professionalId.equals(attributed)) continue;
            if ("PAID".equals(payment.getStatus())) {
                totals.paid = totals.paid.add(payment.getAmount());
                if (isInPeriod(paymentDate(payment), from, to)) {
                    totals.receivedInPeriod = totals.receivedInPeriod.add(payment.getAmount());
                }
            }
            patientIds.add(payment.getPatient().getId());
        }

        totals.patientCount = patientIds.size();
        Professional professional = professionals.findByClinicId(clinicId).stream()
                .filter(item -> item.getId().equals(professionalId))
                .findFirst()
                .orElse(null);
        String name = professional != null ? professional.getName() : "Dentista";

        return new FinancialDashboardResponse(
                new PeriodRange(from, to),
                totals.toTotals(),
                List.of(totals.toBreakdown(professionalId, name))
        );
    }

    private FinancialDashboardResponse clinicDashboard(UUID clinicId, LocalDate from, LocalDate to) {
        List<Patient> clinicPatients = patients.findByClinicId(clinicId);
        Map<UUID, Patient> patientById = clinicPatients.stream()
                .collect(Collectors.toMap(Patient::getId, p -> p));

        List<TreatmentPlan> clinicPlans = plans.findAllByClinicId(clinicId);
        List<PatientPayment> clinicPayments = payments.findAllByClinicId(clinicId);

        Map<UUID, List<TreatmentPlan>> plansByPatient = clinicPlans.stream()
                .collect(Collectors.groupingBy(p -> p.getPatient().getId()));
        Map<UUID, List<PatientPayment>> paymentsByPatient = clinicPayments.stream()
                .collect(Collectors.groupingBy(p -> p.getPatient().getId()));

        Map<UUID, UUID> professionalByPatient = resolveProfessionals(clinicPatients);

        Map<UUID, Professional> professionalById = professionals.findByClinicId(clinicId).stream()
                .collect(Collectors.toMap(Professional::getId, p -> p));

        Map<UUID, MutableTotals> byProfessional = new HashMap<>();
        MutableTotals clinicTotals = new MutableTotals();

        for (Patient patient : clinicPatients) {
            UUID patientId = patient.getId();
            BillingTotals patientTotals = summarize(
                    plansByPatient.getOrDefault(patientId, List.of()),
                    paymentsByPatient.getOrDefault(patientId, List.of()),
                    from,
                    to
            );

            clinicTotals.add(patientTotals);

            UUID professionalId = professionalByPatient.get(patientId);
            MutableTotals bucket = byProfessional.computeIfAbsent(
                    professionalId == null ? UNASSIGNED_KEY : professionalId,
                    ignored -> new MutableTotals()
            );
            bucket.add(patientTotals);
            bucket.patientCount++;
        }

        List<ProfessionalBreakdown> breakdown = new ArrayList<>();
        Set<UUID> seenProfessionals = new HashSet<>();

        for (Map.Entry<UUID, MutableTotals> entry : byProfessional.entrySet()) {
            UUID id = entry.getKey();
            boolean unassigned = id.equals(UNASSIGNED_KEY);
            if (!unassigned) seenProfessionals.add(id);
            Professional professional = unassigned ? null : professionalById.get(id);
            String name = professional != null ? professional.getName() : "Sem dentista atribuído";
            UUID professionalId = professional != null ? professional.getId() : null;
            breakdown.add(entry.getValue().toBreakdown(professionalId, name));
        }

        for (Professional professional : professionalById.values()) {
            if (seenProfessionals.contains(professional.getId())) continue;
            breakdown.add(MutableTotals.empty().toBreakdown(professional.getId(), professional.getName()));
        }

        breakdown.sort(Comparator.comparing(ProfessionalBreakdown::professionalName));

        FinancialTotals totals = clinicTotals.toTotals();
        totals = new FinancialTotals(
                totals.approved(),
                totals.pending(),
                totals.paid(),
                totals.overdue(),
                totals.openBalance(),
                totals.receivedInPeriod(),
                clinicPatients.size()
        );

        return new FinancialDashboardResponse(
                new PeriodRange(from, to),
                totals,
                breakdown
        );
    }

    private UUID resolvePaymentProfessional(PatientPayment payment, Map<UUID, UUID> professionalByPatient) {
        if (payment.getAppointment() != null && payment.getAppointment().getProfessional() != null) {
            return payment.getAppointment().getProfessional().getId();
        }
        return professionalByPatient.get(payment.getPatient().getId());
    }

    private Map<UUID, UUID> resolveProfessionals(List<Patient> clinicPatients) {
        List<UUID> patientIds = clinicPatients.stream().map(Patient::getId).toList();
        Map<UUID, UUID> result = new HashMap<>();

        for (Patient patient : clinicPatients) {
            if (patient.getPreferredProfessional() != null) {
                result.put(patient.getId(), patient.getPreferredProfessional().getId());
            }
        }

        if (patientIds.isEmpty()) {
            return result;
        }

        List<Appointment> patientAppointments = appointments.findByPatientIdIn(patientIds);
        Map<UUID, Appointment> latestByPatient = new HashMap<>();
        for (Appointment appointment : patientAppointments) {
            UUID patientId = appointment.getPatient().getId();
            latestByPatient.merge(patientId, appointment, (current, candidate) ->
                    candidate.getScheduledAt().isAfter(current.getScheduledAt()) ? candidate : current);
        }

        for (Patient patient : clinicPatients) {
            if (result.containsKey(patient.getId())) continue;
            Appointment latest = latestByPatient.get(patient.getId());
            if (latest != null && latest.getProfessional() != null) {
                result.put(patient.getId(), latest.getProfessional().getId());
            }
        }

        return result;
    }

    private BillingTotals summarize(
            List<TreatmentPlan> patientPlans,
            List<PatientPayment> patientPayments,
            LocalDate from,
            LocalDate to
    ) {
        BigDecimal approved = patientPlans.stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .map(TreatmentPlan::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pending = patientPlans.stream()
                .filter(p -> "PENDING".equals(p.getStatus()) || "DRAFT".equals(p.getStatus()))
                .map(TreatmentPlan::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paid = patientPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .map(PatientPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal overdue = patientPlans.stream()
                .filter(p -> ("PENDING".equals(p.getStatus()) || "APPROVED".equals(p.getStatus()))
                        && p.getDueDate() != null
                        && p.getDueDate().isBefore(LocalDate.now()))
                .map(TreatmentPlan::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal open = approved.add(pending).subtract(paid);
        if (open.compareTo(BigDecimal.ZERO) < 0) open = BigDecimal.ZERO;

        BigDecimal receivedInPeriod = patientPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .filter(p -> isInPeriod(paymentDate(p), from, to))
                .map(PatientPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BillingTotals(approved, pending, paid, overdue, open, receivedInPeriod);
    }

    private static LocalDate paymentDate(PatientPayment payment) {
        if (payment.getPaidAt() != null) return payment.getPaidAt();
        OffsetDateTime createdAt = payment.getCreatedAt();
        return createdAt == null ? LocalDate.now() : createdAt.atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
    }

    private static boolean isInPeriod(LocalDate date, LocalDate from, LocalDate to) {
        if (from != null && date.isBefore(from)) return false;
        if (to != null && date.isAfter(to)) return false;
        return true;
    }

    private record BillingTotals(
            BigDecimal approved,
            BigDecimal pending,
            BigDecimal paid,
            BigDecimal overdue,
            BigDecimal openBalance,
            BigDecimal receivedInPeriod
    ) {}

    private static class MutableTotals {
        private BigDecimal approved = BigDecimal.ZERO;
        private BigDecimal pending = BigDecimal.ZERO;
        private BigDecimal paid = BigDecimal.ZERO;
        private BigDecimal overdue = BigDecimal.ZERO;
        private BigDecimal openBalance = BigDecimal.ZERO;
        private BigDecimal receivedInPeriod = BigDecimal.ZERO;
        private int patientCount;

        void add(BillingTotals totals) {
            approved = approved.add(totals.approved());
            pending = pending.add(totals.pending());
            paid = paid.add(totals.paid());
            overdue = overdue.add(totals.overdue());
            openBalance = openBalance.add(totals.openBalance());
            receivedInPeriod = receivedInPeriod.add(totals.receivedInPeriod());
        }

        FinancialTotals toTotals() {
            return new FinancialTotals(approved, pending, paid, overdue, openBalance, receivedInPeriod, patientCount);
        }

        static MutableTotals empty() {
            return new MutableTotals();
        }

        ProfessionalBreakdown toBreakdown(UUID professionalId, String professionalName) {
            return new ProfessionalBreakdown(
                    professionalId,
                    professionalName,
                    approved,
                    pending,
                    paid,
                    overdue,
                    openBalance,
                    receivedInPeriod,
                    patientCount
            );
        }
    }

    public record PeriodRange(LocalDate from, LocalDate to) {}

    public record FinancialTotals(
            BigDecimal approved,
            BigDecimal pending,
            BigDecimal paid,
            BigDecimal overdue,
            BigDecimal openBalance,
            BigDecimal receivedInPeriod,
            int patientCount
    ) {}

    public record ProfessionalBreakdown(
            UUID professionalId,
            String professionalName,
            BigDecimal approved,
            BigDecimal pending,
            BigDecimal paid,
            BigDecimal overdue,
            BigDecimal openBalance,
            BigDecimal receivedInPeriod,
            int patientCount
    ) {}

    public record FinancialDashboardResponse(
            PeriodRange period,
            FinancialTotals totals,
            List<ProfessionalBreakdown> byProfessional
    ) {}
}
