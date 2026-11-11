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

    @Column(nullable = false, unique = true, length = 50)
    private String slug;

    @Column(length = 255)
    private String description;

    @Column(name = "price_cents", nullable = false)
    private Integer priceCents;

    @Column(name = "list_price_cents")
    private Integer listPriceCents;

    @Column(name = "max_professionals", nullable = false)
    private Integer maxProfessionals;

    @Column(name = "max_team_users", nullable = false)
    private Integer maxTeamUsers = 2;

    @Column(name = "includes_whatsapp", nullable = false)
    private Boolean includesWhatsapp = false;

    @Column(name = "gateway_product_id", length = 100)
    private String gatewayProductId;

    @Column(name = "features_json", columnDefinition = "TEXT")
    private String featuresJson;

    @Column(nullable = false)
    private Boolean highlighted = false;

    @Column(name = "checkout_enabled", nullable = false)
    private Boolean checkoutEnabled = false;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (maxTeamUsers == null) {
            maxTeamUsers = 2;
        }
        if (includesWhatsapp == null) {
            includesWhatsapp = false;
        }
        if (highlighted == null) {
            highlighted = false;
        }
        if (checkoutEnabled == null) {
            checkoutEnabled = false;
        }
        if (active == null) {
            active = true;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }
}
