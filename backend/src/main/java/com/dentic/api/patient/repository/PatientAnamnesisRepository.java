package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.PatientAnamnesis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientAnamnesisRepository extends JpaRepository<PatientAnamnesis, UUID> {
    Optional<PatientAnamnesis> findByPatientId(UUID patientId);
}
