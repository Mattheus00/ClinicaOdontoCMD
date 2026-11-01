package com.dentic.api.stock.repository;

import com.dentic.api.stock.domain.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findTop20ByItemIdAndClinicIdOrderByCreatedAtDesc(UUID itemId, UUID clinicId);
}
