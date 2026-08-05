package com.dentic.api.billing.repository;

import com.dentic.api.billing.domain.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    Plan findByName(String name);
}
