package com.dentic.api.patient.domain;

import com.dentic.api.professional.domain.Professional;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "odontogram_entries")
@Getter
@Setter
public class OdontogramEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "tooth_number", nullable = false)
    private String toothNumber;

    @Column
    private String surface;

    @Column(nullable = false)
    private String status = "HEALTHY";

    @Column(name = "procedure_type")
    private String procedureType;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professional_id")
    private Professional professional;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    @PrePersist
    public void prePersist() {
        if (recordedAt == null) recordedAt = OffsetDateTime.now();
    }
}
