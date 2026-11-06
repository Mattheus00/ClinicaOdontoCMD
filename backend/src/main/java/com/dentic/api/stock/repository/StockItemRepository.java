package com.dentic.api.stock.repository;

import com.dentic.api.stock.domain.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StockItemRepository extends JpaRepository<StockItem, UUID> {
    @org.springframework.data.jpa.repository.Query("""
        SELECT s FROM StockItem s WHERE s.clinic.id=:clinic
        AND (:search='' OR LOWER(s.name) LIKE LOWER(CONCAT('%',:search,'%')))
        AND (:filter='ALL' OR (:filter='LOW' AND s.quantity <= s.minimumQuantity) OR s.category=:filter)
        """)
    org.springframework.data.domain.Page<StockItem> search(
        @org.springframework.data.repository.query.Param("clinic") UUID clinic,
        @org.springframework.data.repository.query.Param("search") String search,
        @org.springframework.data.repository.query.Param("filter") String filter, org.springframework.data.domain.Pageable pageable);

    interface Summary { long getTotal(); long getLow(); }
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) AS total, COALESCE(SUM(CASE WHEN s.quantity <= s.minimumQuantity THEN 1 ELSE 0 END),0) AS low FROM StockItem s WHERE s.clinic.id=:clinic")
    Summary summarize(@org.springframework.data.repository.query.Param("clinic") UUID clinic);
    List<StockItem> findByClinicIdOrderByNameAsc(UUID clinicId);

    Optional<StockItem> findByIdAndClinicId(UUID id, UUID clinicId);
}
