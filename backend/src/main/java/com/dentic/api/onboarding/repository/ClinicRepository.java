package com.dentic.api.onboarding.repository;

import com.dentic.api.onboarding.domain.Clinic;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.util.Optional;

public interface ClinicRepository extends JpaRepository<Clinic, UUID> {
    Optional<Clinic> findByEmail(String email);
}
