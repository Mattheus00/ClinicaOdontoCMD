package com.dentic.api.patient.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "patient_anamneses")
@Getter
@Setter
public class PatientAnamnesis {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, unique = true)
    private Patient patient;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "preexisting_conditions", columnDefinition = "TEXT")
    private String preexistingConditions;

    @Column(name = "continuous_medications", columnDefinition = "TEXT")
    private String continuousMedications;

    @Column(name = "is_pregnant")
    private Boolean isPregnant = false;

    @Column(name = "pregnancy_notes")
    private String pregnancyNotes;

    @Column(name = "is_smoker")
    private Boolean isSmoker = false;

    @Column(name = "has_bruxism")
    private Boolean hasBruxism = false;

    @Column(name = "habits_notes", columnDefinition = "TEXT")
    private String habitsNotes;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = OffsetDateTime.now();
    }
}
