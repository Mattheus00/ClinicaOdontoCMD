package com.dentic.api.staffnotification.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.security.SecurityUtils;
import com.dentic.api.staffnotification.domain.StaffNotification;
import com.dentic.api.staffnotification.repository.StaffNotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/staff-notifications")
public class StaffNotificationController {

    private final StaffNotificationRepository notifications;

    public StaffNotificationController(StaffNotificationRepository notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public NotificationListResponse list(@RequestParam(defaultValue = "false") boolean unreadOnly) {
        SecurityUtils.requireAdminOrSecretary();
        UUID clinicId = tenant();
        List<StaffNotification> items = unreadOnly
                ? notifications.findUnreadByClinicId(clinicId)
                : notifications.findRecentByClinicId(clinicId);
        if (items.size() > 30) {
            items = items.subList(0, 30);
        }
        long unreadCount = notifications.countByClinicIdAndReadAtIsNull(clinicId);
        return new NotificationListResponse(
                unreadCount,
                items.stream().map(NotificationResponse::from).toList()
        );
    }

    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<NotificationResponse> markRead(@PathVariable UUID id) {
        SecurityUtils.requireAdminOrSecretary();
        StaffNotification notification = notifications.findByIdAndClinic_Id(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notifications.save(notification);
        }
        return ResponseEntity.ok(NotificationResponse.from(notification));
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllRead() {
        SecurityUtils.requireAdminOrSecretary();
        UUID clinicId = tenant();
        OffsetDateTime now = OffsetDateTime.now();
        for (StaffNotification notification : notifications.findUnreadByClinicId(clinicId)) {
            notification.setReadAt(now);
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<Void> clearAll() {
        SecurityUtils.requireAdminOrSecretary();
        notifications.deleteByClinicId(tenant());
        return ResponseEntity.noContent().build();
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    public record NotificationListResponse(long unreadCount, List<NotificationResponse> items) {}

    public record NotificationResponse(
            UUID id,
            String type,
            String title,
            String message,
            UUID appointmentId,
            OffsetDateTime appointmentStartsAt,
            OffsetDateTime createdAt,
            OffsetDateTime readAt
    ) {
        static NotificationResponse from(StaffNotification value) {
            var appointment = value.getAppointment();
            return new NotificationResponse(
                    value.getId(),
                    value.getType(),
                    value.getTitle(),
                    value.getMessage(),
                    appointment == null ? null : appointment.getId(),
                    appointment == null ? null : appointment.getScheduledAt(),
                    value.getCreatedAt(),
                    value.getReadAt()
            );
        }
    }
}
