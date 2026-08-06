package com.dentic.api.professional.repository;

import com.dentic.api.professional.domain.Professional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfessionalRepository extends JpaRepository<Professional, UUID> {
    @Query("""
        SELECT DISTINCT p FROM Professional p
        LEFT JOIN FETCH p.user
        WHERE p.clinic.id = :clinicId
        """)
    List<Professional> findByClinicId(@Param("clinicId") UUID clinicId);

    Optional<Professional> findByIdAndClinicId(UUID id, UUID clinicId);

    Optional<Professional> findByInviteTokenHash(String inviteTokenHash);

    @Query("""
        SELECT p FROM Professional p
        JOIN FETCH p.clinic
        WHERE p.inviteTokenHash = :tokenHash
        """)
    Optional<Professional> findInviteByTokenHash(@Param("tokenHash") String tokenHash);

    boolean existsByClinicIdAndEmailIgnoreCase(UUID clinicId, String email);

    @Query("SELECT p.id FROM Professional p WHERE p.user.id = :userId")
    Optional<UUID> findProfessionalIdByUserId(@Param("userId") UUID userId);
}
