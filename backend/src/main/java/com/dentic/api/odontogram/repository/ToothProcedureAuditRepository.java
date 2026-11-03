package com.dentic.api.odontogram.repository;

import com.dentic.api.odontogram.domain.ToothProcedureAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ToothProcedureAuditRepository extends JpaRepository<ToothProcedureAudit, UUID> {

    List<ToothProcedureAudit> findByToothProcedureIdAndClinicIdOrderByCreatedAtDesc(UUID toothProcedureId, UUID clinicId);
}
