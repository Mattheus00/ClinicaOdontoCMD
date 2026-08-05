package com.dentic.api.appointment.web;

import com.dentic.api.appointment.domain.Appointment;
import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.patient.domain.PatientPayment;
import com.dentic.api.patient.repository.PatientPaymentRepository;
import com.dentic.api.patient.repository.PatientRepository;
import com.dentic.api.procedure.domain.Procedure;
import com.dentic.api.procedure.repository.ProcedureRepository;
import com.dentic.api.professional.domain.Professional;
import com.dentic.api.professional.repository.ProfessionalRepository;
import com.dentic.api.security.AuthAttributes;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentControllerTest {

    @Mock private AppointmentRepository appointments;
    @Mock private PatientRepository patients;
    @Mock private ProfessionalRepository professionals;
    @Mock private ProcedureRepository procedures;
    @Mock private PatientPaymentRepository payments;
    @Mock private ClinicRepository clinics;

    private final UUID clinicId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID professionalId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private final UUID appointmentId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private AppointmentController controller;

    @BeforeEach
    void setUp() {
        controller = new AppointmentController(
                appointments, patients, professionals, procedures, payments, clinics, "America/Sao_Paulo"
        );
        TenantContext.setCurrentTenant(clinicId);
        AuthAttributes.setProfessionalId(professionalId);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                UUID.randomUUID(), null, List.of(new SimpleGrantedAuthority("ROLE_DENTIST"))
        ));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        AuthAttributes.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void confirm_byDentist_shouldCreatePaymentAndCompleteAppointment() {
        Clinic clinic = new Clinic();
        clinic.setId(clinicId);
        Patient patient = new Patient();
        patient.setId(UUID.randomUUID());
        Professional professional = new Professional();
        professional.setId(professionalId);
        Procedure procedure = new Procedure();
        procedure.setId(UUID.randomUUID());
        procedure.setName("Limpeza");
        procedure.setPrice(new BigDecimal("150.00"));
        Appointment appointment = new Appointment();
        appointment.setId(appointmentId);
        appointment.setClinic(clinic);
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setProcedure(procedure);
        appointment.setScheduledAt(OffsetDateTime.now());
        appointment.setDurationMinutes((short) 30);
        appointment.setStatus("CONFIRMED");

        when(appointments.findById(appointmentId)).thenReturn(Optional.of(appointment));
        when(payments.findByAppointmentId(appointmentId)).thenReturn(Optional.empty());
        when(payments.save(any(PatientPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(appointments.save(appointment)).thenReturn(appointment);

        var response = controller.confirm(appointmentId);

        assertNotNull(response.getBody());
        assertEquals("COMPLETED", response.getBody().status());
        ArgumentCaptor<PatientPayment> payment = ArgumentCaptor.forClass(PatientPayment.class);
        verify(payments).save(payment.capture());
        assertEquals(new BigDecimal("150.00"), payment.getValue().getAmount());
        assertEquals("PAID", payment.getValue().getStatus());
        assertEquals(appointment, payment.getValue().getAppointment());
        verify(appointments).save(appointment);
    }
}
