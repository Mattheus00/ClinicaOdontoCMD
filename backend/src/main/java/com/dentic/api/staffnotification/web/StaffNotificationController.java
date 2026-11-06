package com.dentic.api.staffnotification.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.security.SecurityUtils;
import com.dentic.api.staffnotification.domain.StaffNotification;
import com.dentic.api.staffnotification.repository.StaffNotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
        requireStaff();
        UUID clinicId = tenant();
        List<StaffNotification> items;
        long unreadCount;
        if (SecurityUtils.isDentist()) {
            UUID professionalId = SecurityUtils.requireProfessionalId();
            items = unreadOnly
                    ? notifications.findUnreadForProfessional(clinicId, professionalId, PageRequest.of(0, 30))
                    : notifications.findForProfessional(clinicId, professionalId, PageRequest.of(0, 30));
            unreadCount = notifications.countUnreadForProfessional(clinicId, professionalId);
        } else {
            items = unreadOnly
                    ? notifications.findUnreadClinicInbox(clinicId, PageRequest.of(0, 30))
                    : notifications.findClinicInbox(clinicId, PageRequest.of(0, 30));
            unreadCount = notifications.countUnreadClinicInbox(clinicId);
        }
        return new NotificationListResponse(
                unreadCount,
                items.stream().map(NotificationResponse::from).toList()
        );
    }

    @PostMapping("/{id}/read")
    @Transactional
    public ResponseEntity<NotificationResponse> markRead(@PathVariable UUID id) {
        requireStaff();
        StaffNotification notification = requireAccessible(id);
        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notifications.save(notification);
        }
        return ResponseEntity.ok(NotificationResponse.from(notification));
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllRead() {
        requireStaff();
        UUID clinicId = tenant();
        OffsetDateTime now = OffsetDateTime.now();
        List<StaffNotification> unread = SecurityUtils.isDentist()
                ? notifications.findUnreadForProfessional(clinicId, SecurityUtils.requireProfessionalId())
                : notifications.findUnreadClinicInbox(clinicId);
        for (StaffNotification notification : unread) {
            notification.setReadAt(now);
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<Void> clearAll() {
        requireStaff();
        if (SecurityUtils.isDentist()) {
            notifications.deleteForProfessional(tenant(), SecurityUtils.requireProfessionalId());
        } else {
            notifications.deleteClinicInbox(tenant());
        }
        return ResponseEntity.noContent().build();
    }

    private StaffNotification requireAccessible(UUID id) {
        StaffNotification notification = notifications.findByIdAndClinic_Id(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Notificação não encontrada."));
        if (SecurityUtils.isDentist()) {
            UUID professionalId = SecurityUtils.requireProfessionalId();
            if (notification.getRecipientProfessional() == null
                    || !professionalId.equals(notification.getRecipientProfessional().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
            }
        } else if (notification.getRecipientProfessional() != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
        return notification;
    }

    private static void requireStaff() {
        if (!SecurityUtils.isAdmin() && !SecurityUtils.isSecretary() && !SecurityUtils.isDentist()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado.");
        }
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
