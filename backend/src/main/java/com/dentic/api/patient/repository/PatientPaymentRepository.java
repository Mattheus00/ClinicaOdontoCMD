package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.PatientPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientPaymentRepository extends JpaRepository<PatientPayment, UUID> {
    List<PatientPayment> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    Optional<PatientPayment> findByAppointmentId(UUID appointmentId);

    @Modifying
    @Query("UPDATE PatientPayment pp SET pp.appointment = null WHERE pp.appointment.professional.id = :professionalId")
    void clearAppointmentByProfessionalId(@Param("professionalId") UUID professionalId);

    @Query("""
        SELECT pp FROM PatientPayment pp
        JOIN FETCH pp.patient p
        LEFT JOIN FETCH pp.appointment a
        LEFT JOIN FETCH a.professional
        WHERE p.clinic.id = :clinicId
        ORDER BY pp.createdAt DESC
        """)
    List<PatientPayment> findAllByClinicId(@Param("clinicId") UUID clinicId);
}
