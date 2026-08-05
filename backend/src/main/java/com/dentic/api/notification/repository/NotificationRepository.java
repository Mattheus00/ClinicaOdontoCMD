package com.dentic.api.notification.repository;

import com.dentic.api.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByStatusAndSentAtIsNull(String status);
}
