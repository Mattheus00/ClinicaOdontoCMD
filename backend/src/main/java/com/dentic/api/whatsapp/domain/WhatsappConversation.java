package com.dentic.api.whatsapp.domain;

import com.dentic.api.onboarding.domain.Clinic;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "whatsapp_conversations")
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "tenantId", type = UUID.class)})
@Filter(name = "tenantFilter", condition = "clinic_id = :tenantId")
@Getter
@Setter
public class WhatsappConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Column(name = "patient_phone", nullable = false)
    private String patientPhone;

    @Column(name = "current_step", nullable = false)
    private String currentStep = "inicio";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "context_json", nullable = false, columnDefinition = "jsonb")
    private String contextJson = "{}";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void prePersistOrUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
