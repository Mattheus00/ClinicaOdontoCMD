package com.dentic.api.billing.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;

    @Column(name = "max_professionals", nullable = false)
    private Integer maxProfessionals;

    @Column(name = "includes_whatsapp", nullable = false)
    private Boolean includesWhatsapp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
