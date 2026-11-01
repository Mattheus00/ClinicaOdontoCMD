package com.dentic.api.stock.repository;

import com.dentic.api.stock.domain.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {
    List<StockItem> findByClinicIdOrderByNameAsc(UUID clinicId);

    Optional<StockItem> findByIdAndClinicId(UUID id, UUID clinicId);
}
