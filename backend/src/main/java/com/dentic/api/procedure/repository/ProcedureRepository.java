package com.dentic.api.procedure.repository;

import com.dentic.api.procedure.domain.Procedure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProcedureRepository extends JpaRepository<Procedure, UUID> {
    List<Procedure> findByClinicIdOrderByNameAsc(UUID clinicId);

    Optional<Procedure> findByIdAndClinicId(UUID id, UUID clinicId);
}
