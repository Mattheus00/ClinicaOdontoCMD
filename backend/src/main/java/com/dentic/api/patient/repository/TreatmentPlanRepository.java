package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.TreatmentPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TreatmentPlanRepository extends JpaRepository<TreatmentPlan, UUID> {
    interface Totals { java.math.BigDecimal getApproved(); java.math.BigDecimal getPending(); java.math.BigDecimal getOverdue(); }
    @Query("""
        SELECT COALESCE(SUM(CASE WHEN t.status='APPROVED' THEN t.totalAmount ELSE 0 END),0) AS approved,
          COALESCE(SUM(CASE WHEN t.status IN ('PENDING','DRAFT') THEN t.totalAmount ELSE 0 END),0) AS pending,
          COALESCE(SUM(CASE WHEN t.status IN ('PENDING','APPROVED') AND t.dueDate < :today THEN t.totalAmount ELSE 0 END),0) AS overdue
        FROM TreatmentPlan t WHERE t.patient.id=:patientId
        """)
    Totals summarize(@Param("patientId") UUID patientId, @Param("today") java.time.LocalDate today);
    List<TreatmentPlan> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    @Query("""
        SELECT tp FROM TreatmentPlan tp
        JOIN FETCH tp.patient p
        WHERE p.clinic.id = :clinicId
        """)
    List<TreatmentPlan> findAllByClinicId(@Param("clinicId") UUID clinicId);
}
