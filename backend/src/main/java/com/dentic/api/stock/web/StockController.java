package com.dentic.api.stock.web;

import com.dentic.api.multitenant.TenantContext;
import com.dentic.api.web.PageResult;
import org.springframework.data.domain.Sort;
import com.dentic.api.onboarding.repository.ClinicRepository;
import com.dentic.api.security.SecurityUtils;
import com.dentic.api.stock.domain.StockItem;
import com.dentic.api.stock.domain.StockMovement;
import com.dentic.api.stock.repository.StockItemRepository;
import com.dentic.api.stock.repository.StockMovementRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock/items")
public class StockController {

    private static final Set<String> CATEGORIES = Set.of("DENTAL", "CLINIC");
    private static final Set<String> MOVEMENT_TYPES = Set.of("IN", "OUT", "ADJUST");

    private final StockItemRepository items;
    private final StockMovementRepository movements;
    private final ClinicRepository clinics;

    public StockController(
            StockItemRepository items,
            StockMovementRepository movements,
            ClinicRepository clinics
    ) {
        this.items = items;
        this.movements = movements;
        this.clinics = clinics;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Object list(@RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size,
                       @RequestParam(defaultValue="") String search, @RequestParam(defaultValue="ALL") String filter) {
        if (!Set.of("ALL", "LOW", "DENTAL", "CLINIC").contains(filter)) throw new IllegalArgumentException("Filtro inválido.");
        // Preserve old consumers until they opt in to pagination.
        if (page == null && size == null && search.isBlank() && filter.equals("ALL")) {
            var data = items.findByClinicIdOrderByNameAsc(tenant()).stream().map(StockItemResponse::from).toList();
            return new PageResponse<>(data, data.isEmpty() ? 0 : 1, data.size(), 0, 500);
        }
        return PageResult.from(items.search(tenant(), search.trim(), filter,
                PageResult.request(page, size, Sort.by("name", "id"))), StockItemResponse::from);
    }

    @GetMapping("/summary")
    @Transactional(readOnly=true)
    public java.util.Map<String, Long> summary() {
        var summary = items.summarize(tenant());
        return java.util.Map.of("total", summary.getTotal(), "low", summary.getLow());
    }

    @PostMapping
    @Transactional
    public StockItemResponse create(@RequestBody StockItemRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        StockItem value = new StockItem();
        value.setClinic(clinics.getReferenceById(tenant()));
        apply(value, request, true);
        return StockItemResponse.from(items.save(value));
    }

    @PutMapping("/{id}")
    @Transactional
    public StockItemResponse update(@PathVariable UUID id, @RequestBody StockItemRequest request) {
        SecurityUtils.requireAdminOrSecretary();
        StockItem value = requireItem(id);
        apply(value, request, false);
        return StockItemResponse.from(items.save(value));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        SecurityUtils.requireAdmin();
        items.delete(requireItem(id));
    }

    @GetMapping("/{id}/movements")
    @Transactional(readOnly = true)
    public Object listMovements(@PathVariable UUID id, @RequestParam(required=false) Integer page, @RequestParam(required=false) Integer size) {
        StockItem item = requireItem(id);
        if (page != null || size != null) return PageResult.from(movements.findByItemIdAndClinicId(item.getId(), tenant(),
                PageResult.request(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id"))), StockMovementResponse::from);
        return movements.findTop20ByItemIdAndClinicIdOrderByCreatedAtDesc(item.getId(), tenant()).stream()
                .map(StockMovementResponse::from)
                .toList();
    }

    @PostMapping("/{id}/movements")
    @Transactional
    public StockItemResponse move(@PathVariable UUID id, @RequestBody StockMovementRequest request) {
        StockItem item = requireItem(id);
        String type = request.type() == null ? "" : request.type().trim().toUpperCase();
        if (!MOVEMENT_TYPES.contains(type)) {
            throw new IllegalArgumentException("Informe se a movimentação é entrada, saída ou ajuste.");
        }
        BigDecimal amount = scale(request.quantity());
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Informe uma quantidade maior que zero.");
        }

        BigDecimal current = scale(item.getQuantity());
        BigDecimal next;
        BigDecimal moved;
        if ("IN".equals(type)) {
            next = current.add(amount);
            moved = amount;
        } else if ("OUT".equals(type)) {
            if (amount.compareTo(current) > 0) {
                throw new IllegalArgumentException("A saída é maior do que o saldo atual.");
            }
            next = current.subtract(amount);
            moved = amount;
        } else {
            next = amount;
            moved = next.subtract(current).abs();
            if (moved.compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("O saldo já está nesse valor.");
            }
        }

        item.setQuantity(next);
        items.save(item);

        StockMovement movement = new StockMovement();
        movement.setClinic(item.getClinic());
        movement.setItem(item);
        movement.setMovementType(type);
        movement.setQuantity(moved);
        movement.setBalanceAfter(next);
        movement.setNote(blankToNull(request.note()));
        movements.save(movement);
        return StockItemResponse.from(item);
    }

    private void apply(StockItem value, StockItemRequest request, boolean creating) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isBlank() || name.length() > 200) {
            throw new IllegalArgumentException("Informe o nome do material.");
        }
        String category = request.category() == null ? "" : request.category().trim().toUpperCase();
        if (!CATEGORIES.contains(category)) {
            throw new IllegalArgumentException("Escolha material odontológico ou demais materiais da clínica.");
        }
        String unit = request.unit() == null ? "" : request.unit().trim();
        if (unit.isBlank() || unit.length() > 30) {
            throw new IllegalArgumentException("Informe a unidade.");
        }
        BigDecimal minimum = scale(request.minimumQuantity());
        if (minimum == null || minimum.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Informe um estoque mínimo válido.");
        }
        value.setName(name);
        value.setCategory(category);
        value.setUnit(unit);
        value.setMinimumQuantity(minimum);
        value.setNotes(blankToNull(request.notes()));
        if (creating) {
            BigDecimal quantity = scale(request.quantity());
            if (quantity == null || quantity.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Informe a quantidade inicial.");
            }
            value.setQuantity(quantity);
        }
    }

    private StockItem requireItem(UUID id) {
        return items.findByIdAndClinicId(id, tenant())
                .orElseThrow(() -> new IllegalArgumentException("Material não encontrado"));
    }

    private static BigDecimal scale(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UUID tenant() {
        UUID id = TenantContext.getCurrentTenant();
        if (id == null) throw new IllegalStateException("Sessão inválida");
        return id;
    }

    public record StockItemRequest(
            String name,
            String category,
            String unit,
            BigDecimal quantity,
            BigDecimal minimumQuantity,
            String notes
    ) {}

    public record StockMovementRequest(String type, BigDecimal quantity, String note) {}

    public record StockItemResponse(
            UUID id,
            String name,
            String category,
            String unit,
            BigDecimal quantity,
            BigDecimal minimumQuantity,
            String notes,
            boolean lowStock
    ) {
        static StockItemResponse from(StockItem item) {
            BigDecimal quantity = item.getQuantity() == null ? BigDecimal.ZERO : item.getQuantity();
            BigDecimal minimum = item.getMinimumQuantity() == null ? BigDecimal.ZERO : item.getMinimumQuantity();
            return new StockItemResponse(
                    item.getId(),
                    item.getName(),
                    item.getCategory(),
                    item.getUnit(),
                    quantity,
                    minimum,
                    item.getNotes(),
                    quantity.compareTo(minimum) <= 0
            );
        }
    }

    public record StockMovementResponse(
            UUID id,
            String type,
            BigDecimal quantity,
            BigDecimal balanceAfter,
            String note,
            OffsetDateTime createdAt
    ) {
        static StockMovementResponse from(StockMovement movement) {
            return new StockMovementResponse(
                    movement.getId(),
                    movement.getMovementType(),
                    movement.getQuantity(),
                    movement.getBalanceAfter(),
                    movement.getNote(),
                    movement.getCreatedAt()
            );
        }
    }

    public record PageResponse<T>(List<T> content, int totalPages, int totalElements, int number, int size) {}
}
