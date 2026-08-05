package com.dentic.api.professional.web;

import com.dentic.api.appointment.repository.AppointmentRepository;
import com.dentic.api.multitenant.TenantContext;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfessionalControllerTest {

    @Mock
    private ProfessionalRepository professionals;
    @Mock
    private ClinicRepository clinics;
    @Mock
    private UserRepository users;
    @Mock
    private InviteTokenService inviteTokens;
    @Mock
    private AppointmentRepository appointments;
    @Mock
    private PatientRepository patients;
    @Mock
    private PatientPaymentRepository patientPayments;
    @Mock
    private TreatmentRecordRepository treatmentRecords;
    @Mock
    private OdontogramEntryRepository odontogramEntries;
    @Mock
    private RefreshTokenRepository refreshTokens;

    private ProfessionalController controller;

    private final UUID clinicId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID professionalId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new ProfessionalController(
                professionals,
                clinics,
                users,
                inviteTokens,
                appointments,
                patients,
                patientPayments,
                treatmentRecords,
                odontogramEntries,
                refreshTokens,
                "http://localhost:5173"
        );
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
    void delete_shouldClearReferencesAndRemoveAppointments() {
        Professional professional = new Professional();
        professional.setId(professionalId);
        professional.setUser(null);

        when(professionals.findByIdAndClinicId(professionalId, clinicId)).thenReturn(Optional.of(professional));
        when(professionals.saveAndFlush(professional)).thenReturn(professional);

        controller.delete(professionalId);

        verify(patients).clearPreferredProfessional(professionalId);
        verify(treatmentRecords).clearProfessional(professionalId);
        verify(odontogramEntries).clearProfessional(professionalId);
        verify(patientPayments).clearAppointmentByProfessionalId(professionalId);
        verify(appointments).deleteByProfessionalId(professionalId);
        verify(professionals).deleteById(professionalId);
    }
}
