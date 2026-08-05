package com.dentic.api.patient.web;

import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.patient.repository.*;
import com.dentic.api.professional.repository.ProfessionalRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientControllerTest {

    @Mock
    private PatientRepository patients;
    @Mock
    private ClinicRepository clinics;
    @Mock
    private ProfessionalRepository professionals;
    @Mock
    private PatientAnamnesisRepository anamneses;
    @Mock
    private TreatmentRecordRepository treatments;
    @Mock
    private OdontogramEntryRepository odontograms;
    @Mock
    private TreatmentPlanRepository plans;
    @Mock
    private PatientPaymentRepository payments;
    @Mock
    private PatientInsuranceRepository insurances;
    @Mock
    private PatientAccessLogRepository accessLogs;
    @Mock
    private AppointmentRepository appointments;

    @InjectMocks
    private PatientController controller;

    private final UUID clinicId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID patientId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(clinicId);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        UUID.randomUUID(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void update_shouldPersistPatientData() {
        Clinic clinic = new Clinic();
        clinic.setId(clinicId);

        Patient patient = new Patient();
        patient.setId(patientId);
        patient.setClinic(clinic);
        patient.setName("Antigo");
        patient.setPhone("31999999999");

        when(patients.findByIdAndClinic_Id(patientId, clinicId)).thenReturn(Optional.of(patient));
        when(patients.save(any(Patient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<PatientController.PatientResponse> response = controller.update(
                patientId,
                new PatientController.PatientRequest(
                        "Matheus Pereira",
                        "31983599298",
                        true,
                        "matheus@email.com",
                        "12345678901",
                        null,
                        "1990-01-15",
                        "M",
                        "Rua A",
                        "100",
                        null,
                        "Centro",
                        "Belo Horizonte",
                        "MG",
                        "30110000",
                        null,
                        null,
                        null,
                        "indicacao",
                        null,
                        "Observação",
                        null,
                        "Manhãs"
                )
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Matheus Pereira", response.getBody().name());
        assertEquals("matheus@email.com", response.getBody().email());

        ArgumentCaptor<Patient> captor = ArgumentCaptor.forClass(Patient.class);
        verify(patients).save(captor.capture());
        assertEquals("Matheus Pereira", captor.getValue().getName());
        assertEquals("31983599298", captor.getValue().getPhone());
        assertEquals("matheus@email.com", captor.getValue().getEmail());
    }
}
