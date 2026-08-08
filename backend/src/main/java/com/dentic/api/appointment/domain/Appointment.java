package com.dentic.api.appointment.domain;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.patient.domain.Patient;
import com.dentic.api.procedure.domain.Procedure;
import com.dentic.api.professional.domain.Professional;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "tenantId", type = UUID.class)})
@Filter(name = "tenantFilter", condition = "clinic_id = :tenantId")
@Getter
@Setter
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professional_id", nullable = false)
    private Professional professional;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procedure_id")
    private Procedure procedure;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private Short durationMinutes = 30;

    @Column(nullable = false)
    private String status = "pending"; // pending, confirmed, cancelled, completed, no_show

    @Column(name = "created_via", nullable = false)
    private String createdVia = "manual"; // whatsapp, manual, instagram

    /** What was done in the visit — readable by any dentist on the patient's history. */
    @Column(columnDefinition = "TEXT")
    private String report;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
