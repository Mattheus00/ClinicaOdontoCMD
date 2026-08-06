package com.dentic.api.patient.web;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.common.PhoneNormalizer;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.*;
import com.dentic.api.patient.repository.*;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientRepository patients;
    private final ClinicRepository clinics;
    private final ProfessionalRepository professionals;
    private final PatientAnamnesisRepository anamneses;
    private final TreatmentRecordRepository treatments;
    private final OdontogramEntryRepository odontograms;
    private final TreatmentPlanRepository plans;
    private final PatientPaymentRepository payments;
    private final PatientInsuranceRepository insurances;
    private final PatientAccessLogRepository accessLogs;
    private final AppointmentRepository appointments;

    public PatientController(
            PatientRepository patients,
            ClinicRepository clinics,
            ProfessionalRepository professionals,
            PatientAnamnesisRepository anamneses,
            TreatmentRecordRepository treatments,
            OdontogramEntryRepository odontograms,
            TreatmentPlanRepository plans,
            PatientPaymentRepository payments,
            PatientInsuranceRepository insurances,
            PatientAccessLogRepository accessLogs,
            AppointmentRepository appointments
    ) {
        this.patients = patients;
        this.clinics = clinics;
        this.professionals = professionals;
        this.anamneses = anamneses;
        this.treatments = treatments;
        this.odontograms = odontograms;
        this.plans = plans;
        this.payments = payments;
        this.insurances = insurances;
        this.accessLogs = accessLogs;
        this.appointments = appointments;
    }

    @ModelAttribute
    void requireStaffAccess() {
        SecurityUtils.requireAdminOrSecretary();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<PatientResponse> list(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int pageSize = Math.min(Math.max(size, 1), 50);
        int pageNumber = Math.max(page, 0);
        Page<Patient> found = patients.searchPaged(
                clinicId(),
                search == null ? "" : search.trim(),
                PageRequest.of(pageNumber, pageSize, Sort.by("name"))
        );
        List<PatientResponse> content = found.getContent().stream().map(PatientResponse::from).toList();
        return new PageResponse<>(content, found.getTotalPages(), (int) found.getTotalElements(), found.getNumber(), found.getSize());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public PatientResponse get(@PathVariable UUID id) {
        Patient patient = requirePatient(id);
        logAccess(patient.getId(), "VIEW", "cadastro");
        return PatientResponse.from(patient);
    }

    @GetMapping("/{id}/summary")
    @Transactional(readOnly = true)
    public PatientSummaryResponse summary(@PathVariable UUID id) {
        Patient patient = requirePatient(id);
        logAccess(patient.getId(), "VIEW", "summary");
        BillingSummary billing = billingSummary(patient.getId());
        Optional<PatientAnamnesis> anamnesis = anamneses.findByPatientId(patient.getId());
        List<Appointment> history = appointments.findByPatientIdOrderByScheduledAtDesc(patient.getId());
        OffsetDateTime lastVisit = history.stream()
                .filter(a -> !"CANCELLED".equals(a.getStatus()))
                .map(Appointment::getScheduledAt)
                .findFirst()
                .orElse(null);
        return new PatientSummaryResponse(
                PatientResponse.from(patient),
                lastVisit,
                anamnesis.map(a -> Boolean.TRUE.equals(a.getIsPregnant())).orElse(false),
                anamnesis.map(a -> a.getAllergies() != null && !a.getAllergies().isBlank()).orElse(false),
                billing
        );
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PatientResponse> create(@RequestBody PatientRequest request) {
        Patient patient = new Patient();
        patient.setClinic(clinics.getReferenceById(clinicId()));
        apply(patient, request);
        patient.setConsentGivenAt(OffsetDateTime.now());
        patient.setConsentVersion("1.0");
        return ResponseEntity.ok(PatientResponse.from(patients.save(patient)));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<PatientResponse> update(@PathVariable UUID id, @RequestBody PatientRequest request) {
        Patient patient = requirePatient(id);
        apply(patient, request);
        logAccess(patient.getId(), "UPDATE", "cadastro");
        return ResponseEntity.ok(PatientResponse.from(patients.save(patient)));
    }

    @DeleteMapping("/{id}/personal-data")
    @Transactional
    public ResponseEntity<Void> anonymizePersonalData(@PathVariable UUID id) {
        Patient patient = requirePatient(id);
        patient.setName("Paciente anonimizado");
        patient.setPhone("anon-" + id);
        patient.setEmail(null);
        patient.setCpf(null);
        patient.setRg(null);
        patient.setAddressStreet(null);
        patient.setAddressNumber(null);
        patient.setAddressComplement(null);
        patient.setAddressDistrict(null);
        patient.setAddressCity(null);
        patient.setAddressState(null);
        patient.setAddressZip(null);
        patient.setGuardianName(null);
        patient.setGuardianPhone(null);
        patient.setGuardianCpf(null);
        patient.setReferralNotes(null);
        patient.setNotes(null);
        patient.setPreferredTimeNotes(null);
        patients.save(patient);

        anamneses.findByPatientId(id).ifPresent(a -> {
            a.setAllergies(null);
            a.setPreexistingConditions(null);
            a.setContinuousMedications(null);
            a.setPregnancyNotes(null);
            a.setHabitsNotes(null);
            a.setClinicalNotes(null);
            a.setIsPregnant(false);
            a.setIsSmoker(false);
            a.setHasBruxism(false);
            anamneses.save(a);
        });

        insurances.findByPatientId(id).forEach(ins -> {
            ins.setCardNumber(null);
            ins.setProviderName("Convênio anonimizado");
            insurances.save(ins);
        });

        logAccess(id, "ANONYMIZE", "personal-data");
        return ResponseEntity.noContent().build();
    }

    // --- Anamnese ---
    @GetMapping("/{id}/anamnesis")
    @Transactional(readOnly = true)
    public AnamnesisResponse getAnamnesis(@PathVariable UUID id) {
        Patient patient = requirePatient(id);
        logAccess(id, "VIEW", "anamnesis");
        return anamneses.findByPatientId(patient.getId()).map(AnamnesisResponse::from)
                .orElse(AnamnesisResponse.empty());
    }

    @PutMapping("/{id}/anamnesis")
    @Transactional
    public AnamnesisResponse putAnamnesis(@PathVariable UUID id, @RequestBody AnamnesisRequest request) {
        Patient patient = requirePatient(id);
        PatientAnamnesis value = anamneses.findByPatientId(patient.getId()).orElseGet(PatientAnamnesis::new);
        value.setPatient(patient);
        value.setAllergies(request.allergies());
        value.setPreexistingConditions(request.preexistingConditions());
        value.setContinuousMedications(request.continuousMedications());
        value.setIsPregnant(Boolean.TRUE.equals(request.isPregnant()));
        value.setPregnancyNotes(request.pregnancyNotes());
        value.setIsSmoker(Boolean.TRUE.equals(request.isSmoker()));
        value.setHasBruxism(Boolean.TRUE.equals(request.hasBruxism()));
        value.setHabitsNotes(request.habitsNotes());
        value.setClinicalNotes(request.clinicalNotes());
        logAccess(id, "UPDATE", "anamnesis");
        return AnamnesisResponse.from(anamneses.save(value));
    }

    // --- Treatments ---
    @GetMapping("/{id}/treatments")
    @Transactional(readOnly = true)
    public List<TreatmentResponse> listTreatments(@PathVariable UUID id) {
        requirePatient(id);
        logAccess(id, "VIEW", "treatments");
        return treatments.findByPatientIdOrderByPerformedAtDesc(id).stream().map(TreatmentResponse::from).toList();
    }

    @PostMapping("/{id}/treatments")
    @Transactional
    public TreatmentResponse createTreatment(@PathVariable UUID id, @RequestBody TreatmentRequest request) {
        Patient patient = requirePatient(id);
        TreatmentRecord record = new TreatmentRecord();
        record.setPatient(patient);
        record.setProcedureName(request.procedureName());
        record.setNotes(request.notes());
        record.setStatus(request.status() == null ? "COMPLETED" : request.status());
        record.setPerformedAt(request.performedAt() == null ? LocalDate.now() : LocalDate.parse(request.performedAt()));
        if (request.professionalId() != null) {
            record.setProfessional(professionals.findById(request.professionalId())
                    .filter(p -> p.getClinic().getId().equals(clinicId()))
                    .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado")));
        }
        logAccess(id, "UPDATE", "treatments");
        return TreatmentResponse.from(treatments.save(record));
    }

    // --- Odontogram ---
    @GetMapping("/{id}/odontogram")
    @Transactional(readOnly = true)
    public List<OdontogramResponse> getOdontogram(@PathVariable UUID id) {
        requirePatient(id);
        logAccess(id, "VIEW", "odontogram");
        Map<String, OdontogramEntry> latest = new LinkedHashMap<>();
        for (OdontogramEntry entry : odontograms.findByPatientIdOrderByRecordedAtDesc(id)) {
            latest.putIfAbsent(entry.getToothNumber(), entry);
        }
        return latest.values().stream().map(OdontogramResponse::from).toList();
    }

    @PutMapping("/{id}/odontogram")
    @Transactional
    public List<OdontogramResponse> putOdontogram(@PathVariable UUID id, @RequestBody List<OdontogramRequest> requests) {
        Patient patient = requirePatient(id);
        for (OdontogramRequest request : requests) {
            OdontogramEntry entry = new OdontogramEntry();
            entry.setPatient(patient);
            entry.setToothNumber(request.toothNumber());
            entry.setSurface(request.surface());
            entry.setStatus(request.status() == null ? "HEALTHY" : request.status());
            entry.setProcedureType(request.procedureType());
            entry.setNotes(request.notes());
            if (request.professionalId() != null) {
                entry.setProfessional(professionals.findById(request.professionalId())
                        .filter(p -> p.getClinic().getId().equals(clinicId()))
                        .orElse(null));
            }
            odontograms.save(entry);
        }
        logAccess(id, "UPDATE", "odontogram");
        Map<String, OdontogramEntry> latest = new LinkedHashMap<>();
        for (OdontogramEntry entry : odontograms.findByPatientIdOrderByRecordedAtDesc(id)) {
            latest.putIfAbsent(entry.getToothNumber(), entry);
        }
        return latest.values().stream().map(OdontogramResponse::from).toList();
    }

    // --- Billing ---
    @GetMapping("/{id}/billing/summary")
    @Transactional(readOnly = true)
    public BillingSummary getBillingSummary(@PathVariable UUID id) {
        requirePatient(id);
        logAccess(id, "VIEW", "billing");
        return billingSummary(id);
    }

    @GetMapping("/{id}/billing/plans")
    @Transactional(readOnly = true)
    public List<PlanResponse> listPlans(@PathVariable UUID id) {
        requirePatient(id);
        return plans.findByPatientIdOrderByCreatedAtDesc(id).stream().map(PlanResponse::from).toList();
    }

    @PostMapping("/{id}/billing/plans")
    @Transactional
    public PlanResponse createPlan(@PathVariable UUID id, @RequestBody PlanRequest request) {
        Patient patient = requirePatient(id);
        TreatmentPlan plan = new TreatmentPlan();
        plan.setPatient(patient);
        plan.setTitle(request.title());
        plan.setStatus(request.status() == null ? "PENDING" : request.status());
        plan.setNotes(request.notes());
        if (request.dueDate() != null && !request.dueDate().isBlank()) {
            plan.setDueDate(LocalDate.parse(request.dueDate()));
        }
        BigDecimal total = BigDecimal.ZERO;
        if (request.items() != null) {
            for (PlanItemRequest itemReq : request.items()) {
                TreatmentPlanItem item = new TreatmentPlanItem();
                item.setPlan(plan);
                item.setDescription(itemReq.description());
                item.setQuantity(itemReq.quantity() == null ? 1 : itemReq.quantity());
                item.setUnitPrice(itemReq.unitPrice() == null ? BigDecimal.ZERO : itemReq.unitPrice());
                plan.getItems().add(item);
                total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        plan.setTotalAmount(total);
        logAccess(id, "UPDATE", "billing-plan");
        return PlanResponse.from(plans.save(plan));
    }

    @GetMapping("/{id}/billing/payments")
    @Transactional(readOnly = true)
    public List<PaymentResponse> listPayments(@PathVariable UUID id) {
        requirePatient(id);
        return payments.findByPatientIdOrderByCreatedAtDesc(id).stream().map(PaymentResponse::from).toList();
    }

    @PostMapping("/{id}/billing/payments")
    @Transactional
    public PaymentResponse createPayment(@PathVariable UUID id, @RequestBody PaymentRequest request) {
        Patient patient = requirePatient(id);
        PatientPayment payment = new PatientPayment();
        payment.setPatient(patient);
        payment.setAmount(request.amount());
        payment.setMethod(request.method() == null ? "CASH" : request.method());
        payment.setStatus(request.status() == null ? "PAID" : request.status());
        payment.setNotes(request.notes());
        if (request.paidAt() != null && !request.paidAt().isBlank()) {
            payment.setPaidAt(LocalDate.parse(request.paidAt()));
        }
        if (request.planId() != null) {
            payment.setPlan(plans.findById(request.planId())
                    .filter(p -> p.getPatient().getId().equals(id))
                    .orElseThrow(() -> new IllegalArgumentException("Orçamento não encontrado")));
        }
        logAccess(id, "UPDATE", "billing-payment");
        return PaymentResponse.from(payments.save(payment));
    }

    @GetMapping("/{id}/billing/insurances")
    @Transactional(readOnly = true)
    public List<InsuranceResponse> listInsurances(@PathVariable UUID id) {
        requirePatient(id);
        return insurances.findByPatientIdOrderByCreatedAtDesc(id).stream().map(InsuranceResponse::from).toList();
    }

    @PostMapping("/{id}/billing/insurances")
    @Transactional
    public InsuranceResponse createInsurance(@PathVariable UUID id, @RequestBody InsuranceRequest request) {
        Patient patient = requirePatient(id);
        PatientInsurance insurance = new PatientInsurance();
        insurance.setPatient(patient);
        insurance.setProviderName(request.providerName());
        insurance.setPlanName(request.planName());
        insurance.setCardNumber(request.cardNumber());
        insurance.setStatus(request.status() == null ? "ACTIVE" : request.status());
        logAccess(id, "UPDATE", "billing-insurance");
        return InsuranceResponse.from(insurances.save(insurance));
    }

    // --- Appointments history & access logs ---
    @GetMapping("/{id}/appointments")
    @Transactional(readOnly = true)
    public List<AppointmentHistoryResponse> listAppointments(@PathVariable UUID id) {
        requirePatient(id);
        logAccess(id, "VIEW", "appointments");
        return appointments.findByPatientIdOrderByScheduledAtDesc(id).stream()
                .map(AppointmentHistoryResponse::from)
                .toList();
    }

    @GetMapping("/{id}/access-logs")
    @Transactional(readOnly = true)
    public List<AccessLogResponse> listAccessLogs(@PathVariable UUID id) {
        requirePatient(id);
        return accessLogs.findByPatientIdOrderByCreatedAtDesc(id).stream()
                .limit(50)
                .map(AccessLogResponse::from)
                .toList();
    }

    private BillingSummary billingSummary(UUID patientId) {
        List<TreatmentPlan> patientPlans = plans.findByPatientIdOrderByCreatedAtDesc(patientId);
        List<PatientPayment> patientPayments = payments.findByPatientIdOrderByCreatedAtDesc(patientId);
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
        return new BillingSummary(approved, pending, paid, overdue, open);
    }

    private void apply(Patient patient, PatientRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Informe o nome do paciente.");
        }
        String phone = PhoneNormalizer.normalize(request.phone());
        if (phone.length() < 10) {
            throw new IllegalArgumentException("Informe um telefone válido com DDD.");
        }
        patient.setName(request.name().trim());
        patient.setPhone(phone);
        patient.setPhoneIsWhatsapp(request.phoneIsWhatsapp() == null || request.phoneIsWhatsapp());
        patient.setEmail(blankToNull(request.email()));
        patient.setCpf(blankToNull(request.cpf()));
        patient.setRg(blankToNull(request.rg()));
        patient.setGender(blankToNull(request.gender()));
        if (request.birthDate() != null && !request.birthDate().isBlank()) {
            patient.setBirthDate(LocalDate.parse(request.birthDate()));
        } else {
            patient.setBirthDate(null);
        }
        patient.setAddressStreet(blankToNull(request.addressStreet()));
        patient.setAddressNumber(blankToNull(request.addressNumber()));
        patient.setAddressComplement(blankToNull(request.addressComplement()));
        patient.setAddressDistrict(blankToNull(request.addressDistrict()));
        patient.setAddressCity(blankToNull(request.addressCity()));
        patient.setAddressState(blankToNull(request.addressState()));
        patient.setAddressZip(blankToNull(request.addressZip()));
        patient.setGuardianName(blankToNull(request.guardianName()));
        patient.setGuardianPhone(blankToNull(request.guardianPhone()));
        patient.setGuardianCpf(blankToNull(request.guardianCpf()));
        patient.setReferralSource(blankToNull(request.referralSource()));
        patient.setReferralNotes(blankToNull(request.referralNotes()));
        patient.setNotes(blankToNull(request.notes()));
        patient.setPreferredTimeNotes(blankToNull(request.preferredTimeNotes()));
        if (request.preferredProfessionalId() != null) {
            Professional professional = professionals.findById(request.preferredProfessionalId())
                    .filter(p -> p.getClinic().getId().equals(clinicId()))
                    .orElseThrow(() -> new IllegalArgumentException("Profissional não encontrado"));
            patient.setPreferredProfessional(professional);
        } else {
            patient.setPreferredProfessional(null);
        }
    }

    private Patient requirePatient(UUID id) {
        return patients.findByIdAndClinic_Id(id, clinicId())
                .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado"));
    }

    private void logAccess(UUID patientId, String action, String resource) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) return;
        PatientAccessLog log = new PatientAccessLog();
        log.setClinicId(clinicId());
        log.setPatientId(patientId);
        log.setUserId(UUID.fromString(auth.getPrincipal().toString()));
        log.setAction(action);
        log.setResource(resource);
        accessLogs.save(log);
    }

    private UUID clinicId() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public record PatientRequest(
            String name, String phone, Boolean phoneIsWhatsapp, String email, String cpf, String rg,
            String birthDate, String gender,
            String addressStreet, String addressNumber, String addressComplement, String addressDistrict,
            String addressCity, String addressState, String addressZip,
            String guardianName, String guardianPhone, String guardianCpf,
            String referralSource, String referralNotes, String notes,
            UUID preferredProfessionalId, String preferredTimeNotes
    ) {}

    public record PatientResponse(
            UUID id, String name, String phone, Boolean phoneIsWhatsapp, String email, String cpf, String rg,
            LocalDate birthDate, String gender,
            String addressStreet, String addressNumber, String addressComplement, String addressDistrict,
            String addressCity, String addressState, String addressZip,
            String guardianName, String guardianPhone, String guardianCpf,
            String referralSource, String referralNotes, String notes,
            UUID preferredProfessionalId, String preferredProfessionalName, String preferredTimeNotes,
            OffsetDateTime consentGivenAt, String consentVersion, OffsetDateTime createdAt
    ) {
        static PatientResponse from(Patient p) {
            return new PatientResponse(
                    p.getId(), p.getName(), p.getPhone(), p.getPhoneIsWhatsapp(), p.getEmail(), p.getCpf(), p.getRg(),
                    p.getBirthDate(), p.getGender(),
                    p.getAddressStreet(), p.getAddressNumber(), p.getAddressComplement(), p.getAddressDistrict(),
                    p.getAddressCity(), p.getAddressState(), p.getAddressZip(),
                    p.getGuardianName(), p.getGuardianPhone(), p.getGuardianCpf(),
                    p.getReferralSource(), p.getReferralNotes(), p.getNotes(),
                    p.getPreferredProfessional() == null ? null : p.getPreferredProfessional().getId(),
                    p.getPreferredProfessional() == null ? null : p.getPreferredProfessional().getName(),
                    p.getPreferredTimeNotes(),
                    p.getConsentGivenAt(), p.getConsentVersion(), p.getCreatedAt()
            );
        }
    }

    public record AnamnesisRequest(
            String allergies, String preexistingConditions, String continuousMedications,
            Boolean isPregnant, String pregnancyNotes, Boolean isSmoker, Boolean hasBruxism,
            String habitsNotes, String clinicalNotes
    ) {}

    public record AnamnesisResponse(
            String allergies, String preexistingConditions, String continuousMedications,
            Boolean isPregnant, String pregnancyNotes, Boolean isSmoker, Boolean hasBruxism,
            String habitsNotes, String clinicalNotes, OffsetDateTime updatedAt
    ) {
        static AnamnesisResponse empty() {
            return new AnamnesisResponse(null, null, null, false, null, false, false, null, null, null);
        }
        static AnamnesisResponse from(PatientAnamnesis a) {
            return new AnamnesisResponse(
                    a.getAllergies(), a.getPreexistingConditions(), a.getContinuousMedications(),
                    a.getIsPregnant(), a.getPregnancyNotes(), a.getIsSmoker(), a.getHasBruxism(),
                    a.getHabitsNotes(), a.getClinicalNotes(), a.getUpdatedAt()
            );
        }
    }

    public record TreatmentRequest(String procedureName, String notes, String status, String performedAt, UUID professionalId) {}
    public record TreatmentResponse(UUID id, String procedureName, String notes, String status, LocalDate performedAt, UUID professionalId, String professionalName) {
        static TreatmentResponse from(TreatmentRecord r) {
            return new TreatmentResponse(
                    r.getId(), r.getProcedureName(), r.getNotes(), r.getStatus(), r.getPerformedAt(),
                    r.getProfessional() == null ? null : r.getProfessional().getId(),
                    r.getProfessional() == null ? null : r.getProfessional().getName()
            );
        }
    }

    public record OdontogramRequest(String toothNumber, String surface, String status, String procedureType, String notes, UUID professionalId) {}
    public record OdontogramResponse(UUID id, String toothNumber, String surface, String status, String procedureType, String notes, OffsetDateTime recordedAt) {
        static OdontogramResponse from(OdontogramEntry e) {
            return new OdontogramResponse(e.getId(), e.getToothNumber(), e.getSurface(), e.getStatus(), e.getProcedureType(), e.getNotes(), e.getRecordedAt());
        }
    }

    public record PlanItemRequest(String description, Integer quantity, BigDecimal unitPrice) {}
    public record PlanRequest(String title, String status, String dueDate, String notes, List<PlanItemRequest> items) {}
    public record PlanItemResponse(UUID id, String description, Integer quantity, BigDecimal unitPrice) {}
    public record PlanResponse(UUID id, String title, String status, BigDecimal totalAmount, LocalDate dueDate, String notes, List<PlanItemResponse> items, OffsetDateTime createdAt) {
        static PlanResponse from(TreatmentPlan p) {
            return new PlanResponse(
                    p.getId(), p.getTitle(), p.getStatus(), p.getTotalAmount(), p.getDueDate(), p.getNotes(),
                    p.getItems().stream().map(i -> new PlanItemResponse(i.getId(), i.getDescription(), i.getQuantity(), i.getUnitPrice())).collect(Collectors.toList()),
                    p.getCreatedAt()
            );
        }
    }

    public record PaymentRequest(BigDecimal amount, String method, String status, String paidAt, UUID planId, String notes) {}
    public record PaymentResponse(UUID id, BigDecimal amount, String method, String status, LocalDate paidAt, UUID planId, String notes) {
        static PaymentResponse from(PatientPayment p) {
            return new PaymentResponse(
                    p.getId(), p.getAmount(), p.getMethod(), p.getStatus(), p.getPaidAt(),
                    p.getPlan() == null ? null : p.getPlan().getId(), p.getNotes()
            );
        }
    }

    public record InsuranceRequest(String providerName, String planName, String cardNumber, String status) {}
    public record InsuranceResponse(UUID id, String providerName, String planName, String cardNumber, String status) {
        static InsuranceResponse from(PatientInsurance i) {
            return new InsuranceResponse(i.getId(), i.getProviderName(), i.getPlanName(), maskCardNumber(i.getCardNumber()), i.getStatus());
        }

        private static String maskCardNumber(String value) {
            if (value == null) return null;
            if (value.length() <= 4) return "****";
            return "****" + value.substring(value.length() - 4);
        }
    }

    public record BillingSummary(BigDecimal approved, BigDecimal pending, BigDecimal paid, BigDecimal overdue, BigDecimal openBalance) {}
    public record PatientSummaryResponse(PatientResponse patient, OffsetDateTime lastVisitAt, boolean pregnantFlag, boolean hasAllergies, BillingSummary billing) {}
    public record AppointmentHistoryResponse(UUID id, OffsetDateTime startsAt, String status, String professionalName) {
        static AppointmentHistoryResponse from(Appointment a) {
            return new AppointmentHistoryResponse(a.getId(), a.getScheduledAt(), a.getStatus(), a.getProfessional().getName());
        }
    }
    public record AccessLogResponse(UUID id, UUID userId, String action, String resource, OffsetDateTime createdAt) {
        static AccessLogResponse from(PatientAccessLog l) {
            return new AccessLogResponse(l.getId(), l.getUserId(), l.getAction(), l.getResource(), l.getCreatedAt());
        }
    }
    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}
}
