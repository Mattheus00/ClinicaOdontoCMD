package com.dentic.api.whatsapp.repository;

import com.dentic.api.whatsapp.domain.WhatsappConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface WhatsappConversationRepository extends JpaRepository<WhatsappConversation, UUID> {
    Optional<WhatsappConversation> findByClinicIdAndPatientPhone(UUID clinicId, String patientPhone);
}
