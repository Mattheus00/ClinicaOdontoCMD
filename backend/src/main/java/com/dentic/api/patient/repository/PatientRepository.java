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

    @Query(value = """
        SELECT * FROM patients p
        WHERE p.clinic_id = :clinicId
          AND (
            unaccent(lower(p.name)) LIKE unaccent(lower(concat('%', :search, '%')))
            OR (:phoneDigits <> '' AND dentic_digits(p.phone) LIKE concat('%', :phoneDigits, '%'))
            OR lower(coalesce(p.cpf, '')) LIKE lower(concat('%', :search, '%'))
            OR (:phoneDigits <> '' AND dentic_digits(coalesce(p.cpf, '')) LIKE concat('%', :phoneDigits, '%'))
          )
        ORDER BY p.name
        """, nativeQuery = true)
    List<Patient> search(
            @Param("clinicId") UUID clinicId,
            @Param("search") String search,
            @Param("phoneDigits") String phoneDigits
    );

    @Query(value = """
        SELECT * FROM patients p
        WHERE p.clinic_id = :clinicId
          AND (
            :search = ''
            OR unaccent(lower(p.name)) LIKE unaccent(lower(concat('%', :search, '%')))
            OR (:phoneDigits <> '' AND dentic_digits(p.phone) LIKE concat('%', :phoneDigits, '%'))
            OR lower(coalesce(p.cpf, '')) LIKE lower(concat('%', :search, '%'))
            OR (:phoneDigits <> '' AND dentic_digits(coalesce(p.cpf, '')) LIKE concat('%', :phoneDigits, '%'))
          )
        ORDER BY p.name
        """,
            countQuery = """
        SELECT count(*) FROM patients p
        WHERE p.clinic_id = :clinicId
          AND (
            :search = ''
            OR unaccent(lower(p.name)) LIKE unaccent(lower(concat('%', :search, '%')))
            OR (:phoneDigits <> '' AND dentic_digits(p.phone) LIKE concat('%', :phoneDigits, '%'))
            OR lower(coalesce(p.cpf, '')) LIKE lower(concat('%', :search, '%'))
            OR (:phoneDigits <> '' AND dentic_digits(coalesce(p.cpf, '')) LIKE concat('%', :phoneDigits, '%'))
          )
        """,
            nativeQuery = true)
    Page<Patient> searchPaged(
            @Param("clinicId") UUID clinicId,
            @Param("search") String search,
            @Param("phoneDigits") String phoneDigits,
            Pageable pageable
    );

    Optional<Patient> findByIdAndClinic_Id(UUID id, UUID clinicId);

    Optional<Patient> findByClinicIdAndPhone(UUID clinicId, String phone);

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
