package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.PatientInsurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PatientInsuranceRepository extends JpaRepository<PatientInsurance, UUID> {
    List<PatientInsurance> findByPatientId(UUID patientId);
    List<PatientInsurance> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
}
