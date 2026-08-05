package com.dentic.api.appointment.repository;

import com.dentic.api.appointment.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByProfessionalIdAndScheduledAtBetween(UUID professionalId, OffsetDateTime start, OffsetDateTime end);
    List<Appointment> findByClinicIdAndScheduledAtBetween(UUID clinicId, OffsetDateTime start, OffsetDateTime end);

    @Query("""
        SELECT DISTINCT a FROM Appointment a
        JOIN FETCH a.professional
        JOIN FETCH a.patient
        LEFT JOIN FETCH a.procedure
        WHERE a.clinic.id = :clinicId
          AND a.scheduledAt >= :start
          AND a.scheduledAt < :end
          AND (:professionalId IS NULL OR a.professional.id = :professionalId)
        ORDER BY a.scheduledAt
        """)
    List<Appointment> findAgendaWithDetails(
            @Param("clinicId") UUID clinicId,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end,
            @Param("professionalId") UUID professionalId
    );

    List<Appointment> findByPatientIdOrderByScheduledAtDesc(UUID patientId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.professional.id = :professionalId")
    long countByProfessionalId(@Param("professionalId") UUID professionalId);

    @Modifying
    @Query("DELETE FROM Appointment a WHERE a.professional.id = :professionalId")
    void deleteByProfessionalId(@Param("professionalId") UUID professionalId);

    @Query("""
        SELECT a FROM Appointment a
        JOIN FETCH a.professional
        JOIN FETCH a.patient p
        WHERE p.id IN :patientIds
        ORDER BY a.scheduledAt DESC
        """)
    List<Appointment> findByPatientIdIn(@Param("patientIds") Collection<UUID> patientIds);
}
