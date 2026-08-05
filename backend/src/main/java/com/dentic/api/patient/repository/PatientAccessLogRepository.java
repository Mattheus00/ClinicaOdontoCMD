package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.PatientAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PatientAccessLogRepository extends JpaRepository<PatientAccessLog, UUID> {
    List<PatientAccessLog> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
