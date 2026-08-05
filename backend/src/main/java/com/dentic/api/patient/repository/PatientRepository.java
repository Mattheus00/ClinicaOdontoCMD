package com.dentic.api.patient.repository;

import com.dentic.api.patient.domain.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PatientRepository extends JpaRepository<Patient, UUID> {
    List<Patient> findByClinicIdAndNameContainingIgnoreCase(UUID clinicId, String name);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.clinic.id = :clinicId
          AND (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR p.phone LIKE CONCAT('%', :search, '%')
            OR p.cpf LIKE CONCAT('%', :search, '%')
          )
        ORDER BY p.name
        """)
    List<Patient> search(@Param("clinicId") UUID clinicId, @Param("search") String search);

    @Query("""
        SELECT p FROM Patient p
        WHERE p.clinic.id = :clinicId
          AND (
            :search = ''
            OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR p.phone LIKE CONCAT('%', :search, '%')
            OR p.cpf LIKE CONCAT('%', :search, '%')
          )
        """)
    Page<Patient> searchPaged(
            @Param("clinicId") UUID clinicId,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<Patient> findByIdAndClinic_Id(UUID id, UUID clinicId);

    @Query("""
        SELECT p FROM Patient p
        LEFT JOIN FETCH p.preferredProfessional
        WHERE p.clinic.id = :clinicId
        ORDER BY p.name
        """)
    List<Patient> findByClinicId(@Param("clinicId") UUID clinicId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Patient p SET p.preferredProfessional = null WHERE p.preferredProfessional.id = :professionalId")
    void clearPreferredProfessional(@Param("professionalId") UUID professionalId);
}
