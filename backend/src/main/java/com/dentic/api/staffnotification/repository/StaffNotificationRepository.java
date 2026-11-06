package com.dentic.api.staffnotification.repository;

import com.dentic.api.staffnotification.domain.StaffNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffNotificationRepository extends JpaRepository<StaffNotification, UUID> {

    @Query("""
        SELECT n FROM StaffNotification n
        LEFT JOIN FETCH n.appointment
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional IS NULL
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findClinicInbox(@Param("clinicId") UUID clinicId, Pageable pageable);

    default List<StaffNotification> findClinicInbox(UUID clinicId) { return findClinicInbox(clinicId, Pageable.unpaged()); }

    @Query("""
        SELECT n FROM StaffNotification n
        LEFT JOIN FETCH n.appointment
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional IS NULL
          AND n.readAt IS NULL
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findUnreadClinicInbox(@Param("clinicId") UUID clinicId, Pageable pageable);

    default List<StaffNotification> findUnreadClinicInbox(UUID clinicId) { return findUnreadClinicInbox(clinicId, Pageable.unpaged()); }

    @Query("""
        SELECT COUNT(n) FROM StaffNotification n
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional IS NULL
          AND n.readAt IS NULL
        """)
    long countUnreadClinicInbox(@Param("clinicId") UUID clinicId);

    @Query("""
        SELECT n FROM StaffNotification n
        LEFT JOIN FETCH n.appointment
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional.id = :professionalId
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findForProfessional(
            @Param("clinicId") UUID clinicId,
            @Param("professionalId") UUID professionalId, Pageable pageable
    );

    default List<StaffNotification> findForProfessional(UUID clinicId, UUID professionalId) { return findForProfessional(clinicId, professionalId, Pageable.unpaged()); }

    @Query("""
        SELECT n FROM StaffNotification n
        LEFT JOIN FETCH n.appointment
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional.id = :professionalId
          AND n.readAt IS NULL
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findUnreadForProfessional(
            @Param("clinicId") UUID clinicId,
            @Param("professionalId") UUID professionalId, Pageable pageable
    );

    default List<StaffNotification> findUnreadForProfessional(UUID clinicId, UUID professionalId) { return findUnreadForProfessional(clinicId, professionalId, Pageable.unpaged()); }

    @Query("""
        SELECT COUNT(n) FROM StaffNotification n
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional.id = :professionalId
          AND n.readAt IS NULL
        """)
    long countUnreadForProfessional(
            @Param("clinicId") UUID clinicId,
            @Param("professionalId") UUID professionalId
    );

    Optional<StaffNotification> findByIdAndClinic_Id(UUID id, UUID clinicId);

    List<StaffNotification> findByAppointment_IdAndClinic_Id(UUID appointmentId, UUID clinicId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM StaffNotification n WHERE n.clinic.id = :clinicId AND n.recipientProfessional IS NULL")
    int deleteClinicInbox(@Param("clinicId") UUID clinicId);

    @Modifying(clearAutomatically = true)
    @Query("""
        DELETE FROM StaffNotification n
        WHERE n.clinic.id = :clinicId
          AND n.recipientProfessional.id = :professionalId
        """)
    int deleteForProfessional(@Param("clinicId") UUID clinicId, @Param("professionalId") UUID professionalId);
}
