package com.dentic.api.professional.repository;

import com.dentic.api.professional.domain.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.List;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, UUID> {
    List<WorkingHours> findByProfessionalId(UUID professionalId);
}
