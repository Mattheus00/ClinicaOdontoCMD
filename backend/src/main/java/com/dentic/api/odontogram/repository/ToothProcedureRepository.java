package com.dentic.api.odontogram.repository;

import com.dentic.api.odontogram.domain.ToothProcedure;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ToothProcedureRepository extends JpaRepository<ToothProcedure, UUID> {

    @EntityGraph(attributePaths = {"professional", "appointment"})
    List<ToothProcedure> findByPatientIdAndClinicIdOrderByCreatedAtDesc(UUID patientId, UUID clinicId);

    @EntityGraph(attributePaths = {"professional", "appointment", "patient"})
    Optional<ToothProcedure> findByIdAndClinicId(UUID id, UUID clinicId);

    @Modifying
    @Query("UPDATE ToothProcedure t SET t.professional = null WHERE t.professional.id = :professionalId")
    void clearProfessional(@Param("professionalId") UUID professionalId);

    @Modifying
    @Query("UPDATE ToothProcedure t SET t.appointment = null WHERE t.appointment.professional.id = :professionalId")
    void clearAppointmentByProfessionalId(@Param("professionalId") UUID professionalId);
}
