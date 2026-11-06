package com.dentic.api.financial.service;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/** Aggregates in SQL; at most one row per professional reaches the JVM. */
@Repository
public class FinancialReadRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public FinancialReadRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }
    private static final String PATIENTS = """
        WITH patient_scope AS (
          SELECT p.id, COALESCE(p.preferred_professional_id,
            (SELECT a.professional_id FROM appointments a WHERE a.patient_id=p.id AND a.clinic_id=:clinic
             ORDER BY a.scheduled_at DESC, a.id DESC LIMIT 1)) AS professional_id
          FROM patients p WHERE p.clinic_id=:clinic
        )
        """;
    private static final String PERIOD = """
        (CAST(:fromDate AS date) IS NULL OR COALESCE(pp.paid_at, CAST(pp.created_at AT TIME ZONE 'UTC' AS date), CAST(:today AS date)) >= CAST(:fromDate AS date))
        AND (CAST(:toDate AS date) IS NULL OR COALESCE(pp.paid_at, CAST(pp.created_at AT TIME ZONE 'UTC' AS date), CAST(:today AS date)) <= CAST(:toDate AS date))
        """;

    public List<TotalsRow> clinic(UUID clinic, LocalDate from, LocalDate to) {
        String sql = PATIENTS + """
          , plan_totals AS (
            SELECT tp.patient_id,
              SUM(CASE WHEN tp.status='APPROVED' THEN tp.total_amount ELSE 0 END) approved,
              SUM(CASE WHEN tp.status IN ('PENDING','DRAFT') THEN tp.total_amount ELSE 0 END) pending,
              SUM(CASE WHEN tp.status IN ('PENDING','APPROVED') AND tp.due_date < :today THEN tp.total_amount ELSE 0 END) overdue
            FROM treatment_plans tp JOIN patient_scope p ON p.id=tp.patient_id GROUP BY tp.patient_id
          ), payment_totals AS (
            SELECT pp.patient_id,
              SUM(CASE WHEN pp.status='PAID' THEN pp.amount ELSE 0 END) paid,
              SUM(CASE WHEN pp.status='PAID' AND %s THEN pp.amount ELSE 0 END) received
            FROM patient_payments pp JOIN patient_scope p ON p.id=pp.patient_id GROUP BY pp.patient_id
          ), per_patient AS (
            SELECT p.professional_id, COALESCE(t.approved,0) approved, COALESCE(t.pending,0) pending,
              COALESCE(t.overdue,0) overdue, COALESCE(m.paid,0) paid, COALESCE(m.received,0) received,
              GREATEST(COALESCE(t.approved,0)+COALESCE(t.pending,0)-COALESCE(m.paid,0),0) open_balance
            FROM patient_scope p LEFT JOIN plan_totals t ON t.patient_id=p.id LEFT JOIN payment_totals m ON m.patient_id=p.id
          )
          SELECT professional_id, SUM(approved) approved, SUM(pending) pending, SUM(overdue) overdue,
            SUM(paid) paid, SUM(received) received, SUM(open_balance) open_balance, COUNT(*) patient_count
          FROM per_patient GROUP BY professional_id
          """.formatted(PERIOD);
        return jdbc.query(sql, params(clinic, from, to), (rs, n) -> new TotalsRow(
                rs.getObject("professional_id", UUID.class), rs.getBigDecimal("approved"), rs.getBigDecimal("pending"),
                rs.getBigDecimal("paid"), rs.getBigDecimal("overdue"), rs.getBigDecimal("open_balance"),
                rs.getBigDecimal("received"), rs.getInt("patient_count")));
    }

    public TotalsRow dentist(UUID clinic, UUID professional, LocalDate from, LocalDate to) {
        String sql = PATIENTS + """
          SELECT COALESCE(SUM(CASE WHEN pp.status='PAID' THEN pp.amount ELSE 0 END),0) paid,
            COALESCE(SUM(CASE WHEN pp.status='PAID' AND %s THEN pp.amount ELSE 0 END),0) received,
            COUNT(DISTINCT pp.patient_id) patient_count
          FROM patient_payments pp JOIN patient_scope p ON p.id=pp.patient_id
          LEFT JOIN appointments a ON a.id=pp.appointment_id AND a.clinic_id=:clinic
          WHERE COALESCE(a.professional_id,p.professional_id)=:professional
          """.formatted(PERIOD);
        return jdbc.queryForObject(sql, params(clinic, from, to).addValue("professional", professional), (rs, n) ->
                new TotalsRow(professional, BigDecimal.ZERO, BigDecimal.ZERO, rs.getBigDecimal("paid"),
                        BigDecimal.ZERO, BigDecimal.ZERO, rs.getBigDecimal("received"), rs.getInt("patient_count")));
    }

    public Map<UUID, String> professionalNames(UUID clinic) {
        Map<UUID, String> names = new LinkedHashMap<>();
        jdbc.query("SELECT id,name FROM professionals WHERE clinic_id=:clinic ORDER BY name,id", Map.of("clinic", clinic),
                rs -> { names.put(rs.getObject("id", UUID.class), rs.getString("name")); });
        return names;
    }

    private MapSqlParameterSource params(UUID clinic, LocalDate from, LocalDate to) {
        return new MapSqlParameterSource("clinic", clinic).addValue("fromDate", from).addValue("toDate", to).addValue("today", LocalDate.now());
    }
    public record TotalsRow(UUID professionalId, BigDecimal approved, BigDecimal pending, BigDecimal paid,
                            BigDecimal overdue, BigDecimal openBalance, BigDecimal received, int patientCount) {}
}
