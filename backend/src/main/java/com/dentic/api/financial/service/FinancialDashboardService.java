package com.dentic.api.financial.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import com.dentic.api.financial.service.FinancialReadRepository.TotalsRow;

@Service
public class FinancialDashboardService {
    private final FinancialReadRepository reads;
    public FinancialDashboardService(FinancialReadRepository reads) { this.reads = reads; }

    @Transactional(readOnly = true)
    public FinancialDashboardResponse dashboard(UUID clinicId, LocalDate from, LocalDate to, UUID professionalId) {
        Map<UUID, String> names = reads.professionalNames(clinicId);
        if (professionalId != null) {
            TotalsRow row = reads.dentist(clinicId, professionalId, from, to);
            return new FinancialDashboardResponse(new PeriodRange(from, to), totals(row),
                List.of(breakdown(row, names.getOrDefault(professionalId, "Dentista"))));
        }
        List<TotalsRow> rows = reads.clinic(clinicId, from, to);
        List<ProfessionalBreakdown> breakdown = new ArrayList<>();
        TotalsRow sum = zero(null);
        for (TotalsRow row : rows) {
            sum = new TotalsRow(null, sum.approved().add(row.approved()), sum.pending().add(row.pending()),
                sum.paid().add(row.paid()), sum.overdue().add(row.overdue()), sum.openBalance().add(row.openBalance()),
                sum.received().add(row.received()), sum.patientCount()+row.patientCount());
            String name = names.remove(row.professionalId());
            breakdown.add(breakdown(row, name == null ? "Sem dentista atribuído" : name));
        }
        names.forEach((id, name) -> breakdown.add(breakdown(zero(id), name)));
        breakdown.sort(Comparator.comparing(ProfessionalBreakdown::professionalName));
        return new FinancialDashboardResponse(new PeriodRange(from, to), totals(sum), breakdown);
    }
    private static TotalsRow zero(UUID id) {
        return new TotalsRow(id, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0);
    }
    private static FinancialTotals totals(TotalsRow r) {
        return new FinancialTotals(r.approved(), r.pending(), r.paid(), r.overdue(), r.openBalance(), r.received(), r.patientCount());
    }
    private static ProfessionalBreakdown breakdown(TotalsRow r, String name) {
        return new ProfessionalBreakdown(r.professionalId(), name, r.approved(), r.pending(), r.paid(), r.overdue(), r.openBalance(), r.received(), r.patientCount());
    }

    public record PeriodRange(LocalDate from, LocalDate to) {}

    public record FinancialTotals(
            BigDecimal approved,
            BigDecimal pending,
            BigDecimal paid,
            BigDecimal overdue,
            BigDecimal openBalance,
            BigDecimal receivedInPeriod,
            int patientCount
    ) {}

    public record ProfessionalBreakdown(
            UUID professionalId,
            String professionalName,
            BigDecimal approved,
            BigDecimal pending,
            BigDecimal paid,
            BigDecimal overdue,
            BigDecimal openBalance,
            BigDecimal receivedInPeriod,
            int patientCount
    ) {}

    public record FinancialDashboardResponse(
            PeriodRange period,
            FinancialTotals totals,
            List<ProfessionalBreakdown> byProfessional
    ) {}
}
