package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.TreatmentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TreatmentRecordRepository extends JpaRepository<TreatmentRecord, UUID> {
    List<TreatmentRecord> findByPatientIdOrderByPerformedAtDesc(UUID patientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE TreatmentRecord t SET t.professional = null WHERE t.professional.id = :professionalId")
    void clearProfessional(@Param("professionalId") UUID professionalId);
}