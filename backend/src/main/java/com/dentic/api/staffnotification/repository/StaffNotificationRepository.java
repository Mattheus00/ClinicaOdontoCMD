package com.dentic.api.staffnotification.repository;

import com.dentic.api.staffnotification.domain.StaffNotification;
import org.springframework.data.jpa.repository.JpaRepository;
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
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findRecentByClinicId(@Param("clinicId") UUID clinicId);

    @Query("""
        SELECT n FROM StaffNotification n
        LEFT JOIN FETCH n.appointment
        WHERE n.clinic.id = :clinicId
          AND n.readAt IS NULL
        ORDER BY n.createdAt DESC
        """)
    List<StaffNotification> findUnreadByClinicId(@Param("clinicId") UUID clinicId);

    long countByClinicIdAndReadAtIsNull(UUID clinicId);

    Optional<StaffNotification> findByIdAndClinic_Id(UUID id, UUID clinicId);

    List<StaffNotification> findByAppointment_IdAndClinic_Id(UUID appointmentId, UUID clinicId);
}
