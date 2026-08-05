package com.dentic.api.professional.domain;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.onboarding.domain.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "professionals")
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "tenantId", type = UUID.class)})
@Filter(name = "tenantFilter", condition = "clinic_id = :tenantId")
@Getter
@Setter
public class Professional {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Column
    private String email;

    @Column
    private String specialty;

    @Column
    private String cro;

    @Column(name = "invite_token_hash")
    private String inviteTokenHash;

    @Column(name = "invite_expires_at")
    private OffsetDateTime inviteExpiresAt;

    @Column(name = "invite_accepted_at")
    private OffsetDateTime inviteAcceptedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }

    public boolean hasActiveAccess() {
        return user != null && inviteAcceptedAt != null;
    }
}
