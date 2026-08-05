package com.dentic.api.patient.domain;

import com.dentic.api.onboarding.domain.Clinic;
import com.dentic.api.professional.domain.Professional;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "patients")
@FilterDef(name = "tenantFilter", parameters = {@ParamDef(name = "tenantId", type = UUID.class)})
@Filter(name = "tenantFilter", condition = "clinic_id = :tenantId")
@Getter
@Setter
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phone;

    @Column(name = "phone_is_whatsapp")
    private Boolean phoneIsWhatsapp = true;

    @Column
    private String email;

    @Column
    private String cpf;

    @Column
    private String rg;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column
    private String gender;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_number")
    private String addressNumber;

    @Column(name = "address_complement")
    private String addressComplement;

    @Column(name = "address_district")
    private String addressDistrict;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "address_state")
    private String addressState;

    @Column(name = "address_zip")
    private String addressZip;

    @Column(name = "guardian_name")
    private String guardianName;

    @Column(name = "guardian_phone")
    private String guardianPhone;

    @Column(name = "guardian_cpf")
    private String guardianCpf;

    @Column(name = "referral_source")
    private String referralSource;

    @Column(name = "referral_notes")
    private String referralNotes;

    @Column
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_professional_id")
    private Professional preferredProfessional;

    @Column(name = "preferred_time_notes")
    private String preferredTimeNotes;

    @Column(name = "consent_given_at")
    private OffsetDateTime consentGivenAt;

    @Column(name = "consent_version")
    private String consentVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
