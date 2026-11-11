package com.dentic.api.billing.repository;

import com.dentic.api.billing.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findFirstByClinic_IdOrderByCreatedAtDesc(UUID clinicId);

    Optional<Subscription> findByGatewaySubscriptionId(String gatewaySubscriptionId);

    Optional<Subscription> findByGatewayCheckoutId(String gatewayCheckoutId);
}
