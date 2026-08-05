package com.dentic.api.billing.repository;

import com.dentic.api.billing.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
}
