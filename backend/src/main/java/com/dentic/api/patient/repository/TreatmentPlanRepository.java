package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.TreatmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, UUID> {
    List<TreatmentPlan> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    @Query("""
        SELECT tp FROM TreatmentPlan tp
        JOIN FETCH tp.patient p
        WHERE p.clinic.id = :clinicId
        """)
    List<TreatmentPlan> findAllByClinicId(@Param("clinicId") UUID clinicId);
}
