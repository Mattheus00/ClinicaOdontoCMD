package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.OdontogramEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OdontogramEntryRepository extends JpaRepository<OdontogramEntry, UUID> {
    List<OdontogramEntry> findByPatientIdOrderByRecordedAtDesc(UUID patientId);
    Optional<OdontogramEntry> findFirstByPatientIdAndToothNumberOrderByRecordedAtDesc(UUID patientId, String toothNumber);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OdontogramEntry o SET o.professional = null WHERE o.professional.id = :professionalId")
    void clearProfessional(@Param("professionalId") UUID professionalId);
}